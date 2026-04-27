import { resolveLocale } from '@shared/index';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { normalizeLocalePath } from '@/lib/locale-routing';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const currentLang = resolveLocale(i18n.language);

  const toggle = () => {
    const nextLanguage = currentLang === 'hr' ? 'en' : 'hr';
    i18n.changeLanguage(nextLanguage);
    navigate(`${normalizeLocalePath(location.pathname, nextLanguage)}${location.search}${location.hash}`);
  };

  return (
    <button
      onClick={toggle}
      type="button"
      className="inline-flex h-10 items-center rounded-full border border-white/10 bg-white/[0.04] px-4 font-body text-[10px] uppercase tracking-[0.26em] text-white/92 transition hover:bg-white/[0.08] hover:text-white"
      aria-label={currentLang === 'hr' ? 'Switch language to English' : 'Promijeni jezik na hrvatski'}
    >
      {currentLang === 'hr' ? 'EN' : 'HR'}
    </button>
  );
};
