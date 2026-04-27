import { useMemo, useState } from 'react';
import { resolveLocale } from '@shared/index';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/Layout';
import { PremiumMedia } from '@/components/PremiumMedia';
import { PremiumImage } from '@/components/PremiumImage';
import { Reveal } from '@/components/Reveal';
import { EditorialSection, HeroFrame, ShowcaseMedia } from '@/components/public/PublicPrimitives';
import { PageState } from '@/components/states/PageState';
import { BackendOfflineNotice } from '@/components/states/BackendOfflineNotice';
import { LocalizedHead } from '@/components/seo/LocalizedHead';
import { useMediaCollections } from '@/hooks/use-site-data';
import { isBackendOfflineError } from '@/lib/api-state';
import { buildBreadcrumbSchema, buildImageGallerySchema, buildWebPageSchema, toLocalizedUrl } from '@/lib/seo';
import { siteMedia } from '@/lib/site-media';

const MediaPage = () => {
  const { t, i18n } = useTranslation();
  const locale = resolveLocale(i18n.language);
  const { data: collections, isLoading, isError, error } = useMediaCollections();
  const [activeCollection, setActiveCollection] = useState<string>('all');

  const collectionList = useMemo(() => collections ?? [], [collections]);

  const visibleItems = useMemo(() => {
    const seen = new Set<number>();
    const sourceItems = activeCollection === 'all'
      ? collectionList.flatMap((collection) => collection.items ?? [])
      : collectionList.find((collection) => collection.slug === activeCollection)?.items ?? [];

    return sourceItems.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [activeCollection, collectionList]);

  const mediaItems = useMemo(
    () =>
      visibleItems.map((item) => {
        const hasDimensions = Boolean(item.width && item.height && item.width > 0 && item.height > 0);
        const orientation = hasDimensions ? (item.width! >= item.height! ? 'landscape' : 'portrait') : item.mediaType === 'video' ? 'landscape' : 'portrait';
        const localized = item.localizations?.[locale] ?? item.localizations?.hr ?? item.localizations?.en ?? { alt: '', caption: '' };

        return {
          ...item,
          orientation,
          localized,
        };
      }),
    [locale, visibleItems]
  );

  if (isLoading) {
    return (
      <Layout>
        <PageState title={t('common.loading')} description={t('media_page.subtitle')} />
      </Layout>
    );
  }

  const pageTitle = locale === 'hr' ? 'Galerija i atmosfera Nautice u Tribunju' : 'Nautica gallery and atmosphere in Tribunj';
  const pageDescription = locale === 'hr'
    ? 'Fotografije i mediji Nautice u Tribunju: terasa, kokteli, kava, zalasci sunca i večernja atmosfera uz more.'
    : 'Photos and media from Nautica in Tribunj: terrace, cocktails, coffee, sunsets, and evening atmosphere by the sea.';
  const pageUrl = toLocalizedUrl('/media', locale);

  const backendOffline = isBackendOfflineError(error);

  if (isError && !backendOffline) {
    return <Layout><PageState title={t('common.error')} description={t('media_page.subtitle')} /></Layout>;
  }

  return (
    <Layout>
      <LocalizedHead
        title={pageTitle}
        description={pageDescription}
        canonicalPath="/media"
        locale={locale}
        image={siteMedia.gallery.src}
        imageAlt={locale === 'hr' ? 'Galerija Nautice u Tribunju uz more' : 'Nautica gallery in Tribunj by the sea'}
        schemas={[
          buildWebPageSchema({ locale, title: pageTitle, description: pageDescription, url: pageUrl }),
          buildImageGallerySchema({
            locale,
            url: pageUrl,
            title: pageTitle,
            description: pageDescription,
            images: mediaItems.map((item) => ({ url: item.url, alt: item.localized.alt || item.localized.caption || t('media_page.title') })),
          }),
          buildBreadcrumbSchema([
            { name: 'Nautica', url: toLocalizedUrl('/', locale) },
            { name: t('media_page.title'), url: pageUrl },
          ]),
        ]}
      />

      <HeroFrame
        compact
        eyebrow={t('media_page.hero_eyebrow')}
        title={t('media_page.hero_title')}
        description={t('media_page.subtitle')}
        media={<PremiumImage src={siteMedia.about.src} webpSrc={siteMedia.about.webpSrc} width={siteMedia.about.width} height={siteMedia.about.height} alt={locale === 'hr' ? 'Atmosfera Nautice i zalasci u Tribunju' : 'Nautica atmosphere and sunsets in Tribunj'} className="hero-media" priority sizes="100vw" />}
      />

      <EditorialSection tone="ivory" className="pt-12 sm:pt-16 lg:pt-20">
        <div className="page-width">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="section-kicker">{t('media_page.title')}</p>
              <h2 className="headline-sea mt-3 display-md text-[hsl(var(--text-inverse))]">
                {locale === 'hr' ? 'Kadrovi mora, svjetla i večeri ovdje ostaju živi i nakon zalaska.' : 'Frames of the sea, light, and evenings stay alive here long after sunset.'}
              </h2>
              <p className="copy-marine mt-4 max-w-3xl body-md text-[hsl(var(--text-body))]/80">
                {locale === 'hr'
                  ? 'Galerija okuplja mirnije jutarnje trenutke, zlatni sat na rivi, koktele u pokretu i noći koje najbolje objašnjavaju zašto je Nautica jedno od mjesta kojima se gosti vraćaju u Tribunju.'
                  : 'The gallery brings together quiet mornings, golden hour on the waterfront, cocktails in motion, and the nights that best explain why guests return to Nautica in Tribunj.'}
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-black/8 bg-black/[0.03] px-5 py-4 text-sm text-[hsl(var(--text-body))]/72 shadow-[0_16px_40px_-34px_rgba(0,0,0,0.28)]">
              {locale === 'hr'
                ? `${mediaItems.length} medija trenutno vidljivo`
                : `${mediaItems.length} visible media items`}
            </div>
          </div>

          <div className="hide-scrollbar mt-8 flex gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => setActiveCollection('all')}
              className={`rounded-full px-4 py-2.5 text-[10px] uppercase tracking-[0.22em] ${
                activeCollection === 'all'
                  ? 'bg-[hsl(var(--brand-gold))] text-[hsl(var(--text-inverse))]'
                  : 'border border-black/10 bg-black/[0.03] text-[hsl(var(--text-body))]/88'
              }`}
            >
              {t('media_page.all')}
            </button>
            {collectionList.map((collection) => (
              <button
                key={collection.id}
                type="button"
                onClick={() => setActiveCollection(collection.slug)}
                className={`rounded-full px-4 py-2.5 text-[10px] uppercase tracking-[0.22em] ${
                  activeCollection === collection.slug
                    ? 'bg-[hsl(var(--text-inverse))] text-white'
                    : 'border border-black/10 bg-black/[0.03] text-[hsl(var(--text-body))]/88'
                }`}
              >
                {collection.name}
              </button>
            ))}
          </div>

          {!mediaItems.length ? (
            backendOffline ? (
              <BackendOfflineNotice
                title={locale === 'hr' ? 'Media galerija je privremeno offline.' : 'The media gallery is temporarily offline.'}
                body={locale === 'hr'
                  ? 'Filteri i stranica rade, ali slike i video iz live galerije traže backend. Čim API ponovno bude dostupan, mediji će se vratiti ovdje bez dodatnih izmjena.'
                  : 'The page and filters still work, but live images and videos require the backend. As soon as the API is available again, the media will reappear here without further changes.'}
                className="mt-10"
              />
            ) : (
              <div className="mt-10 rounded-[1.8rem] border border-dashed border-black/12 bg-black/[0.02] px-6 py-14 text-center text-[hsl(var(--text-body))]/72">
                {locale === 'hr' ? 'Nema vidljivih medija za ovu kolekciju.' : 'There are no visible media items for this collection yet.'}
              </div>
            )
          ) : (
            <div className="mt-10 columns-1 gap-5 space-y-5 sm:columns-2 lg:columns-3">
              {mediaItems.map((item, index) => (
                <Reveal key={item.id} className="mb-5 break-inside-avoid">
                  <figure className="overflow-hidden rounded-[1.55rem] border border-black/8 bg-black/[0.035] p-2.5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                    <ShowcaseMedia
                      minHeight={
                        item.mediaType === 'video'
                          ? 'min-h-[20rem] sm:min-h-[24rem]'
                          : item.orientation === 'portrait'
                            ? 'min-h-[28rem] sm:min-h-[34rem]'
                            : 'min-h-[20rem] sm:min-h-[24rem]'
                      }
                      className="overflow-hidden rounded-[1.15rem]"
                    >
                      <PremiumMedia
                        src={item.url}
                        alt={item.localized.alt || 'Nautica media item'}
                        mediaType={item.mediaType}
                        className="h-full w-full"
                        mediaClassName="h-full w-full transition duration-700 hover:scale-[1.02]"
                        sizes="(min-width: 1280px) 28vw, (min-width: 768px) 42vw, 100vw"
                        backdrop={item.mediaType === 'image'}
                        autoPlay={item.mediaType === 'video'}
                        controls={item.mediaType === 'video'}
                        priority={index < 3}
                        focalPointX={item.focalPointX}
                        focalPointY={item.focalPointY}
                      />
                    </ShowcaseMedia>
                    <div className="flex items-start justify-between gap-4 px-1 pt-3">
                      {item.localized.caption ? (
                        <figcaption className="font-body text-sm leading-6 text-[hsl(var(--text-body))]/84">{item.localized.caption}</figcaption>
                      ) : <div />}
                      <span className={`inline-flex rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.22em] ${
                        item.mediaType === 'video'
                          ? 'bg-[rgba(17,24,32,0.94)] text-white/82'
                          : 'border border-black/10 bg-black/[0.03] text-[hsl(var(--text-body))]/62'
                      }`}>
                        {item.mediaType === 'video' ? 'Video' : 'Photo / GIF'}
                      </span>
                    </div>
                  </figure>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </EditorialSection>
    </Layout>
  );
};

export default MediaPage;
