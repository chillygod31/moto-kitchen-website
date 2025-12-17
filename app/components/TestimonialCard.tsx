interface TestimonialCardProps {
  quote: string;
  author: string;
  location?: string;
  eventType?: string;
  rating?: number;
  image?: string;
}

export default function TestimonialCard({
  quote,
  author,
  location,
  eventType,
  rating = 5,
  image,
}: TestimonialCardProps) {
  return (
    <div className="card h-full flex flex-col">
      {/* Rating Stars */}
      {rating > 0 && (
        <div className="flex gap-1 mb-4">
          {[...Array(rating)].map((_, i) => (
            <svg key={i} className="w-5 h-5 text-[#C9653B]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      )}

      {/* Quote */}
      <div className="text-[#C9653B] text-3xl mb-2">&ldquo;</div>
      <p className="text-[#4B4B4B] leading-relaxed flex-grow mb-6">
        {quote}
      </p>

      {/* Author */}
      <div className="flex items-center gap-3 border-t border-[#E6D9C8] pt-4">
        {image && (
          <img
            src={image}
            alt={author}
            className="w-12 h-12 rounded-full object-cover"
          />
        )}
        <div>
          <p className="font-semibold text-[#1F1F1F]">{author}</p>
          {location && <p className="text-sm text-[#4B4B4B]">{location}</p>}
          {eventType && <p className="text-sm text-[#C9653B]">{eventType}</p>}
        </div>
      </div>
    </div>
  );
}

