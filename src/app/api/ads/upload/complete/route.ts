import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readdir, readFile, rm, stat, copyFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { db } from '@/lib/db'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'ads')
const THUMBNAIL_DIR = path.join(UPLOAD_DIR, 'thumbnails')
const CHUNK_DIR_BASE = '/tmp/uploads/chunks'

// POST: Complete a chunked upload by merging all chunks
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { uploadId, fileName, fileType, mimeType, fileSize } = body

    if (!uploadId || !fileName || !fileType || !mimeType || !fileSize) {
      return NextResponse.json(
        { error: 'Missing required fields: uploadId, fileName, fileType, mimeType, fileSize' },
        { status: 400 }
      )
    }

    const chunkDir = path.join(CHUNK_DIR_BASE, uploadId)

    if (!existsSync(chunkDir)) {
      return NextResponse.json(
        { error: 'Upload session not found. Upload may have expired or been cancelled.' },
        { status: 404 }
      )
    }

    // Read all chunk files
    const chunkFiles = await readdir(chunkDir)
    chunkFiles.sort((a, b) => {
      const indexA = parseInt(a.replace('chunk_', ''), 10)
      const indexB = parseInt(b.replace('chunk_', ''), 10)
      return indexA - indexB
    })

    if (chunkFiles.length === 0) {
      await cleanupTempDir(chunkDir)
      return NextResponse.json({ error: 'No chunks found for this upload' }, { status: 400 })
    }

    // Ensure output directories exist
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }
    if (!existsSync(THUMBNAIL_DIR)) {
      await mkdir(THUMBNAIL_DIR, { recursive: true })
    }

    // Generate unique filename
    const ext = fileName.split('.').pop()?.toLowerCase() || ''
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const uniqueFileName = `${timestamp}_${random}.${ext}`

    // Read and concatenate all chunks in order
    const buffers: Buffer[] = []
    for (const chunkFile of chunkFiles) {
      const chunkPath = path.join(chunkDir, chunkFile)
      const chunkData = await readFile(chunkPath)
      buffers.push(chunkData)
    }

    const mergedBuffer = Buffer.concat(buffers)

    // Write merged file to final destination
    const outputPath = path.join(UPLOAD_DIR, uniqueFileName)
    await writeFile(outputPath, mergedBuffer)

    // Verify file size matches expected
    const stats = await stat(outputPath)
    if (stats.size !== Number(fileSize)) {
      // File size mismatch - still keep the file but log warning
      console.error(`File size mismatch: expected ${fileSize}, got ${stats.size}`)
    }

    // Generate thumbnail for images (copy to thumbnails folder)
    let thumbnailUrl: string | null = null
    if (fileType === 'image') {
      const thumbName = `thumb_${uniqueFileName}`
      const thumbPath = path.join(THUMBNAIL_DIR, thumbName)
      await copyFile(outputPath, thumbPath)
      thumbnailUrl = `/uploads/ads/thumbnails/${thumbName}`
    }

    // Create AdMedia record
    const media = await db.adMedia.create({
      data: {
        originalName: fileName,
        fileName: uniqueFileName,
        fileType,
        mimeType,
        fileSize: Number(fileSize),
        thumbnailUrl,
        status: fileType === 'image' ? 'ready' : 'processing',
        uploadChunks: chunkFiles.length,
        totalChunks: chunkFiles.length,
      },
    })

    // Clean up temp directory
    await cleanupTempDir(chunkDir)

    return NextResponse.json({
      media,
      url: `/uploads/ads/${uniqueFileName}`,
    }, { status: 201 })
  } catch (error) {
    console.error('Complete upload failed:', error)
    return NextResponse.json({ error: 'Failed to complete upload' }, { status: 500 })
  }
}

async function cleanupTempDir(dirPath: string): Promise<void> {
  try {
    await rm(dirPath, { recursive: true, force: true })
  } catch (error) {
    console.error('Failed to cleanup temp directory:', dirPath, error)
  }
}
