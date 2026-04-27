# Nautica web stranica

Ovo je kompletan web projekt za Nautica hospitality/restaurant/caffe priču. Projekt nije samo obična landing stranica, nego cijeli mali sustav: javna stranica, admin panel, API, SQLite baza, događaji, rezervacije, galerija, meni i osnovni SEO setup.

Web aplikacija je završena otprilike 80%. NIJE finalni proizvod. Vlasnica je odustala od stranice, te je rađe htjela WordPress template i banalnu kopiju https://cafedelmar.com.mt. Uzeo sam određene smjernice te sam design prilagodio Nautici te njihovim bojama i logotipu.

## Zašto je projekt javno objavljen

Projekt je originalno rađen za klijenticu, ali dogovoreni rad na kraju nije bio plaćen. Ne želim tu stavljati imena niti raditi neku veliku dramu, ali pošto projekt nije naplaćen, odlučeno je da se kod pusti javno.

Ako već projekt nije iskorišten tamo gdje je trebao biti, onda barem može pomoći nekome drugome kao primjer za React + Node + SQLite web aplikaciju za restoran, kafić, beach bar ili neki sličan hospitality business.

README je namjerno napisan jednostavno, normalnim jezikom. Nije neki robotski tekst, nego kratko objašnjenje šta je unutra i kako se pokrene.

## Šta projekt ima

- modernu React + TypeScript frontend aplikaciju
- Node.js + TypeScript API u `apps/api`
- SQLite bazu sa migracijama i seed podacima
- hrvatski i engleski jezik kao osnovu
- javne stranice za početnu, o nama, meni, događaje, galeriju, FAQ i rezervacije
- admin login i admin dashboard
- uređivanje menija, događaja, objava, FAQ-a, galerije i osnovnih postavki
- upload slika i medija
- rezervacije i kontakt forme
- SEO stvari kao sitemap, robots.txt, meta podaci i lokalni content
- animacije, preloadere, page transitione i moderni UI
- neke production stvari kao rate-limit, helmet, CSRF zaštita, session cookie, audit log i opcionalni 2FA

Nije savršeno, ali je dosta ozbiljna baza za pravi projekt. Neke stvari bi svako trebao još prilagoditi za svoj server, domenu i branding.

## Tehnologije

Frontend:

- React
- TypeScript
- Vite
- Tailwind CSS
- Radix UI / shadcn-style komponente
- Framer Motion
- i18next
- React Router
- TanStack Query

Backend:

- Node.js
- Express
- TypeScript
- SQLite preko `better-sqlite3`
- Zod validacije
- cookie session auth
- middleware za sigurnost, rate-limit i greške

## Struktura projekta

```txt
.
├── src/                    # frontend aplikacija
├── src/admin/              # admin panel stranice
├── src/components/         # UI komponente
├── src/pages/              # javne stranice
├── apps/api/src/           # backend API
├── apps/api/src/routes/    # public i admin API rute
├── apps/api/src/services/  # logika za rezervacije, evente, media itd.
├── packages/shared/src/    # zajednički tipovi, schema i helperi
├── db/migrations/          # SQL migracije
├── public/                 # statični public asseti
└── docs/                   # deployment i production bilješke
```

## Šta treba instalirati prije pokretanja

Trebaš imati:

- Node.js, preporuka je Node 20 ili noviji
- npm
- Git, ako projekt kloniraš sa GitHuba

Ako koristiš Windows, sve komande možeš pokretati iz PowerShella ili terminala u VS Code-u.

## Kako pokrenuti lokalno

Prvo instaliraj dependency-je:

```bash
npm install
```

Zatim kopiraj primjer env file-a:

```bash
cp .env.example .env
```

Na Windowsu možeš ovako:

```powershell
copy .env.example .env
```

Otvori `.env` i namjesti barem ove stvari ako želiš admin login:

```env
ADMIN_BOOTSTRAP_EMAIL=admin@example.com
ADMIN_BOOTSTRAP_PASSWORD=promijeni-ovo-u-neku-dugu-lozinku
```

Lozinka mora biti duža, nemoj ostaviti neku glupost tipa `admin123`.

Zatim pokreni migracije i seed podatke za lokalni development:

```bash
npm run db:migrate:dev
npm run db:seed:dev
```

Nakon toga pokreni web i API zajedno:

```bash
npm run dev
```

Kad se pokrene:

- frontend je na `http://localhost:8080`
- API je na `http://localhost:8787`
- admin login je na `http://localhost:8080/admin/login`

Ako želiš pokrenuti samo frontend:

```bash
npm run dev:web
```

Ako želiš pokrenuti samo API:

```bash
npm run dev:api
```

## Najbitnije npm komande

```bash
npm run dev              # frontend + API zajedno
npm run dev:web          # samo Vite frontend
npm run dev:api          # samo API u watch modu
npm run db:migrate:dev   # lokalne migracije preko TS izvora
npm run db:seed:dev      # lokalni seed podaci
npm run build            # production build frontenda i API-a
npm run start:api        # pokretanje buildanog API-a
npm run lint             # ESLint provjera
npm run test             # Vitest testovi
```

