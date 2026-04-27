import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, resolveLocale } from '@shared/index';
import { getPathLocale } from '@/lib/locale-routing';
import hr from './locales/hr.json';
import en from './locales/en.json';

const resources = {
  hr: { translation: hr },
  en: { translation: en },
};

const getInitialLanguage = () => {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  return resolveLocale(
    getPathLocale(window.location.pathname, window.location.search) ??
      window.localStorage.getItem(LOCALE_STORAGE_KEY) ??
      DEFAULT_LOCALE,
  );
};

i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: DEFAULT_LOCALE,
  interpolation: { escapeValue: false },
});

if (typeof window !== 'undefined') {
  i18n.on('languageChanged', (language) => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, resolveLocale(language));
  });
}

export default i18n;
