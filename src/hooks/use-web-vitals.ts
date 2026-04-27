import { useEffect, useState } from 'react';
import { resolveLocale } from '@shared/index';
import { buildApiUrl } from '@/lib/api';
import { readCookieConsent } from '@/lib/cookie-consent';
import { getPathLocale } from '@/lib/locale-routing';

type MetricName = 'LCP' | 'CLS' | 'INP' | 'FCP' | 'TTFB';
type Rating = 'good' | 'needs-improvement' | 'poor';
type EventTimingObserverInit = PerformanceObserverInit & { durationThreshold?: number };

const webVitalsEnabled = import.meta.env.PROD || import.meta.env.VITE_ENABLE_WEB_VITALS === 'true';

const thresholds: Record<MetricName, [number, number]> = {
  LCP: [2500, 4000],
  CLS: [0.1, 0.25],
  INP: [200, 500],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
};

const getRating = (name: MetricName, value: number): Rating => {
  const [good, mid] = thresholds[name];
  if (value <= good) return 'good';
  if (value <= mid) return 'needs-improvement';
  return 'poor';
};

const sendMetric = (name: MetricName, value: number) => {
  const payload = JSON.stringify({
    name,
    value,
    rating: getRating(name, value),
    navigationType: performance.getEntriesByType('navigation')[0] instanceof PerformanceNavigationTiming
      ? (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming).type
      : 'navigate',
    pageUrl: window.location.href,
    locale: resolveLocale(getPathLocale(window.location.pathname, window.location.search)),
  });
  const url = buildApiUrl('/api/observability/web-vitals');
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
    return;
  }
  void fetch(url, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: payload });
};

export const useWebVitals = () => {
  const [analyticsAllowed, setAnalyticsAllowed] = useState(() => Boolean(readCookieConsent()?.preferences.analytics));

  useEffect(() => {
    const syncConsent = () => {
      setAnalyticsAllowed(Boolean(readCookieConsent()?.preferences.analytics));
    };

    if (typeof window === 'undefined') return;
    window.addEventListener('storage', syncConsent);
    window.addEventListener('nautica-cookie-consent-change', syncConsent as EventListener);
    return () => {
      window.removeEventListener('storage', syncConsent);
      window.removeEventListener('nautica-cookie-consent-change', syncConsent as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!webVitalsEnabled || !analyticsAllowed || typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return;

    let clsValue = 0;
    let lcpValue = 0;
    let inpValue = 0;
    const sent = { CLS: false, LCP: false, INP: false, FCP: false, TTFB: false } as Record<MetricName, boolean>;

    const flush = () => {
      if (!sent.CLS) { sent.CLS = true; sendMetric('CLS', Number(clsValue.toFixed(4))); }
      if (!sent.LCP && lcpValue > 0) { sent.LCP = true; sendMetric('LCP', Math.round(lcpValue)); }
      if (!sent.INP && inpValue > 0) { sent.INP = true; sendMetric('INP', Math.round(inpValue)); }
    };

    const onHidden = () => { if (document.visibilityState === 'hidden') flush(); };

    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const entry = entries[entries.length - 1];
      if (entry) lcpValue = entry.startTime;
    });
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { value?: number; hadRecentInput?: boolean }>) {
        if (!entry.hadRecentInput) clsValue += entry.value ?? 0;
      }
    });
    const fcpObserver = new PerformanceObserver((list) => {
      if (sent.FCP) return;
      const entry = list.getEntries().find((item) => item.name === 'first-contentful-paint');
      if (entry) { sent.FCP = true; sendMetric('FCP', Math.round(entry.startTime)); }
    });
    const inpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { interactionId?: number; duration: number }>) {
        if ((entry.interactionId ?? 0) > 0) inpValue = Math.max(inpValue, entry.duration);
      }
    });

    try {
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      fcpObserver.observe({ type: 'paint', buffered: true });
      inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 40 } as EventTimingObserverInit);
      const nav = performance.getEntriesByType('navigation')[0];
      if (!sent.TTFB && nav instanceof PerformanceNavigationTiming) { sent.TTFB = true; sendMetric('TTFB', nav.responseStart); }
    } catch {
      return;
    }

    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('pagehide', flush);
      lcpObserver.disconnect();
      clsObserver.disconnect();
      fcpObserver.disconnect();
      inpObserver.disconnect();
    };
  }, [analyticsAllowed]);
};
