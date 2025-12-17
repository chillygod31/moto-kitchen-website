"use client";

import TestimonialCard from "./TestimonialCard";

interface Testimonial {
  quote: string;
  author: string;
  location?: string;
  eventType?: string;
  rating?: number;
  image?: string;
}

interface TestimonialGridProps {
  testimonials: Testimonial[];
  columns?: 2 | 3;
  showTitle?: boolean;
  title?: string;
  subtitle?: string;
}

export default function TestimonialGrid({
  testimonials,
  columns = 3,
  showTitle = true,
  title = "What Our Clients Say",
  subtitle,
}: TestimonialGridProps) {
  const gridCols = columns === 2 ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3";

  return (
    <section className="section-padding bg-[#F1E7DA]">
      <div className="max-w-6xl mx-auto">
        {showTitle && (
          <div className="text-center mb-12">
            <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">Testimonials</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1F1F1F]">{title}</h2>
            {subtitle && <p className="text-[#4B4B4B] mt-4">{subtitle}</p>}
          </div>
        )}

        <div className={`grid ${gridCols} gap-8`}>
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}

