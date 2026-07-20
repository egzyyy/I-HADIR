# I-HADIR

School attendance management system for Malaysian primary schools — Laravel 12 (PHP 8.2+) + React 18 + Inertia.js + Vite, MySQL database.

This README covers how to actually get the project running. For architecture, database schema, and coding conventions, see `CLAUDE.md`.

---

## Option A — Docker (recommended, zero manual setup)

This is the easiest way to run the project on any machine — no local PHP, Composer, Node, or MySQL install required, and no risk of colliding with an existing XAMPP setup.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### First run

```bash
docker compose up --build
```

That's it. On first run this will, in order:

1. Build the PHP app image (a few minutes — installing PHP extensions from source is the slow part).
2. Pull the MySQL and Node images.
3. Start all three containers (`app`, `db`, `vite`).
4. Inside `app`: install Composer dependencies, wait for MySQL to actually accept connections, generate an `APP_KEY`, run all migrations, and **seed a full demo dataset automatically** if the database is empty (see "Demo data" below).
5. Inside `vite`: install npm dependencies and start the Vite dev server with hot-reload.

It stays attached to your terminal streaming logs from all three services — it will not "exit" on its own since these are long-running dev servers. You know it's ready when you see:

- `app`: `Laravel development server started: http://0.0.0.0:8000`
- `vite`: `VITE vX.X.X ready` with `➜ Local: http://localhost:5173/`

Then open **http://localhost:8000**.

Subsequent runs are much faster (`docker compose up` — no `--build` needed unless you changed the `Dockerfile`), since Composer/npm dependencies persist in named Docker volumes between runs.

### Stopping

`Ctrl+C` if running attached, or from another terminal: `docker compose down` (stops and removes containers, but **keeps your database** — it lives in a separate named volume). Add `-d` to `docker compose up` if you want it to run in the background instead of occupying your terminal.

### Running artisan / composer / npm commands

The containers must be running first (`docker compose up -d`), then:

```bash
docker compose exec app php artisan migrate
docker compose exec app php artisan db:seed --force
docker compose exec app php artisan tinker
docker compose exec app composer require some/package
```

Running several commands in a row? Drop into a shell instead of prefixing every command:

```bash
docker compose exec app bash
# now you're inside the container — just run `php artisan ...` directly
exit
```

**Windows/Git Bash note:** if you ever pass an absolute Unix path as an argument (e.g. `docker compose exec app cat /var/www/html/.env`), Git Bash may mangle it into a Windows path and the command fails with a confusing "No such file" error. Fix: prefix the command with `MSYS_NO_PATHCONV=1`. Doesn't affect plain `artisan` commands since those don't take filesystem paths.

### Ports

| Service | URL | Notes |
|---|---|---|
| App | http://localhost:8000 | The actual site |
| Vite (HMR) | http://localhost:5173 | Loaded automatically by the page's `<script>` tags — you don't visit this directly |
| MySQL | `127.0.0.1:3307` | Deliberately **not** 3306, so it doesn't clash with a locally-running XAMPP MySQL |

### Demo data

`entrypoint.sh` automatically runs `php artisan db:seed` the first time it sees an empty database. This creates a full plausible dataset — one school (SK Pulau Serai), 180 students across 12 classrooms, 18 staff, co-curriculars, sport houses, events, ~3 weeks of realistic attendance/facility logs, and visitor records. See `database/seeders/DatabaseSeeder.php` for exactly what's seeded.

**Login credentials** (all password `password`):

| Role | Email |
|---|---|
| Admin | `admin@ihadir.com` |
| Admin (backup) | `admin2@ihadir.com` |
| Teacher | `teacher1@ihadir.com` |
| Security | `security@ihadir.com` |

To wipe and reseed fresh demo data at any time:

```bash
docker compose exec app php artisan migrate:fresh --seed --force
```

**This drops and recreates every table** — only run it when you're OK losing whatever's currently in the Docker database.

---

## Option B — Bare metal (XAMPP)

If you'd rather run PHP/MySQL natively instead of through Docker:

1. Install dependencies:
   ```bash
   composer install
   npm install
   ```
