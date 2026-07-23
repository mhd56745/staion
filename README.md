# TV Station — Koyeb Live Channel

A self-hosted **TV station** that runs on Koyeb with **zero video storage**.
External streams (HLS / MP4 / DASH) are proxied through Nginx, and a Next.js admin
panel lets you schedule programs just like a real broadcast channel.

## How it works

```
                            ┌────────────────────────────────┐
Viewer  ──── /stream/slug ─▶│ Nginx (port 8080)              │
                            │   location /stream/<slug> →    │
                            │   proxy_pass <external URL>    │──▶ External CDN
                            └────────────────────────────────┘
                                       │
                            ┌──────────▼─────────────────────┐
                            │ Next.js (port 3000)             │
                            │  - Admin UI (channels/sources/  │
                            │    schedule)                    │
                            │  - /api/nginx-config            │
                            │  - SQLite (Koyeb volume)        │
                            └─────────────────────────────────┘
```

* **No video storage** — only the SQLite config DB is persisted. All video bytes
  flow directly from external CDNs through Nginx to the viewer.
* **Schedule-driven** — Nginx proxies each channel to the source URL of whatever
  program is currently scheduled. A background job reloads Nginx every 60s.
* **Fallback** — when nothing is scheduled, the channel plays its fallback source.
* **Public URL per channel** — `https://<your-app>.koyeb.app/stream/<slug>`
  works in VLC, OBS, FFmpeg, hls.js, video.js, etc.

## Deploy to Koyeb

### Option A — Dashboard

1. Push this repo to GitHub.
2. Koyeb → New Service → GitHub → pick this repo.
3. Set env vars:
   * `DATABASE_URL=file:/app/db/custom.db`
   * `ADMIN_PASSWORD=...`
4. Add a 1GB persistent volume at `/app/db`.
5. Expose port `8080`. Health check: `GET /healthz`.

### Option B — koyeb.yaml

```bash
koyeb app create --app tv-station --github <your-repo> --port 8080
```

The included `koyeb.yaml` configures everything (volumes, env, health check).

## Local development

```bash
bun install
bun run db:push
bun run dev
```

Open `http://localhost:3000`, go to **Channels → Seed demo** to populate
sample channels & schedules.

## Project structure

```
.
├── src/
│   ├── app/
│   │   ├── page.tsx              # Single-page admin UI (7 tabs)
│   │   └── api/
│   │       ├── channels/         # CRUD for channels
│   │       ├── sources/          # CRUD for external sources
│   │       ├── schedules/        # CRUD for program schedules
│   │       ├── now-playing/      # What's currently airing per channel
│   │       ├── upcoming/         # Next 24h schedule
│   │       ├── stream/[slug]/    # 302 redirect → current source URL
│   │       ├── nginx-config/     # GET auto-generated nginx.conf
│   │       └── seed/             # Demo data
│   └── lib/
│       ├── db.ts                 # Prisma client
│       └── scheduler.ts          # Resolve now-playing + build nginx config
├── prisma/schema.prisma          # Channel, Source, Schedule, Setting
├── deploy/
│   ├── start.sh                  # Container entrypoint
│   ├── supervisord.conf          # Runs nginx + node + reloader
│   ├── nginx.conf.tmpl           # Fallback config
├── Dockerfile                    # Multi-stage build
├── koyeb.yaml                    # Koyeb deployment config
```

## Admin features

* **Channels** — slug, name, description, logo, category, fallback source, on/off
* **Sources** — external HLS/MP4/DASH URLs, per-channel, optional duration/tags
* **Schedules** — weekly recurring (day-of-week + UTC start/end) or one-off
  broadcasts (absolute datetime). Overnight wrapping supported.
* **Player** — in-browser HLS.js player per channel, plus embed snippet
* **Nginx config** — auto-generated, downloadable, applyable from the UI
* **Deploy tab** — full Dockerfile, supervisord.conf, start.sh, koyeb.yaml, and
  step-by-step instructions

## Security notes

* The admin API is currently open. Before going public, add NextAuth or a
  basic-auth middleware in front of `/api/channels`, `/api/sources`,
  `/api/schedules`, `/api/nginx-config`, and `/api/seed`.
* The viewer endpoints (`/stream/<slug>`, `/api/now-playing`, `/api/upcoming`)
  stay public — that's by design.
