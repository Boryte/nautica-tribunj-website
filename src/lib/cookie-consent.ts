export type CookieConsentCategory = 'necessary' | 'preferences' | 'analytics' | 'marketing';

export type CookieConsentPreferences = Record<CookieConsentCategory, boolean>;

export type CookieConsentRecord = {
  version: 1;
  decidedAt: string;
  preferences: CookieConsentPreferences;
};

export const COOKIE_CONSENT_STORAGE_KEY = 'nautica.cookie-consent.v1';
export const COOKIE_CONSENT_COOKIE_NAME = 'nautica_cookie_consent';
export const COOKIE_CONSENT_MAX_AGE_DAYS = 180;

export const defaultCookiePreferences: CookieConsentPreferences = {
  necessary: true,
  preferences: false,
  analytics: false,
  marketing: false,
};

const consentCookieMaxAge = COOKIE_CONSENT_MAX_AGE_DAYS * 24 * 60 * 60;

export const normalizeCookiePreferences = (
  input?: Partial<CookieConsentPreferences> | null,
): CookieConsentPreferences => ({
  necessary: true,
  preferences: Boolean(input?.preferences),
  analytics: Boolean(input?.analytics),
  marketing: Boolean(input?.marketing),
});

const parseConsentRecord = (value: string | null): CookieConsentRecord | null => {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<CookieConsentRecord>;
    if (parsed.version !== 1 || typeof parsed.decidedAt !== 'string' || !parsed.preferences) {
      return null;
    }

    return {
      version: 1,
      decidedAt: parsed.decidedAt,
      preferences: normalizeCookiePreferences(parsed.preferences),
    };
  } catch {
    return null;
  }
};

export const readCookieConsent = (): CookieConsentRecord | null => {
  if (typeof window === 'undefined') return null;

  const stored = parseConsentRecord(window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY));
  if (stored) return stored;

  const cookieValue = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${COOKIE_CONSENT_COOKIE_NAME}=`))
    ?.slice(COOKIE_CONSENT_COOKIE_NAME.length + 1);

  return parseConsentRecord(cookieValue ? decodeURIComponent(cookieValue) : null);
};

export const writeCookieConsent = (preferences: Partial<CookieConsentPreferences>): CookieConsentRecord => {
  const record: CookieConsentRecord = {
    version: 1,
    decidedAt: new Date().toISOString(),
    preferences: normalizeCookiePreferences(preferences),
  };

  if (typeof window !== 'undefined') {
    const serialized = JSON.stringify(record);
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, serialized);
    document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=${encodeURIComponent(serialized)}; Max-Age=${consentCookieMaxAge}; Path=/; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent('nautica-cookie-consent-change', { detail: record }));
  }

  return record;
};
