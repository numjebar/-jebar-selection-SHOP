import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const maxImageBytes = 10 * 1024 * 1024

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { url?: string }
    const url = String(body.url || '')

    if (!url || !/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 })
    }

    const response = await fetch(url, { cache: 'no-store' })

    if (!response.ok) {
      return NextResponse.json({ error: 'Cannot fetch image' }, { status: 502 })
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'URL is not an image' }, { status: 400 })
    }

    const arrayBuffer = await response.arrayBuffer()
    if (arrayBuffer.byteLength > maxImageBytes) {
      return NextResponse.json({ error: 'Image is too large' }, { status: 400 })
    }

    const base64 = Buffer.from(arrayBuffer).toString('base64')
    return NextResponse.json({ dataUrl: `data:${contentType};base64,${base64}` })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Image conversion failed' }, { status: 500 })
  }
}
