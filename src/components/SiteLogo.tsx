import { LocalizedLink } from '@/components/LocalizedLink';
import { siteMedia } from '@/lib/site-media';
import { cn } from '@/lib/utils';

export const SiteLogo = ({
  variant = 'header',
  className,
}: {
  variant?: 'header' | 'footer' | 'compact';
  className?: string;
}) => {
  const isFooter = variant === 'footer';
  const isCompact = variant === 'compact';

  return (
    <LocalizedLink to="/" className={cn('brand-mark', className)} aria-label="Nautica home">
      {!isFooter ? (
        <>
          <img
            src={siteMedia.logo.src}
            alt="Nautica Tribunj logo"
            className={cn(
              'site-logo-image site-logo-compass block w-auto shrink-0 sm:hidden',
              isCompact ? 'h-8' : 'h-9'
            )}
            loading="eager"
            decoding="async"
            title="Nautica Tribunj logo"
          />
          <img
            src={siteMedia.logo.src}
            alt="Nautica Tribunj logo"
            className={cn(
              'site-logo-image hidden w-auto shrink-0 sm:block',
              isCompact ? 'h-[2.15rem] lg:h-[2.3rem]' : 'h-[2.3rem] lg:h-[2.55rem]'
            )}
            loading="eager"
            decoding="async"
            title="Nautica Tribunj logo"
          />
        </>
      ) : (
        <img
          src={siteMedia.logo.src}
          alt="Nautica Tribunj logo"
          className="site-logo-image h-[2.7rem] w-auto sm:h-[2.9rem] lg:h-[3.15rem]"
          loading="eager"
          decoding="async"
        />
      )}
    </LocalizedLink>
  );
};
