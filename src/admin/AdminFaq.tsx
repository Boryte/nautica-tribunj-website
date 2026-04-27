import { zodResolver } from '@hookform/resolvers/zod';
import { faqUpsertSchema, type FaqEntryDTO } from '@shared/index';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { toast } from 'sonner';
import { useAdminFaqs, useAdminSession } from '@/hooks/use-site-data';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AdminLayout } from './AdminLayout';
import {
  AdminPageHeader,
  AdminSectionCard,
  ConfirmDangerDialog,
  DirtyStateBar,
  EmptyState,
  EntityDrawer,
  PaginationBar,
  SearchInput,
  StatusBadge,
} from './components/AdminPrimitives';
import { LocalizedFieldGroup, LocalizedInput, LocalizedTabs, LocalizedTextarea } from './components/LocalizedFields';
import { useLocaleEditor } from './hooks/use-locale-editor';

type FaqFormValues = z.infer<typeof faqUpsertSchema>;

const initialValues: FaqFormValues = {
  active: true,
  category: 'Reservations',
  sortOrder: 0,
  localizations: {
    hr: { question: '', answer: '' },
    en: { question: '', answer: '' },
  },
};

const mapFaqToForm = (entry: FaqEntryDTO): FaqFormValues => ({
  id: entry.id,
  active: entry.active,
  category: entry.category,
  sortOrder: entry.sortOrder,
  localizations: entry.localizations,
});

export const AdminFaq = () => {
  const queryClient = useQueryClient();
  const { data: session } = useAdminSession();
  const { locale: editLocale, setLocale: setEditLocale } = useLocaleEditor();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selected, setSelected] = useState<FaqEntryDTO | null>(null);
  const { data } = useAdminFaqs({ page, pageSize: 8, search });

  useEffect(() => {
    setPage(1);
  }, [search]);

  const form = useForm<FaqFormValues>({
    resolver: zodResolver(faqUpsertSchema),
    defaultValues: initialValues,
  });

  const openEditor = (entry?: FaqEntryDTO) => {
    setEditorOpen(true);
    if (!entry) {
      setSelected(null);
      form.reset(initialValues);
      return;
    }

    setSelected(entry);
    form.reset(mapFaqToForm(entry));
  };

  const mutation = useMutation({
    mutationFn: (values: FaqFormValues) => api.upsertFaq(values, session?.csrfToken ?? ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      setEditorOpen(false);
      setSelected(null);
      form.reset(initialValues);
      toast.success('FAQ saved');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to save FAQ'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteFaq(id, session?.csrfToken ?? ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      setDeleteId(null);
      toast.success('FAQ deleted');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to delete FAQ'),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Guest questions"
          title="FAQ"
          description="Manage the answers guests see before they reach reservations, events, and private inquiries."
          actions={<Button className="rounded-full bg-[hsl(var(--brand-gold))] text-[hsl(var(--foreground))]" onClick={() => openEditor()}>New FAQ</Button>}
        />

        <AdminSectionCard>
          <div className="mb-5">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by category, question, or answer" />
          </div>

          {(data?.items ?? []).length === 0 ? (
            <EmptyState title="No FAQ entries" description="Create the first FAQ item to populate the public page." actionLabel="New FAQ" onAction={() => openEditor()} />
          ) : (
            <div className="space-y-3">
              {(data?.items ?? []).map((entry) => (
                <div key={entry.id} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status={entry.active ? 'active' : 'hidden'} tone={entry.active ? 'success' : 'neutral'} />
                        <StatusBadge status={entry.category} tone="accent" />
                      </div>
                      <p className="mt-4 font-display text-2xl text-white">{entry.localizations.hr.question}</p>
                      <p className="mt-2 text-sm text-white/52">{entry.localizations.en.question}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" className="rounded-full border border-white/10 bg-white/[0.04] text-white" onClick={() => openEditor(entry)}>Edit</Button>
                      <Button variant="ghost" className="rounded-full border border-rose-400/20 bg-rose-400/10 text-rose-100" onClick={() => setDeleteId(entry.id)}>Delete</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5">
            <PaginationBar page={data?.page ?? 1} totalPages={Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 8)))} onPageChange={setPage} />
          </div>
        </AdminSectionCard>

        <EntityDrawer
          open={editorOpen}
          onOpenChange={(open) => {
            setEditorOpen(open);
            if (!open) {
              setSelected(null);
              form.reset(initialValues);
            }
          }}
          title={selected ? 'Edit FAQ entry' : 'New FAQ entry'}
          description="Questions and answers are localized and shown publicly on the FAQ page."
        >
          <form className="space-y-6">
            <LocalizedTabs value={editLocale} onValueChange={setEditLocale} status={form.watch('localizations')} />

            <LocalizedFieldGroup title="Localized copy">
              <LocalizedInput label={`Question (${editLocale.toUpperCase()})`} value={form.watch(`localizations.${editLocale}.question`)} onChange={(value) => form.setValue(`localizations.${editLocale}.question`, value, { shouldDirty: true })} />
              <LocalizedTextarea label={`Answer (${editLocale.toUpperCase()})`} value={form.watch(`localizations.${editLocale}.answer`)} onChange={(value) => form.setValue(`localizations.${editLocale}.answer`, value, { shouldDirty: true })} rows={7} />
            </LocalizedFieldGroup>

            <AdminSectionCard title="FAQ settings">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-white/58">Category</Label>
                  <Input value={form.watch('category')} onChange={(event) => form.setValue('category', event.target.value, { shouldDirty: true })} className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/58">Sort order</Label>
                  <Input type="number" value={form.watch('sortOrder')} onChange={(event) => form.setValue('sortOrder', Number(event.target.value || 0), { shouldDirty: true })} className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white" />
                </div>
                <div className="md:col-span-2 flex items-center justify-between rounded-[1rem] border border-white/8 bg-black/10 px-4 py-3">
                  <div>
                    <p className="text-sm text-white">Visible on the public FAQ page</p>
                    <p className="text-xs text-white/42">Disable an entry without deleting its localized content.</p>
                  </div>
                  <Switch checked={form.watch('active')} onCheckedChange={(value) => form.setValue('active', value, { shouldDirty: true })} />
                </div>
              </div>
            </AdminSectionCard>
          </form>

          <DirtyStateBar
            visible={form.formState.isDirty}
            saving={mutation.isPending}
            onReset={() => (selected ? form.reset(mapFaqToForm(selected)) : form.reset(initialValues))}
            onSave={form.handleSubmit((values) => mutation.mutate(values))}
          />
        </EntityDrawer>

        <ConfirmDangerDialog
          open={deleteId !== null}
          onOpenChange={(open) => {
            if (!open) setDeleteId(null);
          }}
          title="Delete FAQ entry"
          description="This removes the FAQ entry and both localized variants from the CMS and the public site."
          onConfirm={() => {
            if (deleteId !== null) deleteMutation.mutate(deleteId);
          }}
        />
      </div>
    </AdminLayout>
  );
};
