import { resolveLocale } from '@shared/index';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/Layout';
import { Reveal } from '@/components/Reveal';
import { EditorialSection, HeroFrame } from '@/components/public/PublicPrimitives';
import { LocalizedHead } from '@/components/seo/LocalizedHead';
import { getLegalDocument } from '@/content/legal';
import { toLocalizedUrl } from '@/lib/seo';
import { siteMedia } from '@/lib/site-media';

export const LegalPageTemplate = ({ documentKey }: { documentKey: 'privacy' | 'terms' | 'cookies' }) => {
  const { i18n } = useTranslation();
  const locale = resolveLocale(i18n.language);
  const content = getLegalDocument(documentKey, locale);
  const pageUrl = toLocalizedUrl(`/${documentKey}`, locale);

  return (
    <Layout>
      <LocalizedHead
        title={`Nautica | ${content.title}`}
        description={content.description}
        canonicalPath={`/${documentKey}`}
        locale={locale}
        image={siteMedia.gallery.src}
        imageAlt={content.title}
      />

      <HeroFrame
        compact
        eyebrow={content.heroEyebrow}
        title={content.heroTitle}
        description={content.heroBody}
        className="min-h-[58svh]"
      />

      <EditorialSection tone="ivory" className="pt-0">
        <div className="grid gap-5 lg:grid-cols-[0.84fr_1.16fr]">
          <Reveal>
            <aside className="panel-night-elevated rounded-[1.8rem] p-6 text-white sm:p-7">
              <p className="section-kicker">{content.updatedLabel}</p>
              <p className="mt-4 font-display text-[2.3rem] leading-[0.94] text-on-dark-title">
                {content.updatedAt}
              </p>
              <p className="mt-4 font-body text-sm leading-7 text-white/76">
                {content.description}
              </p>
            </aside>
          </Reveal>

          <div className="grid gap-5">
            {content.sections.map((section) => (
              <Reveal key={section.title}>
                <section className="panel-ivory-elevated rounded-[1.8rem] p-6 sm:p-7">
                  <p className="font-display text-[2.2rem] leading-[0.94] text-on-light-title">
                    {section.title}
                  </p>
                  {section.body?.map((paragraph) => (
                    <p key={paragraph} className="copy-marine mt-4 body-md">
                      {paragraph}
                    </p>
                  ))}
                  {section.bullets ? (
                    <ul className="mt-4 space-y-3 font-body text-sm leading-7 text-on-light-body">
                      {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                    </ul>
                  ) : null}
                </section>
              </Reveal>
            ))}
          </div>
        </div>
      </EditorialSection>
    </Layout>
  );
};
