"use client";

import Link from "next/link";
import { useState } from "react";
import TestimonialGrid from "../../components/TestimonialGrid";
import { galleryItems } from "../../../lib/gallery-data";
import { formatPricing } from "../../../lib/pricing-data";

const includedItems = [
  { icon: "🎂", title: "Celebration Menus", description: "Special menus for birthdays, anniversaries & milestones" },
  { icon: "👨‍👩‍👧‍👦", title: "Family-Style Options", description: "Shared platters that bring people together" },
  { icon: "🎨", title: "Themed Menus", description: "Cultural celebrations and themed events" },
  { icon: "🏠", title: "Home Catering", description: "We come to your home or chosen venue" },
  { icon: "📏", title: "Any Size", description: "From intimate dinners to large gatherings" },
  { icon: "🍰", title: "Desserts Included", description: "Traditional Tanzanian sweets and treats" },
  { icon: "🥂", title: "Special Occasions", description: "Corporate events, weddings, engagement parties, graduations & more" },
  { icon: "❤️", title: "Personal Touch", description: "Customized to your preferences" },
];

const faqs = [
  { question: "What is the minimum guest count?", answer: "We cater for both intimate gatherings and large events. Tell us your guest count and we'll propose the best setup." },
  { question: "Can you cater at my home?", answer: "Yes! We regularly cater at private homes. We just need access to a basic setup area and electricity." },
  { question: "How do I choose a menu?", answer: "We'll discuss your preferences, dietary needs, and event style, then create a custom menu proposal for your approval." },
  { question: "Do you cater cultural celebrations?", answer: "Absolutely! We specialize in Tanzanian cuisine and can create authentic menus for cultural celebrations and heritage events." },
  { question: "What about dietary restrictions?", answer: "We accommodate all dietary needs including vegetarian, vegan, gluten free, and allergies. Just let us know." },
  { question: "Can I request specific dishes?", answer: "Yes! If there's a specific Tanzanian dish you love or want to try, let us know and we'll include it." },
  { question: "Do you provide serving staff for home events?", answer: "Yes, we can provide servers for your home event so you can relax and enjoy with your guests." },
  { question: "What's included in the price?", answer: "Our quotes include food, serving equipment, setup, and cleanup. Staff is included for full-service packages." },
  { question: "How far in advance should I book?", answer: "We recommend 2 to 3 weeks for most private events. For larger gatherings or peak seasons, book earlier." },
];

const testimonials = [
  { quote: "As a Tanzanian living in the Netherlands, this felt like home. The chapati and pilau were perfect! My family loved every dish.", author: "Amina J.", location: "Utrecht", eventType: "Family Gathering", rating: 5 },
  { quote: "We hired Moto Kitchen for our daughter's graduation party. The food was fresh, flavourful, and the service was impeccable.", author: "Sarah M.", location: "The Hague", eventType: "Private Party", rating: 5 },
];

const howItWorksSteps = [
  { 
    number: "1", 
    title: "Inquiry", 
    bullets: [
      "Submit our quote form (2 minutes) or contact us directly",
      "Share your date, location, guest count, and budget",
      "Tell us any dietary needs or preferred dishes"
    ]
  },
  { 
    number: "2", 
    title: "Proposal", 
    bullets: [
      "Receive a tailored menu + quote within 24 to 48 hours",
      "Clear options based on your event style and budget",
      "Optional consultation call (if helpful)"
    ]
  },
  { 
    number: "3", 
    title: "Confirm", 
    bullets: [
      "Secure your date with a 50% deposit (or full payment if within 7 days)",
      "Final guest count confirmed 5 days before",
      "We finalize logistics with you/your venue"
    ]
  },
  { 
    number: "4", 
    title: "Event Day", 
    bullets: [
      "We arrive on time with fresh, beautifully presented food",
      "Seamless setup and service (as agreed)",
      "You enjoy the moment and we handle the rest"
    ]
  },
];

// Get both private and corporate images from gallery data
const eventImages = galleryItems
  .filter(item => item.category === "private" || item.category === "corporate")
  .map(item => item.src);

