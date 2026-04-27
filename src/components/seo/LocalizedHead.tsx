import { Helmet } from 'react-helmet-async';
import type { LocaleCode } from '@shared/index';
import { siteMedia } from '@/lib/site-media';
import {
  DEFAULT_OG_IMAGE,
  FACEBOOK_URL,
  INSTAGRAM_URL,
  SITE_NAME,
  SITE_URL,
  localeToOgLocale,
  normalizePath,
  toAbsoluteUrl,
  toLocalizedUrl,
} from '@/lib/seo';

const inferImageType = (url: string) => {
  if (/\.png($|\?)/i.test(url)) return 'image/png';
  if (/\.webp($|\?)/i.test(url)) return 'image/webp';
  return 'image/jpeg';
};

export const LocalizedHead = ({
  title,
  description,
  canonicalPath,
  locale,
  image,
  imageAlt,
  type = 'website',
  noindex = false,
  schemas = [],
  preloadImage,
  preloadImageType,
}: {
  title: string;
  description: string;
  canonicalPath: string;
  locale: LocaleCode;
  image?: string;
  imageAlt?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  schemas?: Array<Record<string, unknown>>;
  preloadImage?: string;
  preloadImageType?: string;
}) => {
  const normalizedPath = normalizePath(canonicalPath);
  const canonicalUrl = toLocalizedUrl(normalizedPath, locale);
  const hrUrl = toLocalizedUrl(normalizedPath, 'hr');
  const enUrl = toLocalizedUrl(normalizedPath, 'en');
  const socialImage = toAbsoluteUrl(image || DEFAULT_OG_IMAGE);
  const robotsContent = noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  const preloadUrl = preloadImage ? toAbsoluteUrl(preloadImage) : null;
  const imageType = inferImageType(socialImage);

  return (
    <Helmet>
      <html lang={locale} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />
      <meta name="theme-color" content="#0b1218" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="application-name" content={SITE_NAME} />
      <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
      <meta name="referrer" content="strict-origin-when-cross-origin" />
      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hrefLang="hr" href={hrUrl} />
      <link rel="alternate" hrefLang="en" href={enUrl} />
      <link rel="alternate" hrefLang="x-default" href={hrUrl} />
      <link rel="icon" href="/icons/favicon.ico" sizes="any" />
      <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="96x96" href="/icons/favicon-96x96.png" />
      <link rel="icon" type="image/png" href={siteMedia.logo.src} />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <link rel="apple-touch-icon" sizes="57x57" href="/icons/apple-icon-57x57.png" />
      <link rel="apple-touch-icon" sizes="60x60" href="/icons/apple-icon-60x60.png" />
      <link rel="apple-touch-icon" sizes="72x72" href="/icons/apple-icon-72x72.png" />
      <link rel="apple-touch-icon" sizes="76x76" href="/icons/apple-icon-76x76.png" />
      <link rel="apple-touch-icon" sizes="114x114" href="/icons/apple-icon-114x114.png" />
      <link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-icon-120x120.png" />
      <link rel="apple-touch-icon" sizes="144x144" href="/icons/apple-icon-144x144.png" />
      <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-icon-152x152.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-icon-180x180.png" />
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="me" href={INSTAGRAM_URL} />
      <link rel="me" href={FACEBOOK_URL} />
      <link rel="home" href={SITE_URL} />
      <meta name="msapplication-TileColor" content="#0b1218" />
      <meta name="msapplication-TileImage" content="/icons/ms-icon-144x144.png" />
      <meta name="msapplication-square70x70logo" content="/icons/ms-icon-70x70.png" />
      <meta name="msapplication-square150x150logo" content="/icons/ms-icon-150x150.png" />
      <meta name="msapplication-square310x310logo" content="/icons/ms-icon-310x310.png" />
      {preloadUrl ? <link rel="preload" as="image" href={preloadUrl} type={preloadImageType || inferImageType(preloadUrl)} /> : null}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={localeToOgLocale(locale)} />
      <meta property="og:locale:alternate" content={locale === 'hr' ? localeToOgLocale('en') : localeToOgLocale('hr')} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={socialImage} />
      <meta property="og:image:url" content={socialImage} />
      <meta property="og:image:secure_url" content={socialImage} />
      <meta property="og:image:type" content={imageType} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={imageAlt || title} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={socialImage} />
      <meta name="twitter:image:alt" content={imageAlt || title} />

      {schemas.map((schema, index) => (
        <script key={`${normalizedPath}-schema-${index}`} type="application/ld+json">{JSON.stringify(schema)}</script>
      ))}
    </Helmet>
  );
};
