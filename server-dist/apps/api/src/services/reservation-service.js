"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReservationStatus = exports.listReservationsPaginated = exports.listReservations = exports.createReservation = void 0;
const src_1 = require("../../../../packages/shared/src");
const db_1 = require("../db");
const admin_query_1 = require("../utils/admin-query");
const errors_1 = require("../utils/errors");
const time_1 = require("../utils/time");
const areaCapacity = {
    terrace: 28,
    indoor: 18,
    bar: 14,
    vip: 10,
};
const mapReservation = (row) => ({
    id: row.id,
    status: row.status,
    customerName: row.customer_name,
    email: row.email,
    phone: row.phone,
    guests: row.guests,
    area: row.area,
    reservationDate: row.reservation_date,
    reservationTime: row.reservation_time,
    timezone: row.timezone,
    notes: row.notes,
    adminNotes: row.admin_notes,
    source: row.source,
    intentType: row.intent_type,
    eventId: row.event_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});
const bookedGuestsForSlot = (date, time, area) => Number(db_1.db.prepare(`SELECT COALESCE(SUM(guests), 0) as total
         FROM reservations
         WHERE reservation_date = ? AND reservation_time = ? AND area = ?
           AND status IN ('pending', 'confirmed', 'waitlist')`).get(date, time, area).total);
