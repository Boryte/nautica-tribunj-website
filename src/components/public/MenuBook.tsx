import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  PointerEvent as ReactPointerEvent,
  TouchEvent as ReactTouchEvent,
} from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { LocaleCode, MenuItemDTO } from '@shared/index';
import { useTranslation } from 'react-i18next';
import { siteMedia } from '@/lib/site-media';
import { cn } from '@/lib/utils';

type ChapterPage = {
  id: string;
  title: string;
  subtitle: string;
  items: MenuItemDTO[];
};

type MenuSpread =
  | {
      id: string;
      type: 'cover';
      title: string;
      subtitle: string;
      body: string;
    }
  | {
      id: string;
      type: 'intro';
      title: string;
      subtitle: string;
      body: string;
      chapterNames: string[];
    }
  | {
      id: string;
      type: 'chapter';
      title: string;
      subtitle: string;
      items: MenuItemDTO[];
    };

type FlipBookOrientation = 'portrait' | 'landscape';
type FlipBookState = 'user_fold' | 'fold_corner' | 'flipping' | 'read';

type FlipBookApi = {
  turnToPage: (page: number) => void;
  flip: (page: number) => void;
  update?: () => void;
};

type FlipBookRef = {
  pageFlip: () => FlipBookApi;
};

type FlipBookEvent<T> = {
  data?: T;
  object?: Partial<FlipBookApi>;
};

const PAGE_RATIO = 700 / 920;
const FRAME_PADDING = 20;
const MIN_PAGE_WIDTH = 280;
const MAX_PAGE_WIDTH = 720;
const MIN_PAGE_HEIGHT = 420;
const MAX_PAGE_HEIGHT = 960;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const splitIntoPages = (items: MenuItemDTO[], size: number) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size)
  );

const parsePriceLabel = (value: string | null) => {
  if (!value) return null;

  const match = value.match(/^(.*?)\s*·\s*(.+)$/);
  if (!match) {
    return { meta: null, price: value };
  }

  return {
    meta: match[1].trim(),
    price: match[2].trim(),
  };
};

const stopFlipGesturePropagation = (
  event: ReactTouchEvent<HTMLElement> | ReactPointerEvent<HTMLElement>
) => {
  event.stopPropagation();
};

function useMediaQuery(query: string, initialValue = false) {
  const [matches, setMatches] = useState(initialValue);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);

    onChange();

    if (media.addEventListener) {
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    }

    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, [query]);

  return matches;
}

function useViewportHeight() {
  const [height, setHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 900
  );

  useEffect(() => {
    const onResize = () => setHeight(window.innerHeight);
    onResize();
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return height;
}

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current || typeof ResizeObserver === 'undefined') return;

    const element = ref.current;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, ...size };
}

function useFlipAssetSound() {
  const contextRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const loadingPromiseRef = useRef<Promise<AudioBuffer | null> | null>(null);

  const getContext = useCallback(async () => {
    if (typeof window === 'undefined') return null;

    const AudioContextCtor =
      window.AudioContext ||
      // @ts-expect-error Safari fallback
      window.webkitAudioContext;

    if (!AudioContextCtor) return null;

    if (!contextRef.current) {
      contextRef.current = new AudioContextCtor();
    }

    const ctx = contextRef.current;

    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        return null;
      }
    }

    return ctx.state === 'running' ? ctx : null;
  }, []);

  const loadBuffer = useCallback(async (): Promise<AudioBuffer | null> => {
    if (bufferRef.current) return bufferRef.current;
    if (loadingPromiseRef.current) return loadingPromiseRef.current;

    loadingPromiseRef.current = (async () => {
      const ctx = await getContext();
      if (!ctx) return null;

      const candidates = [
        '/audio/page-flip-soft.ogg',
        '/audio/page-flip-soft.mp3',
      ];

      for (const url of candidates) {
        try {
          const response = await fetch(url, { cache: 'force-cache' });
          if (!response.ok) continue;

          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
          bufferRef.current = audioBuffer;
          return audioBuffer;
        } catch {
          // try next format
        }
      }

      return null;
    })();

    return loadingPromiseRef.current;
  }, [getContext]);

  const prime = useCallback(async () => {
    await getContext();
    void loadBuffer();
  }, [getContext, loadBuffer]);

  const play = useCallback(async () => {
    const ctx = await getContext();
    if (!ctx) return;

    const buffer = bufferRef.current ?? (await loadBuffer());
    if (!buffer) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = 0.97 + Math.random() * 0.06;

    const gain = ctx.createGain();
    gain.gain.value = 0.16 + Math.random() * 0.04;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 4200;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start(0);
  }, [getContext, loadBuffer]);

  useEffect(() => {
    return () => {
      if (contextRef.current && contextRef.current.state !== 'closed') {
        void contextRef.current.close();
      }
    };
  }, []);

  return { prime, play };
}

