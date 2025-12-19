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
    <section className="section-padding bg-[#F1E7DA]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p style={{ fontFamily: 'var(--font-heading-display), serif', fontWeight: 700 }} className="text-[#1F1F1F] text-4xl md:text-5xl tracking-widest">What We Offer</p>
        </div>
        
        <div className="grid md:grid-cols-[1.1fr_1fr] gap-1 items-center">
          {/* Left Side - Bullet Points */}
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 text-[#C9653B] text-xl">•</div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading-display), serif', fontWeight: 700 }} className="text-[#1F1F1F] text-lg mb-1">{item.title}</h3>
                  <p className="text-[#4B4B4B] text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right Side - Image Carousel */}
          <div className="relative">
            <div className="aspect-[3/2] bg-[#FAF6EF] rounded-lg border border-[#E6D9C8] overflow-hidden">
              <img 
                src={images[currentImageIndex]} 
                alt={`Corporate event ${currentImageIndex + 1}`}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
            </div>
            
            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 z-10"
                  aria-label="Previous image"
                >
                  <svg className="w-6 h-6 text-[#C9653B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 z-10"
                  aria-label="Next image"
                >
                  <svg className="w-6 h-6 text-[#C9653B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Image Indicators */}
                <div className="flex justify-center gap-2 mt-4">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === currentImageIndex ? 'bg-[#C9653B] w-8' : 'bg-[#E6D9C8] w-2'
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
            
            {/* Gallery Link */}
            <div className="text-center mt-4">
              <Link href="/gallery" className="text-[#C9653B] font-semibold hover:underline text-sm">
                View Full Gallery →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

