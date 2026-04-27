import { useMemo } from 'react';
import { resolveLocale } from '@shared/index';
import { ArrowRight, CircleHelp, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/Layout';
import { Reveal } from '@/components/Reveal';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DarkShowcaseSection, EditorialSection, SectionIntro } from '@/components/public/PublicPrimitives';
import { LocalizedHead } from '@/components/seo/LocalizedHead';
import { BackendOfflineNotice } from '@/components/states/BackendOfflineNotice';
import { PageState } from '@/components/states/PageState';
import { useFaqEntries, usePublicBootstrap } from '@/hooks/use-site-data';
import { isBackendOfflineError } from '@/lib/api-state';
import { fallbackSiteSettings } from '@/lib/site-settings';
import { buildBreadcrumbSchema, buildFaqSchema, buildLocalBusinessSchema, buildWebPageSchema, GOOGLE_MAPS_URL, toLocalizedUrl } from '@/lib/seo';
import { siteMedia } from '@/lib/site-media';
import { LocalizedLink } from '@/components/LocalizedLink';
import { mergeFaqEntries } from '@/lib/local-seo';
const Faq = () => {
  const { t, i18n } = useTranslation();
  const locale = resolveLocale(i18n.language);
  const { data: faqs, isLoading, isError, error } = useFaqEntries();
  const { data: bootstrap } = usePublicBootstrap(locale);
  const settings = bootstrap?.settings ?? fallbackSiteSettings;
  const backendOffline = isBackendOfflineError(error);

  const mergedFaqs = useMemo(() => mergeFaqEntries(faqs), [faqs]);

  const groupedFaqs = useMemo(() => {
    const entries = mergedFaqs;
    return Object.entries(
      entries.reduce<Record<string, typeof entries>>((acc, entry) => {
        acc[entry.category] = [...(acc[entry.category] ?? []), entry];
        return acc;
      }, {})
    );
  }, [mergedFaqs]);

  if (isLoading) {
    return <Layout><PageState title={t('common.loading')} description={t('faq_page.subtitle')} /></Layout>;
  }

  if (isError && !backendOffline) {
    return <Layout><PageState title={t('common.error')} description={t('faq_page.subtitle')} /></Layout>;
  }

  const pageTitle = locale === 'hr' ? 'Česta pitanja | Nautica Tribunj' : 'Frequently asked questions | Nautica Tribunj';
  const pageDescription = locale === 'hr'
    ? 'Česta pitanja za goste koji planiraju kavu, koktele, rezervaciju ili dolazak u Nauticu u Tribunju, uključujući upite iz Vodica i Srime.'
    : 'Frequently asked questions for guests planning coffee, cocktails, reservations, or an evening at Nautica in Tribunj, including nearby arrivals from Vodice and Srima.';
  const pageUrl = toLocalizedUrl('/faq', locale);

  return (
    <Layout>
      <LocalizedHead
        title={pageTitle}
        description={pageDescription}
        canonicalPath="/faq"
        locale={locale}
        image={siteMedia.closeup.src}
        imageAlt={locale === 'hr' ? 'Nautica FAQ i informacije za goste u Tribunju' : 'Nautica FAQ and guest information in Tribunj'}
        preloadImage={siteMedia.about.webpSrc}
        preloadImageType="image/webp"
        schemas={[
          buildWebPageSchema({ locale, title: pageTitle, description: pageDescription, url: pageUrl }),
          buildFaqSchema(mergedFaqs, locale, pageUrl),
          buildLocalBusinessSchema(locale, settings),
          buildBreadcrumbSchema([
            { name: 'Nautica', url: toLocalizedUrl('/', locale) },
            { name: t('faq_page.title'), url: pageUrl },
          ]),
        ]}
      />

      <EditorialSection tone="ivory" className="page-top-safe">
        <SectionIntro
          eyebrow={t('faq_page.section_label')}
          title={t('faq_page.section_title')}
          description={<span className="copy-marine">{t('faq_page.section_body')}</span>}
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-[0.38fr_0.62fr]">
          <Reveal>
            <div className="panel-night-elevated sticky top-[calc(var(--header-height)+1rem)] rounded-[1.8rem] p-6 text-white">
              <p className="section-kicker">{t('faq_page.categories_label')}</p>
              <div className="mt-5 grid gap-3">
                {groupedFaqs.map(([category, entries], index) => (
                  <div key={category} className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] px-4 py-4">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[hsl(var(--brand-gold))]">{`0${index + 1}`}</p>
                    <p className="mt-3 font-display text-3xl leading-[0.94] text-on-dark-title">{category}</p>
                    <p className="mt-2 text-sm leading-6 text-on-dark-body">
                      {entries.length} {entries.length === 1 ? t('faq_page.single_entry') : t('faq_page.multiple_entries')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <div className="grid gap-5">
            {groupedFaqs.length > 0 ? groupedFaqs.map(([category, entries]) => (
              <Reveal key={category}>
                <section className="overflow-hidden rounded-[1.8rem] border border-black/8 bg-black/[0.03] p-3 shadow-[0_20px_55px_rgba(15,23,42,0.06)] sm:p-4">
                  <div className="rounded-[1.4rem] bg-white/55 p-5 sm:p-6">
                    <p className="section-kicker">{category}</p>
                    <Accordion type="single" collapsible className="mt-4">
                      {entries.map((entry) => (
                        <AccordionItem key={entry.id} value={`faq-${entry.id}`} className="border-black/10">
                          <AccordionTrigger className="py-5 text-left font-display text-[1.5rem] leading-[1.02] text-[hsl(var(--text-inverse))] hover:no-underline">
                            {entry.localizations[locale].question}
                          </AccordionTrigger>
                          <AccordionContent className="pb-5 pr-8 font-body text-[0.98rem] leading-8 text-[hsl(var(--text-body))]">
                            {entry.localizations[locale].answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </section>
              </Reveal>
            )) : (
              <BackendOfflineNotice
                title={locale === 'hr' ? 'FAQ trenutno nije učitan.' : 'The FAQ is not currently loaded.'}
                body={locale === 'hr'
                  ? 'Kontakt i ostale statične informacije ostaju dostupne, ali pitanja i odgovori iz CMS-a čekaju povratak backend servisa.'
                  : 'Contact details and the rest of the static page remain available, but the CMS-powered questions and answers are waiting for the backend to come back online.'}
              />
            )}
          </div>
        </div>
      </EditorialSection>

      <DarkShowcaseSection className="pt-0">
        <div className="grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="rounded-[1.9rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <p className="section-kicker">{t('faq_page.cta_label')}</p>
            <h2 className="mt-4 font-display text-[3rem] leading-[0.9] text-on-dark-title sm:text-[4rem]">
              {t('faq_page.cta_title')}
            </h2>
            <p className="mt-5 body-xl text-on-dark-body">{t('faq_page.cta_body')}</p>
          </div>
          <div className="rounded-[1.9rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <p className="section-kicker">{t('faq_page.cta_actions')}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={GOOGLE_MAPS_URL} target="_blank" rel="noreferrer" className="luxury-button-secondary">
                {locale === 'hr' ? 'Otvorite Google Maps' : 'Open Google Maps'}
              </a>
              <a
                href={`https://wa.me/${settings.whatsappPhone.replace(/[^\d]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="luxury-button-primary"
              >
                {t('faq_page.whatsapp_cta')}
                <ArrowRight className="h-4 w-4" />
              </a>
              <LocalizedLink to="/reservation" className="luxury-button-secondary">
                {t('hero.cta_reserve')}
              </LocalizedLink>
            </div>
          </div>
        </div>
      </DarkShowcaseSection>
    </Layout>
  );
};

export default Faq;
