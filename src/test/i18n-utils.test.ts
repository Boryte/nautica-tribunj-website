import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, resolveLocale } from '@shared/index';

describe('locale resolution', () => {
  it('falls back to Croatian for unknown values', () => {
    expect(resolveLocale('de')).toBe(DEFAULT_LOCALE);
    expect(resolveLocale(undefined)).toBe(DEFAULT_LOCALE);
  });

  it('preserves supported locales', () => {
    expect(resolveLocale('hr')).toBe('hr');
    expect(resolveLocale('en')).toBe('en');
  });
});
