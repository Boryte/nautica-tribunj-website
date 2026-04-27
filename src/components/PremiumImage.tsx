import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion, useTime, useTransform } from 'framer-motion';
import { resolveMediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';

interface PremiumImageProps {
  src: string;
  webpSrc?: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  fit?: 'cover' | 'contain';
  drift?: boolean;
  backdrop?: boolean;
  focalPointX?: number | null;
  focalPointY?: number | null;
  objectPosition?: string;
  title?: string;
}

export const PremiumImage = ({
  src,
  webpSrc,
  alt,
  className = '',
  imageClassName = '',
  width,
  height,
  priority = false,
  sizes,
  fit = 'cover',
  drift = false,
  backdrop = true,
  focalPointX = null,
  focalPointY = null,
  objectPosition,
  title,
}: PremiumImageProps) => {
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const primaryResolvedSrc = resolveMediaUrl(src);
  const fallbackResolvedSrc = useMemo(() => {
    if (!src?.startsWith('/uploads/')) return '';
    const filename = src.split('/').pop();
    return filename ? `/site-media/${filename}` : '';
  }, [src]);
  const resolvedWebpSrc = resolveMediaUrl(webpSrc);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [activeSrc, setActiveSrc] = useState(primaryResolvedSrc);
  const [inView] = useState(true);
  const imageRef = useRef<HTMLImageElement>(null);
  const time = useTime();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setActiveSrc(primaryResolvedSrc);
    setLoaded(false);
    setFailed(!primaryResolvedSrc);
  }, [primaryResolvedSrc]);

  useEffect(() => {
    if (!inView) return;
    const image = imageRef.current;
    if (!image || !image.complete) return;
    if (image.naturalWidth > 0) {
      setLoaded(true);
      setFailed(false);
      return;
    }
    setLoaded(false);
    setFailed(true);
  }, [activeSrc, inView]);

  const objectFitClass = fit === 'contain' ? 'object-contain' : 'object-cover';
  const prefersReducedMotion = mounted ? reducedMotion : false;
  const driftEnabled = drift && !prefersReducedMotion;
  const foregroundX = useTransform(time, (t) => (driftEnabled ? Math.sin(t / 4400) * 12 : 0));
  const foregroundY = useTransform(time, (t) => (driftEnabled ? Math.cos(t / 5200) * 9 : 0));
  const foregroundScale = useTransform(time, (t) => {
    if (!driftEnabled) return fit === 'cover' ? 1.01 : 1;
    return fit === 'cover' ? 1.075 + ((Math.sin(t / 6100) + 1) / 2) * 0.03 : 1.01 + ((Math.sin(t / 6100) + 1) / 2) * 0.01;
  });
  const backdropX = useTransform(time, (t) => (driftEnabled ? Math.cos(t / 7600) * 10 : 0));
  const backdropY = useTransform(time, (t) => (driftEnabled ? Math.sin(t / 6900) * 8 : 0));
  const backdropScale = useTransform(time, (t) => (driftEnabled ? 1.14 + ((Math.cos(t / 8300) + 1) / 2) * 0.03 : 1.12));

  const computedObjectPosition = useMemo(() => {
    if (objectPosition) return objectPosition;
    if (typeof focalPointX === 'number' && typeof focalPointY === 'number') return `${Math.round(focalPointX * 100)}% ${Math.round(focalPointY * 100)}%`;
    return undefined;
  }, [focalPointX, focalPointY, objectPosition]);

  const imageTitle = title ?? alt;

  const imageProps = {
    width,
    height,
    loading: priority ? 'eager' : 'lazy' as const,
    fetchpriority: priority ? 'high' : 'auto',
    decoding: 'async' as const,
    sizes,
    style: computedObjectPosition ? { objectPosition: computedObjectPosition } : undefined,
    title: imageTitle,
  };

  return (
    <div className={cn('premium-image-shell relative overflow-hidden bg-[rgba(8,14,20,0.72)]', className)}>
      <div aria-hidden="true" className={cn('absolute inset-0 bg-gradient-to-br from-primary/25 via-sunset/10 to-primary/40 transition-opacity duration-700', loaded || failed ? 'opacity-0' : 'opacity-100')} style={{ backgroundSize: '200% 100%', animation: loaded || failed ? 'none' : 'shimmer 1.5s infinite' }} />
      {inView ? failed ? (
        <div className="absolute inset-0 flex items-end bg-[radial-gradient(circle_at_top,rgba(255,185,96,0.14),transparent_40%),linear-gradient(180deg,rgba(7,12,18,0.35),rgba(7,12,18,0.82))] p-5">
          <div className="max-w-[18rem]">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--brand-gold))]">Galerija</p>
            <p className="mt-3 text-sm leading-6 text-white/82">Fotografija se trenutno nije učitala. Provjeri putanju slike ili dostupnost upload direktorija.</p>
          </div>
        </div>
      ) : (
        <>
          {backdrop ? (
            <motion.div className="absolute inset-0 transform-gpu" style={driftEnabled ? { x: backdropX, y: backdropY, scale: backdropScale } : undefined}>
              <picture>
                {resolvedWebpSrc ? <source srcSet={resolvedWebpSrc} type="image/webp" sizes={sizes} /> : null}
                <img src={activeSrc} alt="" aria-hidden="true" {...imageProps} className={cn('premium-image-backdrop absolute inset-0 block h-full w-full object-cover scale-[1.12] blur-2xl saturate-[1.08] transition-all duration-1000', loaded ? 'opacity-40' : 'opacity-0')} />
              </picture>
            </motion.div>
          ) : null}
          <motion.div className="absolute inset-0 transform-gpu" style={driftEnabled ? { x: foregroundX, y: foregroundY, scale: foregroundScale } : undefined}>
            <picture>
              {resolvedWebpSrc ? <source srcSet={resolvedWebpSrc} type="image/webp" sizes={sizes} /> : null}
              <motion.img
                ref={imageRef}
                src={activeSrc}
                alt={alt}
                {...imageProps}
                onLoad={() => { setLoaded(true); setFailed(false); }}
                onError={() => {
                  if (activeSrc !== fallbackResolvedSrc && fallbackResolvedSrc) {
                    setActiveSrc(fallbackResolvedSrc);
                    setLoaded(false);
                    setFailed(false);
                    return;
                  }
                  setLoaded(false);
                  setFailed(true);
                }}
                initial={{ opacity: 0 }}
                animate={loaded ? { opacity: 1 } : {}}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className={cn('premium-image-foreground block h-full w-full', objectFitClass, imageClassName)}
              />
            </picture>
          </motion.div>
        </>
      ) : null}
    </div>
  );
};
