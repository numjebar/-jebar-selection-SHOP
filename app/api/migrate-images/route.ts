import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { CatalogSnapshot, defaultCatalogSnapshot, normalizeCatalogSnapshot } from '../../../lib/catalogSnapshot'

export const dynamic = 'force-dynamic'

const stateId = 'main'
const bucketName = 'catalog-images'
const sessionCookieName = 'jebar_admin_session'
const maxFileSize = 8 * 1024 * 1024
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

type ServerSupabase = NonNullable<ReturnType<typeof getServerSupabase>>

function getServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) return null
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
}

export async function POST(request: Request) {
  if (!hasAdminAccess(request)) {
    return NextResponse.json({ migrated: 0, error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServerSupabase()
  if (!supabase) {
    return NextResponse.json({ migrated: 0, error: 'Missing Supabase environment variables' }, { status: 500 })
  }

  await ensurePublicBucket(supabase)

  const { data, error } = await supabase.from('catalog_state').select('snapshot').eq('id', stateId).maybeSingle()
  if (error) {
    return NextResponse.json({ migrated: 0, error: error.message }, { status: 500 })
  }

  const snapshot = normalizeCatalogSnapshot((data?.snapshot as Partial<CatalogSnapshot>) || defaultCatalogSnapshot)
  let migrated = 0
  let failed = 0

  const products = await Promise.all(
    snapshot.products.map(async (product) => {
      if (!product.imageUrl?.startsWith('data:image/')) return product

      try {
        const parsed = parseDataUrl(product.imageUrl)
        if (!parsed) throw new Error('Invalid image data')

        const filePath = `products/${product.id.replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 80) || 'product'}-${Date.now()}.${getFileExtension(parsed.contentType)}`
        const { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, parsed.bytes, {
          contentType: parsed.contentType,
          upsert: true
        })
        if (uploadError) throw uploadError

        const { data: publicUrl } = supabase.storage.from(bucketName).getPublicUrl(filePath)
        migrated += 1
        return { ...product, imageUrl: publicUrl.publicUrl }
      } catch (error) {
        console.error(error)
        failed += 1
        return product
      }
    })
  )

  const nextSnapshot: CatalogSnapshot = {
    ...snapshot,
    products,
    updatedAt: new Date().toISOString()
  }

  const { error: saveError } = await supabase.from('catalog_state').upsert({
    id: stateId,
    snapshot: nextSnapshot,
    updated_at: new Date().toISOString()
  })

  if (saveError) {
    return NextResponse.json({ migrated, failed, error: saveError.message }, { status: 500 })
  }

  return NextResponse.json({ migrated, failed, saved: true })
}

async function ensurePublicBucket(supabase: ServerSupabase) {
  const { data: buckets } = await supabase.storage.listBuckets()
  const bucket = buckets?.find((item) => item.name === bucketName)

  if (!bucket) {
    await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: maxFileSize,
      allowedMimeTypes: Array.from(allowedTypes)
    })
    return
  }

  if (!bucket.public) {
    await supabase.storage.updateBucket(bucketName, { public: true })
  }
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
  if (!match) return null

  const contentType = match[1]
  const bytes = Buffer.from(match[2], 'base64')
  if (!allowedTypes.has(contentType) || bytes.byteLength > maxFileSize) return null

  return {
    contentType,
    bytes: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
  }
}

function getFileExtension(contentType: string) {
  if (contentType === 'image/png') return 'png'
  if (contentType === 'image/webp') return 'webp'
  if (contentType === 'image/gif') return 'gif'
  return 'jpg'
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