const MenuPage = forwardRef<
  HTMLDivElement,
  {
    page: MenuSpread;
    locale: LocaleCode;
    pageNumber: number;
    totalPages: number;
  }
>(({ page, locale, pageNumber, totalPages }, ref) => {
  return (
    <article
      ref={ref}
      className={cn(
        'relative h-full overflow-hidden rounded-[1.6rem] border border-black/6 shadow-[0_16px_50px_rgba(0,0,0,0.08)]',
        page.type === 'cover'
          ? 'surface-night text-[hsl(var(--text-on-dark))]'
          : 'surface-ivory text-[hsl(var(--text-inverse))]'
      )}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-black/5" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-black/5" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),transparent)]" />

      {page.type === 'cover' ? (
        <div className="flex h-full flex-col justify-between p-6 sm:p-8 lg:p-10">
          <div>
            <img
              src={siteMedia.logo.src}
              alt="Nautica Tribunj logo"
              className="h-9 w-auto sm:h-10"
              loading="eager"
              decoding="async"
              title="Nautica Tribunj logo"
            />
            <h2 className="mt-8 font-display text-4xl leading-[0.9] sm:text-5xl lg:text-6xl">
              {page.title}
            </h2>
            <p className="mt-4 font-body text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--brand-gold))] sm:text-[11px]">
              {page.subtitle}
            </p>
          </div>

          <div className="space-y-6">
            <p className="max-w-sm font-body text-sm leading-7 text-white/90 sm:text-[0.98rem]">
              {page.body}
            </p>

            <div className="flex items-center justify-between border-t border-white/10 pt-3 text-[10px] uppercase tracking-[0.22em] text-white/65">
              <span>Nautica Editorial Menu</span>
              <span>
                {String(pageNumber + 1).padStart(2, '0')} /{' '}
                {String(totalPages).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
      ) : page.type === 'intro' ? (
        <div className="flex h-full flex-col justify-between p-6 sm:p-8 lg:p-10">
          <div>
            <p className="section-kicker">{page.subtitle}</p>
            <h3 className="text-on-light-title headline-focus wave-emphasis mt-4 font-display text-3xl leading-[0.94] sm:text-4xl lg:text-5xl">
              {page.title}
            </h3>
            <p className="text-on-light-body mt-5 max-w-lg font-body text-sm leading-7 sm:text-[0.98rem] sm:leading-8">
              {page.body}
            </p>
          </div>

          <div
            className="mt-8 grid max-h-[52vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 [touch-action:pan-y]"
            onTouchStartCapture={stopFlipGesturePropagation}
            onTouchMoveCapture={stopFlipGesturePropagation}
            onPointerDownCapture={stopFlipGesturePropagation}
            onPointerMoveCapture={stopFlipGesturePropagation}
          >
            {page.chapterNames.map((chapterName, index) => (
              <div
                key={`${chapterName}-${index}`}
                className="flex items-center justify-between border-b border-black/10 py-3"
              >
                <span className="text-on-light-title font-display text-lg leading-tight sm:text-xl lg:text-[1.45rem]">
                  {chapterName}
                </span>
                <span className="text-on-light-label font-body text-[10px] uppercase tracking-[0.22em]">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-black/10 pt-3 text-[10px] uppercase tracking-[0.22em] text-on-light-label">
            <span>Curated Chapters</span>
            <span>
              {String(pageNumber + 1).padStart(2, '0')} /{' '}
              {String(totalPages).padStart(2, '0')}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col p-6 sm:p-8 lg:p-9">
          <div className="border-b border-black/10 pb-4">
            <p className="section-kicker">{page.subtitle}</p>
            <h3 className="text-on-light-title headline-focus mt-3 font-display text-3xl leading-[0.94] sm:text-4xl lg:text-5xl">
              {page.title}
            </h3>
          </div>

          <div className="mt-6 flex-1 overflow-hidden">
            <div
              className="hide-scrollbar h-full overflow-y-auto overscroll-contain pr-1 [touch-action:pan-y]"
              onTouchStartCapture={stopFlipGesturePropagation}
              onTouchMoveCapture={stopFlipGesturePropagation}
              onPointerDownCapture={stopFlipGesturePropagation}
              onPointerMoveCapture={stopFlipGesturePropagation}
            >
              <div className="space-y-4">
                {page.items.map((item, index) => {
                  const localized =
                    item.localizations[locale] ?? Object.values(item.localizations)[0];
                  const previousBookSection =
                    index > 0 ? page.items[index - 1]?.bookSection : null;
                  const showBookSection = Boolean(
                    item.bookSection && item.bookSection !== previousBookSection
                  );
                  const hasDescription = Boolean(localized?.description?.trim());

                  return (
                    <div
                      key={item.id}
                      className="border-b border-black/10 pb-4 last:border-b-0 last:pb-0"
                    >
                      {showBookSection ? (
                        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-on-light-label">
                          {item.bookSection}
                        </p>
                      ) : null}

                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-on-light-title font-display text-[1.55rem] leading-none sm:text-[1.8rem] lg:text-[2rem]">
                            {localized?.name}
                          </p>
                          {hasDescription ? (
                            <p className="mt-2 font-body text-sm leading-6 text-on-light-body sm:text-[0.98rem] sm:leading-7">
                              {localized?.description}
                            </p>
                          ) : null}
                        </div>

                        <div className="shrink-0 text-right">
                          {[item.priceLabel, item.secondaryPriceLabel]
                            .map((value) => parsePriceLabel(value))
                            .filter(
                              (
                                entry
                              ): entry is NonNullable<
                                ReturnType<typeof parsePriceLabel>
                              > => Boolean(entry)
                            )
                            .map((entry, priceIndex) => (
                              <div
                                key={`${item.id}-${priceIndex}-${entry.price}`}
                                className={
                                  priceIndex === 0
                                    ? ''
                                    : 'mt-2 border-t border-black/8 pt-2'
                                }
                              >
                                {entry.meta ? (
                                  <p className="text-on-light-label font-body text-[10px] uppercase tracking-[0.2em]">
                                    {entry.meta}
                                  </p>
                                ) : null}
                                <p className="text-on-light-title mt-1 font-body text-sm font-semibold">
                                  {entry.price}
                                </p>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-black/10 pt-3 text-[10px] uppercase tracking-[0.22em] text-on-light-label">
            <span>{page.title}</span>
            <span>
              {String(pageNumber + 1).padStart(2, '0')} /{' '}
              {String(totalPages).padStart(2, '0')}
            </span>
          </div>
        </div>
      )}
    </article>
  );
});

MenuPage.displayName = 'MenuPage';

export const MenuBook = ({
  menu,
  locale,
}: {
  menu: MenuItemDTO[];
  locale: LocaleCode;
}) => {
  const { t } = useTranslation();

  const container = useElementSize<HTMLDivElement>();
  const viewportHeight = useViewportHeight();
  const isCoarsePointer = useMediaQuery('(pointer: coarse)');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const { prime, play } = useFlipAssetSound();

  const bookRef = useRef<FlipBookRef | null>(null);
  const [activePage, setActivePage] = useState(0);
  const [orientation, setOrientation] =
    useState<FlipBookOrientation>('landscape');
  const [isFlipping, setIsFlipping] = useState(false);

  const layoutMode = useMemo(() => {
    const width = container.width || 1200;
    if (width < 560) return 'compact';
    if (width < 1140) return 'portrait';
    return 'spread';
  }, [container.width]);

  const pageSize =
    layoutMode === 'compact' ? 4 : layoutMode === 'portrait' ? 5 : 6;

  const chapters = useMemo<ChapterPage[]>(() => {
    const categories = Array.from(new Set(menu.map((item) => item.category)));

    return categories.flatMap((category) =>
      splitIntoPages(
        menu.filter((item) => item.category === category),
        pageSize
      ).map((items, index) => ({
        id: `${category}-${index}`,
        title: t(`menu_page.categories.${category}` as const),
        subtitle:
          index === 0
            ? t('menu_book.curated_selection')
            : t('menu_book.continuation', { index: index + 1 }),
        items,
      }))
    );
  }, [menu, pageSize, t]);

  const uniqueChapterNames = useMemo(
    () =>
      chapters
        .filter(
          (entry, index, array) =>
            array.findIndex((candidate) => candidate.title === entry.title) ===
            index
        )
        .map((entry) => entry.title),
    [chapters]
  );

  const pages = useMemo<MenuSpread[]>(
    () => [
      {
        id: 'cover',
        type: 'cover',
        title: t('menu_page_experience.hero_eyebrow'),
        subtitle: 'Sunset edition',
        body: t('menu_book.cover_body'),
      },
      {
        id: 'intro',
        type: 'intro',
        title: t('menu_book.editorial_title'),
        subtitle: t('menu_book.editorial_subtitle'),
        body: t('menu_book.editorial_body'),
        chapterNames: uniqueChapterNames,
      },
      ...chapters.map((chapter) => ({
        ...chapter,
        type: 'chapter' as const,
      })),
    ],
    [chapters, t, uniqueChapterNames]
  );

  useEffect(() => {
    setActivePage((prev) => clamp(prev, 0, Math.max(0, pages.length - 1)));
  }, [pages.length]);

  const availableWidth = Math.max(
    320,
    (container.width || 1200) - FRAME_PADDING * 2
  );
  const singlePageWidth =
    layoutMode === 'spread'
      ? Math.floor((availableWidth - 24) / 2)
      : Math.floor(availableWidth - 8);

  const pageWidth = clamp(singlePageWidth, MIN_PAGE_WIDTH, MAX_PAGE_WIDTH);

  const targetHeight = Math.round(pageWidth / PAGE_RATIO);
  const viewportCap = Math.floor(
    viewportHeight *
      (layoutMode === 'compact'
        ? 0.64
        : layoutMode === 'portrait'
          ? 0.72
          : 0.78)
  );
  const pageHeight = clamp(
    targetHeight,
    MIN_PAGE_HEIGHT,
    Math.max(MIN_PAGE_HEIGHT, Math.min(MAX_PAGE_HEIGHT, viewportCap))
  );

  const flipBookKey = `${layoutMode}-${pageWidth}-${pageHeight}-${pages.length}-${locale}`;

  const goToPage = useCallback(
    async (pageIndex: number, animated = true) => {
      const nextIndex = clamp(pageIndex, 0, Math.max(0, pages.length - 1));
      if (nextIndex === activePage) return;

      await prime();

      const api = bookRef.current?.pageFlip?.();
      if (!api) {
        setActivePage(nextIndex);
        return;
      }

      if (!animated || prefersReducedMotion) {
        api.turnToPage(nextIndex);
      } else {
        api.flip(nextIndex);
      }

      setActivePage(nextIndex);
    },
    [activePage, pages.length, prefersReducedMotion, prime]
  );

  const goToPrevious = useCallback(() => {
    void goToPage(activePage - 1);
  }, [activePage, goToPage]);

  const goToNext = useCallback(() => {
    void goToPage(activePage + 1);
  }, [activePage, goToPage]);

  const onBookInit = useCallback(
    (event: FlipBookEvent<FlipBookOrientation>) => {
      setOrientation(event.data ?? 'landscape');

      if (activePage > 0) {
        requestAnimationFrame(() => {
          event.object?.turnToPage?.(activePage);
        });
      }
    },
    [activePage]
  );

  const onBookFlip = useCallback(
    (event: FlipBookEvent<number>) => {
      setActivePage(Number(event.data ?? 0));
      void play();
    },
    [play]
  );

  const onBookOrientation = useCallback(
    (event: FlipBookEvent<FlipBookOrientation>) => {
      setOrientation(event.data ?? 'landscape');
    },
    []
  );

  const onBookState = useCallback(
    (event: FlipBookEvent<FlipBookState | string>) => {
      const state = String(event.data ?? 'read');
      setIsFlipping(state === 'flipping');
    },
    []
  );

  useEffect(() => {
    const api = bookRef.current?.pageFlip?.();
    if (!api?.update) return;

    const id = window.requestAnimationFrame(() => {
      api.update?.();
    });

    return () => window.cancelAnimationFrame(id);
  }, [pageWidth, pageHeight, pages.length, layoutMode]);

  return (
    <div
      ref={container.ref}
      className="space-y-5 sm:space-y-6 lg:space-y-7"
      onPointerDown={() => {
        void prime();
      }}
      onTouchStart={() => {
        void prime();
      }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <p className="section-kicker">{t('menu_page_experience.read_label')}</p>
          <h3 className="text-on-dark-title headline-focus wave-emphasis mt-3 font-display text-4xl sm:text-5xl lg:text-6xl">
            {t('menu_book.editorial_title')}
          </h3>
          <p className="mt-3 text-sm text-on-dark-body/80 sm:text-[0.98rem]">
            {orientation === 'portrait'
              ? t('menu_book.tap_or_swipe_single', 'Single-page reading mode')
              : t('menu_book.tap_or_swipe_spread', 'Immersive spread reading mode')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={goToPrevious}
            disabled={activePage <= 0}
            className="luxury-button-secondary border-white/10 bg-white/[0.05] text-on-dark-title hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <ChevronLeft className="h-4 w-4" />
            {t('menu_book.previous')}
          </button>

          <button
            type="button"
            onClick={goToNext}
            disabled={activePage >= pages.length - 1}
            className="luxury-button-primary disabled:cursor-not-allowed disabled:opacity-45"
          >
            {t('menu_book.next')}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-2">
        {pages.map((page, index) => (
          <button
            key={page.id}
            type="button"
            onClick={() => void goToPage(index)}
            className={cn(
              'shrink-0 rounded-full px-4 py-2.5 font-body text-[10px] uppercase tracking-[0.22em] transition',
              activePage === index
                ? 'bg-[hsl(var(--brand-gold))] text-[hsl(var(--text-inverse))]'
                : 'border border-white/10 bg-white/[0.05] text-on-dark-body hover:bg-white/[0.08]'
            )}
          >
            {page.type === 'chapter' ? page.title : page.subtitle}
          </button>
        ))}
      </div>

      <div
        className={cn(
          'overflow-hidden rounded-[2rem] border border-black/8 bg-[linear-gradient(180deg,rgba(245,238,228,0.98),rgba(235,223,206,0.96))] p-3 shadow-[var(--shadow-premium)] transition-[filter,transform,box-shadow] duration-300 sm:p-4 lg:p-5',
          isFlipping && 'shadow-[0_22px_60px_rgba(0,0,0,0.18)]'
        )}
      >
        <div
          className="mx-auto flex w-full justify-center"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') {
              event.preventDefault();
              goToPrevious();
            } else if (event.key === 'ArrowRight') {
              event.preventDefault();
              goToNext();
            }
          }}
        >
          <HTMLFlipBook
            key={flipBookKey}
            ref={bookRef}
            width={pageWidth}
            height={pageHeight}
            size="fixed"
            minWidth={MIN_PAGE_WIDTH}
            maxWidth={MAX_PAGE_WIDTH}
            minHeight={MIN_PAGE_HEIGHT}
            maxHeight={MAX_PAGE_HEIGHT}
            drawShadow={!prefersReducedMotion}
            maxShadowOpacity={0.18}
            flippingTime={prefersReducedMotion ? 0 : isCoarsePointer ? 780 : 920}
            usePortrait
            autoSize
            showCover
            mobileScrollSupport={false}
            clickEventForward
            useMouseEvents={!isCoarsePointer}
            swipeDistance={isCoarsePointer ? 9999 : 28}
            disableFlipByClick={isCoarsePointer}
            showPageCorners={!isCoarsePointer}
            startPage={0}
            startZIndex={0}
            style={{}}
            className="mx-auto"
            onInit={onBookInit}
            onFlip={onBookFlip}
            onChangeOrientation={onBookOrientation}
            onChangeState={onBookState}
          >
            {pages.map((page, index) => (
              <MenuPage
                key={page.id}
                page={page}
                locale={locale}
                pageNumber={index}
                totalPages={pages.length}
              />
            ))}
          </HTMLFlipBook>
        </div>
      </div>
    </div>
  );
};

export default MenuBook;