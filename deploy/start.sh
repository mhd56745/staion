#!/bin/sh
set -e

cd /app
mkdir -p /app/db

# 1) Initialize the SQLite database
echo "[start] Pushing prisma schema..."
DATABASE_URL="file:/app/db/custom.db" npx prisma db push --accept-data-loss

# 2) Use the template nginx config — the reloader background job will replace it
#    with a dynamic one (built from the live DB) once Next.js is up.
cp /etc/nginx/nginx.conf.tmpl /etc/nginx/nginx.conf

# 3) Hand off to supervisord. It will start nginx + node + reloader in parallel.
#    No more kill-and-restart dance that caused port conflicts.
echo "[start] Starting supervisord..."
exec supervisord -n -c /etc/supervisord.conf
