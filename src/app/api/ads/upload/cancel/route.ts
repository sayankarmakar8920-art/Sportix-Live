import { NextRequest, NextResponse } from 'next/server'
import { rm, existsSync } from 'fs/promises'
import path from 'path'

const CHUNK_DIR_BASE = '/tmp/uploads/chunks'

// POST: Cancel a chunked upload and clean up temp files
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { uploadId } = body

    if (!uploadId) {
      return NextResponse.json({ error: 'uploadId is required' }, { status: 400 })
    }

    const chunkDir = path.join(CHUNK_DIR_BASE, uploadId)

    if (!existsSync(chunkDir)) {
      // Already cleaned up or never existed — still return success
      return NextResponse.json({ ok: true, message: 'Upload session already cleaned up' })
    }

    // Delete the entire temp directory recursively
    await rm(chunkDir, { recursive: true, force: true })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Cancel upload failed:', error)
    return NextResponse.json({ error: 'Failed to cancel upload' }, { status: 500 })
  }
}
