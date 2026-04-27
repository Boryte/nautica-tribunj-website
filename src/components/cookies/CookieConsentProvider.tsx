import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import {
  defaultCookiePreferences,
  normalizeCookiePreferences,
  readCookieConsent,
  type CookieConsentCategory,
  type CookieConsentPreferences,
  type CookieConsentRecord,
  writeCookieConsent,
} from '@/lib/cookie-consent';

type CookieConsentContextValue = {
  ready: boolean;
  consent: CookieConsentRecord | null;
  hasDecision: boolean;
  preferences: CookieConsentPreferences;
  preferencesOpen: boolean;
  openPreferences: () => void;
  closePreferences: () => void;
  acceptAll: () => void;
  rejectOptional: () => void;
  savePreferences: (preferences: Partial<CookieConsentPreferences>) => void;
  canUse: (category: CookieConsentCategory) => boolean;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export const CookieConsentProvider = ({ children }: { children: ReactNode }) => {
  const [ready, setReady] = useState(false);
  const [consent, setConsent] = useState<CookieConsentRecord | null>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    const syncConsent = () => {
      setConsent(readCookieConsent());
    };

    syncConsent();
    setReady(true);
    window.addEventListener('storage', syncConsent);
    window.addEventListener('nautica-cookie-consent-change', syncConsent as EventListener);
    return () => {
      window.removeEventListener('storage', syncConsent);
      window.removeEventListener('nautica-cookie-consent-change', syncConsent as EventListener);
    };
  }, []);

  const value = useMemo<CookieConsentContextValue>(() => {
    const preferences = consent?.preferences ?? defaultCookiePreferences;

    return {
      ready,
      consent,
      hasDecision: Boolean(consent),
      preferences,
      preferencesOpen,
      openPreferences: () => setPreferencesOpen(true),
      closePreferences: () => setPreferencesOpen(false),
      acceptAll: () => {
        setConsent(writeCookieConsent({
          necessary: true,
          preferences: true,
          analytics: true,
          marketing: true,
        }));
        setPreferencesOpen(false);
      },
      rejectOptional: () => {
        setConsent(writeCookieConsent(defaultCookiePreferences));
        setPreferencesOpen(false);
      },
      savePreferences: (nextPreferences) => {
        setConsent(writeCookieConsent(normalizeCookiePreferences(nextPreferences)));
        setPreferencesOpen(false);
      },
      canUse: (category) => {
        if (category === 'necessary') return true;
        return Boolean(preferences[category]);
      },
    };
  }, [consent, preferencesOpen, ready]);

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
};

export const useCookieConsent = () => {
  const context = useContext(CookieConsentContext);

  if (!context) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }

  return context;
};