2. Copy `.env.example` to `.env` if you don't already have one, and set `APP_KEY`:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
3. Make sure XAMPP's MySQL is running, and that `.env` has:
   ```
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=i_hadir
   DB_USERNAME=root
   DB_PASSWORD=
   ```
   (Create the `i_hadir` database in phpMyAdmin/HeidiSQL first if it doesn't exist.)
4. Migrate + seed:
   ```bash
   php artisan migrate --seed
   ```
5. Run everything (Laravel server + queue listener + logs + Vite) in one terminal:
   ```bash
   composer run dev
   ```
   Then open **http://localhost:8000**.

**Docker and bare-metal are independent** — they use separate databases (Docker's containerized MySQL on port 3307 vs. XAMPP's on 3306) and separate `.env` files (`docker/.env.docker` vs. your root `.env`). Data doesn't sync between them; seed each one separately if you want data in both.

---

## Viewing the database in DBeaver (or any GUI client)

Works the same for TablePlus, HeidiSQL, MySQL Workbench, etc. — just adjust the equivalent settings.

### Connecting to the Docker database

Containers must be running (`docker compose up -d`) first.

1. New Connection → **MySQL**.
2. Connection settings:
   - **Host:** `127.0.0.1`
   - **Port:** `3307` (not 3306 — see the ports table above)
   - **Database:** `i_hadir`
   - **Username:** `i_hadir`
   - **Password:** `i_hadir_secret`
3. **Before connecting**, go to the **Driver properties** tab and set:
   - `allowPublicKeyRetrieval` → `true`
   - `useSSL` → `false`

   Without this, MySQL 8's default `caching_sha2_password` auth plugin will make DBeaver fail to connect with something like `Public Key Retrieval is not allowed`, even though the credentials are correct.
4. Test Connection → should succeed → Finish.

Want root access instead (to see all databases on that instance, not just `i_hadir`)? Use username `root`, password `root_secret`, same host/port.

### Connecting to the bare-metal (XAMPP) database

Same steps, but:
- **Port:** `3306`
- **Username:** `root`
- **Password:** *(blank)*
- **Database:** `i_hadir`

### Quick CLI alternative (no GUI needed)

```bash
docker compose exec db mysql -u i_hadir -pi_hadir_secret i_hadir
```

Drops you straight into a `mysql>` prompt already connected to the right database. `SHOW TABLES;`, `SELECT * FROM schools;`, etc. `exit` to leave.

---

## Troubleshooting

**"Connection refused" DB errors right after `docker compose up`.** Something else on your machine is bound to port 8000 (e.g. a leftover bare-metal `php artisan serve` from an earlier `composer run dev` session). Check with:
```powershell
Get-NetTCPConnection -LocalPort 8000 -State Listen | ForEach-Object { Get-Process -Id $_.OwningProcess }
```
Kill whatever isn't Docker's own processes (`com.docker.backend`, `wslrelay`), then reload.

**Frontend looks stale / old behavior after editing code.** Should self-heal — `entrypoint.sh` deletes any leftover `public/build/` on every boot specifically to prevent Laravel from silently falling back to an old pre-built bundle instead of the live Vite dev server. If it still happens, restart the `vite` service: `docker compose restart vite`.

**Docker containers not showing up / seem stuck.** The first `docker compose up --build` takes several minutes — compiling PHP extensions from source alone can take 3–4 minutes, during which no containers exist yet (this is normal, not a hang). Give it time before assuming something's wrong.

**Landing page schools aren't clickable / school directory looks empty.** The database has no seeded data. `entrypoint.sh` only auto-seeds when it detects zero rows in `schools` — if you ran `migrate` manually without `--seed`, run `docker compose exec app php artisan db:seed --force` yourself.

**Edited `.env` and now Docker's DB connection is broken.** Don't edit the root `.env` expecting it to affect Docker — the `app` and `vite` containers each read their own dedicated `docker/.env.docker`, bind-mounted separately specifically so bare-metal and Docker configs can't collide. Edit `docker/.env.docker` (and recreate the containers with `docker compose up -d`, not just `restart`, since `restart` doesn't pick up `docker-compose.yml` changes) if you need to change Docker's environment.
