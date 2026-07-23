import { db } from '@/lib/db'

export interface NowPlaying {
  channel: { id: string; slug: string; name: string }
  source: { id: string; name: string; url: string; type: string } | null
  program: { id: string; name: string } | null
  nextChangeAt: Date | null // when the current program ends (or null if live/fallback)
  isFallback: boolean
  reason: string // "schedule" | "fallback" | "offair"
}

function dayOfWeekUTC(d: Date): number {
  return d.getUTCDay()
}
function secondsSinceMidnightUTC(d: Date): number {
  return d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds()
}

/**
 * Find the active program for a channel at the given time.
 * Strategy:
 *   1. Look for one-off schedules (startDate set) whose [start, end] window contains now
 *   2. Otherwise look for weekly schedules: matching dayOfWeek (-1 = any) and time window
 *   3. Schedules whose endSec <= startSec wrap to next day
 */
export async function resolveNowPlaying(channelId: string, now = new Date()): Promise<NowPlaying> {
  const channel = await db.channel.findUnique({
    where: { id: channelId },
    include: { fallbackSource: true },
  })
  if (!channel) throw new Error('Channel not found')

  const dow = dayOfWeekUTC(now)
  const sec = secondsSinceMidnightUTC(now)

  // 1. one-off schedules
  const oneOffs = await db.schedule.findMany({
    where: { channelId, enabled: true, startDate: { not: null } },
    include: { source: true },
  })
  for (const s of oneOffs) {
    if (!s.startDate) continue
    const start = new Date(s.startDate)
    const end = new Date(start.getTime() + (s.endSec - s.startSec) * 1000)
    if (now >= start && now < end) {
      return {
        channel: { id: channel.id, slug: channel.slug, name: channel.name },
        source: { id: s.source.id, name: s.source.name, url: s.source.url, type: s.source.type },
        program: { id: s.id, name: s.name },
        nextChangeAt: end,
        isFallback: false,
        reason: 'schedule',
      }
    }
  }

  // 2. weekly schedules
  const weeklies = await db.schedule.findMany({
    where: { channelId, enabled: true, startDate: null },
    include: { source: true },
  })
  for (const s of weeklies) {
    const matchesDay = s.dayOfWeek === -1 || s.dayOfWeek === dow
    if (!matchesDay) continue
    if (s.endSec > s.startSec) {
      // same-day window
      if (sec >= s.startSec && sec < s.endSec) {
        const end = new Date(now)
        end.setUTCHours(Math.floor(s.endSec / 3600), Math.floor((s.endSec % 3600) / 60), s.endSec % 60)
        return buildFromSchedule(channel, s, end)
      }
    } else {
      // wraps to next day (e.g. 23:00 -> 01:00)
      if (sec >= s.startSec || sec < s.endSec) {
        let end = new Date(now)
        if (sec >= s.startSec) {
          // ends tomorrow
          end = new Date(end.getTime() + 24 * 3600 * 1000)
        }
        end.setUTCHours(Math.floor(s.endSec / 3600), Math.floor((s.endSec % 3600) / 60), s.endSec % 60)
        return buildFromSchedule(channel, s, end)
      }
    }
  }

  // 3. fallback
  if (channel.fallbackSource) {
    return {
      channel: { id: channel.id, slug: channel.slug, name: channel.name },
      source: { id: channel.fallbackSource.id, name: channel.fallbackSource.name, url: channel.fallbackSource.url, type: channel.fallbackSource.type },
      program: { id: 'fallback', name: channel.fallbackSource.name },
      nextChangeAt: null,
      isFallback: true,
      reason: 'fallback',
    }
  }

  return {
    channel: { id: channel.id, slug: channel.slug, name: channel.name },
    source: null,
    program: null,
    nextChangeAt: null,
    isFallback: false,
    reason: 'offair',
  }
}

function buildFromSchedule(channel: any, s: any, end: Date): NowPlaying {
  return {
    channel: { id: channel.id, slug: channel.slug, name: channel.name },
    source: { id: s.source.id, name: s.source.name, url: s.source.url, type: s.source.type },
    program: { id: s.id, name: s.name },
    nextChangeAt: end,
    isFallback: false,
    reason: 'schedule',
  }
}

/**
 * Returns upcoming programs for a channel in the next N hours.
 */
