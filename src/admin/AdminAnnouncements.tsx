import { zodResolver } from '@hookform/resolvers/zod';
import { announcementUpsertSchema, resolveLocale, type AnnouncementDTO } from '@shared/index';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';
import { useAdminAnnouncements, useAdminSession } from '@/hooks/use-site-data';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AdminLayout } from './AdminLayout';
import { normalizeInternalOrExternalUrl } from './lib';
import {
  AdminPageHeader,
  AdminSectionCard,
  AdminToolbar,
  ConfirmDangerDialog,
  DirtyStateBar,
  EmptyState,
  EntityDrawer,
  PaginationBar,
  SearchInput,
  StatusBadge,
} from './components/AdminPrimitives';
import {
  LocalizedFieldGroup,
  LocalizedInput,
  LocalizedTabs,
  LocalizedTextarea,
} from './components/LocalizedFields';
import { useLocaleEditor } from './hooks/use-locale-editor';

type AnnouncementFormValues = z.infer<typeof announcementUpsertSchema>;

const initialValues: AnnouncementFormValues = {
  status: 'draft',
  variant: 'info',
  priority: 100,
  sortOrder: 0,
  dismissible: false,
  persistentDismissalKey: null,
  ctaUrl: null,
  eventId: null,
  reservationIntent: null,
  startsAt: null,
  endsAt: null,
  localizations: {
    hr: { title: '', body: '', ctaLabel: '' },
    en: { title: '', body: '', ctaLabel: '' },
  },
};

const toneByStatus: Record<string, 'neutral' | 'success' | 'warning' | 'danger' | 'accent'> = {
  draft: 'neutral',
  active: 'success',
  scheduled: 'accent',
  expired: 'warning',
};

const toInputDateTime = (value: string | null) => (value ? value.slice(0, 16) : '');
const fromInputDateTime = (value: string) => (value ? new Date(value).toISOString() : null);

