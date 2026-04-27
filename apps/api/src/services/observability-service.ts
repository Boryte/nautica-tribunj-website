import { z } from 'zod';
import { db } from '../db';

const schema = z.object({
  name: z.enum(['LCP', 'CLS', 'INP', 'FCP', 'TTFB']),
  value: z.number().finite().nonnegative(),
  rating: z.enum(['good', 'needs-improvement', 'poor']),
  navigationType: z.string().max(40).optional(),
  pageUrl: z.string().url(),
  locale: z.enum(['hr', 'en']).optional(),
});

export const storeWebVital = (payload: unknown, userAgent?: string | null) => {
  const metric = schema.parse(payload);
  db.prepare(`INSERT INTO web_vitals (metric_name, metric_value, rating, navigation_type, page_url, locale, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(metric.name, metric.value, metric.rating, metric.navigationType ?? null, metric.pageUrl, metric.locale ?? null, userAgent ?? null, new Date().toISOString());
};