export default function PrivateEventsPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % eventImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + eventImages.length) % eventImages.length);
  };

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center bg-[#2B1E1A]">
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto pt-20">
          <p className="text-[#C86A3A] text-sm uppercase tracking-widest mb-4" style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 500 }}>Our Services</p>
          <h1 
            className="text-[36px] md:text-[56px] lg:text-[72px] text-white mb-6"
            style={{ 
              fontFamily: 'var(--font-dm-serif-display), serif', 
              fontWeight: 500,
              letterSpacing: '-0.02em',
              lineHeight: '1.1'
            }}
          >
            Private Event Catering
          </h1>
                  <p 
                    className="text-xl text-white/80 mb-4 max-w-2xl mx-auto"
                    style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, lineHeight: '1.7' }}
                  >
                    Bring people together with food that creates memories
                  </p>
                  <Link
            href="/contact" 
            className="btn-primary text-lg"
            style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 600 }}
          >
            Request a Quote
          </Link>
        </div>
      </section>

      {/* Intro */}
      <section className="section-padding bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <p 
            className="text-lg text-[#6B5B55]"
            style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, lineHeight: '1.75' }}
          >
            Life's special moments deserve exceptional food. Our team of eight women, running Moto Kitchen like family, brings authentic Tanzanian cuisine to your celebrations. Our recipes were learned from our mothers and grandmothers, using spices from Tanzania and Zanzibar whenever we can. Whether you're celebrating a birthday, anniversary, graduation, or simply gathering loved ones together, we add warmth and flavour to every occasion. We bring the feast to you at home or your chosen venue.
          </p>
        </div>
      </section>

      {/* What We Offer */}
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
              {includedItems.map((item, index) => (
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
                      className="text-[#6B5B55] text-sm md:text-sm"
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
                  src={eventImages[currentImageIndex]} 
                  alt={`Event ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
              </div>
              
              {/* Navigation Buttons */}
              {eventImages.length > 1 && (
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
                    {eventImages.map((_, index) => (
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
                <Link 
                  href="/gallery" 
                  className="text-[#C86A3A] font-semibold hover:underline text-sm inline-block"
                  style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 500 }}
                >
                  View Full Gallery →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding bg-[#2B1E1A]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p 
              className="text-sm uppercase tracking-widest mb-4 text-[#C86A3A]"
              style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 500 }}
            >
              Simple Process
            </p>
            <h2 
              className="text-[32px] md:text-[36px] lg:text-[40px] text-white mb-6"
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
            {howItWorksSteps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-[#C86A3A] rounded-full flex items-center justify-center mx-auto mb-6">
                  <span 
                    className="text-2xl font-bold text-white"
                    style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 600 }}
                  >
                    {step.number}
                  </span>
                </div>
                <h3 
                  className="text-[22px] md:text-[24px] lg:text-[28px] mb-4 text-white"
                  style={{ 
                    fontFamily: 'var(--font-inter), sans-serif', 
                    fontWeight: 600,
                    letterSpacing: '-0.01em'
                  }}
                >
                  {step.title}
                </h3>
                {step.bullets ? (
                  <ul className="text-white/70 text-left space-y-2 max-w-xs mx-auto" style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, lineHeight: '1.7' }}>
                    {step.bullets.map((bullet, bulletIndex) => (
                      <li key={bulletIndex} className="flex items-start">
                        <span className="text-[#C86A3A] mr-2 mt-1">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-white/70" style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, lineHeight: '1.7' }}>
                    {step.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p 
              className="text-[#C86A3A] text-sm uppercase tracking-widest mb-4"
              style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 500 }}
            >
              FAQ
            </p>
            <h2 
              className="text-[32px] md:text-[36px] lg:text-[40px] text-[#1E1B18]"
              style={{ 
                fontFamily: 'var(--font-inter), sans-serif', 
                fontWeight: 600,
                letterSpacing: '-0.01em'
              }}
            >
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="card">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex justify-between items-center text-left gap-4"
                >
                  <span 
                    className="font-bold text-[#1E1B18] text-[16px] md:text-[18px]"
                    style={{ 
                      fontFamily: 'var(--font-inter), sans-serif', 
                      fontWeight: 600,
                      letterSpacing: '-0.01em'
                    }}
                  >
                    {faq.question}
                  </span>
                  <svg
                    className={`w-5 h-5 text-[#C86A3A] flex-shrink-0 transition-transform ${
                      openFaqIndex === index ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaqIndex === index && (
                  <p 
                    className="mt-4 text-[#6B5B55] text-[16px] md:text-[17px]"
                    style={{ 
                      fontFamily: 'var(--font-inter), sans-serif', 
                      fontWeight: 400, 
                      lineHeight: '1.7', 
                      maxWidth: '65ch', 
                      letterSpacing: '-0.01em' 
                    }}
                  >
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <TestimonialGrid testimonials={testimonials} columns={2} />
      )}

      {/* CTA */}
      <section className="section-padding bg-[#C86A3A] relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 
            className="text-[32px] md:text-[36px] lg:text-[40px] font-bold mb-6 text-white"
            style={{ 
              fontFamily: 'var(--font-inter), sans-serif', 
              fontWeight: 600,
              letterSpacing: '-0.01em'
            }}
          >
            Ready to Plan Your Event?
          </h2>
          <p 
            className="text-lg mb-10 text-white/90"
            style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, lineHeight: '1.7' }}
          >
            Let's create an unforgettable culinary experience for your guests.
          </p>
          <Link
            href="/contact"
            className="btn-primary !bg-white !text-[#1E1B18] hover:!bg-[#FBF8F3] hover:!text-[#1E1B18]"
            style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 600 }}
          >
            Request a Quote
          </Link>
        </div>
      </section>
    </>
  );
}
