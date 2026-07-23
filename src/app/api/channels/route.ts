import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const channels = await db.channel.findMany({
    include: { _count: { select: { sources: true, schedules: true } }, fallbackSource: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ channels })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, slug, description, logoUrl, category, fallbackSourceId } = body
  if (!name || !slug) return NextResponse.json({ error: 'name and slug are required' }, { status: 400 })
  const ch = await db.channel.create({
    data: {
      name,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      description, logoUrl, category,
      fallbackSourceId: fallbackSourceId || null,
    },
  })
  return NextResponse.json({ channel: ch }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...rest } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  if (rest.slug) rest.slug = String(rest.slug).toLowerCase().replace(/[^a-z0-9-]/g, '-')
  if (rest.fallbackSourceId === '') rest.fallbackSourceId = null
  const ch = await db.channel.update({ where: { id }, data: rest })
  return NextResponse.json({ channel: ch })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await db.channel.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
