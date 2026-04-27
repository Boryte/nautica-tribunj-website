import { zodResolver } from '@hookform/resolvers/zod';
import { menuItemUpsertSchema, resolveLocale } from '@shared/index';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';
import { AdminLayout } from './AdminLayout';
import { useAdminSession } from '@/hooks/use-site-data';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminPageHeader, AdminSectionCard, DirtyStateBar, EntityDrawer, PaginationBar, SearchInput, StatusBadge } from './components/AdminPrimitives';
import { LocalizedFieldGroup, LocalizedInput, LocalizedTabs, LocalizedTextarea } from './components/LocalizedFields';
import { useLocaleEditor } from './hooks/use-locale-editor';

type MenuFormValues = z.infer<typeof menuItemUpsertSchema>;

const initialState: MenuFormValues = {
  category: 'cocktails',
  signature: false,
  priceLabel: '',
  secondaryPriceLabel: null,
  sortOrder: 0,
  availability: true,
  featured: false,
  labels: [],
  allergens: [],
  mediaAssetId: null,
  bookSection: null,
  spreadStyle: null,
  localizations: {
    hr: { name: '', description: '' },
    en: { name: '', description: '' },
  },
};

export const AdminMenu = () => {
  const { i18n } = useTranslation();
  const locale = resolveLocale(i18n.language);
  const queryClient = useQueryClient();
  const { data: session } = useAdminSession();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const { locale: editLocale, setLocale: setEditLocale } = useLocaleEditor();
  const { data } = useQuery({ queryKey: ['admin-menu', page, search], queryFn: () => api.adminMenu({ page, pageSize: 8, search }) });

  useEffect(() => {
    setPage(1);
  }, [search]);

  const form = useForm<MenuFormValues>({
    resolver: zodResolver(menuItemUpsertSchema),
    defaultValues: initialState,
  });

  const mutation = useMutation({
    mutationFn: (values: MenuFormValues) => api.upsertMenuItem(values, session?.csrfToken ?? ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menu'] });
      queryClient.invalidateQueries({ queryKey: ['bootstrap'] });
      setSelectedId(null);
      setEditorOpen(false);
      form.reset(initialState);
      toast.success('Menu item saved');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to save menu item'),
  });

  const openEditor = (item?: NonNullable<typeof data>['items'][number]) => {
    setEditorOpen(true);
    if (!item) {
      setSelectedId(null);
      form.reset(initialState);
      return;
    }

    setSelectedId(item.id);
    form.reset({
      id: item.id,
      category: item.category,
      signature: item.signature,
      priceLabel: item.priceLabel,
      secondaryPriceLabel: item.secondaryPriceLabel,
      sortOrder: item.sortOrder,
      availability: item.availability,
      featured: item.featured,
      labels: item.labels,
      allergens: item.allergens,
      mediaAssetId: null,
      bookSection: item.bookSection,
      spreadStyle: item.spreadStyle,
      localizations: item.localizations,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader eyebrow="Menu CMS" title="Menu" description="Direct editing for menu structure, featured items, labels, and editorial menu-book metadata." actions={<Button className="rounded-full bg-[hsl(var(--brand-gold))] text-[hsl(var(--foreground))]" onClick={() => openEditor()}>New item</Button>} />

        <AdminSectionCard>
          <div className="mb-5">
            <SearchInput value={search} onChange={setSearch} placeholder="Search menu items or categories" />
          </div>
          <div className="space-y-3">
            {(data?.items ?? []).map((item) => (
              <button key={item.id} type="button" onClick={() => openEditor(item)} className="w-full rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-5 text-left transition hover:bg-white/[0.05]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={item.category} tone="neutral" />
                      {item.featured && <StatusBadge status="featured" tone="accent" />}
                    </div>
                    <p className="mt-4 font-display text-2xl text-white">{item.localizations[locale].name}</p>
                    <p className="mt-2 text-sm text-white/54">{item.localizations[locale].description}</p>
                  </div>
                  <p className="text-sm text-white/54">{item.priceLabel}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-5">
            <PaginationBar page={data?.page ?? 1} totalPages={Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 8)))} onPageChange={setPage} />
          </div>
        </AdminSectionCard>

        <EntityDrawer open={editorOpen} onOpenChange={(open) => { setEditorOpen(open); if (!open) { setSelectedId(null); form.reset(initialState); } }} title={selectedId ? 'Edit menu item' : 'New menu item'} description="Single-source editing for both structured menu output and desktop book-mode composition.">
          <form className="space-y-6">
            <LocalizedTabs value={editLocale} onValueChange={setEditLocale} status={form.watch('localizations')} />
            <LocalizedFieldGroup title="Localized copy">
              <LocalizedInput label={`Name (${editLocale.toUpperCase()})`} value={form.watch(`localizations.${editLocale}.name`)} onChange={(value) => form.setValue(`localizations.${editLocale}.name`, value, { shouldDirty: true })} />
              <LocalizedTextarea label={`Description (${editLocale.toUpperCase()})`} value={form.watch(`localizations.${editLocale}.description`)} onChange={(value) => form.setValue(`localizations.${editLocale}.description`, value, { shouldDirty: true })} />
            </LocalizedFieldGroup>
            <AdminSectionCard title="Pricing and structure">
              <div className="grid gap-4 md:grid-cols-2">
                <Input value={form.watch('category')} onChange={(event) => form.setValue('category', event.target.value, { shouldDirty: true })} className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white" placeholder="cocktails" />
                <Input value={form.watch('priceLabel')} onChange={(event) => form.setValue('priceLabel', event.target.value, { shouldDirty: true })} className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white" placeholder="€12.00" />
                <Input value={form.watch('secondaryPriceLabel') ?? ''} onChange={(event) => form.setValue('secondaryPriceLabel', event.target.value || null, { shouldDirty: true })} className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white" placeholder="Optional secondary price" />
                <Input type="number" value={form.watch('sortOrder')} onChange={(event) => form.setValue('sortOrder', Number(event.target.value), { shouldDirty: true })} className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white" />
                <Input value={form.watch('labels').join(', ')} onChange={(event) => form.setValue('labels', event.target.value.split(',').map((value) => value.trim()).filter(Boolean) as MenuFormValues['labels'], { shouldDirty: true })} className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white" placeholder="signature, new" />
                <Input value={form.watch('allergens').join(', ')} onChange={(event) => form.setValue('allergens', event.target.value.split(',').map((value) => value.trim()).filter(Boolean), { shouldDirty: true })} className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white" placeholder="milk, nuts" />
              </div>
            </AdminSectionCard>
          </form>
          <DirtyStateBar visible={form.formState.isDirty} saving={mutation.isPending} onReset={() => {
            const current = data?.items.find((item) => item.id === selectedId);
            if (current) {
              openEditor(current);
              return;
            }
            form.reset(initialState);
          }} onSave={form.handleSubmit((values) => mutation.mutate(values))} />
        </EntityDrawer>
      </div>
    </AdminLayout>
  );
};
