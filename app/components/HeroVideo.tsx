'use client'

import { useEffect, useRef } from 'react'

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Ensure video plays on mobile
    const playPromise = video.play()
    
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        // Autoplay was prevented, try to play on user interaction
        console.log('Autoplay prevented, video will play on interaction')
      })
    }

    // Ensure video continues playing when it comes into view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {
              // Ignore play errors
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
      className="w-full h-full object-cover"
      style={{ objectPosition: 'center', zIndex: 0 }}
    >
      <source src="/hero-video.MP4" type="video/mp4" />
    </video>
  )
}

