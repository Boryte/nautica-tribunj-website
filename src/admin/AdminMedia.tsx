import { zodResolver } from '@hookform/resolvers/zod';
import { mediaAssetUpsertSchema, resolveLocale, type MediaAssetDTO } from '@shared/index';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, LayoutGrid, List, Trash2, UploadCloud } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { PremiumMedia } from '@/components/PremiumMedia';
import { toAbsoluteMediaUrl } from '@/lib/media';
import type { z } from 'zod';
import { useAdminMedia, useAdminSession } from '@/hooks/use-site-data';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AdminLayout } from './AdminLayout';
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

type MediaFormValues = z.infer<typeof mediaAssetUpsertSchema>;

const mapMediaToForm = (asset: MediaAssetDTO): MediaFormValues => ({
  id: asset.id,
  status: asset.status,
  featured: asset.featured,
  tags: asset.tags,
  collections: asset.collections as MediaFormValues['collections'],
  focalPointX: asset.focalPointX,
  focalPointY: asset.focalPointY,
  localizations: asset.localizations,
});

export const AdminMedia = () => {
  const { i18n } = useTranslation();
  const locale = resolveLocale(i18n.language);
  const queryClient = useQueryClient();
  const { data: session } = useAdminSession();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selected, setSelected] = useState<MediaAssetDTO | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const { locale: editLocale, setLocale: setEditLocale } = useLocaleEditor();
  const { data } = useAdminMedia({ page, pageSize: 9, search });

  useEffect(() => {
    setPage(1);
  }, [search]);

  const form = useForm<MediaFormValues>({
    resolver: zodResolver(mediaAssetUpsertSchema),
    defaultValues: {
      status: 'ready',
      featured: false,
      tags: [],
      collections: [],
      focalPointX: 0.5,
      focalPointY: 0.5,
      localizations: {
        hr: { alt: '', caption: '' },
        en: { alt: '', caption: '' },
      },
    },
  });

  const collectionOptions = useMemo(
    () => (data?.collections ?? []).map((collection) => ({ slug: collection.slug, name: collection.name })),
    [data?.collections]
  );

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      Array.from(files ?? []).forEach((file) => formData.append('files', file));
      return api.uploadMedia(formData, session?.csrfToken ?? '');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-media'] });
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      queryClient.invalidateQueries({ queryKey: ['bootstrap'] });
      setFiles(null);
      toast.success('Media uploaded');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Upload failed'),
  });

  const updateMutation = useMutation({
    mutationFn: (values: MediaFormValues) =>
      api.updateMedia(values.id!, { ...values }, session?.csrfToken ?? ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-media'] });
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      queryClient.invalidateQueries({ queryKey: ['bootstrap'] });
      toast.success('Asset updated');
      setSelected(null);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Update failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteMedia(id, session?.csrfToken ?? ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-media'] });
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      queryClient.invalidateQueries({ queryKey: ['bootstrap'] });
      toast.success('Asset deleted');
      setSelected(null);
      setConfirmOpen(false);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Delete failed'),
  });

  const assets = data?.assets.items ?? [];

  const openEditor = (asset: MediaAssetDTO) => {
    setSelected(asset);
    form.reset(mapMediaToForm(asset));
  };

  const toggleCollection = (slug: MediaFormValues['collections'][number]) => {
    const current = form.getValues('collections');
    const next = current.includes(slug)
      ? current.filter((entry) => entry !== slug)
      : [...current, slug];
    form.setValue('collections', next, { shouldDirty: true });
  };

  const previewUrl = toAbsoluteMediaUrl(selected?.url);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Asset library"
          title="Media"
          description="Browse, upload, tag, localize, and curate photos, GIFs, and videos used across the archive. Homepage decorative imagery now stays static, while this library powers the media page and story previews."
          actions={
            <label className="inline-flex cursor-pointer items-center rounded-full bg-[hsl(var(--brand-gold))] px-5 py-3 text-[11px] uppercase tracking-[0.22em] text-[hsl(var(--foreground))]">
              <UploadCloud className="mr-2 h-4 w-4" />
              Upload
              <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={(event) => setFiles(event.target.files)} />
            </label>
          }
        />

        {files?.length ? (
          <AdminSectionCard title="Pending upload" action={<Button type="button" onClick={() => uploadMutation.mutate()}>{uploadMutation.isPending ? 'Uploading...' : 'Start upload'}</Button>}>
            <div className="flex flex-wrap gap-2 text-sm text-white/58">{Array.from(files).map((file) => <span key={file.name} className="rounded-full border border-white/10 px-3 py-1">{file.name}</span>)}</div>
          </AdminSectionCard>
        ) : null}

        <AdminSectionCard>
          <AdminToolbar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search assets, tags, or collections" />
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="icon" className={view === 'grid' ? 'bg-white/8 text-white' : 'text-white/54'} onClick={() => setView('grid')}>
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className={view === 'list' ? 'bg-white/8 text-white' : 'text-white/54'} onClick={() => setView('list')}>
                <List className="h-4 w-4" />
              </Button>
            </div>
          </AdminToolbar>

          {!assets.length ? (
            <div className="mt-5">
              <EmptyState title="No media assets found" description="Upload the first photos, GIFs, or videos to start curating the media library." />
            </div>
          ) : view === 'grid' ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {assets.map((asset) => (
                <button key={asset.id} type="button" onClick={() => openEditor(asset)} className="overflow-hidden rounded-[1.5rem] border border-white/8 bg-white/[0.03] text-left transition hover:bg-white/[0.05]">
                  <PremiumMedia
                    src={asset.url}
                    alt={asset.localizations[locale].alt}
                    mediaType={asset.mediaType}
                    className="h-52 w-full"
                    mediaClassName="h-full w-full"
                    backdrop={false}
                    autoPlay={asset.mediaType === 'video'}
                    controls={false}
                    focalPointX={asset.focalPointX}
                    focalPointY={asset.focalPointY}
                  />
                  <div className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={asset.status} tone="accent" />
                      {asset.featured && <StatusBadge status="featured" tone="success" />}
                      <StatusBadge status={asset.mediaType} tone={asset.mediaType === 'video' ? 'warning' : 'success'} />
                    </div>
                    <p className="mt-3 font-display text-xl text-white">{asset.originalFilename}</p>
                    <p className="mt-2 text-sm text-white/52">{asset.collections.join(', ') || 'Unassigned'}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {assets.map((asset) => (
                <button key={asset.id} type="button" onClick={() => openEditor(asset)} className="flex w-full items-center gap-4 rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4 text-left transition hover:bg-white/[0.05]">
                  <PremiumMedia
                    src={asset.url}
                    alt={asset.localizations[locale].alt}
                    mediaType={asset.mediaType}
                    className="h-20 w-20 rounded-[1rem]"
                    mediaClassName="h-full w-full rounded-[1rem]"
                    backdrop={false}
                    autoPlay={asset.mediaType === 'video'}
                    controls={false}
                    focalPointX={asset.focalPointX}
                    focalPointY={asset.focalPointY}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-xl text-white">{asset.originalFilename}</p>
                    <p className="truncate text-sm text-white/52">{asset.localizations[locale].alt}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={asset.mediaType} tone={asset.mediaType === 'video' ? 'warning' : 'success'} />
                    <StatusBadge status={asset.status} tone="accent" />
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-5">
            <PaginationBar page={data?.assets.page ?? 1} totalPages={Math.max(1, Math.ceil((data?.assets.total ?? 0) / (data?.assets.pageSize ?? 9)))} onPageChange={setPage} />
          </div>
        </AdminSectionCard>

        <EntityDrawer open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }} title={selected ? selected.originalFilename : 'Media editor'} description="Media archive metadata, localization, crop focus, and collection assignment.">
          {selected && (
            <>
              <div className="overflow-hidden rounded-[1.5rem] border border-white/8">
                <PremiumMedia
                  src={selected.url}
                  alt={selected.localizations[locale].alt}
                  mediaType={selected.mediaType}
                  className="h-72 w-full"
                  mediaClassName="h-full w-full"
                  backdrop={false}
                  autoPlay={selected.mediaType === 'video'}
                  controls={selected.mediaType === 'video'}
                  focalPointX={form.watch('focalPointX')}
                  focalPointY={form.watch('focalPointY')}
                />
              </div>
              <form className="mt-6 space-y-6">
                <LocalizedTabs value={editLocale} onValueChange={setEditLocale} status={form.watch('localizations')} />

                <LocalizedFieldGroup title="Localized media text">
                  <LocalizedInput label={`Alt text (${editLocale.toUpperCase()})`} value={form.watch(`localizations.${editLocale}.alt`)} onChange={(value) => form.setValue(`localizations.${editLocale}.alt`, value, { shouldDirty: true })} />
                  <LocalizedTextarea label={`Caption (${editLocale.toUpperCase()})`} value={form.watch(`localizations.${editLocale}.caption`)} onChange={(value) => form.setValue(`localizations.${editLocale}.caption`, value, { shouldDirty: true })} />
                </LocalizedFieldGroup>

                <AdminSectionCard title="Library metadata">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-white/58">Media type</Label>
                      <div className="rounded-[1rem] border border-white/8 bg-black/10 px-4 py-3 text-sm text-white/88">
                        {selected.mediaType === 'video' ? 'Video' : 'Image / GIF'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/58">Status</Label>
                      <Select value={form.watch('status')} onValueChange={(value) => form.setValue('status', value as MediaFormValues['status'], { shouldDirty: true })}>
                        <SelectTrigger className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['draft', 'ready', 'archived'].map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between rounded-[1rem] border border-white/8 bg-black/10 px-4 py-3 md:col-span-2">
                      <div>
                        <p className="text-sm text-white">Featured asset</p>
                        <p className="text-xs text-white/42">Prioritize in curated surfaces.</p>
                      </div>
                      <Switch checked={form.watch('featured')} onCheckedChange={(value) => form.setValue('featured', value, { shouldDirty: true })} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-white/58">Tags</Label>
                      <Input value={form.watch('tags').join(', ')} onChange={(event) => form.setValue('tags', event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean), { shouldDirty: true })} className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white" />
                    </div>
                    <div className="space-y-3 md:col-span-2">
                      <Label className="text-white/58">Collections</Label>
                      <div className="flex flex-wrap gap-2">
                        {collectionOptions.map((collection) => {
                          const active = form.watch('collections').includes(collection.slug as MediaFormValues['collections'][number]);
                          return (
                            <Button
                              key={collection.slug}
                              type="button"
                              variant="ghost"
                              className={active ? 'rounded-full bg-[hsl(var(--brand-gold))] text-[hsl(var(--foreground))]' : 'rounded-full border border-white/10 text-white/72'}
                              onClick={() => toggleCollection(collection.slug as MediaFormValues['collections'][number])}
                            >
                              {collection.name}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="space-y-3 md:col-span-2">
                      <Label className="text-white/58">Crop focus</Label>
                      <div className="grid gap-4 rounded-[1rem] border border-white/8 bg-black/10 p-4 md:grid-cols-2">
                        <label className="space-y-2">
                          <span className="text-sm text-white/76">Horizontal focus</span>
                          <input type="range" min={0} max={100} step={1} value={Math.round((form.watch('focalPointX') ?? 0.5) * 100)} onChange={(event) => form.setValue('focalPointX', Number(event.target.value) / 100, { shouldDirty: true })} className="w-full" />
                        </label>
                        <label className="space-y-2">
                          <span className="text-sm text-white/76">Vertical focus</span>
                          <input type="range" min={0} max={100} step={1} value={Math.round((form.watch('focalPointY') ?? 0.5) * 100)} onChange={(event) => form.setValue('focalPointY', Number(event.target.value) / 100, { shouldDirty: true })} className="w-full" />
                        </label>
                      </div>
                    </div>
                  </div>
                </AdminSectionCard>

                <AdminSectionCard title="Asset actions">
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="ghost" className="border border-white/10" onClick={() => previewUrl && navigator.clipboard.writeText(previewUrl).then(() => toast.success('Asset URL copied'))}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy asset URL
                    </Button>
                    <Button type="button" variant="ghost" className="border border-rose-400/20 text-rose-200" onClick={() => setConfirmOpen(true)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete asset
                    </Button>
                  </div>
                </AdminSectionCard>
              </form>

              <DirtyStateBar
                visible={form.formState.isDirty}
                saving={updateMutation.isPending}
                onReset={() => selected && form.reset(mapMediaToForm(selected))}
                onSave={form.handleSubmit((values) => updateMutation.mutate(values))}
              />

              <ConfirmDangerDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Delete media asset"
                description="Deletion is blocked if the asset is still referenced by events, menu items, glimpse stories, or media collections."
                onConfirm={() => deleteMutation.mutate(selected.id)}
              />
            </>
          )}
        </EntityDrawer>
      </div>
    </AdminLayout>
  );
};
