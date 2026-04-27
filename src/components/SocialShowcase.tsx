import { useMemo } from 'react';
import type { MediaAssetDTO } from '@shared/index';
import { ArrowUpRight, Facebook, Instagram, Play, RefreshCw } from 'lucide-react';
import { ThirdPartyEmbedGate } from '@/components/cookies/ThirdPartyEmbedGate';
import { useTranslation } from 'react-i18next';
import { PremiumMedia } from '@/components/PremiumMedia';
import { Reveal, RevealGroup } from '@/components/Reveal';
import { FloatingCTA, SectionIntro, ShowcaseMedia } from '@/components/public/PublicPrimitives';
import { useSocialFeed } from '@/hooks/use-site-data';

const formatTimestamp = (value: string, locale: 'hr' | 'en') =>
  new Date(value).toLocaleDateString(locale === 'hr' ? 'hr-HR' : 'en-GB', {
    day: '2-digit',
    month: 'short',
  });

export const SocialShowcase = ({
  locale,
  fallbackItems,
}: {
  locale: 'hr' | 'en';
  fallbackItems: MediaAssetDTO[];
}) => {
  const { t } = useTranslation();
  const { data } = useSocialFeed();

  const instagramCards = useMemo(() => {
    if (data?.available && data.items.length > 0) return data.items.slice(0, 3);
    return fallbackItems.slice(0, 3).map((item) => ({
      id: `fallback-${item.id}`,
      caption: item.localizations[locale].caption || item.localizations[locale].alt,
      mediaType: item.mediaType === 'video' ? 'video' : 'image',
      mediaUrl: item.url,
      thumbnailUrl: null,
      permalink: data?.instagramProfileUrl ?? 'https://www.instagram.com/nautica_tribunj/',
      timestamp: new Date().toISOString(),
    }));
  }, [data, fallbackItems, locale]);

  const instagramAvailable = data?.available ?? false;
  const facebookPageUrl = data?.facebookPageUrl ?? 'https://www.facebook.com/nauticatribunj';
  const instagramProfileUrl = data?.instagramProfileUrl ?? 'https://www.instagram.com/nautica_tribunj/';
  const instagramUsername = data?.instagramUsername ?? 'nautica_tribunj';

  const facebookEmbedUrl = useMemo(() => {
    const url = new URL('https://www.facebook.com/plugins/page.php');
    url.searchParams.set('href', facebookPageUrl);
    url.searchParams.set('tabs', 'timeline');
    url.searchParams.set('width', '520');
    url.searchParams.set('height', '680');
    url.searchParams.set('small_header', 'true');
    url.searchParams.set('adapt_container_width', 'true');
    url.searchParams.set('hide_cover', 'false');
    url.searchParams.set('show_facepile', 'false');
    return url.toString();
  }, [facebookPageUrl]);

  return (
    <div className="social-showcase-shell">
      <div className="social-showcase-orb social-showcase-orb-left" aria-hidden="true" />
      <div className="social-showcase-orb social-showcase-orb-right" aria-hidden="true" />
      <RevealGroup className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12">
      <Reveal className="lg:pr-4">
        <SectionIntro
          eyebrow={t('social_live.eyebrow')}
          title={t('social_live.title', { handle: `@${instagramUsername}` })}
          description={t('social_live.description')}
          action={<FloatingCTA to="/media" label={t('social_live.media_cta')} />}
          className="gap-4"
        />

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a href={instagramProfileUrl} target="_blank" rel="noreferrer" className="luxury-button-primary">
            <Instagram className="h-4 w-4" />
            {t('social_live.instagram_cta')}
          </a>
          <a href={facebookPageUrl} target="_blank" rel="noreferrer" className="luxury-button-secondary border-black/10 bg-black/5 text-[hsl(var(--text-inverse))]">
            <Facebook className="h-4 w-4" />
            {t('social_live.facebook_cta')}
          </a>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {instagramCards.map((item, index) => (
            <Reveal key={item.id} className={index === 0 ? 'md:col-span-2' : ''}>
              <a href={item.permalink} target="_blank" rel="noreferrer" className="group block">
                <ShowcaseMedia className={`${index === 0 ? 'min-h-[25rem]' : 'min-h-[18rem]'} social-float-card ${index === 1 ? 'social-float-card-delayed' : index === 2 ? 'social-float-card-late' : ''} overflow-hidden rounded-[1.65rem] border border-black/8 bg-[rgba(17,24,32,0.08)] p-2 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.22)]`}>
                  <div className="relative h-full w-full overflow-hidden rounded-[1.2rem]">
                    <PremiumMedia
                      src={item.mediaType === 'video' ? item.mediaUrl : (item.thumbnailUrl ?? item.mediaUrl)}
                      alt={item.caption || `@${instagramUsername}`}
                      mediaType={item.mediaType === 'video' ? 'video' : 'image'}
                      className="absolute inset-0 h-full w-full"
                      mediaClassName="h-full w-full transition duration-700 group-hover:scale-[1.03]"
                      sizes={index === 0 ? '(min-width: 768px) 42vw, 100vw' : '(min-width: 768px) 20vw, 100vw'}
                      backdrop={false}
                      autoPlay={item.mediaType === 'video'}
                      controls={false}
                      muted
                      loop
                      focalPointX={'focalPointX' in item ? item.focalPointX : null}
                      focalPointY={'focalPointY' in item ? item.focalPointY : null}
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,11,16,0.06),rgba(5,11,16,0.18)_38%,rgba(5,11,16,0.76)_100%)]" />
                    <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/14 bg-[rgba(8,14,20,0.62)] px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-white/84 backdrop-blur-md">
                      <Instagram className="h-3.5 w-3.5 text-[hsl(var(--brand-gold))]" />
                      {item.mediaType === 'video' ? 'Reel' : 'Post'}
                    </div>
                    {item.mediaType === 'video' ? (
                      <div className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-[rgba(8,14,20,0.62)] text-white backdrop-blur-md">
                        <Play className="ml-0.5 h-4 w-4 fill-current" />
                      </div>
                    ) : null}
                    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-body text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--brand-gold))]">
                          {instagramAvailable ? t('social_live.live_label') : t('social_live.curated_label')}
                        </p>
                        <span className="font-body text-[10px] uppercase tracking-[0.24em] text-white/62">{formatTimestamp(item.timestamp, locale)}</span>
                      </div>
                      <p className="mt-3 line-clamp-3 font-body text-sm leading-7 text-white/90">
                        {item.caption || t('social_live.caption_fallback')}
                      </p>
                    </div>
                  </div>
                </ShowcaseMedia>
              </a>
            </Reveal>
          ))}
        </div>

        {!instagramAvailable ? (
          <div className="mt-5 flex items-start gap-3 rounded-[1.35rem] border border-black/8 bg-white/55 px-4 py-4 text-[hsl(var(--text-inverse))]/78 shadow-[0_20px_40px_-36px_rgba(15,23,42,0.2)]">
            <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--brand-gold))]" />
            <p className="font-body text-sm leading-7">
              {t('social_live.fallback_note')}
            </p>
          </div>
        ) : null}
      </Reveal>

      <Reveal>
        <div className="social-frame social-frame-minimal social-frame-breathe overflow-hidden rounded-[2.1rem] p-4 sm:p-5 lg:p-6">
          <div className="social-frame-inner rounded-[1.65rem] border border-white/10 bg-[rgba(8,14,20,0.36)] p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-kicker">{t('social_live.facebook_label')}</p>
                <h3 className="mt-3 font-display text-[2.3rem] leading-[0.92] text-[hsl(var(--text-on-dark))]">
                  {t('social_live.facebook_title')}
                </h3>
              </div>
              <a href={facebookPageUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/88 transition hover:bg-white/[0.08]">
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>

            <p className="mt-4 max-w-md font-body text-sm leading-7 text-white/74">
              {t('social_live.facebook_body')}
            </p>

            <div className="mt-6 rounded-[1.45rem] border border-white/10 bg-[rgba(245,239,231,0.06)] p-2.5">
              <ThirdPartyEmbedGate
                category="marketing"
                title={locale === 'hr' ? 'Facebook timeline učitavamo tek nakon pristanka.' : 'We only load the Facebook timeline after consent.'}
                body={locale === 'hr' ? 'Facebook widget može postaviti vlastite kolačiće i poslati podatke trećoj strani. Nakon pristanka timeline se prikazuje izravno ovdje.' : 'The Facebook widget may set its own cookies and send data to a third party. Once allowed, the timeline appears directly here.'}
                className="min-h-[680px]"
                preview={<div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(255,210,140,0.18),transparent_28%),linear-gradient(180deg,rgba(8,14,20,0.26),rgba(8,14,20,0.88))]" />}
              >
                <div className="social-facebook-shell">
                  <div className="social-facebook-toolbar">
                    <div className="flex items-center gap-2">
                      <span className="social-dot bg-[rgba(255,255,255,0.75)]" />
                      <span className="social-dot bg-[rgba(255,255,255,0.4)]" />
                      <span className="social-dot bg-[rgba(255,255,255,0.18)]" />
                    </div>
                    <span className="font-body text-[10px] uppercase tracking-[0.28em] text-white/48">Official widget</span>
                  </div>
                  <div className="social-facebook-viewport">
                    <iframe
                      title="Nautica Facebook timeline"
                      src={facebookEmbedUrl}
                      width="100%"
                      height="680"
                      loading="lazy"
                      scrolling="no"
                      className="social-facebook-embed"
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  </div>
                </div>
              </ThirdPartyEmbedGate>
            </div>
          </div>
        </div>
      </Reveal>
    </RevealGroup>
    </div>
  );
};
