import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { CatalogSnapshot, defaultCatalogSnapshot, normalizeCatalogSnapshot } from '../../../lib/catalogSnapshot'

export const dynamic = 'force-dynamic'

const stateId = 'main'
const sessionCookieName = 'jebar_admin_session'

function getServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) return null
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
}

export async function GET() {
  const supabase = getServerSupabase()
  if (!supabase) {
    return NextResponse.json({ mode: 'local', snapshot: defaultCatalogSnapshot })
  }

  const { data, error } = await supabase.from('catalog_state').select('snapshot, updated_at').eq('id', stateId).maybeSingle()

  if (error) {
    return NextResponse.json({ mode: 'local', snapshot: defaultCatalogSnapshot, error: error.message }, { status: 200 })
  }

  if (!data?.snapshot) {
    return NextResponse.json({ mode: 'cloud', snapshot: defaultCatalogSnapshot })
  }

  return NextResponse.json({
    mode: 'cloud',
    snapshot: normalizeCatalogSnapshot({
      ...(data.snapshot as Partial<CatalogSnapshot>),
      updatedAt: data.updated_at
    })
  })
}

export async function POST(request: Request) {
  if (!hasAdminAccess(request)) {
    return NextResponse.json({ saved: false, error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServerSupabase()
  if (!supabase) {
    return NextResponse.json({ mode: 'local', saved: false })
  }

  const body = await request.json()
  const snapshot = normalizeCatalogSnapshot(body?.snapshot)

  const { error } = await supabase.from('catalog_state').upsert({
    id: stateId,
    snapshot,
    updated_at: new Date().toISOString()
  })

  if (error) {
    return NextResponse.json({ mode: 'cloud', saved: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ mode: 'cloud', saved: true })
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
