import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const channelId = req.nextUrl.searchParams.get('channelId')
  const where = channelId ? { channelId } : {}
  const schedules = await db.schedule.findMany({
    where,
    include: { source: true, channel: true },
    orderBy: [{ dayOfWeek: 'asc' }, { startSec: 'asc' }],
  })
  return NextResponse.json({ schedules })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, channelId, sourceId, dayOfWeek, startSec, endSec, startDate, enabled } = body
  if (!name || !channelId || !sourceId) {
    return NextResponse.json({ error: 'name, channelId, sourceId required' }, { status: 400 })
  }
  const s = await db.schedule.create({
    data: {
      name,
      channelId,
      sourceId,
      dayOfWeek: Number(dayOfWeek ?? -1),
      startSec: Number(startSec ?? 0),
      endSec: Number(endSec ?? 0),
      startDate: startDate ? new Date(startDate) : null,
      enabled: enabled !== false,
    },
  })
  return NextResponse.json({ schedule: s }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...rest } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  if (rest.startDate) rest.startDate = new Date(rest.startDate)
  if (rest.dayOfWeek !== undefined) rest.dayOfWeek = Number(rest.dayOfWeek)
  if (rest.startSec !== undefined) rest.startSec = Number(rest.startSec)
  if (rest.endSec !== undefined) rest.endSec = Number(rest.endSec)
  const s = await db.schedule.update({ where: { id }, data: rest })
  return NextResponse.json({ schedule: s })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await db.schedule.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
