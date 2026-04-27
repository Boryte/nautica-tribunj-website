import type { ReservationArea, ReservationDTO, ReservationStatus, ReservationSubmissionInput } from '../../../../packages/shared/src';
import { BUSINESS_TIMEZONE } from '../../../../packages/shared/src';
import { db, runInTransaction } from '../db';
import { paginateItems, type AdminListQuery } from '../utils/admin-query';
import { AppError } from '../utils/errors';
import { compareTime, getBusinessWeekday, isPastBusinessSlot, nowIso } from '../utils/time';

const areaCapacity: Record<ReservationArea, number> = {
  terrace: 28,
  indoor: 18,
  bar: 14,
  vip: 10,
};

type ReservationRow = {
  id: number;
  status: ReservationStatus;
  customer_name: string;
  email: string;
  phone: string;
  guests: number;
  area: ReservationArea;
  reservation_date: string;
  reservation_time: string;
  timezone: string;
  notes: string | null;
  admin_notes: string | null;
  source: string;
  intent_type: ReservationDTO['intentType'];
  event_id: number | null;
  created_at: string;
  updated_at: string;
};

const mapReservation = (row: ReservationRow): ReservationDTO => ({
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

const bookedGuestsForSlot = (date: string, time: string, area: ReservationArea) =>
  Number(
    (
      db.prepare(
        `SELECT COALESCE(SUM(guests), 0) as total
         FROM reservations
         WHERE reservation_date = ? AND reservation_time = ? AND area = ?
           AND status IN ('pending', 'confirmed', 'waitlist')`
      ).get(date, time, area) as { total: number }
    ).total
  );

const validateReservationWindow = (input: ReservationSubmissionInput) => {
  if (input.honeypot) throw new AppError(400, 'SPAM_REJECTED', 'Submission rejected');
  if (isPastBusinessSlot(input.date, input.time)) {
    throw new AppError(422, 'RESERVATION_IN_PAST', 'Reservation must be in the future');
  }

  const special = db.prepare(
    `SELECT opens_at as opensAt, closes_at as closesAt, is_closed as isClosed
     FROM special_schedules
     WHERE date = ?`
  ).get(input.date) as { opensAt: string | null; closesAt: string | null; isClosed: number } | undefined;
  const blackout = db.prepare('SELECT id FROM blackout_dates WHERE date = ?').get(input.date) as { id: number } | undefined;
  if (blackout || special?.isClosed) {
    throw new AppError(422, 'RESERVATION_DATE_UNAVAILABLE', 'Selected date is unavailable');
  }

  const weekday = getBusinessWeekday(new Date(`${input.date}T12:00:00.000Z`));
  const hours = special
    ? { opensAt: special.opensAt ?? '00:00', closesAt: special.closesAt ?? '23:59', isClosed: Boolean(special.isClosed) }
    : (db.prepare(
        `SELECT opens_at as opensAt, closes_at as closesAt, is_closed as isClosed
         FROM business_hours
         WHERE weekday = ?`
      ).get(weekday) as { opensAt: string; closesAt: string; isClosed: number } | undefined);

  if (!hours || hours.isClosed) throw new AppError(422, 'BUSINESS_CLOSED', 'Selected date is unavailable');
  const isOvernightService = compareTime(hours.closesAt, hours.opensAt) <= 0;
  const withinNormalHours = compareTime(input.time, hours.opensAt) >= 0 && compareTime(input.time, hours.closesAt) <= 0;
  const withinOvernightHours = compareTime(input.time, hours.opensAt) >= 0 || compareTime(input.time, hours.closesAt) <= 0;

  if ((!isOvernightService && !withinNormalHours) || (isOvernightService && !withinOvernightHours)) {
    throw new AppError(422, 'OUTSIDE_OPENING_HOURS', 'Selected time is outside opening hours');
  }
};

export const createReservation = (input: ReservationSubmissionInput): ReservationDTO => {
  validateReservationWindow(input);

  const duplicateByKey = db.prepare('SELECT id FROM reservations WHERE idempotency_key = ?').get(input.idempotencyKey) as { id: number } | undefined;
  if (duplicateByKey) throw new AppError(409, 'DUPLICATE_SUBMISSION', 'This reservation request has already been submitted');

  const similar = db.prepare(
    `SELECT id FROM reservations
     WHERE email = ? AND reservation_date = ? AND reservation_time = ? AND area = ? AND COALESCE(event_id, 0) = COALESCE(?, 0)
       AND status IN ('pending', 'confirmed', 'waitlist')`
  ).get(input.email, input.date, input.time, input.area, input.eventId) as { id: number } | undefined;
  if (similar) throw new AppError(409, 'SIMILAR_RESERVATION_EXISTS', 'A reservation already exists for this contact and slot');

  if (input.intentType === 'event' && input.eventId) {
    const linkedEvent = db.prepare(`SELECT id, capacity FROM events WHERE id = ? AND status = 'published'`).get(input.eventId) as { id: number; capacity: number } | undefined;
    if (!linkedEvent) throw new AppError(422, 'EVENT_NOT_AVAILABLE', 'Linked event is unavailable');

    const reservedForEvent = Number(
      (
        db.prepare(
          `SELECT COALESCE(SUM(guests), 0) as total
           FROM reservations
           WHERE event_id = ? AND status IN ('pending', 'confirmed', 'waitlist')`
        ).get(input.eventId) as { total: number }
      ).total
    );

    if (reservedForEvent + input.guests > linkedEvent.capacity * 1.1) {
      throw new AppError(409, 'EVENT_RESERVATION_CAPACITY_REACHED', 'Event reservation capacity has been reached');
    }
  }

  return runInTransaction(() => {
    const currentGuests = bookedGuestsForSlot(input.date, input.time, input.area);
    const status: ReservationStatus = currentGuests + input.guests > areaCapacity[input.area] ? 'waitlist' : 'pending';

    const reservationId = Number(
      db
        .prepare(
          `INSERT INTO reservations (status, customer_name, email, phone, guests, area, reservation_date, reservation_time, timezone, notes, admin_notes, source, locale, idempotency_key, intent_type, event_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'web', ?, ?, ?, ?, ?, ?)`
        )
        .run(
          status,
          input.name,
          input.email,
          input.phone,
          input.guests,
          input.area,
          input.date,
          input.time,
          BUSINESS_TIMEZONE,
          input.notes || null,
          input.locale,
          input.idempotencyKey,
          input.intentType,
          input.eventId,
          nowIso(),
          nowIso()
        ).lastInsertRowid
    );

    db.prepare(
      `INSERT INTO reservation_status_history (reservation_id, status, notes, created_at)
       VALUES (?, ?, ?, ?)`
    ).run(reservationId, status, 'Initial status', nowIso());

    return mapReservation(db.prepare('SELECT * FROM reservations WHERE id = ?').get(reservationId) as ReservationRow);
  });
};

export const listReservations = (): ReservationDTO[] =>
  (db.prepare('SELECT * FROM reservations ORDER BY reservation_date DESC, reservation_time DESC').all() as ReservationRow[]).map(mapReservation);

export const listReservationsPaginated = (query: AdminListQuery): ReturnType<typeof paginateItems<ReservationDTO>> => {
  const normalizedSearch = query.search.toLowerCase();
  const items = listReservations().filter((reservation) =>
    (!query.status || reservation.status === query.status) &&
    (!normalizedSearch ||
      reservation.customerName.toLowerCase().includes(normalizedSearch) ||
      reservation.email.toLowerCase().includes(normalizedSearch) ||
      reservation.phone.toLowerCase().includes(normalizedSearch))
  );
  return paginateItems(items, query.page, query.pageSize);
};

export const updateReservationStatus = (reservationId: number, status: ReservationStatus, adminId?: number, adminNotes?: string) => {
  const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(reservationId) as ReservationRow | undefined;
  if (!reservation) throw new AppError(404, 'RESERVATION_NOT_FOUND', 'Reservation not found');

  db.prepare(
    `UPDATE reservations
     SET status = ?, admin_notes = COALESCE(?, admin_notes), updated_at = ?
     WHERE id = ?`
  ).run(status, adminNotes ?? null, nowIso(), reservationId);

  db.prepare(
    `INSERT INTO reservation_status_history (reservation_id, status, changed_by_admin_id, notes, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(reservationId, status, adminId ?? null, adminNotes ?? null, nowIso());

  return mapReservation(db.prepare('SELECT * FROM reservations WHERE id = ?').get(reservationId) as ReservationRow);
};
