import { motion } from 'framer-motion';
import { SlidersHorizontal, Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAmbientAudio } from '@/components/audio/AmbientAudioContext';
import { cn } from '@/lib/utils';

const SoundGlyph = ({ active }: { active: boolean }) => (
  <div className="relative flex h-4 w-5 items-center justify-center">
    {[0, 1, 2].map((index) => (
      <motion.span
        key={index}
        className={cn(
          'absolute bottom-0 w-[2px] rounded-full bg-current',
          index === 0 && 'left-[2px]',
          index === 1 && 'left-1/2 -translate-x-1/2',
          index === 2 && 'right-[2px]'
        )}
        style={{ height: `${8 + index * 3}px` }}
        animate={active ? { scaleY: [0.55, 1, 0.72], opacity: [0.52, 1, 0.7] } : { scaleY: 0.4, opacity: 0.52 }}
        transition={{
          duration: 1.1,
          repeat: active ? Infinity : 0,
          repeatType: 'mirror',
          delay: index * 0.12,
          ease: 'easeInOut',
        }}
      />
    ))}
  </div>
);

export const AmbientSoundControl = () => {
  const location = useLocation();
  const { canPlay, enabled, error, isPlaying, isTransitioning, toggle, volume, setVolume } = useAmbientAudio();
  const [expanded, setExpanded] = useState(false);

  if (location.pathname.startsWith('/admin')) return null;

  return (
    <div className="ambient-sound-control fixed bottom-4 right-4 z-[85] sm:bottom-5 sm:right-5">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-[rgba(9,14,21,0.78)] px-1.5 py-1.5 shadow-[var(--shadow-premium)] backdrop-blur-xl"
      >
        <button
          type="button"
          onClick={() => void toggle()}
          aria-label={enabled ? 'Turn ambient sound off' : 'Turn ambient sound on'}
          aria-pressed={enabled}
          className="inline-flex h-8 items-center gap-1.5 rounded-full px-2 text-[hsl(var(--text-on-dark))] transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-gold))]"
        >
          <span className={cn('flex h-6 w-6 items-center justify-center rounded-full border border-white/10', enabled ? 'bg-[hsl(var(--brand-gold))] text-[hsl(var(--text-inverse))]' : 'bg-white/[0.04] text-white/88')}>
            {enabled ? <SoundGlyph active={isPlaying && !isTransitioning} /> : <VolumeX className="h-3 w-3" />}
          </span>
          <span className="hidden font-body text-[9px] uppercase tracking-[0.2em] text-white/78 sm:inline">
            {enabled ? 'On' : 'Off'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-label={expanded ? 'Hide sound controls' : 'Show sound controls'}
          aria-expanded={expanded}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/82 transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-gold))]"
        >
          <SlidersHorizontal className="h-3 w-3" />
        </button>

        <motion.div
          initial={false}
          animate={{
            width: expanded ? 112 : 0,
            opacity: expanded ? 1 : 0,
            marginLeft: expanded ? 2 : 0,
          }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <label className="flex items-center gap-1.5 rounded-full bg-white/[0.04] px-2.5 py-1.5">
            <Volume2 className="h-3 w-3 text-white/72" />
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(volume * 100)}
              onChange={(event) => setVolume(Number(event.target.value) / 100)}
              aria-label="Ambient sound volume"
              className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[hsl(var(--brand-gold))]"
              disabled={!canPlay}
            />
          </label>
        </motion.div>
      </motion.div>

      {error ? (
        <p className="mt-2 max-w-[18rem] rounded-[1rem] border border-white/10 bg-[rgba(9,14,21,0.88)] px-3 py-2 font-body text-xs leading-6 text-white/76 shadow-[var(--shadow-soft)] backdrop-blur-xl">
          {error}
        </p>
      ) : null}
    </div>
  );
};
