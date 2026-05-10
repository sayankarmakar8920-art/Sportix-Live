import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, unlink, readFile, readdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import crypto from 'crypto'
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, PutObjectCommand } from '@aws-sdk/client-s3'

// Cloudflare R2 Client
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

const UPLOAD_DIR = join(process.cwd(), 'uploads')
const TEMP_DIR = join(UPLOAD_DIR, 'temp')

// Ensure directories exist
async function ensureDirs() {
  if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true })
  if (!existsSync(TEMP_DIR)) await mkdir(TEMP_DIR, { recursive: true })
}

// Generate safe filename
function safeFilename(originalName: string): string {
  const ext = originalName.split('.').pop() || 'bin'
  const name = originalName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50)
  return `${name}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`
}

// GET: Check upload status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const fileId = searchParams.get('fileId')

    if (!fileId) {
      return NextResponse.json({ error: 'fileId is required' }, { status: 400 })
    }

    await ensureDirs()
    const tempDir = join(TEMP_DIR, fileId)
    const metaPath = join(tempDir, 'meta.json')

    if (!existsSync(metaPath)) {
      return NextResponse.json({ exists: false, chunks: [] })
    }

    const meta = JSON.parse(await readFile(metaPath, 'utf-8'))
    const files = await readdir(tempDir)
    const uploadedChunks = files
      .filter(f => f.startsWith('chunk_'))
      .map(f => parseInt(f.replace('chunk_', ''), 10))
      .filter(n => !isNaN(n))

    return NextResponse.json({
      exists: true,
      ...meta,
      uploadedChunks,
      totalChunks: meta.totalChunks,
    })
  } catch (error) {
    console.error('Upload status check error:', error)
    return NextResponse.json({ error: 'Failed to check upload status' }, { status: 500 })
  }
}

// POST: Handle file upload (R2 Direct Multipart)
export async function POST(req: NextRequest) {
  try {
    const uploadType = req.headers.get('x-upload-type') || 'single'
    const fileName = req.headers.get('x-file-name') || 'upload'
    const contentType = req.headers.get('x-file-mime') || 'application/octet-stream'

    // ─── CHUNKED UPLOAD (R2 MULTIPART) ───
    if (uploadType === 'chunk') {
      const chunkIndex = parseInt(req.headers.get('x-chunk-index') || '0', 10)
      const totalChunks = parseInt(req.headers.get('x-total-chunks') || '1', 10)
      let uploadId: any = req.headers.get('x-upload-id')
      const isFinal = req.headers.get('x-is-final') === 'true'
      
      const buffer = Buffer.from(await req.arrayBuffer())
      const partNumber = chunkIndex + 1

      // 1. Initial Chunk: Start Multipart Upload
      if (chunkIndex === 0 && !uploadId) {
        const finalName = safeFilename(fileName)
        const command = new CreateMultipartUploadCommand({
          Bucket: BUCKET_NAME,
          Key: finalName,
          ContentType: contentType,
          Metadata: {
            'original-name': fileName,
          }
        })
        const response = await s3Client.send(command)
        uploadId = response.UploadId || undefined
        
        // Return uploadId to client for next chunks
        // Also upload the first part
        const partCommand = new UploadPartCommand({
          Bucket: BUCKET_NAME,
          Key: finalName,
          UploadId: uploadId,
          PartNumber: partNumber,
          Body: buffer,
        })
        const partResponse = await s3Client.send(partCommand)
        
        return NextResponse.json({ 
          success: true, 
          uploadId, 
          etag: partResponse.ETag,
          fileName: finalName 
        })
      }

      // 2. Middle/Final Chunk: Upload Part
      if (uploadId) {
        const currentFileName = req.headers.get('x-file-name-r2') || fileName // We might need to pass the generated key back
        // Wait, the client doesn't know the generated finalName yet. 
        // We should return the finalName (Key) in the first chunk and client should send it back.
        // I'll update the client header to send x-r2-key.
        const r2Key = req.headers.get('x-r2-key') || fileName 

        const partCommand = new UploadPartCommand({
          Bucket: BUCKET_NAME,
          Key: r2Key,
          UploadId: uploadId,
          PartNumber: partNumber,
          Body: buffer,
        })
        const partResponse = await s3Client.send(partCommand)

        // 3. Final Chunk: Complete Multipart Upload
        if (isFinal) {
          const partsStr = req.headers.get('x-parts')
          if (!partsStr) throw new Error('Missing parts information for completion')
          
          const parts = JSON.parse(partsStr)
          // Add the current final part
          parts.push({ ETag: partResponse.ETag, PartNumber: partNumber })
          
          const completeCommand = new CompleteMultipartUploadCommand({
            Bucket: BUCKET_NAME,
            Key: r2Key,
            UploadId: uploadId,
            MultipartUpload: {
              Parts: parts.sort((a: any, b: any) => a.PartNumber - b.PartNumber),
            },
          })
          await s3Client.send(completeCommand)

          const r2Url = `${PUBLIC_URL}/${r2Key}`
          return NextResponse.json({
            success: true,
            url: r2Url,
            fileUrl: r2Url,
            fileName: r2Key,
            originalName: fileName,
            fileSize: parseInt(req.headers.get('x-file-size') || '0', 10),
          })
        }

        return NextResponse.json({ 
          success: true, 
          uploadId, 
          etag: partResponse.ETag 
        })
      }
    }

    // ─── SINGLE UPLOAD ───
    const contentTypeHeader = req.headers.get('content-type') || ''
    if (contentTypeHeader.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

      const finalName = safeFilename(file.name)
      const buffer = Buffer.from(await file.arrayBuffer())

      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: finalName,
        Body: buffer,
        ContentType: file.type || 'application/octet-stream',
      }))

      const r2Url = `${PUBLIC_URL}/${finalName}`
      return NextResponse.json({
        success: true,
        url: r2Url,
        fileUrl: r2Url,
        fileName: finalName,
        originalName: file.name,
        fileSize: file.size,
      })
    }

    return NextResponse.json({ error: 'Invalid upload request' }, { status: 400 })
  } catch (error) {
    console.error('R2 Upload error:', error)
    return NextResponse.json({ error: 'Upload failed', details: String(error) }, { status: 500 })
  }
}
