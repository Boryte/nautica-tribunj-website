import type { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageState } from '@/components/states/PageState';
import { useAdminSession } from '@/hooks/use-site-data';

export const ProtectedAdminRoute = ({ children }: PropsWithChildren) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { data, isLoading } = useAdminSession();

  if (isLoading) {
    return <PageState title={t('common.loading')} description={t('admin.login_subtitle')} />;
  }

  if (!data?.authenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};
