import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveNowPlaying } from '@/lib/scheduler'

// Edge-runtime friendly: returns 302 to the current source URL.
// In production, Nginx takes over this path and proxies server-side.
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const channel = await db.channel.findUnique({ where: { slug } })
  if (!channel) return NextResponse.json({ error: 'channel not found' }, { status: 404 })
  if (!channel.isLive) return new NextResponse('off-air', { status: 503, headers: { 'Content-Type': 'text/plain' } })

  const np = await resolveNowPlaying(channel.id)
  if (!np.source) {
    return new NextResponse('off-air — no source scheduled', {
      status: 503,
      headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' },
    })
  }
  return NextResponse.redirect(np.source.url, {
    status: 302,
    headers: {
      'Cache-Control': 'no-store',
      'X-Program': np.program?.name ?? '',
      'X-Source': np.source.name,
      'Access-Control-Allow-Origin': '*',
    },
  })
}
