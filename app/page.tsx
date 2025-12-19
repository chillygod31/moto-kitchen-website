import Link from "next/link";
import { getRandomGalleryImages } from "../lib/gallery-data";
import { findDishByName } from "../lib/menu-data";
import { formatPricing } from "../lib/pricing-data";

export default function Home() {
  const signatureDishNames = [
    "Goat meat/Mbuzi",
    "Fried Fish/Samaki",
    "Mchuzi wa Nyama/Beef stew",
    "Pilau Beef",
    "Samosa",
    "Vitumbua",
    "Chapati",
    "Kachumbari",
  ];

  const signatureDishes = signatureDishNames.map(name => {
    const dish = findDishByName(name);
    return dish || { name, description: "", image: null };
  });

  const trustPoints = [
    "Family-owned",
    "100% Halal",
    "Serving across the Netherlands and beyond",
    "Official caterer for the Embassy of Tanzania in the Netherlands",
  ];

  const howItWorks = [
    { step: "1", title: "Inquiry", description: "Tell us about your event and requirements" },
    { step: "2", title: "Proposal", description: "Receive a custom menu and quote" },
    { step: "3", title: "Confirm", description: "Finalize details and secure your date" },
    { step: "4", title: "Catering Day", description: "We deliver an unforgettable experience" },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-[#3A2A24] overflow-hidden">
        {/* Background Video/Image */}
        <div className="absolute inset-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover"
            style={{ objectPosition: 'center', zIndex: 0 }}
          >
            <source src="/hero-video.MP4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/50 z-10" />
        </div>
        
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <p style={{ fontFamily: 'var(--font-cinzel), serif' }} className="text-[#C9653B] text-lg mb-4 tracking-widest uppercase">Karibu</p>
          <h1 style={{ fontFamily: 'var(--font-cinzel), serif' }} className="text-5xl md:text-7xl font-bold text-white mb-6">
            Authentic Tanzanian Catering for Every Occasion
          </h1>
          <p style={{ fontFamily: 'var(--font-cinzel), serif' }} className="text-xl md:text-2xl text-white/80 mb-10 max-w-2xl mx-auto">
            Private Events • Corporate Events • Weddings • Pick Up & Delivery
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" style={{ fontFamily: 'var(--font-cinzel), serif' }} className="btn-primary text-lg">
              Request a Quote
            </Link>
            <Link href="/menu" style={{ fontFamily: 'var(--font-cinzel), serif' }} className="btn-secondary text-lg !text-white !border-white hover:!bg-white hover:!text-[#1F1F1F]">
              View Sample Menus
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-6 bg-[#F1E7DA] border-y border-[#E6D9C8]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-4">
            {trustPoints.map((point, index) => (
              <span key={index} className="trust-chip">
                <svg className="w-4 h-4 text-[#C9653B]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {point}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* About Preview Section */}
      <section className="section-padding bg-[#FAF6EF]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">Our Story</p>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#1F1F1F]">
                A Taste of Home, Far From Home
              </h2>
              <p className="text-[#4B4B4B] text-lg mb-6 leading-relaxed">
                Moto Kitchen began in a home kitchen, with a grandmother, a mother, and an aunt cooking for the people around them. That was about 12 to 13 years ago. Over time, people started asking if we could cook for them, first for birthdays and small celebrations, then for bigger moments where the food needed to feel like home.
              </p>
              <p className="text-[#4B4B4B] text-lg mb-8 leading-relaxed">
                In 2023 we officially started Moto Kitchen as a business. Today, we are a team of eight women, and we run Moto Kitchen like family. Moto means fire in Swahili. For us, it is the fire in our kitchen and the passion in our veins, the kind of fire that turns a meal into a memory.
              </p>
              <Link href="/about" className="text-[#C9653B] font-semibold hover:underline inline-flex items-center gap-2">
                Read Our Full Story
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
            <div className="relative">
              <div className="aspect-[3/2] bg-[#F1E7DA] rounded-lg overflow-hidden border border-[#E6D9C8]">
                <img 
                  src="/team1.jpg" 
                  alt="Moto Kitchen team"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: '70% center' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Preview Section */}
      <section className="section-padding bg-[#F1E7DA]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">What We Offer</p>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1F1F1F]">
              Our Services
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center max-w-7xl mx-auto">
            {[
              {
                href: "/services/private-events",
                image: "/food-8.jpg",
                title: "Private Events",
                description: "Birthday parties, anniversaries, family gatherings, and intimate celebrations with authentic flavours.",
                pricing: formatPricing("private-events")
              },
              {
                href: "/services/private-events",
                image: "/corporate-2.jpg",
                title: "Corporate",
                description: "Professional catering for team lunches, conferences, client meetings, and company celebrations.",
                pricing: formatPricing("corporate")
              },
              {
                href: "/services/private-events",
                image: "/private-3.jpg",
                title: "Weddings",
                description: "Make your special day unforgettable with authentic Tanzanian cuisine for your wedding celebration.",
                pricing: formatPricing("weddings")
              },
              {
                href: "/services/pick-up-delivery",
                image: "/delivery.jpg",
                title: "Pick-Up & Delivery",
                description: "Convenient pick-up and delivery service across the Netherlands, Belgium, and Germany, and beyond.",
                pricing: formatPricing("pick-up-delivery")
              }
            ].map((service, index) => (
              <Link 
                key={index}
                href={service.href}
                className="card hover:shadow-md transition-shadow group"
              >
                <div className="mb-6 overflow-hidden rounded-md">
                  <img 
                    src={service.image} 
                    alt={service.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-xl font-semibold text-[#1F1F1F] mb-4 group-hover:text-[#C9653B] transition-colors text-center">
                  {service.title}
                </h3>
                <p className="text-[#4B4B4B] text-center mb-4">
                  {service.description}
                </p>
                {service.pricing && (
                  <p className="text-[#C9653B] font-semibold text-sm mb-4 text-center">
                    {service.pricing}
                  </p>
                )}
                <span className="inline-flex items-center gap-1 mt-auto text-[#C9653B] font-semibold text-sm justify-center w-full">
                  Learn more
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Signature Dishes Section */}
      <section className="section-padding bg-[#FAF6EF]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">Our Menu</p>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1F1F1F]">
              Signature Dishes
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {signatureDishes.map((dish, index) => (
              <div key={index} className="card">
                <div className="aspect-[4/3] bg-[#F1E7DA] rounded-lg mb-4 overflow-hidden border border-[#E6D9C8] flex items-center justify-center">
                  {dish.image ? (
                    <img 
                      src={`/${dish.image}`} 
                      alt={dish.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl">🍽️</span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-[#1F1F1F] mb-2 text-center">{dish.name}</h3>
                <p className="text-[#4B4B4B] text-sm text-center">{dish.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/menu" className="btn-primary">
              View Full Menu
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section-padding bg-[#3A2A24]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">Simple Process</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              How It Works
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-[#C9653B] rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-white">{item.step}</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-white/70">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Teaser */}
      <section className="section-padding bg-[#FAF6EF]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">Our Work</p>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1F1F1F]">
              Gallery
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {getRandomGalleryImages(6).map((item) => (
              <div key={item.id} className="aspect-square bg-[#F1E7DA] rounded-lg border border-[#E6D9C8] overflow-hidden">
                <img 
                  src={item.src} 
                  alt={item.alt} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/gallery" className="btn-secondary">
              View Full Gallery
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section-padding bg-[#F1E7DA]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">Testimonials</p>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1F1F1F]">
              What Our Clients Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "The food was absolutely incredible! Our guests couldn't stop talking about the flavours. Moto Kitchen made our event truly special.",
                author: "Sarah M.",
                location: "Amsterdam",
                event: "Birthday Party"
              },
              {
                quote: "Professional, delicious, and authentic. They catered our company event and everyone was impressed by the unique menu.",
                author: "Thomas K.",
                location: "Rotterdam",
                event: "Corporate Event"
              },
              {
                quote: "As a Tanzanian living in the Netherlands, this felt like home. The chapati and pilau were perfect!",
                author: "Amina J.",
                location: "Utrecht",
                event: "Family Gathering"
              }
            ].map((testimonial, index) => (
              <div key={index} className="card">
                <div className="text-[#C9653B] text-4xl mb-4">&ldquo;</div>
                <p className="text-[#4B4B4B] mb-6 leading-relaxed">
                  {testimonial.quote}
                </p>
                <div>
                  <p className="font-semibold text-[#1F1F1F]">{testimonial.author}</p>
                  <p className="text-sm text-[#4B4B4B]">{testimonial.location}</p>
                  <p className="text-sm text-[#C9653B]">{testimonial.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="section-padding bg-[#C9653B] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Experience Tanzanian Flavours?
          </h2>
          <p className="text-white/90 text-lg mb-10 max-w-2xl mx-auto">
            Let us bring the taste of Tanzania to your next event. Get in touch for a custom quote tailored to your needs.
          </p>
          <Link href="/contact" className="bg-white text-[#C9653B] px-8 py-4 rounded-md font-semibold text-lg hover:bg-[#FAF6EF] transition-colors inline-block">
            Request a Quote
          </Link>
        </div>
      </section>
    </>
  );
}
