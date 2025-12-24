import Link from "next/link";

export const metadata = {
  title: "Reviews | Moto Kitchen",
  description: "Read what our clients say about Moto Kitchen's authentic Tanzanian catering. Real testimonials from weddings, corporate events, and private parties.",
};

const reviews = [
  {
    quote: "The food was absolutely incredible! Our guests couldn't stop talking about the flavours. Moto Kitchen made our wedding day truly special.",
    author: "Maria & David",
    location: "Amsterdam",
    eventType: "Wedding",
    rating: 5,
  },
  {
    quote: "Professional, delicious, and authentic. They catered our company event and everyone was impressed by the unique menu. Will definitely book again!",
    author: "Thomas K.",
    location: "Rotterdam",
    eventType: "Corporate Event",
    rating: 5,
  },
  {
    quote: "As a Tanzanian living in the Netherlands, this felt like home. The chapati and pilau were perfect! My family loved every dish.",
    author: "Amina J.",
    location: "Utrecht",
    eventType: "Family Gathering",
    rating: 5,
  },
  {
    quote: "We hired Moto Kitchen for our daughter's graduation party. The food was fresh, flavourful, and the service was impeccable.",
    author: "Sarah M.",
    location: "The Hague",
    eventType: "Private Party",
    rating: 5,
  },
  {
    quote: "Outstanding catering service! The Nyama Choma was the highlight of our corporate retreat. Highly recommend for any event.",
    author: "Mark van den Berg",
    location: "Eindhoven",
    eventType: "Corporate Event",
    rating: 5,
  },
  {
    quote: "From the first call to the last plate, everything was perfect. They understood our vision and delivered beyond expectations.",
    author: "Lisa & James",
    location: "Amsterdam",
    eventType: "Wedding",
    rating: 5,
  },
];

export default function ReviewsPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-[#2B1E1A]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[#C86A3A] text-sm uppercase tracking-widest mb-4">Testimonials</p>
          <h1 
            className="text-4xl md:text-6xl font-bold text-white mb-6"
            style={{ 
              fontFamily: 'var(--font-dm-serif-display), serif', 
              fontWeight: 500,
              letterSpacing: '-0.02em',
              lineHeight: '1.1'
            }}
          >
            What Our Clients Say
          </h1>
          <p className="text-xl text-white/80">
            Real stories from real events across the Netherlands
          </p>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="section-padding bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reviews.map((review, index) => (
              <div key={index} className="card">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-[#C86A3A]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                
                <div className="text-[#C86A3A] text-3xl mb-3">&ldquo;</div>
                <p className="text-[#6B5B55] mb-6 leading-relaxed">
                  {review.quote}
                </p>
                <div className="border-t border-[#E9E2D7] pt-4">
                  <p className="font-semibold text-[#1E1B18]">{review.author}</p>
                  <p className="text-sm text-[#6B5B55]">{review.location}</p>
                  <p className="text-sm text-[#C86A3A]">{review.eventType}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-[#C86A3A] relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 
            className="text-[32px] md:text-[36px] lg:text-[40px] font-bold text-white mb-6"
            style={{ 
              fontFamily: 'var(--font-inter), sans-serif', 
              fontWeight: 600,
              letterSpacing: '-0.01em'
            }}
          >
            Ready to Create Your Own Experience?
          </h2>
          <p className="text-white/90 text-lg mb-10">
            Join our happy clients and let us cater your next event.
          </p>
          <Link href="/contact" className="btn-primary !bg-white !text-[#1E1B18] hover:!bg-[#FBF8F3] hover:!text-[#1E1B18]">
            Request a Quote
          </Link>
        </div>
      </section>
    </>
  );
}

