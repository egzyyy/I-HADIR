#!/usr/bin/env bash
set -e

cd /var/www/html

# .env is bind-mounted from docker/.env.docker (see docker-compose.yml) —
# it always exists and is intentionally separate from any host .env.

# This stack always runs dev-mode Vite (the `vite` service). If a stale
# public/build/ (from an old `npm run build`, e.g. on the host) is present,
# Laravel's @vite directive silently serves THAT instead of the live dev
# server whenever public/hot is momentarily missing (briefly on every `vite`
# container restart) — no error, just old/wrong frontend behavior that looks
# like a mystery bug. Since a prebuilt bundle is never wanted here, remove it
# every boot so this can't happen.
rm -rf public/build

if [ ! -f vendor/autoload.php ]; then
  echo "[entrypoint] Installing PHP dependencies..."
  composer install --no-interaction --prefer-dist --optimize-autoloader
fi

echo "[entrypoint] Waiting for database at ${DB_HOST}:${DB_PORT}..."
until php -r "new PDO('mysql:host=${DB_HOST};port=${DB_PORT}', '${DB_USERNAME}', '${DB_PASSWORD}');" > /dev/null 2>&1; do
  sleep 2
done
echo "[entrypoint] Database is up."

if ! grep -q "^APP_KEY=base64:" .env; then
  echo "[entrypoint] Generating application key..."
  php artisan key:generate --ansi
fi

echo "[entrypoint] Running migrations..."
php artisan migrate --force

# DatabaseSeeder does plain INSERTs (no firstOrCreate), so it's only safe to
# run once against a genuinely empty database — not on every container
# restart. A fresh docker `db` volume has tables but zero rows (migrations
# create schema, not data), which without this leaves every school card on
# the landing page permanently non-clickable (nothing for /api/public/schools
# to return) even though the app itself is working fine.
SCHOOL_COUNT=$(php -r "
  \$pdo = new PDO('mysql:host=${DB_HOST};port=${DB_PORT};dbname=${DB_DATABASE}', '${DB_USERNAME}', '${DB_PASSWORD}');
  echo \$pdo->query('SELECT COUNT(*) FROM schools')->fetchColumn();
" 2>/dev/null || echo 0)

if [ "$SCHOOL_COUNT" = "0" ]; then
  echo "[entrypoint] Database is empty, seeding..."
  php artisan db:seed --force
fi

php artisan storage:link > /dev/null 2>&1 || true

chmod -R 775 storage bootstrap/cache > /dev/null 2>&1 || true

exec "$@"
