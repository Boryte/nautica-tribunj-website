import type { LocaleCode } from '@shared/index';
import { useState } from 'react';

export const useLocaleEditor = (initial: LocaleCode = 'hr') => {
  const [locale, setLocale] = useState<LocaleCode>(initial);
  return { locale, setLocale };
};
