import Link from "next/link";
import Image from "next/image";
import { getRandomGalleryImages } from "../lib/gallery-data";
import { findDishByName } from "../lib/menu-data";
import { parseDishName } from "../lib/utils";

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


  const howItWorks = [
    { 
      step: "1", 
      title: "Inquiry", 
      bullets: [
        "Submit our quote form (2 minutes) or contact us directly",
        "Share your date, location, guest count, and budget",
        "Tell us any dietary needs or preferred dishes"
      ]
    },
    { 
      step: "2", 
      title: "Proposal", 
      bullets: [
        "Receive a tailored menu + quote within 24 to 48 hours",
        "Clear options based on your event style and budget",
        "Optional consultation call (if helpful)"
      ]
    },
    { 
      step: "3", 
      title: "Confirm", 
      bullets: [
        "Secure your date with a 50% deposit (or full payment if within 7 days)",
        "Final guest count confirmed 5 days before",
        "We finalize logistics with you/your venue"
      ]
    },
    { 
      step: "4", 
      title: "Event Day", 
      bullets: [
        "We arrive on time with fresh, beautifully presented food",
        "Seamless setup and service (as agreed)",
        "You enjoy the moment and we handle the rest"
      ]
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-[#2B1E1A] overflow-hidden">
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
          <h1 style={{ fontWeight: 400 }} className="text-5xl md:text-7xl text-white mb-6">
            Authentic Tanzanian Catering for Every Occasion
          </h1>
          <p style={{ fontFamily: 'var(--font-body), sans-serif' }} className="text-base md:text-lg text-white/80 mb-10 max-w-2xl mx-auto">
            Private Events • Corporate Events • Weddings
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="btn-primary">
              Request a Quote
            </Link>
            <Link href="/menu" className="btn-secondary !text-white !border-white hover:!bg-white hover:!text-[#1F1F1F]">
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


      {/* About Preview Section */}
      <section className="section-padding bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[#C86A3A] text-sm uppercase tracking-widest mb-4">Our Story</p>
              <h2 
                className="text-[32px] md:text-[36px] lg:text-[40px] mb-6 text-[#1E1B18]"
                style={{ 
                  fontFamily: 'var(--font-inter), sans-serif', 
                  fontWeight: 600,
                  letterSpacing: '-0.01em'
                }}
              >
                A Taste of Home, Far From Home
              </h2>
              <p 
                className="text-[#6B5B55] text-lg mb-6"
                style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, lineHeight: '1.75', fontSize: '1.125rem' }}
              >
                Moto Kitchen began in a home kitchen, with a grandmother, a mother, and an aunt cooking for the people around them. That was about 12 to 13 years ago. Over time, people started asking if we could cook for them, first for birthdays and small celebrations, then for bigger moments where the food needed to feel like home.
              </p>
              <p 
                className="text-[#6B5B55] text-lg mb-8"
                style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, lineHeight: '1.75', fontSize: '1.125rem' }}
              >
                In 2023 we officially started Moto Kitchen as a business. Today, we are a team of eight women, and we run Moto Kitchen like family. Moto means fire in Swahili. For us, it is the fire in our kitchen and the passion in our veins, the kind of fire that turns a meal into a memory.
              </p>
              <Link href="/about" className="text-[#C86A3A] font-semibold hover:underline inline-flex items-center gap-2">
                Read Our Full Story
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
            <div className="relative">
              <div className="relative aspect-[3/2] bg-[#FBF8F3] rounded-lg overflow-hidden border border-[#E9E2D7]">
                <Image
                  src="/team1.jpg"
                  alt="Moto Kitchen team of eight women"
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                  style={{ objectPosition: '70% center' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Preview Section */}
      <section className="section-padding bg-[#FBF8F3]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">What We Offer</p>
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

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center max-w-7xl mx-auto">
            {[
              {
                href: "/services/private-events",
                image: "/food-8.jpg",
                title: "Private Events",
                description: "Birthday parties, anniversaries, family gatherings, and intimate celebrations with authentic flavours."
              },
              {
                href: "/services/private-events",
                image: "/corporate-2.jpg",
                title: "Corporate Events",
                description: "Professional catering for team lunches, conferences, client meetings, and company celebrations."
              },
              {
                href: "/services/private-events",
                image: "/private-3.jpg",
                title: "Weddings",
                description: "Make your special day unforgettable with authentic Tanzanian cuisine for your wedding celebration."
              },
              {
                href: "/services/pick-up-delivery",
                image: "/delivery.jpg",
                title: "Pick-Up & Delivery",
                description: "Convenient pick-up and delivery service across the Netherlands, Belgium, Germany, and beyond."
              }
            ].map((service, index) => (
              <Link 
                key={index}
                href={service.href}
                className="card hover:shadow-md transition-shadow group"
              >
                <div className="relative aspect-[4/3] mb-6 overflow-hidden rounded-md">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 
                  className="text-[16px] md:text-[18px] lg:text-[20px] text-[#1E1B18] mb-4 group-hover:text-[#C86A3A] transition-colors text-center"
                  style={{ 
                    fontFamily: 'var(--font-inter), sans-serif', 
                    fontWeight: 600,
                    letterSpacing: '-0.01em'
                  }}
                >
                  {service.title}
                </h3>
                <p 
                  className="text-[#6B5B55] text-center mb-4"
                  style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, lineHeight: '1.7' }}
                >
                  {service.description}
                </p>
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
      <section className="section-padding bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">Our Menu</p>
            <h2 
              className="text-[32px] md:text-[36px] lg:text-[40px] text-[#1E1B18]"
              style={{ 
                fontFamily: 'var(--font-inter), sans-serif', 
                fontWeight: 600,
                letterSpacing: '-0.01em'
              }}
            >
              Signature Dishes
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {signatureDishes.map((dish, index) => {
              const { swahili, english } = parseDishName(dish.name);
              return (
              <div key={index} className="card">
                <div className="relative aspect-[4/3] bg-[#FBF8F3] rounded-lg mb-4 overflow-hidden border border-[#E9E2D7] flex items-center justify-center">
                  {dish.image ? (
                    <Image
                      src={`/${dish.image}`}
                      alt={swahili || english}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-4xl">🍽️</span>
                  )}
                </div>
                {swahili ? (
                  <>
                    <h3 className="dish-name-swahili -mt-2 text-center">{swahili}</h3>
                    <p className="dish-name-english text-center">{english}</p>
                  </>
                ) : (
                  <h3 style={{ fontFamily: 'var(--font-heading-display), serif', fontWeight: 700 }} className="text-xl text-[#1F1F1F] -mt-2 mb-2 text-center">
                    {english}
                  </h3>
                )}
                <p className="text-[#4B4B4B] text-sm text-center italic">{dish.description}</p>
              </div>
            );
            })}
          </div>

          <div className="text-center mt-12">
            <Link href="/menu" className="btn-primary">
              View Full Menu
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section-padding bg-[#2B1E1A]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">Simple Process</p>
            <h2 
              className="text-[32px] md:text-[36px] lg:text-[40px] text-white"
              style={{ 
                fontFamily: 'var(--font-inter), sans-serif', 
                fontWeight: 600,
                letterSpacing: '-0.01em'
              }}
            >
              How It Works
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-[#C9653B] rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-white">{item.step}</span>
                </div>
                <h3 
                  className="text-[16px] md:text-[18px] lg:text-[20px] text-white mb-4"
                  style={{ 
                    fontFamily: 'var(--font-inter), sans-serif', 
                    fontWeight: 600,
                    letterSpacing: '-0.01em'
                  }}
                >
                  {item.title}
                </h3>
                <ul 
                  className="text-white/70 text-left space-y-2 max-w-xs mx-auto"
                  style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, lineHeight: '1.7' }}
                >
                  {item.bullets.map((bullet, bulletIndex) => (
                    <li key={bulletIndex} className="flex items-start">
                      <span className="text-[#C9653B] mr-2 mt-1">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Teaser */}
      <section className="section-padding bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">Our Work</p>
            <h2 
              className="text-[32px] md:text-[36px] lg:text-[40px] text-[#1E1B18]"
              style={{ 
                fontFamily: 'var(--font-inter), sans-serif', 
                fontWeight: 600,
                letterSpacing: '-0.01em'
              }}
            >
              Gallery
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {getRandomGalleryImages(6).map((item) => (
              <div key={item.id} className="relative aspect-square bg-[#FBF8F3] rounded-lg border border-[#E9E2D7] overflow-hidden">
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="(min-width: 768px) 33vw, 50vw"
                  className="object-cover hover:scale-105 transition-transform duration-300"
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
      <section className="section-padding bg-[#FBF8F3]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">Testimonials</p>
            <h2 
              className="text-[32px] md:text-[36px] lg:text-[40px] text-[#1E1B18]"
              style={{ 
                fontFamily: 'var(--font-inter), sans-serif', 
                fontWeight: 600,
                letterSpacing: '-0.01em'
              }}
            >
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
      <section className="section-padding bg-[#C86A3A] relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 
            className="text-[32px] md:text-[36px] lg:text-[40px] text-white mb-6"
            style={{ 
              fontFamily: 'var(--font-inter), sans-serif', 
              fontWeight: 600,
              letterSpacing: '-0.01em'
            }}
          >
            Ready to Experience Tanzanian Flavours?
          </h2>
          <p className="text-white/90 text-lg mb-10 max-w-2xl mx-auto">
            Let us bring the taste of Tanzania to your next event. Get in touch for a custom quote tailored to your needs.
          </p>
            <Link href="/contact" className="btn-primary !bg-white !text-[#1E1B18] hover:!bg-[#FBF8F3] hover:!text-[#1E1B18]">
            Request a Quote
          </Link>
        </div>
      </section>
    </>
  );
}
