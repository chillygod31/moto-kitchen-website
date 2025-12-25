'use client'

import { useEffect, useRef } from 'react'

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Try to play the video - if it fails (Low Power Mode), poster image will show
    const playPromise = video.play()
    
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay was prevented - poster image will show instead
      })
    }

    // Ensure video continues playing when it comes into view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Try to play when in view, ignore errors (Low Power Mode will prevent it)
            video.play().catch(() => {
              // Silently fail - poster image will show
            })
          }
        })
      },
      { threshold: 0.5 }
    )

    observer.observe(video)

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      controls={false}
      disablePictureInPicture
      disableRemotePlayback
      poster="/behind-5.jpg"
      className="w-full h-full object-cover hero-video"
      style={{ 
        objectPosition: 'center', 
        zIndex: 0,
        pointerEvents: 'none',
      } as React.CSSProperties}
    >
      <source src="/hero-video.MP4" type="video/mp4" />
    </video>
  )
}

