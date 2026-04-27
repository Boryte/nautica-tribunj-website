import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reservationStatuses } from '@shared/index';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from './AdminLayout';
import { useAdminSession } from '@/hooks/use-site-data';
import { api } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminPageHeader, AdminSectionCard, PaginationBar, SearchInput, StatusBadge } from './components/AdminPrimitives';

export const AdminReservations = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: session } = useAdminSession();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data } = useQuery({
    queryKey: ['admin-reservations', page, search],
    queryFn: () => api.adminReservations({ page, pageSize: 8, search }),
  });

  useEffect(() => {
    setPage(1);
  }, [search]);

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.updateReservationStatus(id, { status }, session?.csrfToken ?? ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Reservation operations"
          title={t('admin.reservations')}
          description="Operational workflow for incoming bookings, event-linked intent, and table status changes."
        />

        <AdminSectionCard>
          <div className="mb-5">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by guest, email, or status" />
          </div>
          <div className="space-y-3">
            {(data?.items ?? []).map((reservation) => (
              <div key={reservation.id} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={reservation.status} tone={reservation.status === 'confirmed' ? 'success' : reservation.status === 'waitlist' ? 'warning' : 'neutral'} />
                      <StatusBadge status={reservation.intentType} tone="accent" />
                    </div>
                    <p className="mt-4 font-display text-2xl text-white">{reservation.customerName}</p>
                    <p className="mt-2 text-sm text-white/56">
                      {reservation.reservationDate} • {reservation.reservationTime} • {reservation.guests} guests • {reservation.area}
                    </p>
                    <p className="mt-2 text-sm text-white/42">{reservation.email} • {reservation.phone}</p>
                  </div>
                  <div className="w-full lg:w-56">
                    <Select value={reservation.status} onValueChange={(value) => mutation.mutate({ id: reservation.id, status: value })}>
                      <SelectTrigger className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {reservationStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <PaginationBar page={data?.page ?? 1} totalPages={Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 8)))} onPageChange={setPage} />
          </div>
        </AdminSectionCard>
      </div>
    </AdminLayout>
  );
};
