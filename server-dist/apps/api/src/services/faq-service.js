"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFaqEntry = exports.upsertFaqEntry = exports.listFaqEntriesPaginated = exports.listFaqEntries = void 0;
const db_1 = require("../db");
const admin_query_1 = require("../utils/admin-query");
const errors_1 = require("../utils/errors");
const time_1 = require("../utils/time");
const mapFaq = (row) => {
    const localizations = db_1.db.prepare(`SELECT locale, question, answer
     FROM faq_localizations
     WHERE faq_id = ?`).all(row.id);
    return {
        id: row.id,
        active: Boolean(row.active),
        category: row.category,
        sortOrder: row.sort_order,
        localizations: {
            hr: localizations.find((entry) => entry.locale === 'hr') ?? { question: '', answer: '' },
            en: localizations.find((entry) => entry.locale === 'en') ?? { question: '', answer: '' },
        },
    };
};
const listFaqEntries = (activeOnly = true) => {
    const rows = db_1.db.prepare(activeOnly
        ? 'SELECT * FROM faqs WHERE active = 1 ORDER BY category ASC, sort_order ASC, id ASC'
        : 'SELECT * FROM faqs ORDER BY active DESC, category ASC, sort_order ASC, id ASC').all();
    return rows.map(mapFaq);
};
exports.listFaqEntries = listFaqEntries;
const listFaqEntriesPaginated = (query) => {
    const normalizedSearch = query.search.toLowerCase();
    const items = (0, exports.listFaqEntries)(false).filter((entry) => !normalizedSearch ||
        entry.category.toLowerCase().includes(normalizedSearch) ||
        entry.localizations.hr.question.toLowerCase().includes(normalizedSearch) ||
        entry.localizations.en.question.toLowerCase().includes(normalizedSearch) ||
        entry.localizations.hr.answer.toLowerCase().includes(normalizedSearch) ||
        entry.localizations.en.answer.toLowerCase().includes(normalizedSearch));
    return (0, admin_query_1.paginateItems)(items, query.page, query.pageSize);
};
exports.listFaqEntriesPaginated = listFaqEntriesPaginated;
const upsertFaqEntry = (input) => (0, db_1.runInTransaction)(() => {
    const faqId = input.id ??
        Number(db_1.db
            .prepare(`INSERT INTO faqs (active, category, sort_order, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?)`)
            .run(input.active ? 1 : 0, input.category, input.sortOrder, (0, time_1.nowIso)(), (0, time_1.nowIso)()).lastInsertRowid);
    if (input.id) {
        db_1.db.prepare(`UPDATE faqs
         SET active = ?, category = ?, sort_order = ?, updated_at = ?
         WHERE id = ?`).run(input.active ? 1 : 0, input.category, input.sortOrder, (0, time_1.nowIso)(), input.id);
    }
    for (const locale of ['hr', 'en']) {
        db_1.db.prepare(`INSERT INTO faq_localizations (faq_id, locale, question, answer, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(faq_id, locale) DO UPDATE SET question = excluded.question, answer = excluded.answer, updated_at = excluded.updated_at`).run(faqId, locale, input.localizations[locale].question, input.localizations[locale].answer, (0, time_1.nowIso)(), (0, time_1.nowIso)());
    }
    return mapFaq(db_1.db.prepare('SELECT * FROM faqs WHERE id = ?').get(faqId));
});
exports.upsertFaqEntry = upsertFaqEntry;
const deleteFaqEntry = (faqId) => (0, db_1.runInTransaction)(() => {
    const existing = db_1.db.prepare('SELECT id FROM faqs WHERE id = ?').get(faqId);
    if (!existing)
        throw new errors_1.AppError(404, 'FAQ_NOT_FOUND', 'FAQ entry not found');
    db_1.db.prepare('DELETE FROM faqs WHERE id = ?').run(faqId);
    return { deleted: true };
});
exports.deleteFaqEntry = deleteFaqEntry;
