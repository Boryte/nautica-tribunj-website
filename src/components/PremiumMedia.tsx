import { Film } from 'lucide-react';
import { PremiumImage } from '@/components/PremiumImage';
import { resolveMediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';

interface PremiumMediaProps {
  src: string;
  alt: string;
  mediaType: 'image' | 'video';
  className?: string;
  mediaClassName?: string;
  priority?: boolean;
  sizes?: string;
  fit?: 'cover' | 'contain';
  backdrop?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  autoPlay?: boolean;
  controls?: boolean;
  drift?: boolean;
  focalPointX?: number | null;
  focalPointY?: number | null;
  objectPosition?: string;
}

export const PremiumMedia = ({
  src,
  alt,
  mediaType,
  className,
  mediaClassName,
  priority = false,
  sizes,
  fit = 'cover',
  backdrop = true,
  muted = true,
  loop = true,
  playsInline = true,
  autoPlay = true,
  controls = false,
  drift = false,
  focalPointX = null,
  focalPointY = null,
  objectPosition,
}: PremiumMediaProps) => {
  if (mediaType === 'image') {
    return (
      <PremiumImage
        src={src}
        alt={alt}
        className={className}
        imageClassName={mediaClassName}
        priority={priority}
        sizes={sizes}
        fit={fit}
        backdrop={backdrop}
        drift={drift}
        focalPointX={focalPointX}
        focalPointY={focalPointY}
        objectPosition={objectPosition}
        title={alt}
      />
    );
  }

  const resolvedSrc = resolveMediaUrl(src);
  const computedObjectPosition =
    objectPosition ??
    (typeof focalPointX === 'number' && typeof focalPointY === 'number'
      ? `${Math.round(focalPointX * 100)}% ${Math.round(focalPointY * 100)}%`
      : undefined);

  if (!resolvedSrc) {
    return (
      <div className={cn('relative overflow-hidden bg-[rgba(8,14,20,0.72)]', className)}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,185,96,0.14),transparent_40%),linear-gradient(180deg,rgba(7,12,18,0.35),rgba(7,12,18,0.82))]" />
        <div className="absolute inset-0 flex items-end p-5">
          <div className="max-w-[18rem]">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--brand-gold))]">Media</p>
            <p className="mt-3 text-sm leading-6 text-white/82">The video source is unavailable right now.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden bg-[rgba(8,14,20,0.82)]', className)}>
      {backdrop ? <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,185,96,0.18),transparent_38%),linear-gradient(180deg,rgba(7,12,18,0.18),rgba(7,12,18,0.62))]" /> : null}
      <video
        src={resolvedSrc}
        aria-label={alt}
        title={alt}
        poster=""
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        autoPlay={autoPlay}
        controls={controls}
        preload={priority ? 'auto' : 'metadata'}
        style={computedObjectPosition ? { objectPosition: computedObjectPosition } : undefined}
        className={cn('block h-full w-full', fit === 'contain' ? 'object-contain' : 'object-cover', mediaClassName)}
      />
      <div className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/12 bg-[rgba(8,14,20,0.62)] px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-white/84 backdrop-blur-md">
        <Film className="h-3.5 w-3.5 text-[hsl(var(--brand-gold))]" />
        Video
      </div>
    </div>
  );
};
