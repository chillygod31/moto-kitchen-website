import Link from "next/link";
import FAQAccordion from "./FAQAccordion";
import TestimonialGrid from "./TestimonialGrid";
import CTASection from "./CTASection";
import HowItWorks from "./HowItWorks";

interface IncludedItem {
  icon: string;
  title: string;
  description: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface Testimonial {
  quote: string;
  author: string;
  location?: string;
  eventType?: string;
  rating?: number;
}

interface GalleryImage {
  src: string;
  alt: string;
}

interface ServicePageTemplateProps {
  heroTitle: string;
  heroSubtitle: string;
  heroImage?: string;
  introText: string;
  includedItems: IncludedItem[];
  galleryImages: GalleryImage[];
  faqs: FAQ[];
  testimonials: Testimonial[];
  howItWorksSteps?: { number: string; title: string; description?: string; bullets?: string[] }[];
  customWhatsIncluded?: React.ReactNode;
  pricing?: string;
}

export default function ServicePageTemplate({
  heroTitle,
  heroSubtitle,
  heroImage,
  introText,
  includedItems,
  galleryImages,
  faqs,
  testimonials,
  howItWorksSteps,
  customWhatsIncluded,
  pricing,
}: ServicePageTemplateProps) {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center bg-[#2B1E1A]">
        {heroImage && (
          <>
            <div className="absolute inset-0">
              <img src={heroImage} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="absolute inset-0 bg-black/60" />
          </>
        )}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto pt-20">
          <p className="text-[#C86A3A] text-sm uppercase tracking-widest mb-4">Our Services</p>
          <h1 
            className="text-4xl md:text-6xl font-bold text-white mb-6"
            style={{ 
              fontFamily: 'var(--font-dm-serif-display), serif', 
              fontWeight: 500,
              letterSpacing: '-0.02em',
              lineHeight: '1.1'
            }}
          >
            {heroTitle}
          </h1>
          <p 
            className="text-xl text-white/80 mb-4 max-w-2xl mx-auto"
            style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, lineHeight: '1.7' }}
          >
            {heroSubtitle}
          </p>
          {pricing && (
            <p 
              className="text-[#C86A3A] font-semibold text-lg mb-6"
              style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 600 }}
            >
              {pricing}
            </p>
          )}
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
            {introText}
          </p>
        </div>
      </section>

      {/* What We Offer */}
      {customWhatsIncluded ? (
        customWhatsIncluded
      ) : (
        <section className="section-padding bg-[#FBF8F3]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 
                className="text-[32px] md:text-[36px] lg:text-[40px] font-bold text-[#1E1B18]"
                style={{ 
                  fontFamily: 'var(--font-inter), sans-serif', 
                  fontWeight: 600,
                  letterSpacing: '-0.01em'
                }}
              >
                What We Offer
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {includedItems.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 
                    className="font-semibold text-[#1E1B18] mb-2"
                    style={{ 
                      fontFamily: 'var(--font-inter), sans-serif', 
                      fontWeight: 600,
                      fontSize: '16px',
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
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      {howItWorksSteps && howItWorksSteps.length > 0 && (
        <HowItWorks steps={howItWorksSteps} />
      )}

      {/* Gallery Strip */}
      {galleryImages.length > 0 && (
        <section className="bg-white py-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8 px-6">
              <p className="text-[#C86A3A] text-sm uppercase tracking-widest mb-4">Our Work</p>
              <h2 
                className="text-[32px] md:text-[36px] lg:text-[40px] font-bold text-[#1E1B18]"
                style={{ 
                  fontFamily: 'var(--font-inter), sans-serif', 
                  fontWeight: 600,
                  letterSpacing: '-0.01em'
                }}
              >
                Gallery
              </h2>
            </div>
            <div className="flex overflow-x-auto gap-4 px-6 pb-4 snap-x snap-mandatory scrollbar-hide">
              {galleryImages.map((image, index) => (
                <div 
                  key={index} 
                  className="flex-shrink-0 w-72 h-48 rounded-lg overflow-hidden snap-start border border-[#E9E2D7]"
                >
                  {image.src ? (
                    <img src={image.src} alt={image.alt} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#FBF8F3] flex items-center justify-center">
                      <span className="text-4xl">🍽️</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-6">
              <Link 
                href="/gallery" 
                className="text-[#C86A3A] font-semibold hover:underline"
                style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 500 }}
              >
                View Full Gallery →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <FAQAccordion faqs={faqs} />

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <TestimonialGrid testimonials={testimonials} columns={2} />
      )}

      {/* CTA */}
      <CTASection
        title="Ready to Plan Your Event?"
        description="Let's create an unforgettable culinary experience for your guests."
        variant="primary"
      />
    </>
  );
}

