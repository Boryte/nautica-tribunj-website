import { zodResolver } from '@hookform/resolvers/zod';
import { businessSettingsSchema, resolveLocale } from '@shared/index';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, QrCode, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';
import { useAdminSession, useSiteBootstrap } from '@/hooks/use-site-data';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminLayout } from './AdminLayout';
import { AdminPageHeader, AdminSectionCard, DirtyStateBar } from './components/AdminPrimitives';

type SettingsFormValues = z.infer<typeof businessSettingsSchema>;

export const AdminSettings = () => {
  const { t, i18n } = useTranslation();
  const locale = resolveLocale(i18n.language);
  const queryClient = useQueryClient();
  const { data: session } = useAdminSession();
  const { data: bootstrap } = useSiteBootstrap(locale);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(businessSettingsSchema),
    defaultValues: bootstrap?.settings,
  });

  useEffect(() => {
    if (bootstrap?.settings) form.reset(bootstrap.settings);
  }, [bootstrap?.settings, form]);

  const mutation = useMutation({
    mutationFn: (values: SettingsFormValues) => api.updateSettings(values, session?.csrfToken ?? ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bootstrap'] });
      form.reset(form.getValues());
      toast.success('Settings saved');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to save settings'),
  });

  const twoFactorSetupMutation = useMutation({
    mutationFn: () => api.getAdminTwoFactorSetup(),
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to generate 2FA setup'),
  });

  const copyValue = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(label);
      window.setTimeout(() => setCopiedValue((current) => (current === label ? null : current)), 1800);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Unable to copy ${label.toLowerCase()}`);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Business configuration"
          title={t('admin.settings')}
          description="Identity, contact, location, and operational defaults for the public site and admin workflows."
          actions={
            <Button
              onClick={form.handleSubmit((values) => mutation.mutate(values))}
              className="rounded-full bg-[hsl(var(--brand-gold))] text-[hsl(var(--foreground))]"
            >
              {mutation.isPending ? t('common.saving') : t('common.save')}
            </Button>
          }
        />

        <form className="grid gap-6 xl:grid-cols-2">
          <AdminSectionCard title="Business identity" description="Core brand information used across public pages and metadata.">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-white/58">Business name</Label>
                <Input {...form.register('businessName')} className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-white/58">Timezone</Label>
                <Input {...form.register('timezone')} className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white" />
              </div>
            </div>
          </AdminSectionCard>

          <AdminSectionCard title="Contact info" description="Public reservation and contact channels.">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-white/58">Phone</Label>
                <Input {...form.register('phone')} className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-white/58">WhatsApp</Label>
                <Input {...form.register('whatsappPhone')} className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-white/58">Email</Label>
                <Input {...form.register('email')} className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white" />
              </div>
            </div>
          </AdminSectionCard>

          <AdminSectionCard title="Location" description="Venue address used in contact areas and local SEO.">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/58">Address</Label>
                <Input {...form.register('address')} className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-white/58">City</Label>
                <Input {...form.register('city')} className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white" />
              </div>
            </div>
          </AdminSectionCard>

          <AdminSectionCard title="Operational note" description="Keep these values accurate. They drive public contact details and admin defaults.">
            <div className="rounded-[1.25rem] border border-white/8 bg-black/10 p-4 text-sm leading-7 text-white/58">
              Settings save through the existing admin settings endpoint with schema validation. This screen now keeps controlled form state, reset support, inline editing, and explicit save flow instead of blindly resubmitting bootstrap data.
            </div>
          </AdminSectionCard>

          <AdminSectionCard
            title="Admin 2FA onboarding"
            description="Generate a fresh authenticator secret and QR code from admin, then paste the secret into production environment variables before enabling 2FA."
            action={
              <Button
                type="button"
                onClick={() => twoFactorSetupMutation.mutate()}
                variant="outline"
                className="rounded-full border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
              >
                <QrCode className="mr-2 h-4 w-4" />
                {twoFactorSetupMutation.isPending ? 'Generating...' : 'Generate setup'}
              </Button>
            }
            className="xl:col-span-2"
          >
            <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
              <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-white/8 bg-black/15 p-4">
                {twoFactorSetupMutation.data?.qrCodeDataUrl ? (
                  <img
                    src={twoFactorSetupMutation.data.qrCodeDataUrl}
                    alt="Admin 2FA QR code"
                    className="h-auto w-full max-w-[280px] rounded-[1rem] bg-white p-3"
                  />
                ) : (
                  <div className="max-w-[14rem] text-center text-sm leading-7 text-white/46">
                    Generate setup to render a QR code for Google Authenticator, 1Password, Authy, or another TOTP app.
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-[1.35rem] border border-white/8 bg-black/10 p-4 text-sm leading-7 text-white/62">
                  <div className="flex items-center gap-2 text-white">
                    <ShieldCheck className="h-4 w-4 text-[hsl(var(--brand-gold))]" />
                    <span>{twoFactorSetupMutation.data?.alreadyEnabled ? '2FA is currently enabled in environment.' : '2FA is currently disabled in environment.'}</span>
                  </div>
                  <p className="mt-3">
                    This flow generates a new secret locally in the API and does not persist it. After scanning, copy the secret into `ADMIN_2FA_SECRET`, set `ADMIN_2FA_ENABLED=true`, deploy the updated env file, and restart the API.
                  </p>
                </div>

                {twoFactorSetupMutation.data ? (
                  <>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label className="text-white/58">Secret</Label>
                        <div className="flex gap-2">
                          <Input value={twoFactorSetupMutation.data.secret} readOnly className="rounded-[1rem] border-white/10 bg-white/[0.04] font-mono text-white" />
                          <Button type="button" variant="outline" className="rounded-full border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]" onClick={() => copyValue('Secret', twoFactorSetupMutation.data!.secret)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white/58">otpauth URI</Label>
                        <div className="flex gap-2">
                          <Input value={twoFactorSetupMutation.data.otpauthUri} readOnly className="rounded-[1rem] border-white/10 bg-white/[0.04] font-mono text-white" />
                          <Button type="button" variant="outline" className="rounded-full border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]" onClick={() => copyValue('otpauth URI', twoFactorSetupMutation.data!.otpauthUri)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4 text-sm leading-7 text-white/60">
                      <p>1. Click `Generate setup`.</p>
                      <p>2. Scan the QR code in your authenticator app.</p>
                      <p>3. Copy the secret into `ADMIN_2FA_SECRET` in production env.</p>
                      <p>4. Set `ADMIN_2FA_ENABLED=true` and keep `ADMIN_2FA_WINDOW=1` unless you need a wider tolerance.</p>
                      <p>5. Restart the API and verify one successful admin login with the authenticator code.</p>
                      {copiedValue ? <p className="mt-2 text-[hsl(var(--brand-gold))]">{copiedValue} copied to clipboard.</p> : null}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </AdminSectionCard>
        </form>

        <DirtyStateBar
          visible={form.formState.isDirty}
          saving={mutation.isPending}
          onReset={() => bootstrap?.settings && form.reset(bootstrap.settings)}
          onSave={form.handleSubmit((values) => mutation.mutate(values))}
        />
      </div>
    </AdminLayout>
  );
};
