'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video || showFallback) return

    // Try to play the video - if it fails (Low Power Mode), use image fallback
    const playPromise = video.play()
    
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay was prevented - hide video and show image instead
        setShowFallback(true)
      })
    } else {
      // Check if video is actually playing after a short delay
      setTimeout(() => {
        if (video.paused || video.ended) {
          setShowFallback(true)
        }
      }, 500)
    }

    // Ensure video continues playing when it comes into view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !showFallback) {
            // Try to play when in view
            video.play().catch(() => {
              // If play fails, show fallback image
              setShowFallback(true)
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
  }, [showFallback])

  // If autoplay failed, show static image instead
  if (showFallback) {
    return (
      <div className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
        <Image
          src="/behind-5.jpg"
          alt="Moto Kitchen catering"
          fill
          priority
          className="object-cover"
          style={{ objectPosition: 'center' }}
          sizes="100vw"
        />
      </div>
    )
  }

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

