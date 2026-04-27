# Nautica SEO / Local Growth Checklist

## Deploy / crawl validation
- Deploy the prerendered `dist/**/index.html` files exactly as generated.
- Set `VITE_SITE_URL` to the exact public origin before building so canonical, hreflang, Open Graph, `robots.txt`, and `sitemap.xml` all point to the same host.
- Verify that `/`, `/about`, `/menu`, `/events`, `/reservation`, `/media`, `/faq` and all `/en/...` equivalents return HTML directly.
- Submit `https://nautica.hr/sitemap.xml` to Google Search Console and Bing Webmaster Tools.
- Confirm that `robots.txt` and `sitemap.xml` from `dist/` are the files served in production.
- Check canonical and hreflang output for both HR and EN routes.
- Validate JSON-LD with Google Rich Results Test and Schema Markup Validator.

## Performance / Core Web Vitals
- Monitor `LCP`, `CLS`, `INP`, `FCP`, `TTFB` in production using the new `/api/observability/web-vitals` endpoint.
- Enable Cloudflare Brotli and keep Nginx gzip as the origin fallback.
- Cache hashed build assets aggressively and cache media uploads with a shorter but still strong `max-age`.
- Make sure `/uploads/*.webp` is served with the correct `image/webp` MIME type.
- Keep `/api/*` and `/admin/*` out of the edge cache.

## Google Business Profile hardening
- Keep NAP consistent: Nautica / DONJA RIVA 55 / 22212 Tribunj / phone / website.
- Primary category: Cocktail bar. Secondary category only if accurate (coffee shop / cafe / bar).
- Keep hours, address, website URL, reservation link, and phone in sync with the website.
- Upload fresh venue, terrace, drinks, and sunset photos regularly.
- Publish Google Posts for events and special evenings.
- Reply to reviews consistently and mention event / cocktail / sunset context naturally.
- Use the website link and reservation link inside GBP.
- Monitor Google-suggested profile edits and correct anything inaccurate quickly.

## Content / local relevance
- Keep event pages fresh and remove cancelled or stale offers from public visibility.
- Add real seasonal updates, menu highlights, and event recaps to strengthen local relevance.
- Keep English translations accurate on `/en/...` pages for tourist search intent.
- Keep visible local copy for Tribunj, Vodice, and Srima intent natural and useful.
- Do not add self-serving review schema to the local business site.

## Image optimization
- Use descriptive alt text tied to the actual page context.
- Use stable image URLs and avoid random cache-busting URLs for the same media.
- Prefer descriptive filenames for new uploads where possible.
- Keep important images close to relevant visible text.
