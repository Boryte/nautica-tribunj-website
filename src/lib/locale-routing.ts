import { DEFAULT_LOCALE, resolveLocale, type LocaleCode } from '@shared/index';

const EN_PREFIX = '/en';

const isExternal = (value: string) => /^https?:\/\//i.test(value) || value.startsWith('mailto:') || value.startsWith('tel:') || value.startsWith('#');

export const stripLocalePrefix = (pathname: string) => {
  if (!pathname) return '/';
  if (pathname === EN_PREFIX) return '/';
  if (pathname.startsWith(`${EN_PREFIX}/`)) return pathname.slice(EN_PREFIX.length) || '/';
  return pathname;
};

export const getPathLocale = (pathname: string, search = ''): LocaleCode => {
  if (pathname === EN_PREFIX || pathname.startsWith(`${EN_PREFIX}/`)) return 'en';
  const lang = new URLSearchParams(search.startsWith('?') ? search : `?${search}`).get('lang');
  return resolveLocale(lang ?? DEFAULT_LOCALE);
};

export const localizePath = (path: string, locale: LocaleCode) => {
  if (!path || isExternal(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const basePath = stripLocalePrefix(normalized);
  return locale === 'en' ? `${EN_PREFIX}${basePath === '/' ? '' : basePath}` : basePath;
};

export const normalizeLocalePath = (pathname: string, locale: LocaleCode) => localizePath(stripLocalePrefix(pathname), locale);
