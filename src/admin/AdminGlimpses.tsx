import { zodResolver } from '@hookform/resolvers/zod';
import { glimpseGroupUpsertSchema, resolveLocale, type GlimpseGroupDTO } from '@shared/index';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';
import { useAdminGlimpses, useAdminSession } from '@/hooks/use-site-data';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminLayout } from './AdminLayout';
import { AdminPageHeader, AdminSectionCard, DirtyStateBar, EntityDrawer, SearchInput, StatusBadge } from './components/AdminPrimitives';
import { LocalizedFieldGroup, LocalizedInput, LocalizedTabs } from './components/LocalizedFields';
import { useLocaleEditor } from './hooks/use-locale-editor';

type GlimpseGroupFormValues = z.infer<typeof glimpseGroupUpsertSchema>;

const initialState: GlimpseGroupFormValues = {
  active: true,
  sortOrder: 0,
  coverMediaId: null,
  localizations: {
    hr: { label: 'Glimpse', title: '' },
    en: { label: 'Glimpse', title: '' },
  },
};

const mapGroupToForm = (group: GlimpseGroupDTO): GlimpseGroupFormValues => ({
  id: group.id,
  active: group.active,
  sortOrder: group.sortOrder,
  coverMediaId: group.coverMediaId,
  localizations: group.localizations,
});

export const AdminGlimpses = () => {
  const { i18n } = useTranslation();
  const locale = resolveLocale(i18n.language);
  const queryClient = useQueryClient();
  const { data: session } = useAdminSession();
  const { data = [] } = useAdminGlimpses();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<GlimpseGroupDTO | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const { locale: editLocale, setLocale: setEditLocale } = useLocaleEditor();

  const form = useForm<GlimpseGroupFormValues>({
    resolver: zodResolver(glimpseGroupUpsertSchema),
    defaultValues: initialState,
  });

  const filtered = useMemo(
    () => data.filter((group) => group.localizations[locale].title.toLowerCase().includes(search.toLowerCase())),
    [data, locale, search]
  );

  const mutation = useMutation({
    mutationFn: (values: GlimpseGroupFormValues) => api.upsertGlimpseGroup(values, session?.csrfToken ?? ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-glimpses'] });
      queryClient.invalidateQueries({ queryKey: ['glimpses'] });
      queryClient.invalidateQueries({ queryKey: ['bootstrap'] });
      setSelected(null);
      setEditorOpen(false);
      form.reset(initialState);
      toast.success('Glimpse group saved');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to save glimpse group'),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader eyebrow="Story discovery" title="Glimpses" description="Curate immersive story-group entry points for the homepage rail and viewer." actions={<Button className="rounded-full bg-[hsl(var(--brand-gold))] text-[hsl(var(--foreground))]" onClick={() => { setSelected(null); form.reset(initialState); setEditorOpen(true); }}>New glimpse group</Button>} />

        <AdminSectionCard>
          <div className="mb-5">
            <SearchInput value={search} onChange={setSearch} placeholder="Search glimpse groups" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {filtered.map((group) => (
              <button key={group.id} type="button" onClick={() => { setSelected(group); form.reset(mapGroupToForm(group)); setEditorOpen(true); }} className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5 text-left transition hover:bg-white/[0.05]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={group.active ? 'active' : 'inactive'} tone={group.active ? 'success' : 'neutral'} />
                      <StatusBadge status={`${group.slides.length} slides`} tone="accent" />
                    </div>
                    <p className="mt-4 font-display text-2xl text-white">{group.localizations[locale].title}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </AdminSectionCard>

        <EntityDrawer open={editorOpen} onOpenChange={(open) => { setEditorOpen(open); if (!open) { setSelected(null); form.reset(initialState); } }} title={selected ? 'Edit glimpse group' : 'New glimpse group'} description="Localized labeling for homepage story discovery groups.">
          <form className="space-y-6">
            <LocalizedTabs value={editLocale} onValueChange={setEditLocale} status={form.watch('localizations')} />
            <LocalizedFieldGroup title="Localized identity">
              <LocalizedInput label={`Label (${editLocale.toUpperCase()})`} value={form.watch(`localizations.${editLocale}.label`)} onChange={(value) => form.setValue(`localizations.${editLocale}.label`, value, { shouldDirty: true })} />
              <LocalizedInput label={`Title (${editLocale.toUpperCase()})`} value={form.watch(`localizations.${editLocale}.title`)} onChange={(value) => form.setValue(`localizations.${editLocale}.title`, value, { shouldDirty: true })} />
            </LocalizedFieldGroup>
            <AdminSectionCard title="Ordering">
              <Input type="number" value={form.watch('sortOrder')} onChange={(event) => form.setValue('sortOrder', Number(event.target.value), { shouldDirty: true })} className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white" />
            </AdminSectionCard>
          </form>
          <DirtyStateBar visible={form.formState.isDirty} saving={mutation.isPending} onReset={() => (selected ? form.reset(mapGroupToForm(selected)) : form.reset(initialState))} onSave={form.handleSubmit((values) => mutation.mutate(values))} />
        </EntityDrawer>
      </div>
    </AdminLayout>
  );
};
