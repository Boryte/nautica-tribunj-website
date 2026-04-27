import type { SiteSettingsDTO } from '@shared/index';
import { ExternalLink, MapPin } from 'lucide-react';
import { useMemo } from 'react';
import { ThirdPartyEmbedGate } from '@/components/cookies/ThirdPartyEmbedGate';
import { GOOGLE_MAPS_URL } from '@/lib/seo';
import { cn } from '@/lib/utils';

type VenueMapWidgetProps = {
  locale: 'hr' | 'en';
  settings: SiteSettingsDTO;
  className?: string;
  compact?: boolean;
};

export const VenueMapWidget = ({
  locale,
  settings,
  className,
  compact = false,
}: VenueMapWidgetProps) => {
  const mapEmbedUrl = useMemo(() => {
    const query = [settings.businessName, settings.address, settings.city].filter(Boolean).join(', ');
    return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=17&output=embed`;
  }, [settings.address, settings.businessName, settings.city]);

  return (
    <ThirdPartyEmbedGate
      category="marketing"
      title={locale === 'hr' ? 'Karta se učitava tek nakon pristanka za vanjske sadržaje.' : 'The map only loads after consent for external content.'}
      body={locale === 'hr' ? 'Google Maps može postaviti vlastite kolačiće i učitati sadržaj treće strane. Nakon pristanka karta će se prikazati izravno ovdje.' : 'Google Maps may set its own cookies and load third-party content. Once you allow it, the map appears directly here.'}
      className={cn(compact ? 'min-h-[14rem]' : 'min-h-[19rem]', className)}
      preview={<div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(255,210,140,0.2),transparent_35%),linear-gradient(135deg,rgba(20,31,43,0.95),rgba(11,18,26,0.84))]" />}
    >
      <div className={cn('relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[rgba(7,12,18,0.7)] shadow-[var(--shadow-premium)]', className)}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,210,140,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(73,145,179,0.16),transparent_34%)]"
        />
        <div className="absolute inset-x-0 top-0 z-10 h-20 bg-[linear-gradient(180deg,rgba(7,12,18,0.9),rgba(7,12,18,0.12),transparent)]" />
        <div className="absolute inset-x-0 bottom-0 z-10 h-28 bg-[linear-gradient(180deg,transparent,rgba(7,12,18,0.32),rgba(7,12,18,0.9))]" />
        <iframe
          title={locale === 'hr' ? 'Lokacija Nautice na karti' : 'Nautica location on the map'}
          src={mapEmbedUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className={cn('w-full border-0', compact ? 'h-[14rem]' : 'h-[19rem]')}
        />

        <div className="pointer-events-none absolute left-4 top-4 z-20 flex items-start gap-3">
          <div className="rounded-full border border-white/12 bg-[rgba(7,12,18,0.7)] p-2.5 backdrop-blur-md">
            <MapPin className="h-4 w-4 text-[hsl(var(--brand-gold))]" />
          </div>
          <div className="max-w-[18rem] rounded-[1rem] border border-white/12 bg-[rgba(7,12,18,0.72)] px-3 py-2.5 backdrop-blur-md">
            <p className="section-kicker">{locale === 'hr' ? 'Lokacija' : 'Location'}</p>
            <p className="mt-2 font-body text-xs leading-6 text-white/84">
              {settings.address}
              <br />
              {settings.city}
            </p>
          </div>
        </div>

        <div className="absolute inset-x-3 bottom-3 z-20">
          <a
            href={GOOGLE_MAPS_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between gap-3 rounded-[1rem] border border-white/12 bg-[rgba(7,12,18,0.76)] px-4 py-3 backdrop-blur-md transition hover:bg-[rgba(7,12,18,0.84)]"
          >
            <div>
              <p className="font-body text-[10px] uppercase tracking-[0.22em] text-white/46">
                {locale === 'hr' ? 'Google Maps' : 'Google Maps'}
              </p>
              <p className="mt-1 font-body text-sm leading-6 text-white">
                {locale === 'hr' ? 'Otvori rutu i pregled lokacije' : 'Open directions and venue view'}
              </p>
            </div>
            <ExternalLink className="h-4 w-4 shrink-0 text-[hsl(var(--brand-gold))]" />
          </a>
        </div>
      </div>
    </ThirdPartyEmbedGate>
  );
};
