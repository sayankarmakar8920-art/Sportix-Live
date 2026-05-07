import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, copyFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { db } from '@/lib/db'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'ads')
const THUMBNAIL_DIR = path.join(UPLOAD_DIR, 'thumbnails')

const ALLOWED_VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', 'ogg']
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif']
const MAX_VIDEO_SIZE = 5 * 1024 * 1024 * 1024 // 5GB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

function getFileType(ext: string): 'video' | 'image' | null {
  if (ALLOWED_VIDEO_EXTENSIONS.includes(ext)) return 'video'
  if (ALLOWED_IMAGE_EXTENSIONS.includes(ext)) return 'image'
  return null
}

function generateUniqueFileName(originalName: string): string {
  const ext = getFileExtension(originalName)
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${timestamp}_${random}.${ext}`
}

// POST: Simple upload for files < 50MB
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const originalName = file.name
    const ext = getFileExtension(originalName)
    const fileType = getFileType(ext)

    if (!fileType) {
      return NextResponse.json(
        { error: `Invalid file type .${ext}. Allowed: video (${ALLOWED_VIDEO_EXTENSIONS.join(', ')}), image (${ALLOWED_IMAGE_EXTENSIONS.join(', ')})` },
        { status: 400 }
      )
    }

    const maxSize = fileType === 'video' ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
    if (file.size > maxSize) {
      const maxLabel = fileType === 'video' ? '5GB' : '10MB'
      return NextResponse.json(
        { error: `File too large. Maximum ${maxLabel} for ${fileType}s` },
        { status: 400 }
      )
    }

    const fileName = generateUniqueFileName(originalName)

    // Ensure directories exist
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }
    if (!existsSync(THUMBNAIL_DIR)) {
      await mkdir(THUMBNAIL_DIR, { recursive: true })
    }

    // Save the file
    const filePath = path.join(UPLOAD_DIR, fileName)
    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    // Generate thumbnail for images (copy to thumbnails folder)
    let thumbnailUrl: string | null = null
    if (fileType === 'image') {
      const thumbName = `thumb_${fileName}`
      const thumbPath = path.join(THUMBNAIL_DIR, thumbName)
      await copyFile(filePath, thumbPath)
      thumbnailUrl = `/uploads/ads/thumbnails/${thumbName}`
    }

    // Create AdMedia record
    const media = await db.adMedia.create({
      data: {
        originalName,
        fileName,
        fileType,
        mimeType: file.type || (fileType === 'video' ? 'video/mp4' : 'image/jpeg'),
        fileSize: file.size,
        thumbnailUrl,
        status: fileType === 'image' ? 'ready' : 'processing',
        uploadChunks: 1,
        totalChunks: 1,
      },
    })

    return NextResponse.json({
      media,
      url: `/uploads/ads/${fileName}`,
    }, { status: 201 })
  } catch (error) {
    console.error('Upload failed:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
