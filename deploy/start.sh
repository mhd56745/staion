#!/bin/sh
set -e

cd /app
mkdir -p /app/db

# 1) Initialize the SQLite database
echo "[start] Pushing prisma schema..."
DATABASE_URL="file:/app/db/custom.db" npx prisma db push --accept-data-loss

# 2) Start Next.js in background so we can fetch the nginx config from it
echo "[start] Starting Next.js in background..."
PORT=3000 HOSTNAME=127.0.0.1 node /app/server.js &
NEXT_PID=$!

# 3) Wait for Next.js to come up
echo "[start] Waiting for Next.js on :3000..."
for i in $(seq 1 30); do
  if curl -sf http://127.0.0.1:3000/api/nginx-config > /etc/nginx/nginx.conf 2>/dev/null; then
    echo "[start] nginx.conf generated from app."
    break
  fi
  sleep 1
done

# Fallback to template if app didn't respond
if [ ! -s /etc/nginx/nginx.conf ]; then
  echo "[start] Using template nginx.conf"
  cp /etc/nginx/nginx.conf.tmpl /etc/nginx/nginx.conf
fi

# 4) Kill the background Next.js — supervisord will manage it from here
kill $NEXT_PID 2>/dev/null || true
wait $NEXT_PID 2>/dev/null || true

# 5) Start supervisord (runs nginx + node + nginx-reloader)
echo "[start] Starting supervisord..."
exec supervisord -c /etc/supervisord.conf
