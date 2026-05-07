import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readdir, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const CHUNK_DIR_BASE = '/tmp/uploads/chunks'

// POST: Upload a single chunk for chunked upload
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const uploadId = formData.get('uploadId') as string | null
    const chunkIndexStr = formData.get('chunkIndex') as string | null
    const totalChunksStr = formData.get('totalChunks') as string | null
    const fileName = formData.get('fileName') as string | null
    const fileType = formData.get('fileType') as string | null
    const mimeType = formData.get('mimeType') as string | null
    const chunk = formData.get('chunk') as File | null

    if (!uploadId || chunkIndexStr === null || !totalChunksStr || !fileName || !fileType || !mimeType || !chunk) {
      return NextResponse.json(
        { error: 'Missing required fields: uploadId, chunkIndex, totalChunks, fileName, fileType, mimeType, chunk' },
        { status: 400 }
      )
    }

    const chunkIndex = parseInt(chunkIndexStr, 10)
    const totalChunks = parseInt(totalChunksStr, 10)

    if (isNaN(chunkIndex) || isNaN(totalChunks) || chunkIndex < 0 || totalChunks <= 0 || chunkIndex >= totalChunks) {
      return NextResponse.json(
        { error: 'Invalid chunkIndex or totalChunks' },
        { status: 400 }
      )
    }

    const chunkDir = path.join(CHUNK_DIR_BASE, uploadId)

    // Ensure temp directory exists
    if (!existsSync(chunkDir)) {
      await mkdir(chunkDir, { recursive: true })
    }

    // Save the chunk
    const chunkPath = path.join(chunkDir, `chunk_${chunkIndex}`)
    const bytes = await chunk.arrayBuffer()
    await writeFile(chunkPath, Buffer.from(bytes))

    // Count how many chunks have been received
    const existingChunks = await readdir(chunkDir)
    const received = existingChunks.length

    // Check if all chunks received
    const complete = received >= totalChunks

    return NextResponse.json({
      uploadId,
      chunkIndex,
      received,
      total: totalChunks,
      complete,
    })
  } catch (error) {
    console.error('Chunk upload failed:', error)
    return NextResponse.json({ error: 'Chunk upload failed' }, { status: 500 })
  }
}
