import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const channelId = req.nextUrl.searchParams.get('channelId')
  const where = channelId ? { channelId } : {}
  const sources = await db.source.findMany({
    where,
    include: { channel: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ sources })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, url, type, duration, description, thumbnail, tags, channelId } = body
  if (!name || !url || !channelId) {
    return NextResponse.json({ error: 'name, url, channelId required' }, { status: 400 })
  }
  const src = await db.source.create({
    data: { name, url, type: type || 'hls', duration: Number(duration) || 0, description, thumbnail, tags, channelId },
  })
  return NextResponse.json({ source: src }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...rest } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const src = await db.source.update({ where: { id }, data: rest })
  return NextResponse.json({ source: src })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await db.source.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
