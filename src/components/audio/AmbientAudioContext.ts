import { createContext, useContext } from 'react';

export type AmbientAudioContextValue = {
  canPlay: boolean;
  enabled: boolean;
  error: string | null;
  isPlaying: boolean;
  isTransitioning: boolean;
  toggle: () => Promise<void>;
  volume: number;
  setVolume: (value: number) => void;
};

export const AmbientAudioContext = createContext<AmbientAudioContextValue | null>(null);

export const useAmbientAudio = () => {
  const context = useContext(AmbientAudioContext);

  if (!context) {
    throw new Error('useAmbientAudio must be used within AmbientAudioProvider');
  }

  return context;
};
