"use client";

import { useState } from "react";
import Image from "next/image";
import Lightbox from "./Lightbox";

interface GalleryItem {
  id: string | number;
  src: string;
  alt: string;
  category: string;
}

interface GalleryGridProps {
  items: GalleryItem[];
  categories?: { id: string; label: string }[];
  showFilters?: boolean;
}

const defaultCategories = [
  { id: "all", label: "All" },
  { id: "events", label: "Private Events & Corporate" },
  { id: "food", label: "Food" },
  { id: "behind", label: "Behind The Scenes" },
];

export default function GalleryGrid({
  items,
  categories = defaultCategories,
  showFilters = true,
}: GalleryGridProps) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const filteredItems = activeFilter === "all"
    ? items
    : activeFilter === "events"
    ? items.filter((item) => item.category === "corporate" || item.category === "private")
    : items.filter((item) => item.category === activeFilter);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % filteredItems.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
  };

  return (
    <>
      {/* Filter Tabs */}
      {showFilters && (
        <div className="py-6 bg-white border-b border-[#E9E2D7] sticky top-[72px] z-40">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveFilter(category.id)}
                  style={{ 
                    fontFamily: 'var(--font-inter), sans-serif', 
                    fontWeight: activeFilter === category.id ? 600 : 500,
                    letterSpacing: '0.04em',
                    textTransform: 'none'
                  }}
                  className={`px-4 py-2 rounded-full transition-colors text-[13px] md:text-[14px] ${
                    activeFilter === category.id
                      ? "bg-[#C86A3A] text-white"
                      : "bg-white border border-[#E9E2D7] text-[#6B5B55] hover:bg-[#C86A3A] hover:text-white hover:border-[#C86A3A]"
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gallery Grid */}
      <div className="section-padding bg-white">
        <div className="max-w-6xl mx-auto">
          {filteredItems.length === 0 ? (
            <p className="text-center text-[#6B5B55]">No items found in this category.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => openLightbox(index)}
                  className="aspect-square bg-[#FBF8F3] rounded-lg border border-[#E9E2D7] overflow-hidden group cursor-pointer relative"
                >
                  {item.src ? (
                    <Image
                      src={item.src}
                      alt={item.alt}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#6B5B55]">
                      <span className="text-4xl">🍽️</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-[#C86A3A]/0 group-hover:bg-[#C86A3A]/20 transition-colors flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <Lightbox
        images={filteredItems.map((item) => ({ src: item.src, alt: item.alt }))}
        currentIndex={currentImageIndex}
        isOpen={lightboxOpen}
        onClose={closeLightbox}
        onNext={nextImage}
        onPrev={prevImage}
      />
    </>
  );
}

