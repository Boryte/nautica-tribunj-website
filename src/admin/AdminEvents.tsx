import { zodResolver } from '@hookform/resolvers/zod';
import { eventUpsertSchema, resolveLocale, type EventDTO } from '@shared/index';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';
import { useAdminSession } from '@/hooks/use-site-data';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { AdminLayout } from './AdminLayout';
import { AdminPageHeader, AdminSectionCard, DirtyStateBar, EntityDrawer, PaginationBar, SearchInput, StatusBadge } from './components/AdminPrimitives';
import { LocalizedFieldGroup, LocalizedInput, LocalizedTabs, LocalizedTextarea } from './components/LocalizedFields';
import { normalizeInternalOrExternalUrl } from './lib';
import { useLocaleEditor } from './hooks/use-locale-editor';

type EventFormValues = z.infer<typeof eventUpsertSchema>;

const initialState: EventFormValues = {
  slug: '',
  status: 'draft',
  featured: false,
  capacity: 40,
  waitlistEnabled: true,
  startsAt: '',
  endsAt: null,
  imageUrl: null,
  posterMediaId: null,
  category: 'special',
  timezone: 'Europe/Zagreb',
  reservationMode: 'optional',
  priceLabel: null,
  ticketUrl: null,
  linkedAnnouncementId: null,
  linkedGlimpseGroupId: null,
  tags: [],
  galleryMediaIds: [],
  localizations: {
    hr: { title: '', teaser: '', description: '' },
    en: { title: '', teaser: '', description: '' },
  },
};

const toInputDateTime = (value: string | null) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const offset = parsed.getTimezoneOffset();
  const local = new Date(parsed.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
};

const fromInputDateTime = (value: string) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString();
};

const mapEventToForm = (event: EventDTO): EventFormValues => ({
  id: event.id,
  slug: event.slug,
  status: event.status,
  featured: event.featured,
  capacity: event.capacity,
  waitlistEnabled: event.waitlistEnabled,
  startsAt: event.startsAt,
  endsAt: event.endsAt,
  imageUrl: event.imageUrl,
  posterMediaId: event.posterMediaId,
  category: event.category,
  timezone: event.timezone,
  reservationMode: event.reservationMode,
  priceLabel: event.priceLabel,
  ticketUrl: event.ticketUrl,
  linkedAnnouncementId: event.linkedAnnouncementId,
  linkedGlimpseGroupId: event.linkedGlimpseGroupId,
  tags: event.tags,
  galleryMediaIds: event.gallery.map((item) => item.id),
  localizations: event.localizations,
});

