# Production Security Checklist

## Environment and secrets

- copy from `.env.production.example`, not from a dev `.env`
- leave `VITE_API_BASE_URL` blank when frontend and API share the same HTTPS origin through Nginx
- rotate `ADMIN_BOOTSTRAP_PASSWORD` before the first public launch
- remove unused variables and empty placeholder secrets from the final environment file
- set `ENFORCE_HTTPS=true` in production
- enable `ADMIN_2FA_ENABLED=true` only after generating and storing a valid Base32 TOTP secret
- prefer generating the first `ADMIN_2FA_SECRET` from the admin settings onboarding flow instead of crafting it manually
- protect `/etc/nautica/nautica.env` with `root:nautica` ownership and `640` permissions

## API and admin auth

- verify the public site reaches the API only through HTTPS
- confirm the Node API port is not exposed publicly and only Nginx can reach `127.0.0.1:8787`
- verify admin login, logout, protected routes, and CSRF-protected mutations on the production hostname
- confirm admin cookies are `HttpOnly`, `Secure`, and `SameSite=Strict`
- if 2FA is enabled, test one successful login and one invalid TOTP attempt
- review audit logs for `admin.login.failed` and repeated `429` responses

## Upload safety

- confirm `MEDIA_UPLOAD_DIR` is outside the release directory and on persistent storage
- verify uploaded files are restricted to vetted image and video formats only
- confirm Nginx serves `/uploads/` as static files and never executes them
- if Nginx serves `/uploads/` from a different path than `MEDIA_UPLOAD_DIR`, use an explicit `alias` to the real upload directory
- smoke-test rejection for oversized files, renamed script files, and unsupported extensions
- ensure upload directories are writable by the app user and read-only to the web tier where possible

## Reverse proxy and host hardening

- apply the hardened Nginx config from [docs/examples/nginx-nautica.conf](/C:/Users/nikma/Desktop/nautica%20website/docs/examples/nginx-nautica.conf)
- install Fail2ban using the examples in [docs/examples/fail2ban/jail.local](/C:/Users/nikma/Desktop/nautica%20website/docs/examples/fail2ban/jail.local)
- enable `ufw` or equivalent firewall for only `22`, `80`, and `443`
- disable default Nginx sites and verify `nginx -t` passes before reload
- verify Cloudflare SSL/TLS is set to `Full (strict)`
- if Facebook or Instagram embeds are enabled behind strict security headers, allow Meta domains in `Content-Security-Policy` `frame-src`, `img-src`, `script-src`, and `connect-src`
- serve `/admin` and `/admin/*` from `spa.html`, not the prerendered `index.html`, so the admin panel never hydrates against public-page HTML

## Data, recovery, and observability

- run `npm run db:migrate` successfully on the target environment
- verify database persistence, backup rotation, and restore drills
- monitor `/health` and `/ready`
- retain request logs with request IDs and keep journal or file retention configured
- review notification logs for provider failures

## Final smoke test

- Croatian default locale and English fallback render correctly
- reservation submission works for normal slot, waitlist slot, and duplicate prevention
- published events render correctly on the public site
- media upload, preview, and deletion work from admin
- a restart of the API leaves database content and uploaded media intact
