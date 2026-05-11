import { NextRequest, NextResponse } from 'next/server'
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { db } from '@/lib/db'
import crypto from 'crypto'

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.R2_BUCKET_NAME!
const PUBLIC_URL = process.env.R2_PUBLIC_URL!

function safeFilename(originalName: string): string {
  const ext = originalName.split('.').pop() || 'bin'
  const name = originalName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50)
  return `${name}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''
    
    if (contentType.includes('application/json')) {
      const body = await req.json()
      const { action } = body

      // 1. INIT MULTIPART
      if (action === 'init') {
        const { filename, contentType: fileType } = body
        const key = safeFilename(filename)
        const command = new CreateMultipartUploadCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          ContentType: fileType || 'video/mp4',
        })
        const response = await s3Client.send(command)
        return NextResponse.json({ uploadId: response.UploadId, key })
      }

      // 2. COMPLETE MULTIPART
      if (action === 'complete') {
        const { uploadId, key, parts, metadata } = body
        const command = new CompleteMultipartUploadCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          UploadId: uploadId,
          MultipartUpload: {
            Parts: parts.sort((a: any, b: any) => a.PartNumber - b.PartNumber),
          },
        })
        await s3Client.send(command)
        const videoUrl = `${PUBLIC_URL}/${key}`

        // Save to Supabase via Prisma
        const video = await db.video.create({
          data: {
            title: metadata.title || 'Untitled Video',
            description: metadata.description || '',
            videoUrl: videoUrl,
            thumbnail: metadata.thumbnail || `https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=800`,
            category: metadata.category || 'highlights',
            duration: 0, // Duration calculation would happen on client or via FFmpeg
            isFeatured: metadata.isFeatured || false,
          }
        })

        return NextResponse.json({ success: true, video })
      }
    }

    // 3. UPLOAD PART (FormData)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const action = formData.get('action')

      if (action === 'uploadPart') {
        const uploadId = formData.get('uploadId') as string
        const key = formData.get('key') as string
        const partNumber = parseInt(formData.get('partNumber') as string)
        const chunk = formData.get('chunk') as Blob

        const buffer = Buffer.from(await chunk.arrayBuffer())
        const command = new UploadPartCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          UploadId: uploadId,
          PartNumber: partNumber,
          Body: buffer,
        })
        const response = await s3Client.send(command)
        return NextResponse.json({ etag: response.ETag })
      }

      // Single file upload fallback
      const file = formData.get('file') as File | null
      if (file) {
        const key = safeFilename(file.name)
        const buffer = Buffer.from(await file.arrayBuffer())
        await s3Client.send(new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: file.type,
        }))
        const videoUrl = `${PUBLIC_URL}/${key}`
        const video = await db.video.create({
          data: {
            title: file.name,
            videoUrl,
            category: 'highlights',
          }
        })
        return NextResponse.json({ success: true, video })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Upload API Error:', error)
    return NextResponse.json({ error: 'Upload failed', details: String(error) }, { status: 500 })
  }
}
