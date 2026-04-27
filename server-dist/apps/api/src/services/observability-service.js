"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeWebVital = void 0;
const zod_1 = require("zod");
const db_1 = require("../db");
const schema = zod_1.z.object({
    name: zod_1.z.enum(['LCP', 'CLS', 'INP', 'FCP', 'TTFB']),
    value: zod_1.z.number().finite().nonnegative(),
    rating: zod_1.z.enum(['good', 'needs-improvement', 'poor']),
    navigationType: zod_1.z.string().max(40).optional(),
    pageUrl: zod_1.z.string().url(),
    locale: zod_1.z.enum(['hr', 'en']).optional(),
});
const storeWebVital = (payload, userAgent) => {
    const metric = schema.parse(payload);
    db_1.db.prepare(`INSERT INTO web_vitals (metric_name, metric_value, rating, navigation_type, page_url, locale, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(metric.name, metric.value, metric.rating, metric.navigationType ?? null, metric.pageUrl, metric.locale ?? null, userAgent ?? null, new Date().toISOString());
};
exports.storeWebVital = storeWebVital;
