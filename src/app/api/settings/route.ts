import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const rows = await db.setting.findMany()
  const obj: Record<string, string> = {}
  for (const r of rows) obj[r.key] = r.value
  return NextResponse.json({ settings: obj })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  for (const [k, v] of Object.entries(body)) {
    await db.setting.upsert({ where: { key: k }, update: { value: String(v) }, create: { key: k, value: String(v) } })
  }
  return NextResponse.json({ ok: true })
}
