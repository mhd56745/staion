import { NextRequest, NextResponse } from 'next/server'
import { buildNginxConfig } from '@/lib/scheduler'

export async function GET() {
  const config = await buildNginxConfig()
  return new NextResponse(config, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

export async function POST(req: NextRequest) {
  // In production, this rewrites /etc/nginx/nginx.conf and reloads nginx.
  // In dev, we just return the config for the user to preview.
  const body = await req.json().catch(() => ({}))
  const { apply } = body
  const config = await buildNginxConfig()
  if (apply) {
    try {
      const fs = await import('fs/promises')
      await fs.writeFile('/etc/nginx/nginx.conf', config)
      const { exec } = await import('child_process')
      await new Promise<void>((resolve, reject) => {
        exec('nginx -s reload', (err) => err ? reject(err) : resolve())
      })
      return NextResponse.json({ applied: true })
    } catch (e: any) {
      return NextResponse.json({ applied: false, error: e?.message || 'nginx not available in dev' }, { status: 200 })
    }
  }
  return NextResponse.json({ config })
}