const validateReservationWindow = (input) => {
    if (input.honeypot)
        throw new errors_1.AppError(400, 'SPAM_REJECTED', 'Submission rejected');
    if ((0, time_1.isPastBusinessSlot)(input.date, input.time)) {
        throw new errors_1.AppError(422, 'RESERVATION_IN_PAST', 'Reservation must be in the future');
    }
    const special = db_1.db.prepare(`SELECT opens_at as opensAt, closes_at as closesAt, is_closed as isClosed
     FROM special_schedules
     WHERE date = ?`).get(input.date);
    const blackout = db_1.db.prepare('SELECT id FROM blackout_dates WHERE date = ?').get(input.date);
    if (blackout || special?.isClosed) {
        throw new errors_1.AppError(422, 'RESERVATION_DATE_UNAVAILABLE', 'Selected date is unavailable');
    }
    const weekday = (0, time_1.getBusinessWeekday)(new Date(`${input.date}T12:00:00.000Z`));
    const hours = special
        ? { opensAt: special.opensAt ?? '00:00', closesAt: special.closesAt ?? '23:59', isClosed: Boolean(special.isClosed) }
        : db_1.db.prepare(`SELECT opens_at as opensAt, closes_at as closesAt, is_closed as isClosed
         FROM business_hours
         WHERE weekday = ?`).get(weekday);
    if (!hours || hours.isClosed)
        throw new errors_1.AppError(422, 'BUSINESS_CLOSED', 'Selected date is unavailable');
    const isOvernightService = (0, time_1.compareTime)(hours.closesAt, hours.opensAt) <= 0;
    const withinNormalHours = (0, time_1.compareTime)(input.time, hours.opensAt) >= 0 && (0, time_1.compareTime)(input.time, hours.closesAt) <= 0;
    const withinOvernightHours = (0, time_1.compareTime)(input.time, hours.opensAt) >= 0 || (0, time_1.compareTime)(input.time, hours.closesAt) <= 0;
    if ((!isOvernightService && !withinNormalHours) || (isOvernightService && !withinOvernightHours)) {
        throw new errors_1.AppError(422, 'OUTSIDE_OPENING_HOURS', 'Selected time is outside opening hours');
    }
};
const createReservation = (input) => {
    validateReservationWindow(input);
    const duplicateByKey = db_1.db.prepare('SELECT id FROM reservations WHERE idempotency_key = ?').get(input.idempotencyKey);
    if (duplicateByKey)
        throw new errors_1.AppError(409, 'DUPLICATE_SUBMISSION', 'This reservation request has already been submitted');
    const similar = db_1.db.prepare(`SELECT id FROM reservations
     WHERE email = ? AND reservation_date = ? AND reservation_time = ? AND area = ? AND COALESCE(event_id, 0) = COALESCE(?, 0)
       AND status IN ('pending', 'confirmed', 'waitlist')`).get(input.email, input.date, input.time, input.area, input.eventId);
    if (similar)
        throw new errors_1.AppError(409, 'SIMILAR_RESERVATION_EXISTS', 'A reservation already exists for this contact and slot');
    if (input.intentType === 'event' && input.eventId) {
        const linkedEvent = db_1.db.prepare(`SELECT id, capacity FROM events WHERE id = ? AND status = 'published'`).get(input.eventId);
        if (!linkedEvent)
            throw new errors_1.AppError(422, 'EVENT_NOT_AVAILABLE', 'Linked event is unavailable');
        const reservedForEvent = Number(db_1.db.prepare(`SELECT COALESCE(SUM(guests), 0) as total
           FROM reservations
           WHERE event_id = ? AND status IN ('pending', 'confirmed', 'waitlist')`).get(input.eventId).total);
        if (reservedForEvent + input.guests > linkedEvent.capacity * 1.1) {
            throw new errors_1.AppError(409, 'EVENT_RESERVATION_CAPACITY_REACHED', 'Event reservation capacity has been reached');
        }
    }
    return (0, db_1.runInTransaction)(() => {
        const currentGuests = bookedGuestsForSlot(input.date, input.time, input.area);
        const status = currentGuests + input.guests > areaCapacity[input.area] ? 'waitlist' : 'pending';
        const reservationId = Number(db_1.db
            .prepare(`INSERT INTO reservations (status, customer_name, email, phone, guests, area, reservation_date, reservation_time, timezone, notes, admin_notes, source, locale, idempotency_key, intent_type, event_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'web', ?, ?, ?, ?, ?, ?)`)
            .run(status, input.name, input.email, input.phone, input.guests, input.area, input.date, input.time, src_1.BUSINESS_TIMEZONE, input.notes || null, input.locale, input.idempotencyKey, input.intentType, input.eventId, (0, time_1.nowIso)(), (0, time_1.nowIso)()).lastInsertRowid);
        db_1.db.prepare(`INSERT INTO reservation_status_history (reservation_id, status, notes, created_at)
       VALUES (?, ?, ?, ?)`).run(reservationId, status, 'Initial status', (0, time_1.nowIso)());
        return mapReservation(db_1.db.prepare('SELECT * FROM reservations WHERE id = ?').get(reservationId));
    });
};
exports.createReservation = createReservation;
const listReservations = () => db_1.db.prepare('SELECT * FROM reservations ORDER BY reservation_date DESC, reservation_time DESC').all().map(mapReservation);
exports.listReservations = listReservations;
const listReservationsPaginated = (query) => {
    const normalizedSearch = query.search.toLowerCase();
    const items = (0, exports.listReservations)().filter((reservation) => (!query.status || reservation.status === query.status) &&
        (!normalizedSearch ||
            reservation.customerName.toLowerCase().includes(normalizedSearch) ||
            reservation.email.toLowerCase().includes(normalizedSearch) ||
            reservation.phone.toLowerCase().includes(normalizedSearch)));
    return (0, admin_query_1.paginateItems)(items, query.page, query.pageSize);
};
exports.listReservationsPaginated = listReservationsPaginated;
const updateReservationStatus = (reservationId, status, adminId, adminNotes) => {
    const reservation = db_1.db.prepare('SELECT * FROM reservations WHERE id = ?').get(reservationId);
    if (!reservation)
        throw new errors_1.AppError(404, 'RESERVATION_NOT_FOUND', 'Reservation not found');
    db_1.db.prepare(`UPDATE reservations
     SET status = ?, admin_notes = COALESCE(?, admin_notes), updated_at = ?
     WHERE id = ?`).run(status, adminNotes ?? null, (0, time_1.nowIso)(), reservationId);
    db_1.db.prepare(`INSERT INTO reservation_status_history (reservation_id, status, changed_by_admin_id, notes, created_at)
     VALUES (?, ?, ?, ?, ?)`).run(reservationId, status, adminId ?? null, adminNotes ?? null, (0, time_1.nowIso)());
    return mapReservation(db_1.db.prepare('SELECT * FROM reservations WHERE id = ?').get(reservationId));
};
exports.updateReservationStatus = updateReservationStatus;