Mala napomena: komande `npm run db:migrate` i `npm run db:seed` su za buildanu production verziju, jer čitaju fajlove iz `server-dist`. Za lokalni rad koristi `db:migrate:dev` i `db:seed:dev`.

## Kako napraviti production build

Prvo buildaj projekt:

```bash
npm run build
```

To napravi:

- frontend build u `dist`
- prerender gdje je podešeno
- backend build u `server-dist`

Nakon builda možeš pokrenuti migracije za production:

```bash
npm run db:migrate
npm run db:seed
```

I pokrenuti API:

```bash
npm run start:api
```

U pravoj produkciji frontend iz `dist` obično servira Nginx, a `/api` i `/uploads` se proxy-a na Node API koji radi na portu `8787`.

## Env varijable koje su bitne

Najbitnije stvari su u `.env.example` i `.env.production.example`.

Najviše ćeš dirati ovo:

```env
VITE_SITE_URL=http://localhost:8080
VITE_API_BASE_URL=
NODE_ENV=development
PORT=8787
FRONTEND_ORIGIN=http://localhost:8080
DATABASE_PATH=./db/nautica.sqlite
MEDIA_UPLOAD_DIR=./public/uploads
ADMIN_BOOTSTRAP_EMAIL=
ADMIN_BOOTSTRAP_PASSWORD=
ENFORCE_HTTPS=false
```

Za produkciju obavezno promijeni domenu, admin email, admin password i putanje za bazu/upload.

## Admin panel

Admin panel se nalazi na:

```txt
/admin/login
```

Kroz admin možeš uređivati:

- rezervacije
- događaje
- meni
- objave / announcements
- FAQ
- glimpses / story-style slajdove
- galeriju i media library
- osnovne postavke stranice

Ako admin user ne postoji, seed skripta može napraviti bootstrap admina iz `.env` vrijednosti.

## Baza podataka

Projekt koristi SQLite. Default lokalna baza je:

```txt
db/nautica.sqlite
```

Migracije su ovdje:

```txt
db/migrations
```

Seed podaci pune početni sadržaj, meni, evente, media zapise i osnovne postavke. Ako nešto zeznes lokalno, najbrže je obrisati lokalni sqlite file i opet pokrenuti migracije + seed.

Nemoj javno uploadati pravu produkcijsku bazu jer može imati rezervacije, emailove, audit logove i ostale privatne stvari.

## Uploadani mediji

Uploadi idu po defaultu u:

```txt
public/uploads
```

U produkciji je bolje imati shared folder izvan repozitorija, npr:

```txt
/websites/nautica/shared/uploads
```

I onda to postaviti kroz `MEDIA_UPLOAD_DIR`.

## Bitno prije javnog objavljivanja

Prije nego ovo digneš javno na GitHub, provjeri:

- da nema `.env` file-a u repozitoriju
- da nema pravih lozinki ili tokena
- da nema production SQLite baze
- da nema privatnih slika koje ne smiju biti javne
- da si promijenio admin password
- da si dodao licencu ako želiš da bude pravi open-source projekt

Ovaj projekt je pušten javno zato jer posao nije plaćen, ali svejedno treba paziti da se ne objave privatni podaci ili tuđi pristupi. Kod može biti otvoren, ali tajne stvari ne smiju ići javno.

## Dokumentacija

Dodatni dokumenti su u `docs` folderu:

- `docs/DEPLOYMENT.md`
- `docs/BACKUP_AND_RESTORE.md`
- `docs/PRODUCTION_CHECKLIST.md`
- `docs/PRODUCTION_DEPLOYMENT_UBUNTU_22.04.md`
- `docs/CLOUDFLARE_CACHE_AND_COMPRESSION.md`
- `docs/SEO_LOCAL_GROWTH_CHECKLIST.md`

Tamo ima više detalja za server, backup, Cloudflare, Nginx i production deploy.

## Kratko objašnjenje projekta

Ideja je bila napraviti modernu web stranicu za hospitality business koji želi izgledati ozbiljno, imati događaje, meni, galeriju i rezervacije bez da se svaka sitnica ručno mijenja u kodu.

Frontend prikazuje lijepu javnu stranicu za goste. Backend čuva sadržaj u SQLite bazi. Admin panel služi da vlasnik može mijenjati sadržaj bez developera. To je glavna poanta cijelog projekta.

Projekt se može preraditi za restoran, beach bar, caffe bar, hotel, apartmane, event venue ili nešto slično. Samo treba promijeniti branding, tekstove, slike, domenu i po potrebi doraditi business logiku.

## Status

Projekt je funkcionalna baza, ali nije garancija da je sve 100% spremno za svaku produkciju bez provjere. Prije pravog korištenja treba testirati forme, admin, upload, security postavke, SEO i deploy konfiguraciju.

Drugim riječima: može se pokrenuti, može se učiti iz njega, može se dalje razvijati, ali nemoj samo blind copy-paste na server bez da provjeriš šta radiš.
