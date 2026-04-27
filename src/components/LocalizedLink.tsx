import type { ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { resolveLocale } from '@shared/index';
import { useTranslation } from 'react-i18next';
import { localizePath } from '@/lib/locale-routing';

export const LocalizedLink = ({ to, children, ...props }: Omit<LinkProps, 'to'> & { to: string; children: ReactNode }) => {
  const { i18n } = useTranslation();
  const locale = resolveLocale(i18n.language);
  return <Link to={localizePath(to, locale)} {...props}>{children}</Link>;
};