export const AdminEvents = () => {
  const { i18n } = useTranslation();
  const locale = resolveLocale(i18n.language);
  const queryClient = useQueryClient();
  const { data: session } = useAdminSession();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<EventDTO | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const { locale: editLocale, setLocale: setEditLocale } = useLocaleEditor();
  const { data } = useQuery({ queryKey: ['admin-events', page, search], queryFn: () => api.adminEvents({ page, pageSize: 6, search }) });

  useEffect(() => {
    setPage(1);
  }, [search]);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventUpsertSchema),
    defaultValues: initialState,
  });

  const openEditor = (event?: EventDTO) => {
    setEditorOpen(true);
    if (!event) {
      setSelected(null);
      form.reset(initialState);
      return;
    }
    setSelected(event);
    form.reset(mapEventToForm(event));
  };

  const mutation = useMutation({
    mutationFn: (values: EventFormValues) => api.upsertEvent(values, session?.csrfToken ?? '', values.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event'] });
      queryClient.invalidateQueries({ queryKey: ['bootstrap'] });
      setSelected(null);
      setEditorOpen(false);
      form.reset(initialState);
      toast.success('Event saved');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to save event'),
  });

  const reservationMode = form.watch('reservationMode');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Programming"
          title="Events"
          description="Publishing, ticketing, modal content, and reservation behavior for every event card."
          actions={<Button className="rounded-full bg-[hsl(var(--brand-gold))] text-[hsl(var(--foreground))]" onClick={() => openEditor()}>New event</Button>}
        />

        <AdminSectionCard>
          <div className="mb-5">
            <SearchInput value={search} onChange={setSearch} placeholder="Search events by title, status, or category" />
          </div>
          <div className="space-y-3">
            {(data?.items ?? []).map((event) => (
              <button key={event.id} type="button" onClick={() => openEditor(event)} className="w-full rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-5 text-left transition hover:bg-white/[0.05]">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={event.status} tone={event.status === 'published' ? 'success' : 'neutral'} />
                      <StatusBadge status={event.category} tone="accent" />
                      {event.ticketUrl ? <StatusBadge status="ticketed" tone="warning" /> : <StatusBadge status="free / internal" tone="neutral" />}
                    </div>
                    <p className="mt-4 font-display text-2xl text-white">{event.localizations[locale].title}</p>
                    <p className="mt-2 text-sm text-white/56">{event.localizations[locale].teaser}</p>
                  </div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/34">{new Date(event.startsAt).toLocaleString()}</p>
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
              setSelected(null);
              form.reset(initialState);
            }
          }}
          title={selected ? 'Edit event' : 'New event'}
          description="Each event now supports a richer popup presentation plus an optional external ticket CTA."
        >
          <form className="space-y-6">
            <LocalizedTabs value={editLocale} onValueChange={setEditLocale} status={form.watch('localizations')} />

            <LocalizedFieldGroup title="Localized content">
              <LocalizedInput label={`Title (${editLocale.toUpperCase()})`} value={form.watch(`localizations.${editLocale}.title`)} onChange={(value) => form.setValue(`localizations.${editLocale}.title`, value, { shouldDirty: true })} />
              <LocalizedInput label={`Teaser (${editLocale.toUpperCase()})`} value={form.watch(`localizations.${editLocale}.teaser`)} onChange={(value) => form.setValue(`localizations.${editLocale}.teaser`, value, { shouldDirty: true })} />
              <LocalizedTextarea label={`Description (${editLocale.toUpperCase()})`} value={form.watch(`localizations.${editLocale}.description`)} onChange={(value) => form.setValue(`localizations.${editLocale}.description`, value, { shouldDirty: true })} rows={6} />
            </LocalizedFieldGroup>

            <AdminSectionCard title="Publishing and scheduling">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-white/58">Slug</Label>
                  <Input {...form.register('slug')} className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white" placeholder="sunset-sessions-vol-iv" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/58">Status</Label>
                  <Select value={form.watch('status')} onValueChange={(value) => form.setValue('status', value as EventFormValues['status'], { shouldDirty: true })}>
                    <SelectTrigger className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['draft', 'published', 'cancelled', 'archived'].map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/58">Starts at</Label>
                  <Input type="datetime-local" value={toInputDateTime(form.watch('startsAt'))} onChange={(event) => form.setValue('startsAt', fromInputDateTime(event.target.value), { shouldDirty: true })} className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/58">Ends at</Label>
                  <Input type="datetime-local" value={toInputDateTime(form.watch('endsAt'))} onChange={(event) => form.setValue('endsAt', event.target.value ? fromInputDateTime(event.target.value) : null, { shouldDirty: true })} className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/58">Timezone</Label>
                  <Input {...form.register('timezone')} className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white" />
                </div>
                <div className="flex items-center justify-between rounded-[1rem] border border-white/8 bg-black/10 px-4 py-3">
                  <div>
                    <p className="text-sm text-white">Featured event</p>
                    <p className="text-xs text-white/42">Promotes the card into homepage and featured layouts.</p>
                  </div>
                  <Switch checked={form.watch('featured')} onCheckedChange={(value) => form.setValue('featured', value, { shouldDirty: true })} />
                </div>
              </div>
            </AdminSectionCard>

            <AdminSectionCard title="Presentation and access">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-white/58">Category</Label>
                  <Select value={form.watch('category')} onValueChange={(value) => form.setValue('category', value as EventFormValues['category'], { shouldDirty: true })}>
                    <SelectTrigger className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['music', 'sunset', 'brunch', 'cocktail', 'special', 'private'].map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/58">Reservation mode</Label>
                  <Select value={reservationMode} onValueChange={(value) => form.setValue('reservationMode', value as EventFormValues['reservationMode'], { shouldDirty: true })}>
                    <SelectTrigger className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['optional', 'required', 'external', 'none'].map((mode) => <SelectItem key={mode} value={mode}>{mode}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/58">Card / popup image URL</Label>
                  <Input value={form.watch('imageUrl') ?? ''} onChange={(event) => form.setValue('imageUrl', event.target.value || null, { shouldDirty: true })} className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white" placeholder="/uploads/event.jpg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/58">Displayed price label</Label>
                  <Input value={form.watch('priceLabel') ?? ''} onChange={(event) => form.setValue('priceLabel', event.target.value || null, { shouldDirty: true })} className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white" placeholder="Free entry / €18" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-white/58">External ticket URL</Label>
                  <Input value={form.watch('ticketUrl') ?? ''} onChange={(event) => form.setValue('ticketUrl', normalizeInternalOrExternalUrl(event.target.value), { shouldDirty: true })} className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white" placeholder="https://tickets.example.com/..." />
                  <p className="text-xs text-white/42">Leave empty for free / on-site events. Use with external mode when tickets are sold elsewhere.</p>
                </div>
              </div>
            </AdminSectionCard>

            <AdminSectionCard title="Operations">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-white/58">Capacity</Label>
                  <Input type="number" {...form.register('capacity', { valueAsNumber: true })} className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white" />
                </div>
                <div className="flex items-center justify-between rounded-[1rem] border border-white/8 bg-black/10 px-4 py-3">
                  <div>
                    <p className="text-sm text-white">Enable waitlist</p>
                    <p className="text-xs text-white/42">Keeps registrations open after sellout.</p>
                  </div>
                  <Switch checked={form.watch('waitlistEnabled')} onCheckedChange={(value) => form.setValue('waitlistEnabled', value, { shouldDirty: true })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-white/58">Tags</Label>
                  <Textarea value={form.watch('tags').join(', ')} onChange={(event) => form.setValue('tags', event.target.value.split(',').map((item) => item.trim()).filter(Boolean), { shouldDirty: true })} rows={3} className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white" placeholder="dj, sunset, terrace, cocktails" />
                </div>
              </div>
            </AdminSectionCard>
          </form>

          <DirtyStateBar visible={form.formState.isDirty} saving={mutation.isPending} onReset={() => (selected ? form.reset(mapEventToForm(selected)) : form.reset(initialState))} onSave={form.handleSubmit((values) => mutation.mutate(values))} />
        </EntityDrawer>
      </div>
    </AdminLayout>
  );
};
