# Cloudflare cache + compression setup for Nautica

This project now ships prerendered public routes and long-lived hashed assets. The CDN should respect that split.

## Recommended Cloudflare baseline
- SSL/TLS mode: **Full (strict)**
- Always Use HTTPS: **On**
- Automatic HTTPS Rewrites: **On**
- Brotli: **On**
- HTTP/3 (with QUIC): **On**
- Early Hints: **On** if available on your plan and after testing
- Rocket Loader: **Off** unless you test it carefully with the app

## Cache rules

### 1) Bypass admin and API
Expression examples:
- `http.request.uri.path starts_with "/api/"`
- `http.request.uri.path starts_with "/admin"`

Action:
- Cache eligibility: **Bypass cache**

Reason:
- Admin, session, auth, uploads, and live mutations should not be cached at the edge.

### 2) Respect origin cache headers for public HTML
Expression example:
- `http.request.uri.path matches "^/(|en|about|menu|events|reservation|media|faq)(/.*)?$"`

Action:
- Cache eligibility: **Eligible for cache**
- Origin Cache Control: **On**

Reason:
- Nginx sends the HTML caching policy. Cloudflare should respect `Cache-Control` and `s-maxage` coming from origin.

### 3) Aggressive caching for static assets
Expression example:
- `http.request.uri.path starts_with "/assets/" or http.request.uri.path starts_with "/icons/"`

Action:
- Cache eligibility: **Eligible for cache**
- Edge TTL: **Respect origin**

Reason:
- Vite hashed assets are immutable and should stay cached for a long time.

### 4) Cache public uploads but not forever
Expression example:
- `http.request.uri.path starts_with "/uploads/"`

Action:
- Cache eligibility: **Eligible for cache**
- Edge TTL: **Respect origin**

Reason:
- Venue photos and media should cache well, but not like immutable build assets because they can be replaced.

## Purge strategy
- After each frontend release: **Purge only changed URLs** when possible.
- If the visual release is large: purge `/`, `/en`, `/about`, `/en/about`, `/menu`, `/events`, `/media`, `/faq`, `/reservation`, and any updated event routes.
- Do **not** repeatedly full-purge unless necessary.

## Compression strategy
- Let **Cloudflare Brotli** handle edge compression.
- Keep **Nginx gzip** enabled as the origin-side fallback.
- Do not rely on `no-transform` headers on public HTML or static files, otherwise Cloudflare compression features can be disabled.

## What to verify after enabling rules
- `curl -I https://your-domain.tld/assets/...` returns long cache headers.
- `curl -I https://your-domain.tld/api/health` does not return cacheable headers.
- HTML routes return finite browser caching and a stronger shared-cache policy.
- Cloudflare response headers show `cf-cache-status: HIT` for repeat requests on assets and media, but not for admin/API endpoints.