export const AdminAnnouncements = () => {
  const { i18n } = useTranslation();
  const locale = resolveLocale(i18n.language);
  const queryClient = useQueryClient();
  const { data: session } = useAdminSession();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AnnouncementDTO | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { locale: editLocale, setLocale: setEditLocale } = useLocaleEditor();
  const { data } = useAdminAnnouncements({ page, pageSize: 6, search });

  useEffect(() => {
    setPage(1);
  }, [search]);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementUpsertSchema),
    defaultValues: initialValues,
  });

  const items = data?.items ?? [];

  const upsertMutation = useMutation({
    mutationFn: (values: AnnouncementFormValues) =>
      api.upsertAnnouncement(
        {
          ...values,
          ctaUrl: normalizeInternalOrExternalUrl(values.ctaUrl),
        },
        session?.csrfToken ?? ''
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['bootstrap'] });
      form.reset(initialValues);
      setSelected(null);
      setEditorOpen(false);
      toast.success('Announcement saved');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to save announcement'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteAnnouncement(id, session?.csrfToken ?? ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['bootstrap'] });
      form.reset(initialValues);
      setSelected(null);
      setConfirmOpen(false);
      setEditorOpen(false);
      toast.success('Announcement deleted');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to delete announcement'),
  });

  const openEditor = (announcement?: AnnouncementDTO) => {
    setEditorOpen(true);
    if (!announcement) {
      setSelected(null);
      form.reset(initialValues);
      return;
    }

    setSelected(announcement);
    form.reset({
      id: announcement.id,
      status: announcement.status,
      variant: announcement.variant,
      priority: announcement.priority,
      sortOrder: announcement.sortOrder,
      dismissible: announcement.dismissible,
      persistentDismissalKey: announcement.persistentDismissalKey,
      ctaUrl: announcement.ctaUrl,
      eventId: announcement.eventId,
      reservationIntent: announcement.reservationIntent,
      startsAt: announcement.startsAt,
      endsAt: announcement.endsAt,
      localizations: announcement.localizations,
    });
  };

  const watchLocalized = form.watch('localizations');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Campaign management"
          title="Announcements"
          description="Manage promo bars, event callouts, scheduling windows, and CTA behavior with explicit state and preview."
          actions={<Button className="rounded-full bg-[hsl(var(--brand-gold))] text-[hsl(var(--foreground))]" onClick={() => openEditor()}>New announcement</Button>}
        />

        <AdminSectionCard>
          <AdminToolbar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search title, body, or status" />
          </AdminToolbar>

          <div className="mt-5 grid gap-4">
            {!items.length && (
              <EmptyState
                title="No announcements yet"
                description="Create campaign bars for event launches, reservation pushes, or operational notices."
                actionLabel="Create announcement"
                onAction={() => openEditor()}
              />
            )}

            {items.map((announcement) => (
              <button
                type="button"
                key={announcement.id}
                onClick={() => openEditor(announcement)}
                className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5 text-left transition hover:bg-white/[0.05]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={announcement.status} tone={toneByStatus[announcement.status]} />
                      <StatusBadge status={announcement.variant} tone="neutral" />
                    </div>
                    <h3 className="mt-4 font-display text-2xl text-white">{announcement.localizations[locale].title}</h3>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-white/58">{announcement.localizations[locale].body}</p>
                  </div>
                  <div className="text-right text-xs uppercase tracking-[0.18em] text-white/34">
                    <p>Priority {announcement.priority}</p>
                    <p className="mt-2">Sort {announcement.sortOrder}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-5">
            <PaginationBar page={data?.page ?? 1} totalPages={Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 6)))} onPageChange={setPage} />
          </div>
        </AdminSectionCard>

        <EntityDrawer
          open={editorOpen}
          onOpenChange={(open) => {
            setEditorOpen(open);
            if (!open) {
              form.reset(initialValues);
              setSelected(null);
            }
          }}
          title={selected ? 'Edit announcement' : 'New announcement'}
          description="Localized campaign copy with state, scheduling, CTA routing, and dismissibility."
        >
          <form className="space-y-6">
            <LocalizedTabs value={editLocale} onValueChange={setEditLocale} status={watchLocalized} />

            <LocalizedFieldGroup title="Localized copy" description="Edit one locale at a time and track completeness without duplicating the page structure.">
              <LocalizedInput label={`Title (${editLocale.toUpperCase()})`} value={form.watch(`localizations.${editLocale}.title`)} onChange={(value) => form.setValue(`localizations.${editLocale}.title`, value, { shouldDirty: true })} />
              <LocalizedTextarea label={`Body (${editLocale.toUpperCase()})`} rows={4} value={form.watch(`localizations.${editLocale}.body`)} onChange={(value) => form.setValue(`localizations.${editLocale}.body`, value, { shouldDirty: true })} />
              <LocalizedInput label={`CTA label (${editLocale.toUpperCase()})`} value={form.watch(`localizations.${editLocale}.ctaLabel`)} onChange={(value) => form.setValue(`localizations.${editLocale}.ctaLabel`, value, { shouldDirty: true })} />
            </LocalizedFieldGroup>

            <AdminSectionCard title="Campaign configuration">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-white/58">Status</Label>
                  <Select value={form.watch('status')} onValueChange={(value) => form.setValue('status', value as AnnouncementFormValues['status'], { shouldDirty: true })}>
                    <SelectTrigger className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['draft', 'scheduled', 'active', 'expired'].map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/58">Variant</Label>
                  <Select value={form.watch('variant')} onValueChange={(value) => form.setValue('variant', value as AnnouncementFormValues['variant'], { shouldDirty: true })}>
                    <SelectTrigger className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['info', 'event', 'promo', 'urgent'].map((variant) => <SelectItem key={variant} value={variant}>{variant}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/58">Priority</Label>
                  <Input type="number" {...form.register('priority', { valueAsNumber: true })} className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/58">Sort order</Label>
                  <Input type="number" {...form.register('sortOrder', { valueAsNumber: true })} className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/58">Starts at</Label>
                  <Input type="datetime-local" value={toInputDateTime(form.watch('startsAt'))} onChange={(event) => form.setValue('startsAt', fromInputDateTime(event.target.value), { shouldDirty: true })} className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/58">Ends at</Label>
                  <Input type="datetime-local" value={toInputDateTime(form.watch('endsAt'))} onChange={(event) => form.setValue('endsAt', fromInputDateTime(event.target.value), { shouldDirty: true })} className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white" />
                </div>
              </div>
            </AdminSectionCard>

            <AdminSectionCard title="Linking and behavior">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-white/58">CTA destination</Label>
                  <Input
                    value={form.watch('ctaUrl') ?? ''}
                    onChange={(event) => form.setValue('ctaUrl', normalizeInternalOrExternalUrl(event.target.value), { shouldDirty: true })}
                    placeholder="/events/sunset-sessions-vol-iii or https://..."
                    className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white"
                  />
                </div>
                <div className="flex items-center justify-between rounded-[1rem] border border-white/8 bg-black/10 px-4 py-3">
                  <div>
                    <p className="text-sm text-white">Dismissible</p>
                    <p className="text-xs text-white/42">Allows persistent client-side dismissal.</p>
                  </div>
                  <Switch checked={form.watch('dismissible')} onCheckedChange={(value) => form.setValue('dismissible', value, { shouldDirty: true })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/58">Dismissal key</Label>
                  <Input value={form.watch('persistentDismissalKey') ?? ''} onChange={(event) => form.setValue('persistentDismissalKey', event.target.value || null, { shouldDirty: true })} className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white" />
                </div>
              </div>
            </AdminSectionCard>

            <AdminSectionCard title="Live preview">
              <div className="rounded-full border border-[hsl(var(--brand-gold))]/20 bg-[linear-gradient(90deg,rgba(48,28,12,0.94),rgba(10,20,31,0.94))] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--brand-gold))]">
                  {form.watch(`localizations.${editLocale}.title`) || 'Announcement title'}
                </p>
                <p className="mt-1 text-sm text-white/78">{form.watch(`localizations.${editLocale}.body`) || 'Announcement preview body'}</p>
              </div>
            </AdminSectionCard>
          </form>

          <DirtyStateBar
            visible={form.formState.isDirty}
            saving={upsertMutation.isPending}
            onReset={() => (selected ? openEditor(selected) : form.reset(initialValues))}
            onSave={form.handleSubmit((values) => upsertMutation.mutate(values))}
          />

          {selected && (
            <>
              <div className="mt-4">
                <Button variant="ghost" className="text-rose-300 hover:text-rose-200" onClick={() => setConfirmOpen(true)}>
                  Remove draft entry
                </Button>
              </div>
              <ConfirmDangerDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Delete announcement"
                description="This removes the campaign and its localized content from the admin and public site."
                confirmLabel="Delete announcement"
                onConfirm={() => {
                  if (selected) deleteMutation.mutate(selected.id);
                }}
              />
            </>
          )}
        </EntityDrawer>
      </div>
    </AdminLayout>
  );
};
