"use client";

import { useState } from "react";
import Link from "next/link";

interface IncludedItem {
  icon: string;
  title: string;
  description: string;
}

interface SplitWhatsIncludedProps {
  items: IncludedItem[];
  images: string[];
}

export default function SplitWhatsIncluded({ items, images }: SplitWhatsIncludedProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <section className="section-padding bg-[#FBF8F3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 md:mb-12">
          <h2 
            className="text-[32px] md:text-[36px] lg:text-[40px] text-[#1E1B18]"
            style={{ 
              fontFamily: 'var(--font-inter), sans-serif', 
              fontWeight: 600,
              letterSpacing: '-0.01em'
            }}
          >
            Our Services
          </h2>
        </div>
        
        <div className="flex flex-col md:grid md:grid-cols-[1.1fr_1fr] gap-6 md:gap-8 items-start">
          {/* Left Side - Bullet Points */}
          <div className="w-full space-y-4 md:space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex items-start gap-3 md:gap-4">
                <div className="flex-shrink-0 text-[#C86A3A] text-lg md:text-xl">•</div>
                <div className="flex-1 min-w-0">
                  <h3 
                    className="text-[#1E1B18] text-[16px] md:text-[18px] lg:text-[20px] mb-1"
                    style={{ 
                      fontFamily: 'var(--font-inter), sans-serif', 
                      fontWeight: 600,
                      letterSpacing: '-0.01em'
                    }}
                  >
                    {item.title}
                  </h3>
                  <p 
                    className="text-[#6B5B55] text-sm"
                    style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, lineHeight: '1.7' }}
                  >
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Right Side - Image Carousel */}
          <div className="relative w-full max-w-full">
            <div className="aspect-[3/2] w-full bg-[#FBF8F3] rounded-lg border border-[#E9E2D7] overflow-hidden">
              <img 
                src={images[currentImageIndex]} 
                alt={`Event ${currentImageIndex + 1}`}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
            </div>
            
            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 z-10 touch-manipulation"
                  aria-label="Previous image"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-[#C86A3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <button
                  onClick={nextImage}
                  className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 z-10 touch-manipulation"
                  aria-label="Next image"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-[#C86A3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Image Indicators */}
                <div className="flex justify-center gap-2 mt-4 overflow-x-auto pb-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`h-2 rounded-full transition-all flex-shrink-0 ${
                        index === currentImageIndex ? 'bg-[#C86A3A] w-8' : 'bg-[#E9E2D7] w-2'
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
            
            {/* Gallery Link */}
            <div className="text-center mt-4">
              <Link href="/gallery" className="text-[#C86A3A] font-semibold hover:underline text-sm inline-block">
                View Full Gallery →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

