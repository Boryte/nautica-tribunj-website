import { resolveLocale } from '@shared/index';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/Layout';
import { DarkShowcaseSection } from '@/components/public/PublicPrimitives';
import { LocalizedHead } from '@/components/seo/LocalizedHead';
import { BackendOfflineNotice } from '@/components/states/BackendOfflineNotice';
import { PageState } from '@/components/states/PageState';
import { usePublicBootstrap } from '@/hooks/use-site-data';
import { buildBreadcrumbSchema, buildLocalBusinessSchema, buildMenuSchema, buildWebPageSchema, toLocalizedUrl } from '@/lib/seo';
import { siteMedia } from '@/lib/site-media';
import { fallbackSiteSettings } from '@/lib/site-settings';
import MenuBook from '@/components/public/MenuBook';

const Menu = () => {
  const { t, i18n } = useTranslation();
  const locale = resolveLocale(i18n.language);
  const { data: bootstrap, isLoading, isError, backendOffline } = usePublicBootstrap(locale);

  if (isLoading) {
    return <Layout><PageState title={t('common.loading')} description={t('menu_page.subtitle')} /></Layout>;
  }

  if (isError && !backendOffline) {
    return <Layout><PageState title={t('common.error')} description={t('menu_page.subtitle')} /></Layout>;
  }
  const settings = bootstrap?.settings ?? fallbackSiteSettings;

  const pageTitle = locale === 'hr' ? 'Meni koktela i kave u Tribunju | Nautica' : 'Cocktail and coffee menu in Tribunj | Nautica';
  const pageDescription = locale === 'hr'
    ? 'Meni koktela, kave i pića u Nautici u Tribunju, za goste koji traže elegantan bar uz more blizu Vodica i Srime.'
    : 'Cocktail, coffee, and drinks menu at Nautica in Tribunj for guests looking for an elegant seafront bar close to Vodice and Srima.';
  const pageUrl = toLocalizedUrl('/menu', locale);

  return (
    <Layout>
      <LocalizedHead
        title={pageTitle}
        description={pageDescription}
        canonicalPath="/menu"
        locale={locale}
        image={siteMedia.cocktails.src}
        imageAlt={locale === 'hr' ? 'Signature kokteli i meni Nautice u Tribunju' : 'Signature cocktails and Nautica menu in Tribunj'}
        preloadImage={siteMedia.cocktails.webpSrc}
        preloadImageType="image/webp"
        schemas={[
          buildWebPageSchema({ locale, title: pageTitle, description: pageDescription, url: pageUrl }),
          buildLocalBusinessSchema(locale, settings),
          buildMenuSchema({ locale, url: pageUrl, menuItems: bootstrap.menu }),
          buildBreadcrumbSchema([
            { name: 'Nautica', url: toLocalizedUrl('/', locale) },
            { name: t('menu_page.title'), url: pageUrl },
          ]),
        ]}
      />
      <DarkShowcaseSection className="page-top-safe">
        {bootstrap.menu.length > 0 ? (
          <MenuBook menu={bootstrap.menu} locale={locale} />
        ) : (
          <BackendOfflineNotice
            title={locale === 'hr' ? 'Meni trenutno nije učitan.' : 'The menu is not currently loaded.'}
            body={locale === 'hr'
              ? 'Frontend i navigacija rade normalno, ali digitalni meni traži backend podatke. Čim API ponovno bude dostupan, ovdje će se prikazati cijelo izdanje menija.'
              : 'The frontend and navigation still work normally, but the digital menu requires backend data. As soon as the API is available again, the full menu edition will appear here.'}
          />
        )}
      </DarkShowcaseSection>
    </Layout>
  );
};

export default Menu;
