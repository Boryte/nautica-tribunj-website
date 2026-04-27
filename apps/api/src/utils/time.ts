import { BUSINESS_TIMEZONE, DEFAULT_LOCALE, localizedDateFormatters, type LocaleCode } from '../../../../packages/shared/src';

export const businessTimeZone = BUSINESS_TIMEZONE;
export const nowIso = () => new Date().toISOString();

export const formatBusinessDate = (date: Date, locale: LocaleCode = DEFAULT_LOCALE) =>
  new Intl.DateTimeFormat(localizedDateFormatters[locale], {
    timeZone: businessTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== 'literal') acc[part.type] = part.value;
      return acc;
    }, {});

export const toBusinessDate = (date: Date) => {
  const parts = formatBusinessDate(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
};

export const currentBusinessTime = () =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: businessTimeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());

export const getBusinessWeekday = (date: Date) =>
  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(
    new Intl.DateTimeFormat('en-US', {
      timeZone: businessTimeZone,
      weekday: 'short',
    }).format(date)
  );

export const isPastBusinessSlot = (date: string, time: string) => {
  const now = new Date();
  const today = toBusinessDate(now);
  const currentTime = currentBusinessTime();
  return date < today || (date === today && time < currentTime);
};

export const compareTime = (a: string, b: string) => a.localeCompare(b);
