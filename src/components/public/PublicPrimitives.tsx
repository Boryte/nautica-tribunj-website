import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { LocalizedLink } from '@/components/LocalizedLink';
import { Reveal, RevealGroup, revealSoftItem } from '@/components/Reveal';
import { cn } from '@/lib/utils';

export const HeroFrame = ({
  eyebrow,
  title,
  description,
  media,
  actions,
  aside,
  className,
  compact = false,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  media?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  className?: string;
  compact?: boolean;
}) => (
  <section className={cn('hero-frame', compact ? 'min-h-[74svh]' : 'pt-0', className)}>
    {media ? <div className="absolute inset-0">{media}</div> : null}
    <div className="absolute inset-0 hero-overlay-cinematic" />
    <div className="page-gutter relative z-10 flex min-h-[inherit] items-end pb-12 pt-[calc(var(--header-height)+4.5rem)] sm:pb-16 sm:pt-[calc(var(--header-height)+5rem)] lg:pb-20 lg:pt-[calc(var(--header-height)+5.75rem)]">
      <div className={cn(aside ? 'hero-grid lg:items-end' : 'page-width')}>
        <RevealGroup className="hero-copy" delayChildren={0.08} staggerChildren={0.1}>
          {eyebrow ? <Reveal soft><p className="section-kicker text-shadow-display">{eyebrow}</p></Reveal> : null}
        <Reveal>
            <motion.h1
              variants={revealSoftItem}
              className={cn(compact ? 'display-xl max-w-[10.5ch]' : 'display-hero', 'hero-title-block headline-focus')}
            >
              {title}
            </motion.h1>
          </Reveal>
          {description ? <Reveal soft><div className="hero-description">{description}</div></Reveal> : null}
          {actions ? <Reveal soft><div className="hero-actions">{actions}</div></Reveal> : null}
        </RevealGroup>
        {aside ? <Reveal className="hero-aside">{aside}</Reveal> : null}
      </div>
    </div>
  </section>
);

export const EditorialSection = ({
  children,
  className,
  tone = 'default',
  innerClassName,
}: {
  children: ReactNode;
  className?: string;
  tone?: 'default' | 'ivory' | 'night' | 'booking';
  innerClassName?: string;
}) => {
  const sectionTone =
    tone === 'ivory'
      ? 'editorial-section-ivory'
      : tone === 'night'
        ? 'editorial-section-night'
        : tone === 'booking'
          ? 'editorial-section-booking'
          : 'editorial-section';

  return (
    <section className={cn(sectionTone, 'content-visibility-auto', className)}>
      <div className={cn('section-inner', innerClassName)}>{children}</div>
    </section>
  );
};

export const DarkShowcaseSection = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => <EditorialSection tone="night" className={className}>{children}</EditorialSection>;

export const TribunjMediaStory = ({
  media,
  children,
  reverse = false,
  className,
}: {
  media: ReactNode;
  children: ReactNode;
  reverse?: boolean;
  className?: string;
}) => (
  <div className={cn('grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10', reverse && 'lg:grid-cols-[0.95fr_1.05fr]', className)}>
    <div className={cn(reverse && 'lg:order-2')}>{media}</div>
    <div className="flex items-center">{children}</div>
  </div>
);

export const ShowcaseMedia = ({
  children,
  className,
  minHeight = 'min-h-[24rem] sm:min-h-[30rem]',
}: {
  children: ReactNode;
  className?: string;
  minHeight?: string;
}) => (
  <div className={cn('showcase-media rounded-[1.6rem] shadow-[var(--shadow-premium)]', minHeight, className)}>
    {children}
  </div>
);

export const BookingSurface = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => <div className={cn('booking-surface', className)}>{children}</div>;

export const SectionIntro = ({
  eyebrow,
  title,
  description,
  action,
  className,
  tone = 'light',
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  tone?: 'light' | 'dark';
}) => (
  <RevealGroup className={cn('flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between', className)} delayChildren={0.05} staggerChildren={0.08}>
    <div className="max-w-3xl">
      {eyebrow ? <Reveal soft><p className="section-kicker">{eyebrow}</p></Reveal> : null}
      <Reveal>
        <h2 className={cn('mt-3 display-lg headline-focus', tone === 'dark' ? 'text-on-dark-title' : 'text-on-light-title')}>
          {title}
        </h2>
      </Reveal>
      {description ? <Reveal soft><div className={cn('mt-5 body-lg', tone === 'dark' ? 'text-on-dark-body' : 'text-on-light-body')}>{description}</div></Reveal> : null}
    </div>
    {action ? <Reveal soft>{action}</Reveal> : null}
  </RevealGroup>
);

export const SectionDivider = ({ className }: { className?: string }) => <div className={cn('section-divider', className)} />;

export const LuxuryButtonPrimary = ({
  to,
  href,
  children,
  className,
}: {
  to?: string;
  href?: string;
  children: ReactNode;
  className?: string;
}) => {
  if (to) return <LocalizedLink to={to} className={cn('luxury-button-primary', className)}>{children}</LocalizedLink>;
  if (href) return <a href={href} className={cn('luxury-button-primary', className)}>{children}</a>;
  return <span className={cn('luxury-button-primary', className)}>{children}</span>;
};

export const LuxuryButtonSecondary = ({
  to,
  href,
  children,
  className,
}: {
  to?: string;
  href?: string;
  children: ReactNode;
  className?: string;
}) => {
  if (to) return <LocalizedLink to={to} className={cn('luxury-button-secondary', className)}>{children}</LocalizedLink>;
  if (href) return <a href={href} className={cn('luxury-button-secondary', className)}>{children}</a>;
  return <span className={cn('luxury-button-secondary', className)}>{children}</span>;
};

export const FloatingCTA = ({
  to,
  label,
}: {
  to: string;
  label: string;
}) => (
  <LocalizedLink to={to} className="luxury-button-ghost">
    {label}
    <ArrowRight className="h-4 w-4" />
  </LocalizedLink>
);

export const BookingField = ({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) => (
  <label className={cn('booking-field', className)}>
    <div className="booking-label">
      <span>{label}</span>
      {hint ? <span className="text-on-light-muted text-[11px] normal-case tracking-normal">{hint}</span> : null}
    </div>
    {children}
    {error ? <span className="block text-sm text-rose-700">{error}</span> : null}
  </label>
);

export const BookingInput = ({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) => <input {...props} className={cn('booking-input', className)} />;

export const BookingTextarea = ({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} className={cn('booking-textarea', className)} />;

export const BookingSelect = ({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} className={cn('booking-select', className)}>{children}</select>;
