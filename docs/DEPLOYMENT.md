# Deployment Notes

## Runtime shape

- Serve the frontend build from `dist/`.
- Run the API with `npm run start:api` or an equivalent `tsx apps/api/src/server.ts` process manager command.
- Put both services behind HTTPS and a reverse proxy.

## Required environment variables

Use `.env.example` as the source of truth. In production, update at least:

- `VITE_API_BASE_URL` (usually leave blank behind same-origin Nginx)
- `NODE_ENV=production`
- `FRONTEND_ORIGIN`
- `DATABASE_PATH`
- `ADMIN_BOOTSTRAP_PASSWORD`
- `SESSION_COOKIE_NAME`
- `SMTP_FROM`

## Reverse proxy

- terminate TLS at the proxy
- preserve `X-Forwarded-*` headers
- route `/api/*`, `/health`, and `/ready` to the API
- route all other requests to the frontend

## Cookies and security

- production cookies use `httpOnly` and `SameSite=Lax`
- enable `secure` cookies by running behind HTTPS
- keep the API and frontend on the same parent origin when possible

## SQLite

- persist the database file on durable storage
- keep WAL files on the same persistent volume
- run `npm run db:migrate` before promoting a new release
- run `npm run db:seed` only for first-time environment bootstrap or deliberate reference-data refreshes

## Observability

- capture stdout/stderr from the API process
- retain structured logs for request IDs, auth events, audit events, and notification logs
- monitor `/health` and `/ready`
