import { useMemo, useState } from 'react';
import { locales, type LocaleCode } from '@shared/index';

export const adminLocaleMeta: Record<LocaleCode, { label: string; nativeLabel: string }> = {
  hr: { label: 'HR', nativeLabel: 'Hrvatski' },
  en: { label: 'EN', nativeLabel: 'English' },
};

export const normalizeInternalOrExternalUrl = (value: string | null | undefined) => {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return null;
  if (trimmed.startsWith('/')) return trimmed;
  return trimmed;
};

export type LocalizedCompletenessValue = Partial<Record<LocaleCode, Record<string, string | undefined> | undefined>>;

export const getLocalizedCompleteness = (value: LocalizedCompletenessValue) =>
  (locales as readonly LocaleCode[]).map((locale) => {
    const fields = value[locale] ?? {};
    const fieldValues = Object.values(fields);
    const total = fieldValues.length || 1;
    const filled = fieldValues.filter((field) => (field ?? '').trim().length > 0).length;
    return { locale, filled, total, complete: filled === total };
  });

export const useClientPagination = <T>(items: T[], pageSize = 8) => {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return {
    page,
    setPage,
    totalPages,
    paginated,
  };
};
