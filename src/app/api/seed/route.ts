import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  // Wipe & reseed demo data
  await db.schedule.deleteMany()
  await db.source.deleteMany()
  await db.channel.deleteMany()

  // Demo channel: "Lo-Fi Live"
  const ch1 = await db.channel.create({
    data: {
      slug: 'lofi-live',
      name: 'Lo-Fi Live',
      description: '24/7 lo-fi beats to relax/study to',
      category: 'Music',
      logoUrl: 'https://placehold.co/200x200/1a1a2e/eaeaea?text=LoFi',
    },
  })
  const src1 = await db.source.create({
    data: {
      channelId: ch1.id,
      name: 'Lofi Girl 24/7',
      url: 'https://live.lofi.gg/lofi.m3u8',
      type: 'hls',
      duration: 0,
      description: 'Always-on lo-fi stream (HLS)',
      tags: 'lofi,music,chill',
    },
  })
  await db.channel.update({ where: { id: ch1.id }, data: { fallbackSourceId: src1.id } })

  // Demo channel: "News 24"
  const ch2 = await db.channel.create({
    data: {
      slug: 'news-24',
      name: 'News 24',
      description: 'Round-the-clock world news from public sources',
      category: 'News',
      logoUrl: 'https://placehold.co/200x200/2d1a1a/eaeaea?text=News24',
    },
  })
  const n1 = await db.source.create({
    data: {
      channelId: ch2.id,
      name: 'NASA TV Public',
      url: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8',
      type: 'hls',
      description: 'NASA public broadcast',
      tags: 'news,public',
    },
  })
  const n2 = await db.source.create({
    data: {
      channelId: ch2.id,
      name: 'Red Bull TV',
      url: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
      type: 'hls',
      description: 'Red Bull TV live',
      tags: 'sports,music',
    },
  })
  await db.channel.update({ where: { id: ch2.id }, data: { fallbackSourceId: n1.id } })

  // Schedule: NASA in the morning, Red Bull in the evening, NASA overnight
  await db.schedule.create({
    data: { name: 'NASA Morning', channelId: ch2.id, sourceId: n1.id, dayOfWeek: -1, startSec: 6 * 3600, endSec: 18 * 3600 },
  })
  await db.schedule.create({
    data: { name: 'Red Bull Evening', channelId: ch2.id, sourceId: n2.id, dayOfWeek: -1, startSec: 18 * 3600, endSec: 23 * 3600 },
  })
  await db.schedule.create({
    data: { name: 'NASA Late Night', channelId: ch2.id, sourceId: n1.id, dayOfWeek: -1, startSec: 23 * 3600, endSec: 6 * 3600 },
  })

  // Demo channel: "Classic Films" — uses public domain MP4 clips as a loop
  const ch3 = await db.channel.create({
    data: {
      slug: 'classic-films',
      name: 'Classic Films',
      description: 'Public-domain short films on loop',
      category: 'Movies',
    },
  })
  const f1 = await db.source.create({
    data: {
      channelId: ch3.id,
      name: 'Big Buck Bunny',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      type: 'mp4',
      duration: 596,
    },
  })
  const f2 = await db.source.create({
    data: {
      channelId: ch3.id,
      name: 'Sintel',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      type: 'mp4',
      duration: 888,
    },
  })
  const f3 = await db.source.create({
    data: {
      channelId: ch3.id,
      name: 'Elephant Dream',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      type: 'mp4',
      duration: 654,
    },
  })
  await db.channel.update({ where: { id: ch3.id }, data: { fallbackSourceId: f1.id } })

  // one-off schedule example
  await db.schedule.create({
    data: {
      name: 'Big Buck Bunny — special broadcast',
      channelId: ch3.id,
      sourceId: f1.id,
      dayOfWeek: -1,
      startSec: 0,
      endSec: 600,
      startDate: new Date(Date.now() + 60 * 1000), // starts in 1 minute, runs 10 minutes
    },
  })

  return NextResponse.json({
    ok: true,
    seeded: {
      channels: 3,
      sources: 6,
      schedules: 4,
      sources_detail: [src1, n1, n2, f1, f2, f3],
    },
  })
}
