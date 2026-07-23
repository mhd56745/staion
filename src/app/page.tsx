'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import {
  Tv, Radio, Calendar, Server, Rocket, Plus, Trash2, Pencil, Play, Pause,
  RefreshCw, Copy, Download, ExternalLink, Clock, Circle, Film, Music2, Newspaper, CheckCircle2, XCircle
} from 'lucide-react'

type Channel = {
  id: string; slug: string; name: string; description?: string | null
  logoUrl?: string | null; category?: string | null; isLive: boolean
  fallbackSourceId?: string | null
  _count?: { sources: number; schedules: number }
  fallbackSource?: { id: string; name: string } | null
}
type Source = {
  id: string; name: string; url: string; type: string; duration: number
  description?: string | null; tags?: string | null; channelId: string
  channel?: { name: string; slug: string }
}
type Schedule = {
  id: string; name: string; channelId: string; sourceId: string
  dayOfWeek: number; startSec: number; endSec: number
  startDate?: string | null; enabled: boolean
  source: { id: string; name: string; url: string; type: string }
  channel: { id: string; slug: string; name: string }
}
type NowPlaying = {
  channel: { id: string; slug: string; name: string }
  source: { id: string; name: string; url: string; type: string } | null
  program: { id: string; name: string } | null
  nextChangeAt: string | null
  isFallback: boolean
  reason: string
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Any']
const DOW_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Every day']

function fmtTime(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
function parseTime(s: string) {
  const [h, m] = s.split(':').map(Number)
  return (h || 0) * 3600 + (m || 0) * 60
}

async function api(path: string, init?: RequestInit) {
  const r = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...init })
  if (!r.ok) {
    const t = await r.text()
    throw new Error(t || r.statusText)
  }
  return r.json()
}

export default function Home() {
  const [tab, setTab] = useState('dashboard')
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState<string>('')
  const { toast } = useToast()

  const loadChannels = useCallback(async () => {
    const { channels } = await api('/api/channels')
    setChannels(channels)
    if (channels.length && !selectedChannelId) setSelectedChannelId(channels[0].id)
  }, [selectedChannelId])

  useEffect(() => { loadChannels() }, [loadChannels])

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Header />
      <main className="flex-1 container mx-auto max-w-7xl px-4 py-6">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="bg-zinc-900 border border-zinc-800 grid grid-cols-3 md:grid-cols-7 h-auto">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-red-600 data-[state=active]:text-white"><Tv className="w-4 h-4 mr-1.5" />Dashboard</TabsTrigger>
            <TabsTrigger value="channels" className="data-[state=active]:bg-red-600 data-[state=active]:text-white"><Radio className="w-4 h-4 mr-1.5" />Channels</TabsTrigger>
            <TabsTrigger value="sources" className="data-[state=active]:bg-red-600 data-[state=active]:text-white"><Film className="w-4 h-4 mr-1.5" />Sources</TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:bg-red-600 data-[state=active]:text-white"><Calendar className="w-4 h-4 mr-1.5" />Schedule</TabsTrigger>
            <TabsTrigger value="player" className="data-[state=active]:bg-red-600 data-[state=active]:text-white"><Play className="w-4 h-4 mr-1.5" />Player</TabsTrigger>
            <TabsTrigger value="nginx" className="data-[state=active]:bg-red-600 data-[state=active]:text-white"><Server className="w-4 h-4 mr-1.5" />Nginx</TabsTrigger>
            <TabsTrigger value="deploy" className="data-[state=active]:bg-red-600 data-[state=active]:text-white"><Rocket className="w-4 h-4 mr-1.5" />Deploy</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <Dashboard channels={channels} selectedChannelId={selectedChannelId} setSelectedChannelId={setSelectedChannelId} reload={loadChannels} />
          </TabsContent>
          <TabsContent value="channels" className="mt-6">
            <ChannelsTab channels={channels} reload={loadChannels} setSelectedChannelId={setSelectedChannelId} />
          </TabsContent>
          <TabsContent value="sources" className="mt-6">
            <SourcesTab channels={channels} selectedChannelId={selectedChannelId} setSelectedChannelId={setSelectedChannelId} />
          </TabsContent>
          <TabsContent value="schedule" className="mt-6">
            <ScheduleTab channels={channels} selectedChannelId={selectedChannelId} setSelectedChannelId={setSelectedChannelId} />
          </TabsContent>
          <TabsContent value="player" className="mt-6">
            <PlayerTab channels={channels} selectedChannelId={selectedChannelId} setSelectedChannelId={setSelectedChannelId} />
          </TabsContent>
          <TabsContent value="nginx" className="mt-6">
            <NginxTab />
          </TabsContent>
          <TabsContent value="deploy" className="mt-6">
            <DeployTab />
          </TabsContent>
        </Tabs>
      </main>
      <footer className="border-t border-zinc-900 mt-auto py-4 text-center text-xs text-zinc-600">
        TV Station · Nginx proxy · No storage · Deploy on Koyeb
      </footer>
      <Toaster />
    </div>
  )
}

