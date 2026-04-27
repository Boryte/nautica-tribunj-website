import { useQuery } from '@tanstack/react-query';
import { Activity, CalendarDays, CircleHelp, ImageIcon, LockKeyhole, Megaphone, ShieldCheck, TableProperties } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { api } from '@/lib/api';
import { AdminPageHeader, AdminSectionCard } from './components/AdminPrimitives';

const stats = [
  { key: 'reservations', label: 'Reservations', icon: TableProperties },
  { key: 'events', label: 'Events', icon: CalendarDays },
  { key: 'announcements', label: 'Announcements', icon: Megaphone },
  { key: 'faqCount', label: 'FAQ entries', icon: CircleHelp },
  { key: 'mediaCount', label: 'Media assets', icon: ImageIcon },
] as const;

export const AdminDashboard = () => {
  const { data } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.adminDashboard(),
  });

  const reservationCount = data?.reservations.length ?? 0;
  const eventCount = data?.events.length ?? 0;
  const announcementCount = data?.announcements.length ?? 0;

  const getStatValue = (key: (typeof stats)[number]['key']) => {
    if (!data) return 0;

    switch (key) {
      case 'reservations':
        return data.reservations.length;
      case 'events':
        return data.events.length;
      case 'announcements':
        return data.announcements.length;
      case 'faqCount':
        return data.faqCount;
      case 'mediaCount':
        return data.mediaCount;
      default:
        return 0;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Operations"
          title="Dashboard"
          description="A live control snapshot across bookings, event programming, content surfaces, and protected admin operations."
        />

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[1.8rem] border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.015)_48%,rgba(255,184,92,0.08))] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--brand-gold))]">Control status</p>
                <h3 className="mt-3 font-display text-4xl text-white">Protected admin operations are live.</h3>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/58">
                  Login hardening now combines challenge verification, adaptive lockouts, browser-bound sessions, CSRF-protected mutations, and stricter cookie handling.
                </p>
              </div>

              <div className="grid min-w-[14rem] gap-3">
                {[
                  { icon: ShieldCheck, label: 'Auth posture', value: 'Hardened' },
                  { icon: LockKeyhole, label: 'Mutation guard', value: 'CSRF active' },
                  { icon: Activity, label: 'Live modules', value: `${announcementCount} campaigns` },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-[1.2rem] border border-white/8 bg-black/15 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full border border-white/10 bg-white/[0.05] p-2">
                          <Icon className="h-4 w-4 text-[hsl(var(--brand-gold))]" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.22em] text-white/42">{item.label}</p>
                          <p className="mt-1 text-sm text-white">{item.value}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-6">
            <p className="text-[10px] uppercase tracking-[0.26em] text-white/42">Current pulse</p>
            <div className="mt-5 space-y-4">
              {[
                { label: 'Latest reservations loaded', value: reservationCount, suffix: 'items' },
                { label: 'Recent events in scope', value: eventCount, suffix: 'events' },
                { label: 'Content surfaces available', value: (data?.mediaCount ?? 0) + (data?.faqCount ?? 0), suffix: 'records' },
              ].map((item) => (
                <div key={item.label} className="border-b border-white/8 pb-4 last:border-b-0 last:pb-0">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/38">{item.label}</p>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <p className="font-display text-4xl text-white">{item.value}</p>
                    <p className="text-sm text-white/48">{item.suffix}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const value = getStatValue(stat.key);

            return (
              <AdminSectionCard key={stat.key} className="bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-white/42">{stat.label}</p>
                    <p className="mt-4 font-display text-5xl text-white">{value}</p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/[0.04] p-3 text-white/58">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </AdminSectionCard>
            );
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <AdminSectionCard title="Recent reservations">
            <div className="space-y-3">
              {data?.reservations.length ? (
                data.reservations.map((reservation) => (
                  <div key={reservation.id} className="rounded-[1.25rem] border border-white/8 bg-black/10 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-display text-xl text-white">{reservation.customerName}</p>
                        <p className="mt-2 text-sm text-white/54">
                          {reservation.reservationDate} • {reservation.reservationTime} • {reservation.guests} guests
                        </p>
                      </div>
                      <div className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/54">
                        {reservation.status}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.25rem] border border-dashed border-white/10 bg-black/10 p-4 text-sm text-white/52">
                  No recent reservations in the current feed.
                </div>
              )}
            </div>
          </AdminSectionCard>

          <AdminSectionCard title="Recent events">
            <div className="space-y-3">
              {data?.events.length ? (
                data.events.map((event) => (
                  <div key={event.id} className="rounded-[1.25rem] border border-white/8 bg-black/10 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-display text-xl text-white">{event.localizations.hr.title}</p>
                        <p className="mt-2 text-sm text-white/54">{event.startsAt} • {event.category}</p>
                      </div>
                      <div className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/54">
                        {event.status}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.25rem] border border-dashed border-white/10 bg-black/10 p-4 text-sm text-white/52">
                  No recent events are available in the dashboard payload.
                </div>
              )}
            </div>
          </AdminSectionCard>
        </div>
      </div>
    </AdminLayout>
  );
};
