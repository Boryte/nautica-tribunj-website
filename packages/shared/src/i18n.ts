import { locales, type LocaleCode } from './domain';

export const DEFAULT_LOCALE: LocaleCode = 'hr';
export const BUSINESS_TIMEZONE = 'Europe/Zagreb';
export const LOCALE_STORAGE_KEY = 'nautica-locale';

export const isLocale = (value: string): value is LocaleCode =>
  locales.includes(value as LocaleCode);

export const resolveLocale = (value?: string | null): LocaleCode =>
  value && isLocale(value) ? value : DEFAULT_LOCALE;

export const localizedDateFormatters: Record<LocaleCode, string> = {
  hr: 'hr-HR',
  en: 'en-GB',
};

