import type { PropsWithChildren } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, ChevronRight, Command, Globe2, LogOut, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAdminSession } from '@/hooks/use-site-data';
import { api } from '@/lib/api';
import { adminLocaleMeta } from './lib';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const links = [
  { to: '/admin', key: 'dashboard' },
  { to: '/admin/announcements', key: 'announcements' },
  { to: '/admin/faqs', key: 'faqs' },
  { to: '/admin/glimpses', key: 'glimpses' },
  { to: '/admin/media', key: 'media' },
  { to: '/admin/reservations', key: 'reservations' },
  { to: '/admin/events', key: 'events' },
  { to: '/admin/menu', key: 'menu' },
  { to: '/admin/settings', key: 'settings' },
];

const AdminNav = ({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) => {
  const { t, i18n } = useTranslation();

  return (
    <div className="flex h-full flex-col rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(18,28,40,0.92),rgba(10,14,20,0.98))] p-5 shadow-[0_35px_110px_-55px_rgba(0,0,0,0.85)]">
      <div className="mb-8 border-b border-white/8 pb-6">
        <p className="text-[10px] uppercase tracking-[0.38em] text-[hsl(var(--brand-gold))]">Nautica CMS</p>
        <h1 className="mt-3 font-display text-3xl text-white">Control panel</h1>
        <p className="mt-3 text-sm leading-6 text-white/54">
          {adminLocaleMeta[(i18n.language === 'en' ? 'en' : 'hr')].nativeLabel} • premium hospitality operations
        </p>
      </div>
      <nav className="flex-1 space-y-2 overflow-y-auto">
        {links.map((link) => {
          const active = pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={onNavigate}
              className={`block rounded-[1.2rem] px-4 py-3.5 text-[11px] uppercase tracking-[0.24em] transition ${
                active
                  ? 'bg-[hsl(var(--brand-gold))] text-[hsl(var(--foreground))] shadow-[0_15px_50px_-25px_hsla(36,82%,52%,0.85)]'
                  : 'text-white/62 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              {t(`admin.${link.key}`)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export const AdminLayout = ({ children }: PropsWithChildren) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data } = useAdminSession();

  const handleLogout = async () => {
    if (data?.csrfToken) {
      await api.adminLogout(data.csrfToken);
      queryClient.invalidateQueries({ queryKey: ['admin-session'] });
      navigate('/admin/login');
    }
  };

  const currentLink = links.find((link) => link.to === location.pathname);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(72,42,18,0.22),transparent_26rem),linear-gradient(180deg,rgba(8,12,18,1),rgba(11,18,26,1))] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-5 px-3 py-3 lg:px-5 lg:py-5">
        <aside className="hidden w-[292px] shrink-0 lg:block">
          <AdminNav pathname={location.pathname} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col rounded-[2rem] border border-white/8 bg-[rgba(255,255,255,0.028)] shadow-[0_35px_120px_-70px_rgba(0,0,0,0.9)] backdrop-blur-xl">
          <header className="sticky top-0 z-20 border-b border-white/6 bg-[rgba(9,14,20,0.74)] px-4 py-4 backdrop-blur-2xl lg:px-7">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <Sheet>
                  <SheetTrigger asChild className="lg:hidden">
                    <Button variant="ghost" size="icon" className="rounded-full border border-white/10 bg-white/[0.04] text-white">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="border-r border-white/8 bg-[rgba(10,15,21,0.98)] p-3 text-white">
                    <AdminNav pathname={location.pathname} />
                  </SheetContent>
                </Sheet>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-white/38">
                    <span>Admin</span>
                    {currentLink && (
                      <>
                        <ChevronRight className="h-3.5 w-3.5" />
                        <span>{t(`admin.${currentLink.key}`)}</span>
                      </>
                    )}
                  </div>
                  <h2 className="mt-2 truncate font-display text-2xl text-white lg:text-3xl">
                    {currentLink ? t(`admin.${currentLink.key}`) : t('admin.dashboard')}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 text-white/70 md:inline-flex">
                  <Command className="mr-2 h-4 w-4" />
                  Search
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full border border-white/10 bg-white/[0.04] text-white/70">
                  <Bell className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 text-white/70"
                  onClick={() => i18n.changeLanguage(i18n.language === 'hr' ? 'en' : 'hr')}
                >
                  <Globe2 className="mr-2 h-4 w-4" />
                  {adminLocaleMeta[(i18n.language === 'en' ? 'en' : 'hr')].label}
                </Button>
                <Button variant="ghost" className="rounded-full border border-white/10 bg-white/[0.04] px-4 text-white/70" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('common.logout')}
                </Button>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 p-4 lg:p-7">{children}</main>
        </div>
      </div>
    </div>
  );
};
