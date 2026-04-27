import { useEffect } from 'react';

const activeOverlays = new Set<string>();

const applyOverlayState = () => {
  if (typeof document === 'undefined') return;

  const body = document.body;
  const hasOpenOverlay = activeOverlays.size > 0;

  if (hasOpenOverlay) {
    body.dataset.publicOverlay = 'open';
    body.style.overflow = 'hidden';
    body.style.touchAction = 'none';
    return;
  }

  delete body.dataset.publicOverlay;
  body.style.overflow = '';
  body.style.touchAction = '';
};

export const setOverlayPresence = (key: string, open: boolean) => {
  if (open) activeOverlays.add(key);
  else activeOverlays.delete(key);

  applyOverlayState();
};

export const usePublicOverlay = (key: string, open: boolean) => {
  useEffect(() => {
    setOverlayPresence(key, open);
    return () => setOverlayPresence(key, false);
  }, [key, open]);
};

export const setHeaderHeightVar = (value: number) => {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty('--header-height', `${Math.round(value)}px`);
};
