import { createHash, randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const sessionCookieName = 'jebar_admin_session'
const allowedEvents = new Set([
  'Catalog Viewed',
  'Catalog Started',
  'Cart Item Added',
  'Cart Item Removed',
  'Order Copied'
])

type EventSnapshot = {
  name: string
  visitorId: string
  sessionId: string
  path: string
  properties: Record<string, string | number | boolean>
}

export async function POST(request: Request) {
  const supabase = getServerSupabase()
  if (!supabase) return NextResponse.json({ ok: false }, { status: 503 })

  const body = await request.json().catch(() => null)
  if (!body || !allowedEvents.has(body.name) || typeof body.visitorId !== 'string' || typeof body.sessionId !== 'string') {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const snapshot: EventSnapshot = {
    name: body.name,
    visitorId: hashId(body.visitorId.slice(0, 100)),
    sessionId: hashId(body.sessionId.slice(0, 100)),
    path: typeof body.path === 'string' ? body.path.slice(0, 200) : '/catalog',
    properties: sanitizeProperties(body.properties)
  }

  const now = new Date().toISOString()
  const { error } = await supabase.from('catalog_state').insert({
    id: `analytics:${now}:${randomUUID()}`,
    snapshot,
    updated_at: now
  })

  return NextResponse.json({ ok: !error }, { status: error ? 500 : 200 })
}

export async function GET(request: Request) {
  if (!hasAdminAccess(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServerSupabase()
  if (!supabase) return NextResponse.json(emptyReport())

  const since = new Date()
  since.setDate(since.getDate() - 30)

  const { data, error } = await supabase
    .from('catalog_state')
    .select('snapshot, updated_at')
    .like('id', 'analytics:%')
    .gte('updated_at', since.toISOString())
    .order('updated_at', { ascending: false })
    .limit(5000)

  if (error) return NextResponse.json({ ...emptyReport(), error: error.message })

  const events = (data || []).map((row) => ({
    ...(row.snapshot as EventSnapshot),
    timestamp: row.updated_at as string
  }))

  return NextResponse.json(buildReport(events))
}

function getServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) return null
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
}

function hashId(value: string) {
  const salt = process.env.ADMIN_SESSION_TOKEN || process.env.ADMIN_PASSWORD || 'jebar-analytics'
  return createHash('sha256').update(`${salt}:${value}`).digest('hex').slice(0, 24)
}

function sanitizeProperties(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .slice(0, 10)
      .flatMap(([key, item]) => {
        if (!['string', 'number', 'boolean'].includes(typeof item)) return []
        return [[key.slice(0, 50), typeof item === 'string' ? item.slice(0, 150) : item]]
      })
  ) as Record<string, string | number | boolean>
}

function buildReport(events: Array<EventSnapshot & { timestamp: string }>) {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recent = events.filter((event) => new Date(event.timestamp).getTime() >= sevenDaysAgo)
  const count = (name: string) => recent.filter((event) => event.name === name).length
  const visitors = new Set(recent.map((event) => event.visitorId)).size
  const views = count('Catalog Viewed')
  const orders = count('Order Copied')
  const products = new Map<string, number>()

  recent
    .filter((event) => event.name === 'Cart Item Added')
    .forEach((event) => {
      const name = String(event.properties.productName || event.properties.productId || 'Unknown')
      products.set(name, (products.get(name) || 0) + 1)
    })

  return {
    period: '7d',
    visitors,
    views,
    starts: count('Catalog Started'),
    cartAdds: count('Cart Item Added'),
    orders,
    conversionRate: views > 0 ? Math.round((orders / views) * 1000) / 10 : 0,
    topProducts: [...products.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, clicks]) => ({ name, clicks })),
    recentEvents: recent.slice(0, 20).map((event) => ({
      name: event.name,
      timestamp: event.timestamp,
      productName: event.properties.productName || ''
    }))
  }
}

function emptyReport() {
  return {
    period: '7d',
    visitors: 0,
    views: 0,
    starts: 0,
    cartAdds: 0,
    orders: 0,
    conversionRate: 0,
    topProducts: [],
    recentEvents: []
  }
}

function hasAdminAccess(request: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD
  const sessionToken = process.env.ADMIN_SESSION_TOKEN || adminPassword
  if (!adminPassword || !sessionToken) return process.env.NODE_ENV !== 'production'

  const cookieHeader = request.headers.get('cookie') || ''
  return cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .some((cookie) => {
      const [name, value] = cookie.split('=')
      return name === sessionCookieName && decodeURIComponent(value || '') === sessionToken
    })
}
