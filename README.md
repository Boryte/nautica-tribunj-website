# Nautica

Nautica is now structured as a production-minded single-repo hospitality application:

- premium React + TypeScript frontend
- Node + TypeScript API under `apps/api`
- SQLite persistence with migrations and seed data
- bilingual Croatian/English content foundation
- secure admin session flow
- reservation and event workflows with validation, audit logging, and notification logs
- admin-managed announcements, glimpses, gallery media, homepage modules, and direct menu editing
- premium event detail routes, calendar/list/featured event views, and desktop menu book mode

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Run migrations and seed data:

```bash
npm run db:migrate
npm run db:seed
```

4. Start web + API together:

```bash
npm run dev
```

Frontend runs on `http://localhost:8080`.
API runs on `http://localhost:8787`.

Default bootstrap admin credentials come from `.env.example` and should be changed immediately outside local development.

## Important scripts

- `npm run dev`, runs Vite and the API together
- `npm run dev:web`, frontend only
- `npm run dev:api`, API only
- `npm run db:migrate`, apply SQLite migrations
- `npm run db:seed`, seed default business/admin/content data
- `npm run lint`, ESLint
- `npm run test`, Vitest
- `npm run build`, production frontend build + API typecheck

## Project structure

- `src`, public web client and admin frontend
- `apps/api/src`, API server, auth, routes, services, middleware
- `packages/shared/src`, shared types, schemas, locale helpers
- `db/migrations`, SQLite schema migrations
- `docs`, deployment, backup, and production notes

## Migrations and seed notes

- The initial schema lives in `db/migrations/001_init.sql`.
- Seed data creates:
  - one bootstrap admin account
  - business settings and opening hours
  - localized homepage/about/SEO content
  - media library collections and seeded gallery/story assets
  - announcements, glimpse groups/slides, homepage module defaults
  - richer seed menu items and published events
- Re-seeding is additive and uses upserts for most reference data.
- Uploaded media is stored locally under `MEDIA_UPLOAD_DIR` in v1 and served by the API at `/uploads/*`.

## Deployment notes

See:

- `docs/DEPLOYMENT.md`
- `docs/BACKUP_AND_RESTORE.md`
- `docs/PRODUCTION_CHECKLIST.md`

## Tooling notes

- The repository is standard Vite + React + TypeScript.
- Custom Vite/Playwright wrappers were removed in favor of standard tooling.
- If you want a fresh lockfile, regenerate it with your preferred package manager after cloning.

