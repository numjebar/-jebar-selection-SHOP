import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const web = await sharp(buffer)
    .resize(1200, 900, { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer()

  const catalog = await sharp(buffer)
    .resize(2500, 1875, { fit: 'cover' })
    .webp({ quality: 90 })
    .toBuffer()

  return NextResponse.json({
    message: 'Resize ready',
    original_bytes: buffer.length,
    web_bytes: web.length,
    catalog_bytes: catalog.length,
    web_base64: web.toString('base64'),
    catalog_base64: catalog.toString('base64')
  })
}