function Header() {
  return (
    <header className="border-b border-zinc-900 bg-black">
      <div className="container mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
            <Tv className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">TV Station</h1>
            <p className="text-xs text-zinc-500">Nginx-proxied live channel · No storage · Koyeb-ready</p>
          </div>
        </div>
        <Badge variant="outline" className="border-red-600 text-red-500 hidden sm:flex">
          <Circle className="w-2 h-2 mr-1 fill-red-500 text-red-500" /> LIVE
        </Badge>
      </div>
    </header>
  )
}

/* ───────────────── Dashboard ───────────────── */
function Dashboard({ channels, selectedChannelId, setSelectedChannelId, reload }: {
  channels: Channel[]; selectedChannelId: string; setSelectedChannelId: (s: string) => void; reload: () => void
}) {
  const [np, setNp] = useState<NowPlaying | null>(null)
  const [upcoming, setUpcoming] = useState<any[]>([])
  const [now, setNow] = useState(new Date())
  const [loading, setLoading] = useState(false)

  const channel = channels.find(c => c.id === selectedChannelId)

  const refresh = useCallback(async () => {
    if (!channel) return
    setLoading(true)
    try {
      const [n, u] = await Promise.all([
        api(`/api/now-playing?slug=${channel.slug}`),
        api(`/api/upcoming?slug=${channel.slug}&hours=24`),
      ])
      setNp(n.nowPlaying)
      setUpcoming(u.upcoming)
    } catch (e: any) {
      // toast handled by caller if needed
    } finally {
      setLoading(false)
    }
  }, [channel])

  useEffect(() => {
    if (channel) refresh()
    const t = setInterval(() => setNow(new Date()), 1000)
    const r = setInterval(() => { if (channel) refresh() }, 15000)
    return () => { clearInterval(t); clearInterval(r) }
  }, [channel, refresh])

  if (!channels.length) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle>No channels yet</CardTitle><CardDescription>Seed demo data or create your first channel.</CardDescription></CardHeader>
        <CardContent className="flex gap-2 flex-wrap">
          <Button onClick={async () => { await api('/api/seed', { method: 'POST' }); await reload(); }}>
            <Plus className="w-4 h-4 mr-2" />Seed demo data
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              {channel?.name}
              {channel?.isLive ? <Badge variant="outline" className="border-red-600 text-red-500"><Circle className="w-2 h-2 mr-1 fill-red-500" />LIVE</Badge> : <Badge variant="outline">OFF</Badge>}
            </CardTitle>
            <CardDescription className="text-zinc-500">{channel?.slug} · {channel?.category || 'Uncategorized'}</CardDescription>
          </div>
          <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
            <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">{channels.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {loading && !np ? <p className="text-zinc-500">Loading...</p> : np ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-gradient-to-br from-zinc-950 to-zinc-900 border border-zinc-800 p-6">
                <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Now Playing</div>
                <div className="text-2xl font-bold">{np.program?.name || 'Off-air'}</div>
                <div className="text-sm text-zinc-400 mt-1">Source: {np.source?.name || '—'} ({np.source?.type?.toUpperCase() || '—'})</div>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant={np.isFallback ? 'secondary' : np.source ? 'default' : 'outline'}
                         className={np.source ? 'bg-red-600 text-white' : ''}>
                    {np.reason === 'schedule' ? 'SCHEDULED' : np.reason === 'fallback' ? 'FALLBACK' : 'OFF-AIR'}
                  </Badge>
                  {np.nextChangeAt && (
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />Next change in {fmtDuration(new Date(np.nextChangeAt).getTime() - now.getTime())}
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <Stat label="Sources" value={channel?._count?.sources ?? 0} />
                <Stat label="Schedules" value={channel?._count?.schedules ?? 0} />
                <Stat label="Status" value={np.source ? 'ON-AIR' : 'OFF'} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={refresh}><RefreshCw className="w-3 h-3 mr-1" />Refresh</Button>
                <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/api/stream/${channel?.slug}`)}>
                  <Copy className="w-3 h-3 mr-1" />Copy stream URL
                </Button>
                <a href={`/api/stream/${channel?.slug}`} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline"><ExternalLink className="w-3 h-3 mr-1" />Open stream</Button>
                </a>
              </div>
            </div>
          ) : <p className="text-zinc-500">No data.</p>}
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-sm">Upcoming (next 24h)</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="h-72 pr-3">
            {!upcoming.length ? <p className="text-zinc-500 text-sm">No upcoming programs.</p> : (
              <div className="space-y-2">
                {upcoming.map((u, i) => (
                  <div key={u.id + i} className="border border-zinc-800 rounded p-2 text-sm">
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-zinc-500">{new Date(u.projectedStart).toUTCString().slice(0, 22)} → {new Date(u.projectedEnd).toUTCString().slice(17, 22)}</div>
                    <div className="text-xs text-zinc-400">{u.source.name}</div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: any }) {
  return <div className="rounded bg-zinc-950 border border-zinc-800 p-3"><div className="text-xl font-bold">{value}</div><div className="text-xs text-zinc-500">{label}</div></div>
}
function fmtDuration(ms: number) {
  if (ms < 0) return 'now'
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  if (h) return `${h}h ${m}m`
  if (m) return `${m}m ${sec}s`
  return `${sec}s`
}

/* ───────────────── Channels ───────────────── */
function ChannelsTab({ channels, reload, setSelectedChannelId }: {
  channels: Channel[]; reload: () => void; setSelectedChannelId: (s: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Channel | null>(null)
  const { toast } = useToast()
  const [form, setForm] = useState({ name: '', slug: '', description: '', category: '', logoUrl: '', isLive: true })

  function reset() { setForm({ name: '', slug: '', description: '', category: '', logoUrl: '', isLive: true }); setEditing(null) }

  async function submit() {
    try {
      if (editing) {
        await api('/api/channels', { method: 'PATCH', body: JSON.stringify({ id: editing.id, ...form }) })
        toast({ title: 'Channel updated' })
      } else {
        await api('/api/channels', { method: 'POST', body: JSON.stringify(form) })
        toast({ title: 'Channel created' })
      }
      reset(); setOpen(false); reload()
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }) }
  }

  async function seed() {
    try {
      await api('/api/seed', { method: 'POST' })
      toast({ title: 'Demo data seeded' })
      reload()
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }) }
  }

  async function del(id: string) {
    if (!confirm('Delete this channel and all its sources/schedules?')) return
    await api(`/api/channels?id=${id}`, { method: 'DELETE' })
    toast({ title: 'Channel deleted' })
    reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Channels</h2>
          <p className="text-sm text-zinc-500">Each channel is one public stream URL. Add sources &amp; schedules to control programming.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={seed}><Rocket className="w-4 h-4 mr-2" />Seed demo</Button>
          <Button onClick={() => { reset(); setOpen(true) }}><Plus className="w-4 h-4 mr-2" />New channel</Button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {channels.map(c => (
          <Card key={c.id} className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {c.logoUrl ? <img src={c.logoUrl} alt="" className="w-12 h-12 rounded object-cover" /> :
                    <div className="w-12 h-12 rounded bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center"><Tv className="w-6 h-6" /></div>}
                  <div>
                    <CardTitle className="text-base">{c.name}</CardTitle>
                    <CardDescription className="text-xs">/{c.slug}</CardDescription>
                  </div>
                </div>
                {c.isLive ? <Badge variant="outline" className="border-red-600 text-red-500 text-xs"><Circle className="w-1.5 h-1.5 fill-red-500 mr-1" />LIVE</Badge> : <Badge variant="outline" className="text-xs">OFF</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-zinc-400 line-clamp-2">{c.description || 'No description'}</p>
              <div className="flex gap-2 text-xs text-zinc-500">
                <Badge variant="secondary">{c._count?.sources ?? 0} sources</Badge>
                <Badge variant="secondary">{c._count?.schedules ?? 0} schedules</Badge>
                {c.category && <Badge variant="secondary">{c.category}</Badge>}
              </div>
              <Separator className="bg-zinc-800" />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setEditing(c); setForm({ name: c.name, slug: c.slug, description: c.description || '', category: c.category || '', logoUrl: c.logoUrl || '', isLive: c.isLive }); setOpen(true) }}>
                  <Pencil className="w-3 h-3 mr-1" />Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setSelectedChannelId(c.id); navigator.clipboard.writeText(`${window.location.origin}/api/stream/${c.slug}`); toast({ title: 'Stream URL copied' }) }}>
                  <Copy className="w-3 h-3 mr-1" />URL
                </Button>
                <Button size="sm" variant="destructive" onClick={() => del(c.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader><DialogTitle>{editing ? 'Edit channel' : 'New channel'}</DialogTitle><DialogDescription>Configure your TV channel.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <Field label="Name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-zinc-800 border-zinc-700" placeholder="My TV Channel" /></Field>
            <Field label="Slug (URL)"><Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="bg-zinc-800 border-zinc-700" placeholder="my-tv-channel" /></Field>
            <Field label="Description"><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-zinc-800 border-zinc-700" rows={2} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category"><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="bg-zinc-800 border-zinc-700" placeholder="Music" /></Field>
              <Field label="Logo URL"><Input value={form.logoUrl} onChange={e => setForm({ ...form, logoUrl: e.target.value })} className="bg-zinc-800 border-zinc-700" placeholder="https://..." /></Field>
            </div>
            <div className="flex items-center gap-2"><Switch checked={form.isLive} onCheckedChange={v => setForm({ ...form, isLive: v })} id="live" /><Label htmlFor="live">Channel is live (broadcasting)</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit}>{editing ? 'Save' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs text-zinc-400">{label}</Label>{children}</div>
}

/* ───────────────── Sources ───────────────── */
function SourcesTab({ channels, selectedChannelId, setSelectedChannelId }: {
  channels: Channel[]; selectedChannelId: string; setSelectedChannelId: (s: string) => void
}) {
  const [sources, setSources] = useState<Source[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Source | null>(null)
  const { toast } = useToast()
  const [form, setForm] = useState({ name: '', url: '', type: 'hls', duration: 0, description: '', tags: '' })

  const channel = channels.find(c => c.id === selectedChannelId)

  const load = useCallback(async () => {
    if (!channel) return
    const { sources } = await api(`/api/sources?channelId=${channel.id}`)
    setSources(sources)
  }, [channel])

  useEffect(() => { load() }, [load])

  function reset() { setForm({ name: '', url: '', type: 'hls', duration: 0, description: '', tags: '' }); setEditing(null) }

  async function submit() {
    if (!channel) return
    try {
      if (editing) {
        await api('/api/sources', { method: 'PATCH', body: JSON.stringify({ id: editing.id, ...form, duration: Number(form.duration) }) })
        toast({ title: 'Source updated' })
      } else {
        await api('/api/sources', { method: 'POST', body: JSON.stringify({ ...form, channelId: channel.id, duration: Number(form.duration) }) })
        toast({ title: 'Source added' })
      }
      reset(); setOpen(false); load()
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }) }
  }

  async function del(id: string) {
    if (!confirm('Delete this source?')) return
    await api(`/api/sources?id=${id}`, { method: 'DELETE' })
    toast({ title: 'Source deleted' })
    load()
  }

  async function setFallback(sourceId: string) {
    if (!channel) return
    await api('/api/channels', { method: 'PATCH', body: JSON.stringify({ id: channel.id, fallbackSourceId: sourceId }) })
    toast({ title: 'Default fallback updated' })
  }

  if (!channels.length) return <EmptyState text="Create a channel first." />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Sources</h2>
          <p className="text-sm text-zinc-500">External URLs that Nginx will proxy. No files are stored.</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
            <SelectTrigger className="w-48 bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">{channels.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={() => { reset(); setOpen(true) }}><Plus className="w-4 h-4 mr-2" />Add source</Button>
        </div>
      </div>

      {!sources.length ? (
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="py-10 text-center text-zinc-500">No sources yet. Add an HLS playlist (.m3u8) or MP4 URL.</CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sources.map(s => (
            <Card key={s.id} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant={s.type === 'hls' ? 'default' : 'secondary'} className={s.type === 'hls' ? 'bg-red-600' : ''}>{s.type.toUpperCase()}</Badge>
                  {channel?.fallbackSourceId === s.id && <Badge variant="outline" className="text-xs border-amber-500 text-amber-500">FALLBACK</Badge>}
                </div>
                <div className="font-semibold">{s.name}</div>
                <div className="text-xs text-zinc-500 truncate">{s.url}</div>
                {s.description && <div className="text-xs text-zinc-400">{s.description}</div>}
                {s.duration > 0 && <div className="text-xs text-zinc-500">Duration: {Math.floor(s.duration / 60)}m {s.duration % 60}s</div>}
                <Separator className="bg-zinc-800" />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(s); setForm({ name: s.name, url: s.url, type: s.type, duration: s.duration, description: s.description || '', tags: s.tags || '' }); setOpen(true) }}><Pencil className="w-3 h-3 mr-1" />Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => setFallback(s.id)}>Set fallback</Button>
                  <Button size="sm" variant="destructive" onClick={() => del(s.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader><DialogTitle>{editing ? 'Edit source' : 'Add source'}</DialogTitle><DialogDescription>External URL Nginx will proxy. Supports HLS (.m3u8), MP4, DASH.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <Field label="Name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-zinc-800 border-zinc-700" placeholder="My Stream" /></Field>
            <Field label="URL"><Input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} className="bg-zinc-800 border-zinc-700" placeholder="https://example.com/stream.m3u8" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="hls">HLS (.m3u8)</SelectItem>
                    <SelectItem value="mp4">MP4</SelectItem>
                    <SelectItem value="dash">DASH (.mpd)</SelectItem>
                    <SelectItem value="proxy">Generic proxy</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Duration (sec, 0 = live)"><Input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: Number(e.target.value) })} className="bg-zinc-800 border-zinc-700" /></Field>
            </div>
            <Field label="Description"><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-zinc-800 border-zinc-700" rows={2} /></Field>
            <Field label="Tags (comma-separated)"><Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="bg-zinc-800 border-zinc-700" placeholder="music,news" /></Field>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit}>{editing ? 'Save' : 'Add'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ───────────────── Schedule ───────────────── */
function ScheduleTab({ channels, selectedChannelId, setSelectedChannelId }: {
  channels: Channel[]; selectedChannelId: string; setSelectedChannelId: (s: string) => void
}) {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Schedule | null>(null)
  const { toast } = useToast()
  const [form, setForm] = useState({ name: '', sourceId: '', dayOfWeek: -1, startSec: 0, endSec: 0, startDate: '', enabled: true })

  const channel = channels.find(c => c.id === selectedChannelId)

  const load = useCallback(async () => {
    if (!channel) return
    const [s, src] = await Promise.all([
      api(`/api/schedules?channelId=${channel.id}`),
      api(`/api/sources?channelId=${channel.id}`),
    ])
    setSchedules(s.schedules)
    setSources(src.sources)
  }, [channel])

  useEffect(() => { load() }, [load])

  function reset() { setForm({ name: '', sourceId: '', dayOfWeek: -1, startSec: 0, endSec: 0, startDate: '', enabled: true }); setEditing(null) }

  async function submit() {
    if (!channel || !form.sourceId) { toast({ title: 'Pick a source', variant: 'destructive' }); return }
    try {
      const payload = {
        ...form,
        dayOfWeek: form.startDate ? -1 : Number(form.dayOfWeek),
        startSec: Number(form.startSec),
        endSec: Number(form.endSec),
        startDate: form.startDate || null,
        channelId: channel.id,
      }
      if (editing) {
        await api('/api/schedules', { method: 'PATCH', body: JSON.stringify({ id: editing.id, ...payload }) })
        toast({ title: 'Schedule updated' })
      } else {
        await api('/api/schedules', { method: 'POST', body: JSON.stringify(payload) })
        toast({ title: 'Schedule added' })
      }
      reset(); setOpen(false); load()
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }) }
  }

  async function del(id: string) {
    if (!confirm('Delete this schedule entry?')) return
    await api(`/api/schedules?id=${id}`, { method: 'DELETE' })
    load()
  }

  async function toggle(s: Schedule) {
    await api('/api/schedules', { method: 'PATCH', body: JSON.stringify({ id: s.id, enabled: !s.enabled }) })
    load()
  }

  if (!channels.length) return <EmptyState text="Create a channel first." />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Schedule</h2>
          <p className="text-sm text-zinc-500">Program guide. Weekly recurrences and one-off broadcasts.</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
            <SelectTrigger className="w-48 bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">{channels.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={() => { reset(); setOpen(true) }} disabled={!sources.length}>
            <Plus className="w-4 h-4 mr-2" />Add program
          </Button>
        </div>
      </div>

      {!sources.length ? (
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="py-8 text-center text-zinc-500">Add sources for this channel first.</CardContent></Card>
      ) : !schedules.length ? (
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="py-10 text-center text-zinc-500">No programs scheduled. Without a schedule, the channel plays its fallback source 24/7.</CardContent></Card>
      ) : (
        <Card className="bg-zinc-900 border-zinc-800">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-zinc-900">
                <TableHead className="text-zinc-400">Program</TableHead>
                <TableHead className="text-zinc-400">Source</TableHead>
                <TableHead className="text-zinc-400">Day</TableHead>
                <TableHead className="text-zinc-400">Start</TableHead>
                <TableHead className="text-zinc-400">End</TableHead>
                <TableHead className="text-zinc-400">Type</TableHead>
                <TableHead className="text-zinc-400">Enabled</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map(s => (
                <TableRow key={s.id} className="border-zinc-800 hover:bg-zinc-800/40">
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-sm text-zinc-400">{s.source.name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{s.startDate ? 'One-off' : DOW_FULL[s.dayOfWeek + 1]}</Badge></TableCell>
                  <TableCell className="font-mono text-sm">{s.startDate ? new Date(s.startDate).toUTCString().slice(5, 22) : fmtTime(s.startSec)}</TableCell>
                  <TableCell className="font-mono text-sm">{s.startDate ? new Date(new Date(s.startDate).getTime() + (s.endSec - s.startSec) * 1000).toUTCString().slice(17, 22) : fmtTime(s.endSec)}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{s.source.type.toUpperCase()}</Badge></TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => toggle(s)}>
                      {s.enabled ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-zinc-600" />}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => {
                        setEditing(s)
                        setForm({
                          name: s.name, sourceId: s.sourceId, dayOfWeek: s.dayOfWeek,
                          startSec: s.startSec, endSec: s.endSec,
                          startDate: s.startDate ? new Date(s.startDate).toISOString().slice(0, 16) : '',
                          enabled: s.enabled,
                        })
                        setOpen(true)
                      }}><Pencil className="w-3 h-3" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => del(s.id)}><Trash2 className="w-3 h-3 text-red-500" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Edit program' : 'Add program'}</DialogTitle><DialogDescription>Schedule a program. Weekly recurring, or one-off broadcast.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <Field label="Program name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-zinc-800 border-zinc-700" placeholder="Evening News" /></Field>
            <Field label="Source">
              <Select value={form.sourceId} onValueChange={v => setForm({ ...form, sourceId: v })}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue placeholder="Pick a source" /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">{sources.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.type.toUpperCase()})</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="One-off broadcast (leave empty for weekly)">
              <Input type="datetime-local" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="bg-zinc-800 border-zinc-700" />
            </Field>
            {!form.startDate && (
              <Field label="Day of week">
                <Select value={String(form.dayOfWeek)} onValueChange={v => setForm({ ...form, dayOfWeek: Number(v) })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {DAYS.map((d, i) => <SelectItem key={i} value={String(i - 1)}>{DOW_FULL[i]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start time (UTC)"><Input type="time" value={fmtTime(form.startSec)} onChange={e => setForm({ ...form, startSec: parseTime(e.target.value) })} className="bg-zinc-800 border-zinc-700" /></Field>
              <Field label="End time (UTC)"><Input type="time" value={fmtTime(form.endSec)} onChange={e => setForm({ ...form, endSec: parseTime(e.target.value) })} className="bg-zinc-800 border-zinc-700" /></Field>
            </div>
            <p className="text-xs text-zinc-500">If end &lt; start, the program runs overnight (e.g. 23:00 → 01:00).</p>
            <div className="flex items-center gap-2"><Switch checked={form.enabled} onCheckedChange={v => setForm({ ...form, enabled: v })} id="en" /><Label htmlFor="en">Enabled</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit}>{editing ? 'Save' : 'Add'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ───────────────── Player ───────────────── */
function PlayerTab({ channels, selectedChannelId, setSelectedChannelId }: {
  channels: Channel[]; selectedChannelId: string; setSelectedChannelId: (s: string) => void
}) {
  const [np, setNp] = useState<NowPlaying | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const channel = channels.find(c => c.id === selectedChannelId)

  const refresh = useCallback(async () => {
    if (!channel) return
    const { nowPlaying } = await api(`/api/now-playing?slug=${channel.slug}`)
    setNp(nowPlaying)
  }, [channel])

  useEffect(() => {
    refresh()
    const r = setInterval(refresh, 10000)
    return () => clearInterval(r)
  }, [refresh])

  // Use hls.js for HLS streams (loaded via script tag to avoid SSR issues)
  useEffect(() => {
    if (!np?.source || !videoRef.current || !channel) return
    const v = videoRef.current
    const url = `/api/stream/${channel.slug}` // use our redirect endpoint, browser follows 302

    let destroyed = false
    let hls: any = null

    function loadWithHls(Hls: any) {
      if (destroyed) return
      if (Hls.isSupported()) {
        hls = new Hls({ enableWorker: true, lowLatencyMode: true })
        hls.loadSource(url)
        hls.attachMedia(v)
      } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
        v.src = url
      }
    }

    if (np.source!.type === 'hls') {
      // Use the global Hls if already loaded, else inject script tag
      const w = window as any
      if (w.Hls) {
        loadWithHls(w.Hls)
      } else {
        const s = document.createElement('script')
        s.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.6.16/dist/hls.min.js'
        s.onload = () => loadWithHls(w.Hls)
        document.head.appendChild(s)
      }
    } else {
      v.src = url
    }

    return () => {
      destroyed = true
      if (hls) { try { hls.destroy() } catch {} }
    }
  }, [np?.source?.id, channel?.slug])

  if (!channels.length) return <EmptyState text="Create a channel first." />

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{channel?.name}</CardTitle>
            <CardDescription className="text-zinc-500">/{channel?.slug}</CardDescription>
          </div>
          <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
            <SelectTrigger className="w-48 bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">{channels.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-black rounded-lg overflow-hidden border border-zinc-800 relative">
            <video ref={videoRef} controls autoPlay muted playsInline className="w-full h-full" />
            {np && !np.source && (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
                <div className="text-center">
                  <Tv className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Off-air</p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={np?.source ? 'default' : 'outline'} className={np?.source ? 'bg-red-600' : ''}>
                <Circle className={`w-2 h-2 mr-1 ${np?.source ? 'fill-white' : ''}`} />
                {np?.source ? 'ON AIR' : 'OFF-AIR'}
              </Badge>
              {np?.program && <span className="text-sm font-medium">{np.program.name}</span>}
            </div>
            <div className="text-xs text-zinc-500 font-mono bg-zinc-950 p-2 rounded border border-zinc-800">
              {window.location.origin}/api/stream/{channel?.slug}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/api/stream/${channel?.slug}`)}>
                <Copy className="w-3 h-3 mr-1" />Copy URL
              </Button>
              <Button size="sm" variant="outline" onClick={refresh}><RefreshCw className="w-3 h-3 mr-1" />Refresh</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-sm">Embed this channel</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-zinc-400">Use this URL in any HLS-compatible player (VLC, OBS, video.js, etc.):</p>
          <pre className="text-xs bg-zinc-950 p-2 rounded border border-zinc-800 overflow-x-auto">
{`<video controls src="${typeof window !== 'undefined' ? window.location.origin : 'https://your-app.koyeb.app'}/api/stream/${channel?.slug}"></video>`}
          </pre>
          <p className="text-zinc-400">For HLS in browsers, use hls.js or video.js.</p>
          <Separator className="bg-zinc-800" />
          <p className="text-zinc-400">External players:</p>
          <ul className="text-xs text-zinc-500 list-disc list-inside space-y-1">
            <li>VLC → Media → Open Network Stream</li>
            <li>OBS → Media Source → uncheck Local File → paste URL</li>
            <li>FFmpeg: <code className="text-zinc-400">ffmpeg -i "URL" -c copy out.mp4</code></li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

/* ───────────────── Nginx Config ───────────────── */
function NginxTab() {
  const [config, setConfig] = useState('')
  const [loading, setLoading] = useState(false)
  const [applyResult, setApplyResult] = useState<string>('')
  const { toast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/nginx-config')
      setConfig(await r.text())
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function apply() {
    try {
      const r = await api('/api/nginx-config', { method: 'POST', body: JSON.stringify({ apply: true }) })
      if (r.applied) {
        setApplyResult('Nginx reloaded successfully.')
        toast({ title: 'Nginx reloaded' })
      } else {
        setApplyResult(`Not applied (dev environment): ${r.error}`)
        toast({ title: 'Not applied in dev', description: r.error })
      }
    } catch (e: any) {
      setApplyResult(`Error: ${e.message}`)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Nginx Proxy Config</h2>
          <p className="text-sm text-zinc-500">Auto-generated from your channels &amp; schedule. In production, this is the file written to /etc/nginx/nginx.conf on Koyeb.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}><RefreshCw className="w-4 h-4 mr-2" />Regenerate</Button>
          <Button variant="outline" onClick={() => {
            const blob = new Blob([config], { type: 'text/plain' })
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = 'nginx.conf'
            a.click()
          }}><Download className="w-4 h-4 mr-2" />Download</Button>
          <Button onClick={apply}><Server className="w-4 h-4 mr-2" />Apply &amp; reload</Button>
        </div>
      </div>
      {applyResult && <Card className="bg-zinc-900 border-zinc-800"><CardContent className="py-3 text-sm">{applyResult}</CardContent></Card>}
      <Card className="bg-zinc-950 border-zinc-800">
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <pre className="text-xs font-mono p-4 text-zinc-300 whitespace-pre-wrap">{loading ? 'Loading...' : config}</pre>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

/* ───────────────── Deploy ───────────────── */
function DeployTab() {
  const [copied, setCopied] = useState('')
  const dockerfile = `# Multi-stage: build Next.js standalone, then run with Nginx + supervisord
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++ openssl
COPY package.json bun.lock* ./
RUN npm install
COPY . .
RUN npx prisma generate && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN apk add --no-cache nginx supervisor openssl
# Install hls.js support? No — hls.js runs in browser only.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY deploy/supervisord.conf /etc/supervisord.conf
COPY deploy/nginx.conf.tmpl /etc/nginx/nginx.conf.tmpl
# At startup: generate prisma client, push schema, write nginx config from app, start supervisord
COPY deploy/start.sh /start.sh
RUN chmod +x /start.sh
EXPOSE 8080
CMD ["/start.sh"]`

  const startSh = `#!/bin/sh
set -e
cd /app
mkdir -p /app/db
# Push schema (creates SQLite file if missing)
npx prisma db push --accept-data-loss
# Fetch nginx.conf from the running app (or generate static one)
# We give nginx a basic config that proxies / to Next.js and /stream/* to current sources
curl -s http://127.0.0.1:3000/api/nginx-config > /etc/nginx/nginx.conf || cp /etc/nginx/nginx.conf.tmpl /etc/nginx/nginx.conf
# Start supervisord (runs both nginx and node)
exec supervisord -c /etc/supervisord.conf`

  const supervisordConf = `[supervisord]
nodaemon=true
logfile=/tmp/supervisord.log

[program:nginx]
command=nginx -g "daemon off;"
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:node]
command=node /app/server.js
environment=NODE_ENV="production",PORT="3000"
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

# Reload nginx every 60s to pick up schedule changes
[program:nginx-reloader]
command=sh -c "while true; do sleep 60; curl -s -X POST -H 'Content-Type: application/json' -d '{\\"apply\\":true}' http://127.0.0.1:3000/api/nginx-config; done"
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0`

  const koyebYaml = `# koyeb.yaml — deploy via: koyeb app create --app tv-station
services:
  - name: tv-station
    docker:
      image: ghcr.io/your-user/tv-station:latest
      # Or build from this repo:
      # build_command: docker build -t tv-station .
      # dockerfile_path: Dockerfile
    ports:
      - port: 8080
        protocol: http
    routes:
      - path: /
        port: 8080
    health:
      http:
        path: /healthz
        port: 8080
    env:
      - key: DATABASE_URL
        value: file:/app/db/custom.db
      - key: ADMIN_PASSWORD
        value: change-me
    regions:
      - fra
    instance_type: free
    autoscaling:
      min: 1
      max: 1`

  const steps = [
    { n: 1, title: 'Push this repo to GitHub', desc: 'Commit all files including Dockerfile, deploy/ folder, koyeb.yaml.' },
    { n: 2, title: 'Create a Koyeb service', desc: 'In Koyeb dashboard → New Service → GitHub → pick this repo. Koyeb will use the Dockerfile automatically.' },
    { n: 3, title: 'Set environment variables', desc: 'Set DATABASE_URL=file:/app/db/custom.db and ADMIN_PASSWORD=<your password>. Koyeb provides a free persistent volume — mount it at /app/db.' },
    { n: 4, title: 'Expose port 8080', desc: 'Koyeb will give you a https://<service>-<org>.koyeb.app URL. The /healthz endpoint is the health check.' },
    { n: 5, title: 'Open the admin panel', desc: 'Visit your Koyeb URL, go to the Channels tab, click "Seed demo" to populate sample channels and schedules.' },
    { n: 6, title: 'Add your sources & schedules', desc: 'Add HLS (.m3u8) or MP4 URLs from any external CDN. Schedule programs by day/time. The channel auto-proxies the right source every minute.' },
    { n: 7, title: 'Share the stream URL', desc: 'Each channel has a public URL: https://<your-app>.koyeb.app/stream/<slug>. Embed it, share it, open in VLC.' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Deploy on Koyeb</h2>
        <p className="text-sm text-zinc-500">Run the whole stack (Nginx + Next.js) in a single Docker container on Koyeb's free tier.</p>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-base">Step-by-step</CardTitle></CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {steps.map(s => (
              <li key={s.n} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center font-bold shrink-0">{s.n}</div>
                <div>
                  <div className="font-medium">{s.title}</div>
                  <div className="text-sm text-zinc-400">{s.desc}</div>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Dockerfile</CardTitle>
          <CopyBtn text={dockerfile} label="Dockerfile" onCopy={setCopied} />
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-80"><pre className="text-xs font-mono p-4 text-zinc-300">{dockerfile}</pre></ScrollArea>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">deploy/start.sh</CardTitle>
          <CopyBtn text={startSh} label="start.sh" onCopy={setCopied} />
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-60"><pre className="text-xs font-mono p-4 text-zinc-300">{startSh}</pre></ScrollArea>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">deploy/supervisord.conf</CardTitle>
          <CopyBtn text={supervisordConf} label="supervisord.conf" onCopy={setCopied} />
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-80"><pre className="text-xs font-mono p-4 text-zinc-300">{supervisordConf}</pre></ScrollArea>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">koyeb.yaml</CardTitle>
          <CopyBtn text={koyebYaml} label="koyeb.yaml" onCopy={setCopied} />
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-80"><pre className="text-xs font-mono p-4 text-zinc-300">{koyebYaml}</pre></ScrollArea>
        </CardContent>
      </Card>

      {copied && <p className="text-xs text-green-500">Copied {copied} to clipboard.</p>}

      <Card className="bg-zinc-900 border-amber-900/40 border">
        <CardHeader><CardTitle className="text-base text-amber-500">Important notes</CardTitle></CardHeader>
        <CardContent className="text-sm text-zinc-400 space-y-2">
          <p>• <strong className="text-zinc-200">No storage:</strong> Only the SQLite config DB is persisted (via Koyeb volume at /app/db). All video content is proxied from external URLs.</p>
          <p>• <strong className="text-zinc-200">Nginx reload:</strong> A background job regenerates nginx.conf every 60s from your current schedule and reloads Nginx. So schedule changes take effect within 1 minute.</p>
          <p>• <strong className="text-zinc-200">CORS:</strong> Nginx adds <code className="text-zinc-300">Access-Control-Allow-Origin: *</code> so any web player can embed your streams.</p>
          <p>• <strong className="text-zinc-200">Free tier limits:</strong> Koyeb's free instance has 512MB RAM. This stack fits comfortably. For heavy traffic, upgrade to a larger instance.</p>
          <p>• <strong className="text-zinc-200">Security:</strong> Add NextAuth or a basic-auth middleware in front of the admin API before going public. The viewer endpoints (/stream/*) stay open.</p>
        </CardContent>
      </Card>
    </div>
  )
}

function CopyBtn({ text, label, onCopy }: { text: string; label: string; onCopy: (s: string) => void }) {
  return <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(text); onCopy(label) }}><Copy className="w-3 h-3 mr-1" />Copy</Button>
}

function EmptyState({ text }: { text: string }) {
  return <Card className="bg-zinc-900 border-zinc-800"><CardContent className="py-10 text-center text-zinc-500">{text}</CardContent></Card>
}
