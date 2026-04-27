import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react';
import { PremiumMedia } from '@/components/PremiumMedia';
import { usePublicOverlay } from '@/lib/public-ui';
import { cn } from '@/lib/utils';

export type GlimpseRailSlide = {
  id: string | number;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  alt: string;
  caption?: string;
  durationMs?: number;
  focalPointX?: number | null;
  focalPointY?: number | null;
};

export type GlimpseRailGroup = {
  id: string | number;
  label: string;
  title: string;
  coverImageUrl: string;
  coverAlt: string;
  itemCount?: number;
  ctaUrl?: string;
  ctaLabel?: string;
  slides: GlimpseRailSlide[];
};

const fallbackDuration = 4800;
const tapThresholdMs = 220;

export const GlimpseRail = ({
  groups,
  locale,
}: {
  groups: GlimpseRailGroup[];
  locale: 'hr' | 'en';
}) => {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const pointerStartRef = useRef<number | null>(null);
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const activeGroup = activeGroupIndex === null ? null : groups[activeGroupIndex];
  const activeSlide = activeGroup?.slides[activeSlideIndex] ?? null;
  usePublicOverlay('glimpse-story', activeGroupIndex !== null);

  const closeViewer = useCallback(() => {
    setActiveGroupIndex(null);
    setActiveSlideIndex(0);
    setPaused(false);
  }, []);

  const openViewer = useCallback((groupIndex: number) => {
    setActiveGroupIndex(groupIndex);
    setActiveSlideIndex(0);
    setPaused(false);
  }, []);

  const goToNext = useCallback(() => {
    if (!activeGroup) return;

    if (activeSlideIndex < activeGroup.slides.length - 1) {
      setActiveSlideIndex((current) => current + 1);
      return;
    }

    if (activeGroupIndex !== null && activeGroupIndex < groups.length - 1) {
      setActiveGroupIndex(activeGroupIndex + 1);
      setActiveSlideIndex(0);
      return;
    }

    closeViewer();
  }, [activeGroup, activeGroupIndex, activeSlideIndex, closeViewer, groups.length]);

  const goToPrevious = useCallback(() => {
    if (!activeGroup) return;

    if (activeSlideIndex > 0) {
      setActiveSlideIndex((current) => current - 1);
      return;
    }

    if (activeGroupIndex !== null && activeGroupIndex > 0) {
      const previousGroupIndex = activeGroupIndex - 1;
      setActiveGroupIndex(previousGroupIndex);
      setActiveSlideIndex(Math.max(0, groups[previousGroupIndex].slides.length - 1));
    }
  }, [activeGroup, activeGroupIndex, activeSlideIndex, groups]);

  useEffect(() => {
    if (!activeGroup || !activeSlide || paused) return;
    const timer = window.setTimeout(goToNext, activeSlide.durationMs || fallbackDuration);
    return () => window.clearTimeout(timer);
  }, [activeGroup, activeSlide, activeSlideIndex, goToNext, paused]);

  useEffect(() => {
    if (activeGroupIndex !== null) {
      window.setTimeout(() => closeButtonRef.current?.focus(), 40);
    }
  }, [activeGroupIndex]);

  useEffect(() => {
    if (activeGroupIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeViewer();
      if (event.key === 'ArrowRight') {
        setPaused(true);
        goToNext();
      }
      if (event.key === 'ArrowLeft') {
        setPaused(true);
        goToPrevious();
      }
      if (event.key === ' ') {
        event.preventDefault();
        setPaused((current) => !current);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeGroupIndex, closeViewer, goToNext, goToPrevious]);

  const alignment = useMemo(() => {
    return 'items-start text-left';
  }, []);

  const handleViewerPointerDown = () => {
    pointerStartRef.current = window.performance.now();
    setPaused(true);
  };

  const handleViewerPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const startedAt = pointerStartRef.current;
    pointerStartRef.current = null;

    if (startedAt === null) {
      setPaused(false);
      return;
    }

    const pressDuration = window.performance.now() - startedAt;
    const target = event.currentTarget.getBoundingClientRect();
    const relativeX = event.clientX - target.left;

    if (pressDuration > tapThresholdMs) {
      setPaused(false);
      return;
    }

    if (relativeX < target.width * 0.32) {
      goToPrevious();
      return;
    }

    if (relativeX > target.width * 0.68) {
      goToNext();
      return;
    }

    setPaused((current) => !current);
  };

  if (!groups.length) return null;

  return (
    <>
      <section className="page-gutter relative z-20 pt-8 pb-8 sm:pt-10 sm:pb-10 lg:pt-14 lg:pb-16">
        <div className="page-width">
          <div className="story-rail-shell">
            <div className="mb-8 text-center">
              <div className="mx-auto max-w-2xl">
                <p className="section-kicker">Glimpse</p>
                <h2 className="story-rail-title mt-3 font-display text-[2.15rem] leading-[0.98] sm:text-[2.6rem] lg:text-[3rem]">
                  {locale === 'hr' ? 'Media story mode.' : 'Media story mode.'}
                </h2>
                <p className="story-rail-body mx-auto mt-4 max-w-[34rem] font-body text-[0.96rem] leading-7 sm:text-[1rem]">
                  {locale === 'hr'
                    ? 'Svaka kategorija otvara mali story pogled.'
                    : 'Each category opens a compact story preview.'}
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-10 bg-gradient-to-r from-[rgba(240,231,216,0.95)] to-transparent sm:block" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-10 bg-gradient-to-l from-[rgba(240,231,216,0.95)] to-transparent sm:block" />

              <div className="grid grid-cols-3 gap-x-3 gap-y-6 px-1 pb-2 sm:flex sm:flex-wrap sm:justify-center sm:gap-6 sm:overflow-visible">
                {groups.map((group, index) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => openViewer(index)}
                    className={cn('story-trigger group w-full min-w-0 sm:w-[7.1rem]', activeGroupIndex === index && 'story-trigger-active')}
                    aria-label={group.title}
                  >
                    <div className="story-trigger-ring mx-auto">
                      <div className="story-trigger-ring-core" />
                      <div className="story-trigger-media">
                        <img
                          src={group.coverImageUrl}
                          alt={group.coverAlt}
                          className="block h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                          loading="lazy"
                          decoding="async"
                          title={group.coverAlt}
                        />
                      </div>
                    </div>
                    <div className="mt-3 text-center">
                      <p className="font-body text-[9px] uppercase tracking-[0.28em] text-[hsl(var(--brand-gold))]">
                        {group.label}
                      </p>
                      <p className="story-label mt-1 line-clamp-2 font-body text-[0.92rem] leading-5">
                        {group.title}
                      </p>
                      {group.itemCount ? (
                        <p className="mt-1 text-[11px] text-[hsl(var(--text-muted))]">{group.itemCount}+</p>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {activeGroup && activeSlide ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="story-viewer-shell"
            aria-modal="true"
            role="dialog"
            onClick={closeViewer}
          >
            <div className="story-viewer-frame" onClick={(event) => event.stopPropagation()}>
              <div className="story-viewer-controls-top">
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={closeViewer}
                  className="story-viewer-icon-button"
                  aria-label="Close story viewer"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPaused((current) => !current)}
                    className="story-viewer-icon-button"
                    aria-label={paused ? 'Resume story viewer' : 'Pause story viewer'}
                  >
                    {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </button>
                  {activeGroup.ctaUrl && activeGroup.ctaLabel ? (
                    <a href={activeGroup.ctaUrl} className="story-viewer-chip-link">
                      {activeGroup.ctaLabel}
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="story-viewer-card" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
                <div className="absolute inset-x-0 top-0 z-20 flex gap-2 p-4">
                  {activeGroup.slides.map((slide, slideIndex) => (
                    <div key={slide.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
                      <motion.div
                        key={`${slide.id}-${activeSlideIndex}-${paused ? 'paused' : 'running'}`}
                        className="h-full rounded-full bg-white"
                        initial={{ width: slideIndex < activeSlideIndex ? '100%' : '0%' }}
                        animate={{ width: slideIndex === activeSlideIndex ? '100%' : slideIndex < activeSlideIndex ? '100%' : '0%' }}
                        transition={{
                          duration: slideIndex === activeSlideIndex ? (activeSlide.durationMs || fallbackDuration) / 1000 : 0,
                          ease: 'linear',
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div
                  className="absolute inset-0 z-10"
                  onPointerDown={handleViewerPointerDown}
                  onPointerUp={handleViewerPointerUp}
                  onPointerLeave={() => {
                    pointerStartRef.current = null;
                    setPaused(false);
                  }}
                />

                <PremiumMedia
                  src={activeSlide.mediaUrl}
                  alt={activeSlide.alt}
                  mediaType={activeSlide.mediaType}
                  className="absolute inset-0 h-full w-full"
                  mediaClassName="h-full w-full"
                  backdrop={false}
                  autoPlay={activeSlide.mediaType === 'video'}
                  controls={false}
                  muted
                  loop
                  focalPointX={activeSlide.focalPointX}
                  focalPointY={activeSlide.focalPointY}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,11,16,0.08),rgba(5,11,16,0.14)_20%,rgba(5,11,16,0.46)_68%,rgba(5,11,16,0.88)_100%)]" />

                <div className={cn('relative flex h-full flex-col justify-end p-5 sm:p-6', alignment)}>
                  <div className="story-viewer-copy relative z-20">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-body text-[10px] uppercase tracking-[0.26em] text-white/84">
                        {activeGroup.label}
                      </p>
                      <p className="text-[11px] text-white/62">
                        {activeSlideIndex + 1} / {activeGroup.slides.length}
                      </p>
                    </div>
                    <h3 className="mt-3 font-display text-[1.7rem] leading-[1.02] text-[hsl(var(--text-on-image))] sm:text-[1.95rem]">
                      {activeGroup.title}
                    </h3>
                    <p className="story-viewer-body">
                      {activeSlide.caption || (locale === 'hr' ? 'Odabrani kadar iz kolekcije.' : 'Selected frame from the collection.')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute inset-y-0 left-0 z-20 hidden items-center pl-3 sm:flex sm:pl-5">
                <button type="button" onClick={() => { setPaused(true); goToPrevious(); }} className="story-viewer-icon-button">
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
              <div className="absolute inset-y-0 right-0 z-20 hidden items-center pr-3 sm:flex sm:pr-5">
                <button type="button" onClick={() => { setPaused(true); goToNext(); }} className="story-viewer-icon-button">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
};