export async function getUpcoming(channelId: string, hoursAhead = 24, now = new Date()): Promise<any[]> {
  const out: any[] = []
  const weeklies = await db.schedule.findMany({
    where: { channelId, enabled: true, startDate: null },
    include: { source: true },
    orderBy: { startSec: 'asc' },
  })
  const oneOffs = await db.schedule.findMany({
    where: { channelId, enabled: true, startDate: { gte: now } },
    include: { source: true },
    orderBy: { startDate: 'asc' },
  })

  // Project weeklies for next N days
  for (let dayOffset = 0; dayOffset < Math.ceil(hoursAhead / 24) + 1; dayOffset++) {
    const day = new Date(now.getTime() + dayOffset * 24 * 3600 * 1000)
    const dow = dayOfWeekUTC(day)
    for (const s of weeklies) {
      if (s.dayOfWeek !== -1 && s.dayOfWeek !== dow) continue
      const start = new Date(day)
      start.setUTCHours(Math.floor(s.startSec / 3600), Math.floor((s.startSec % 3600) / 60), s.startSec % 60, 0)
      const endSec = s.endSec > s.startSec ? s.endSec : s.endSec + 24 * 3600
      const end = new Date(start.getTime() + (endSec - s.startSec) * 1000)
      if (end > now && start < new Date(now.getTime() + hoursAhead * 3600 * 1000)) {
        out.push({ ...s, projectedStart: start, projectedEnd: end, kind: 'weekly' })
      }
    }
  }
  for (const s of oneOffs) {
    if (!s.startDate) continue
    const start = new Date(s.startDate)
    const endSec = s.endSec > s.startSec ? s.endSec : s.endSec + 24 * 3600
    const end = new Date(start.getTime() + (endSec - s.startSec) * 1000)
    if (start < new Date(now.getTime() + hoursAhead * 3600 * 1000)) {
      out.push({ ...s, projectedStart: start, projectedEnd: end, kind: 'one-off' })
    }
  }
  return out.sort((a, b) => a.projectedStart.getTime() - b.projectedStart.getTime()).slice(0, 20)
}

/**
 * Build the Nginx config that proxies each channel to its current source URL.
 * In production, this is reloaded via `nginx -s reload` after each schedule change.
 */
export async function buildNginxConfig(): Promise<string> {
  const channels = await db.channel.findMany({
    include: { fallbackSource: true, sources: true },
  })

  const lines: string[] = []
  lines.push('# Auto-generated by TV Station app — do not edit manually')
  lines.push('# Each /stream/<slug> location proxies the current source URL.')
  lines.push('worker_processes 1;')
  lines.push('events { worker_connections 256; }')
  lines.push('http {')
  lines.push('  include       mime.types;')
  lines.push('  default_type  application/octet-stream;')
  lines.push('  sendfile      on;')
  lines.push('  keepalive_timeout 30;')
  lines.push('  access_log /dev/stdout;')
  lines.push('  error_log /dev/stderr;')
  lines.push('  # HLS proxy tuning')
  lines.push('  proxy_buffering on;')
  lines.push('  proxy_buffer_size 16k;')
  lines.push('  proxy_buffers 16 64k;')
  lines.push('  proxy_read_timeout 90s;')
  lines.push('  # CORS for browser players')
  lines.push('  add_header Access-Control-Allow-Origin "*" always;')
  lines.push('')
  lines.push('  server {')
  lines.push('    listen 8080;')
  lines.push('    server_name _;')
  lines.push('    root /usr/share/nginx/html;')
  lines.push('')
  lines.push('    # Health check for Koyeb')
  lines.push('    location = /healthz { return 200 "ok\\n"; add_header Content-Type text/plain; }')
  lines.push('')
  lines.push('    # Admin panel + API (proxied to Next.js)')
  lines.push('    location / {')
  lines.push('      proxy_pass http://127.0.0.1:3000;')
  lines.push('      proxy_http_version 1.1;')
  lines.push('      proxy_set_header Host $host;')
  lines.push('      proxy_set_header X-Real-IP $remote_addr;')
  lines.push('      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;')
  lines.push('      proxy_set_header X-Forwarded-Proto $scheme;')
  lines.push('      proxy_set_header Upgrade $http_upgrade;')
  lines.push('      proxy_set_header Connection "upgrade";')
  lines.push('    }')
  lines.push('')
  lines.push('    # Per-channel live stream (resolved server-side and proxied)')
  for (const ch of channels) {
    const now = await resolveNowPlaying(ch.id)
    const url = now.source?.url
    if (!url) {
      lines.push(`    # channel ${ch.slug}: off-air`)
      lines.push(`    location /stream/${ch.slug} { return 503 "off-air\\n"; add_header Content-Type text/plain; }`)
      continue
    }
    const parsed = new URL(url)
    const host = parsed.host
    const path = parsed.pathname + parsed.search
    lines.push(`    # channel ${ch.slug} -> ${now.source?.name} (${now.reason})`)
    lines.push(`    location /stream/${ch.slug} {`)
    lines.push(`      proxy_pass ${parsed.protocol}//${host}${path};`)
    lines.push('      proxy_http_version 1.1;')
    lines.push('      proxy_set_header Host ' + host + ';')
    lines.push('      proxy_set_header User-Agent "TVStation/1.0";')
    lines.push('      proxy_set_header X-Real-IP $remote_addr;')
    lines.push('      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;')
    lines.push('      # Pass through range requests for MP4 seeking')
    lines.push('      proxy_set_header Range $http_range;')
    lines.push('      # Disable buffering for live streams')
    lines.push('      proxy_buffering off;')
    lines.push('      proxy_cache off;')
    lines.push('    }')
    lines.push('')
  }
  lines.push('  }')
  lines.push('}')

  return lines.join('\n')
}
