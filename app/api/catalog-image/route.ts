import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const bucketName = 'catalog-images'
const maxFileSize = 8 * 1024 * 1024
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

type ServerSupabase = NonNullable<ReturnType<typeof getServerSupabase>>

function getServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) return null

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  })
}

export async function POST(request: Request) {
  const supabase = getServerSupabase()

  if (!supabase) {
    return NextResponse.json({ error: 'Missing Supabase environment variables' }, { status: 500 })
  }

  const contentType = request.headers.get('content-type') || ''
  let fileBytes: ArrayBuffer
  let fileType = 'image/jpeg'
  let productId = 'product'

  if (contentType.includes('application/json')) {
    const body = (await request.json().catch(() => ({}))) as { dataUrl?: string; productId?: string }
    productId = String(body.productId || 'product')

    const parsed = parseDataUrl(String(body.dataUrl || ''))
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid image data' }, { status: 400 })
    }

    fileBytes = parsed.bytes
    fileType = parsed.contentType
  } else {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    productId = String(formData.get('productId') || 'product')

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    fileBytes = await file.arrayBuffer()
    fileType = file.type || 'image/jpeg'
  }

  if (!allowedTypes.has(fileType)) {
    return NextResponse.json({ error: 'รองรับเฉพาะไฟล์รูปภาพ jpg, png, webp หรือ gif' }, { status: 400 })
  }

  if (fileBytes.byteLength > maxFileSize) {
    return NextResponse.json({ error: 'รูปใหญ่เกินไป กรุณาใช้ไฟล์ไม่เกิน 8MB' }, { status: 400 })
  }

  await ensurePublicBucket(supabase)

  const extension = getFileExtension(fileType)
  const safeProductId = productId.replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 80) || 'product'
  const filePath = `products/${safeProductId}-${Date.now()}.${extension}`

  const { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, fileBytes, {
    contentType: fileType,
    upsert: true
  })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath)

  return NextResponse.json({ imageUrl: data.publicUrl })
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
  const base64 = match[2]
  const bytes = Buffer.from(base64, 'base64')

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
