import type { FaqEntryDTO, FaqUpsertInput, LocaleCode } from '../../../../packages/shared/src';
import { db, runInTransaction } from '../db';
import { paginateItems, type AdminListQuery } from '../utils/admin-query';
import { AppError } from '../utils/errors';
import { nowIso } from '../utils/time';

type FaqRow = {
  id: number;
  active: number;
  category: string;
  sort_order: number;
};

const mapFaq = (row: FaqRow): FaqEntryDTO => {
  const localizations = db.prepare(
    `SELECT locale, question, answer
     FROM faq_localizations
     WHERE faq_id = ?`
  ).all(row.id) as Array<{ locale: LocaleCode; question: string; answer: string }>;

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

export const listFaqEntries = (activeOnly = true): FaqEntryDTO[] => {
  const rows = db.prepare(
    activeOnly
      ? 'SELECT * FROM faqs WHERE active = 1 ORDER BY category ASC, sort_order ASC, id ASC'
      : 'SELECT * FROM faqs ORDER BY active DESC, category ASC, sort_order ASC, id ASC'
  ).all() as FaqRow[];

  return rows.map(mapFaq);
};

export const listFaqEntriesPaginated = (query: AdminListQuery) => {
  const normalizedSearch = query.search.toLowerCase();
  const items = listFaqEntries(false).filter((entry) =>
    !normalizedSearch ||
    entry.category.toLowerCase().includes(normalizedSearch) ||
    entry.localizations.hr.question.toLowerCase().includes(normalizedSearch) ||
    entry.localizations.en.question.toLowerCase().includes(normalizedSearch) ||
    entry.localizations.hr.answer.toLowerCase().includes(normalizedSearch) ||
    entry.localizations.en.answer.toLowerCase().includes(normalizedSearch)
  );

  return paginateItems(items, query.page, query.pageSize);
};

export const upsertFaqEntry = (input: FaqUpsertInput) =>
  runInTransaction(() => {
    const faqId =
      input.id ??
      Number(
        db
          .prepare(
            `INSERT INTO faqs (active, category, sort_order, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?)`
          )
          .run(input.active ? 1 : 0, input.category, input.sortOrder, nowIso(), nowIso()).lastInsertRowid
      );

    if (input.id) {
      db.prepare(
        `UPDATE faqs
         SET active = ?, category = ?, sort_order = ?, updated_at = ?
         WHERE id = ?`
      ).run(input.active ? 1 : 0, input.category, input.sortOrder, nowIso(), input.id);
    }

    for (const locale of ['hr', 'en'] as const) {
      db.prepare(
        `INSERT INTO faq_localizations (faq_id, locale, question, answer, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(faq_id, locale) DO UPDATE SET question = excluded.question, answer = excluded.answer, updated_at = excluded.updated_at`
      ).run(faqId, locale, input.localizations[locale].question, input.localizations[locale].answer, nowIso(), nowIso());
    }

    return mapFaq(db.prepare('SELECT * FROM faqs WHERE id = ?').get(faqId) as FaqRow);
  });

export const deleteFaqEntry = (faqId: number) =>
  runInTransaction(() => {
    const existing = db.prepare('SELECT id FROM faqs WHERE id = ?').get(faqId) as { id: number } | undefined;
    if (!existing) throw new AppError(404, 'FAQ_NOT_FOUND', 'FAQ entry not found');
    db.prepare('DELETE FROM faqs WHERE id = ?').run(faqId);
    return { deleted: true };
  });
