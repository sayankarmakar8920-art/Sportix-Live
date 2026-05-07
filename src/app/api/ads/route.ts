import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: List all ads with filters (type, position, placement, device, active, schedule)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const active = searchParams.get('active')
    const position = searchParams.get('position')
    const placement = searchParams.get('placement')
    const device = searchParams.get('device')

    const now = new Date()
    const where: Record<string, unknown> = {}

    if (type) where.type = type
    if (category) where.category = category
    if (active !== null) where.isActive = active === 'true'
    if (position) where.position = position
    if (placement) where.placement = placement

    // Device targeting: show ads for "all" OR matching device
    if (device) {
      where.OR = [
        { deviceTarget: null },
        { deviceTarget: 'all' },
        { deviceTarget: device },
      ]
    }

    // Schedule filtering: only show ads whose schedule window includes now
    // (handled at query level for SQLite compatibility)
    const ads = await db.ad.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    })

    // Post-filter by schedule in JS (SQLite date handling)
    const filtered = ads.filter(ad => {
      if (ad.scheduleStart && ad.scheduleStart > now) return false
      if (ad.scheduleEnd && ad.scheduleEnd < now) return false
      return true
    })

    return NextResponse.json({ ads: filtered })
  } catch (error) {
    console.error('Failed to fetch ads:', error)
    return NextResponse.json({ error: 'Failed to fetch ads' }, { status: 500 })
  }
}

// POST: Create new ad with full targeting fields
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      title, type, mediaUrl, targetUrl, category, duration, position,
      description, priority, createdBy, placement, deviceTarget,
      countryTarget, cpm, cpc, skipAfter, scheduleStart, scheduleEnd,
      abTestGroup, midRollTimes, autoSchedule, adFrequency,
    } = body

    if (!title || !mediaUrl) {
      return NextResponse.json({ error: 'Title and mediaUrl are required' }, { status: 400 })
    }

    const ad = await db.ad.create({
      data: {
        title,
        type: type || 'banner',
        mediaUrl,
        targetUrl,
        category,
        duration: duration ? Number(duration) : null,
        position,
        description,
        priority: priority ? Number(priority) : 0,
        createdBy,
        placement,
        deviceTarget: deviceTarget || 'all',
        countryTarget,
        cpm: cpm ? Number(cpm) : null,
        cpc: cpc ? Number(cpc) : null,
        skipAfter: skipAfter ? Number(skipAfter) : 5,
        scheduleStart: scheduleStart ? new Date(scheduleStart) : null,
        scheduleEnd: scheduleEnd ? new Date(scheduleEnd) : null,
        abTestGroup,
        midRollTimes: typeof midRollTimes === 'string' ? midRollTimes : midRollTimes ? JSON.stringify(midRollTimes) : null,
        autoSchedule: autoSchedule !== false,
        adFrequency: adFrequency || 'medium',
      },
    })

    return NextResponse.json({ ad }, { status: 201 })
  } catch (error) {
    console.error('Failed to create ad:', error)
    return NextResponse.json({ error: 'Failed to create ad' }, { status: 500 })
  }
}

// PUT: Update ad by id
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...fields } = body

    if (!id) {
      return NextResponse.json({ error: 'Ad id is required' }, { status: 400 })
    }

    // Handle date fields
    if (fields.scheduleStart) fields.scheduleStart = new Date(fields.scheduleStart)
    if (fields.scheduleEnd) fields.scheduleEnd = new Date(fields.scheduleEnd)

    const ad = await db.ad.update({
      where: { id },
      data: fields,
    })

    return NextResponse.json({ ad })
  } catch (error) {
    console.error('Failed to update ad:', error)
    return NextResponse.json({ error: 'Failed to update ad' }, { status: 500 })
  }
}

// DELETE: Delete ad by id
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Ad id is required' }, { status: 400 })
    }

    await db.ad.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to delete ad:', error)
    return NextResponse.json({ error: 'Failed to delete ad' }, { status: 500 })
  }
}
