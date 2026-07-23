import { NextRequest, NextResponse } from 'next/server'
import { buildNginxConfig } from '@/lib/scheduler'

export async function GET() {
  const config = await buildNginxConfig()
  return new NextResponse(config, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

export async function POST(req: NextRequest) {
  // In production (Koyeb), this writes the config and reloads nginx.
  // The actual writing is done by the nginx-reloader background job in supervisord
  // (which calls this endpoint every 5 minutes). Calling it manually from the UI
  // is also fine — it just won't reload nginx itself, the reloader will pick it up.
  const body = await req.json().catch(() => ({}))
  const { apply } = body
  const config = await buildNginxConfig()
  if (apply) {
    try {
      const fs = await import('fs/promises')
      // Write to a temp file then atomic rename — avoids partial-write corruption
      const tmp = '/etc/nginx/nginx.conf.new'
      const final = '/etc/nginx/nginx.conf'
      await fs.writeFile(tmp, config)
      const { exec } = await import('child_process')
      const promisify = (fn: any) => (...args: any[]) => new Promise((res, rej) => fn(...args, (e: any, ...rest: any[]) => e ? rej(e) : res(rest)))
      const execP = promisify(exec)
      // Test config syntax before swapping
      await execP(`nginx -t -c ${tmp}`)
      await fs.rename(tmp, final)
      await execP('nginx -s reload')
      return NextResponse.json({ applied: true })
    } catch (e: any) {
      return NextResponse.json({ applied: false, error: e?.message || 'nginx reload failed (normal in dev — works in the Koyeb container)' }, { status: 200 })
    }
  }
  return NextResponse.json({ config })
}
