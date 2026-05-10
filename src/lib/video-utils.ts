/**
 * Captures a frame from a video file at a specific time (seconds)
 * Returns a Blob containing the image data
 */
export async function captureVideoThumbnail(file: File, time: number = 1): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.src = URL.createObjectURL(file)
    video.muted = true
    video.playsInline = true

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(time, video.duration)
    }

    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Canvas toBlob failed'))
        }
        URL.revokeObjectURL(video.src)
      }, 'image/jpeg', 0.8)
    }

    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      reject(new Error('Video loading error'))
    }
  })
}

/**
 * Gets video duration in seconds from a file
 */
export async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.src = URL.createObjectURL(file)
    video.onloadedmetadata = () => {
      resolve(video.duration)
      URL.revokeObjectURL(video.src)
    }
    video.onerror = () => {
      resolve(0)
      URL.revokeObjectURL(video.src)
    }
  })
}
