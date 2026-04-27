import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { AmbientAudioContext, type AmbientAudioContextValue } from '@/components/audio/AmbientAudioContext';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const createAudio = (src: string) => {
  const audio = new Audio(src);
  audio.loop = true;
  audio.preload = 'none';
  return audio;
};

export const AmbientAudioProvider = ({
  children,
  src,
  enabledByDefault = true,
}: {
  children: ReactNode;
  src: string;
  enabledByDefault?: boolean;
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const targetVolumeRef = useRef(0.24);
  const [volume, setVolumeState] = useState(0.24);
  const [enabled, setEnabled] = useState(enabledByDefault);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasTriedAutostartRef = useRef(false);

  const cancelFade = useCallback(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = createAudio(src);
      audioRef.current.addEventListener('ended', () => {
        audioRef.current?.play().catch(() => undefined);
      });
    }

    return audioRef.current;
  }, [src]);

  const fadeTo = useCallback((target: number, duration: number, onComplete?: () => void) => {
    const audio = getAudio();
    cancelFade();
    setIsTransitioning(true);

    const startVolume = audio.volume;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = clamp((now - startTime) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      audio.volume = startVolume + (target - startVolume) * eased;

      if (progress < 1) {
        frameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      audio.volume = target;
      frameRef.current = null;
      setIsTransitioning(false);
      onComplete?.();
    };

    frameRef.current = window.requestAnimationFrame(tick);
  }, [cancelFade, getAudio]);

  const setVolume = useCallback((value: number) => {
    const next = clamp(value, 0, 1);
    targetVolumeRef.current = next;
    setVolumeState(next);

    const audio = audioRef.current;
    if (!audio) return;
    if (!isPlaying || isTransitioning) return;

    audio.volume = next;
  }, [isPlaying, isTransitioning]);

  const toggle = useCallback(async () => {
    const audio = getAudio();

    if (isPlaying) {
      setEnabled(false);
      fadeTo(0, 480, () => {
        audio.pause();
        setIsPlaying(false);
      });
      return;
    }

    try {
      setEnabled(true);
      setError(null);
      audio.volume = 0;
      await audio.play();
      setIsPlaying(true);
      fadeTo(targetVolumeRef.current, 640);
    } catch {
      setIsPlaying(false);
      setIsTransitioning(false);
      setEnabled(false);
    }
  }, [fadeTo, getAudio, isPlaying]);

  useEffect(() => {
    if (!enabled || isPlaying || hasTriedAutostartRef.current) return;

    const startOnFirstGesture = () => {
      hasTriedAutostartRef.current = true;
      void toggle();
    };

    window.addEventListener('pointerdown', startOnFirstGesture, { once: true, passive: true });
    window.addEventListener('keydown', startOnFirstGesture, { once: true });

    return () => {
      window.removeEventListener('pointerdown', startOnFirstGesture);
      window.removeEventListener('keydown', startOnFirstGesture);
    };
  }, [enabled, isPlaying, toggle]);

  useEffect(() => {
    return () => {
      cancelFade();
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [cancelFade]);

  const value = useMemo<AmbientAudioContextValue>(() => ({
    canPlay: typeof Audio !== 'undefined',
    enabled,
    error,
    isPlaying,
    isTransitioning,
    toggle,
    volume,
    setVolume,
  }), [enabled, error, isPlaying, isTransitioning, setVolume, toggle, volume]);

  return <AmbientAudioContext.Provider value={value}>{children}</AmbientAudioContext.Provider>;
};

