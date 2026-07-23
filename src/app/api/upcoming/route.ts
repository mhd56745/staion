import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUpcoming } from '@/lib/scheduler'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  const id = req.nextUrl.searchParams.get('id')
  const hours = Number(req.nextUrl.searchParams.get('hours') ?? 24)
  if (!slug && !id) return NextResponse.json({ error: 'slug or id required' }, { status: 400 })

  const channel = slug
    ? await db.channel.findUnique({ where: { slug } })
    : await db.channel.findUnique({ where: { id: id! } })
  if (!channel) return NextResponse.json({ error: 'channel not found' }, { status: 404 })

  const upcoming = await getUpcoming(channel.id, hours)
  return NextResponse.json({ upcoming })
}
