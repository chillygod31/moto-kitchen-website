import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "About Us | Moto Kitchen",
  description: "Learn about Moto Kitchen's story, our passion for Tanzanian cuisine, and our mission to bring authentic East African flavours to the Netherlands.",
};

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-[#2B1E1A]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[#C86A3A] text-sm uppercase tracking-widest mb-4">Our Story</p>
          <h1 
            className="text-4xl md:text-6xl font-bold text-white mb-6"
            style={{ 
              fontFamily: 'var(--font-dm-serif-display), serif', 
              fontWeight: 500,
              letterSpacing: '-0.02em',
              lineHeight: '1.1'
            }}
          >
            A Culinary Legacy
          </h1>
          <p className="text-xl text-white/80">
            A Culinary Journey from Tanzania to Elegance
          </p>
        </div>
      </section>

      {/* Origin Story */}
      <section className="section-padding bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="card space-y-6">
            <p 
              className="text-[#6B5B55] text-lg"
              style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, lineHeight: '1.75' }}
            >
              Moto Kitchen began the way many of our favourite meals begin. In a home kitchen, with a grandmother, a mother, and an aunt cooking for the people around them.
            </p>
            
            <p 
              className="text-[#6B5B55] text-lg"
              style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, lineHeight: '1.75' }}
            >
              The kind of cooking you learn by watching, tasting, and adjusting, until it feels right.
            </p>
            
            <p 
              className="text-[#6B5B55] text-lg"
              style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, lineHeight: '1.75' }}
            >
              Long before we were a company, we were simply the family that cooked. At parties and gatherings, everyone quickly became known for their best dish.
            </p>
            
            <p 
              className="text-[#6B5B55] text-lg"
              style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, lineHeight: '1.75' }}
            >
              That was about 12 to 13 years ago. Over time, people started asking if we could cook for them, first for birthdays and small celebrations, then for bigger moments where the food needed to feel like home.
            </p>
            
            {/* Pull Quote */}
            <div className="my-8 p-6 bg-[#FBF8F3] border-l-4 border-[#C86A3A] rounded-r-lg">
              <p className="text-[#1E1B18] text-xl md:text-2xl font-semibold italic leading-relaxed">
                &quot;The kind of cooking you learn by watching, tasting, and adjusting, until it feels right.&quot;
              </p>
            </div>
            
            <p 
              className="text-[#6B5B55] text-lg"
              style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, lineHeight: '1.75' }}
            >
              In 2023 we officially started Moto Kitchen as a business, and the kitchen grew with us.
            </p>
            
            <p 
              className="text-[#6B5B55] text-lg"
              style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, lineHeight: '1.75' }}
            >
              From family parties to weddings, engagement celebrations, office lunches, and festival crowds, we have been grateful to bring Tanzanian flavours to tables across the Netherlands, Belgium, Germany, and beyond.
            </p>
            
            <p 
              className="text-[#6B5B55] text-lg"
              style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, lineHeight: '1.75' }}
            >
              One of the moments we are quietly grateful for was being invited to cater for an event at the Tanzanian Embassy in the Netherlands.
            </p>
            
            <p 
              className="text-[#6B5B55] text-lg"
              style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, lineHeight: '1.75' }}
            >
              Since then, the embassy has remained a loyal client, and we appreciate that trust more than we can say.
            </p>
          </div>
        </div>
      </section>

      {/* Culinary Heritage */}
      <section className="section-padding bg-[#FBF8F3]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 
                className="text-[32px] md:text-[36px] lg:text-[40px] font-bold mb-6 text-[#1E1B18]"
                style={{ 
                  fontFamily: 'var(--font-inter), sans-serif', 
                  fontWeight: 600,
                  letterSpacing: '-0.01em'
                }}
              >
                Our Culinary Heritage
              </h2>
              <p 
                className="text-[#6B5B55] text-lg mb-4"
                style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, lineHeight: '1.75' }}
              >
                Our food is Tanzanian at heart. Our recipes were learned from our mothers and grandmothers, and we try to stay as close to home as possible, using spices from Tanzania and Zanzibar whenever we can.
              </p>
              <p 
                className="text-[#6B5B55] text-lg mb-4"
                style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, lineHeight: '1.75' }}
              >
                The flavours carry warmth, comfort, and a little spark, the kind that makes people pause after the first bite and say, &quot;this tastes like home.&quot;
              </p>
              <p 
                className="text-[#6B5B55] text-lg mb-4"
                style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, lineHeight: '1.75' }}
              >
                Tanzanian cuisine, shaped by Indian, Middle Eastern, and African influences, reflects a unique culinary crossroads.
              </p>
              <p 
                className="text-[#6B5B55] text-lg mb-4"
                style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, lineHeight: '1.75' }}
              >
                Situated along ancient trade routes, Tanzania&apos;s food culture has absorbed the spices of India, the aromatics of the Middle East, and the vibrant traditions of Africa.
              </p>
              <p 
              className="text-[#6B5B55] text-lg"
              style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, lineHeight: '1.75' }}
            >
                The result is a harmonious blend of flavors, spiced pilau, coconut curries, and dishes like nyama choma, that tell the story of a nation&apos;s rich history and diversity.
              </p>
            </div>
            <div className="relative aspect-square bg-[#FBF8F3] rounded-lg border border-[#E9E2D7] overflow-hidden">
              <Image
                src="/corporate-4.jpg"
                alt="Our Culinary Heritage"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="section-padding bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 
            className="text-[32px] md:text-[36px] lg:text-[40px] font-bold mb-6 text-[#1E1B18]"
            style={{ 
              fontFamily: 'var(--font-inter), sans-serif', 
              fontWeight: 600,
              letterSpacing: '-0.01em'
            }}
          >
            Our Dedicated Team
          </h2>
          <p className="text-[#4B4B4B] text-lg leading-relaxed mb-8">
            Today, we are a team of eight women, and we run Moto Kitchen like family. Someone is always tasting the sauce. Someone is fixing the garnish. Someone is reminding us it needs just a little more spice. We laugh a lot, we sometimes argue like family does, and we always pull together in the end, because what matters most to us is the connection around the table. Sharing a meal is how people meet, talk, and remember that in this life, we are more alike than we are different.
          </p>
          
          <p className="text-[#4B4B4B] text-lg leading-relaxed mb-8">
            Moto means fire in Swahili. For us, it is the fire in our kitchen and the passion in our veins, the kind of fire that turns a meal into a memory, and a gathering into something people feel.
          </p>
          
          <p className="text-[#C86A3A] text-xl font-semibold leading-relaxed">
            Karibu Moto Kitchen, a taste of Tanzania served like family.
          </p>
        </div>
      </section>

      {/* Our Services */}
      <section className="section-padding bg-[#FBF8F3]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#C86A3A] text-sm uppercase tracking-widest mb-4">What We Offer</p>
            <h2 
              className="text-[32px] md:text-[36px] lg:text-[40px] font-bold text-[#1E1B18]"
              style={{ 
                fontFamily: 'var(--font-inter), sans-serif', 
                fontWeight: 600,
                letterSpacing: '-0.01em'
              }}
            >
              Our Culinary Services
            </h2>
            <p className="text-[#4B4B4B] text-lg mt-4 max-w-3xl mx-auto">
              Tailored Experiences for Every Occasion
            </p>
          </div>

          <div className="card">
            <p className="text-[#4B4B4B] text-lg mb-6 leading-relaxed">
              At Moto Kitchen, we specialize in creating bespoke catering solutions designed to elevate your event. Whether it&apos;s an intimate gathering or a grand celebration, our offerings include:
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-[#C86A3A] text-xl">•</span>
                <div>
                  <h3 
                    className="text-[16px] md:text-[18px] lg:text-[20px] font-bold italic text-[#1E1B18] mb-1"
                    style={{ 
                      fontFamily: 'var(--font-inter), sans-serif', 
                      fontWeight: 600,
                      letterSpacing: '-0.01em'
                    }}
                  >
                    Buffets
                  </h3>
                  <p className="text-[#6B5B55] text-base">A diverse array of dishes that celebrate bold flavors and cultural richness.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-[#C86A3A] text-xl">•</span>
                <div>
                  <h3 
                    className="text-[16px] md:text-[18px] lg:text-[20px] font-bold italic text-[#1E1B18] mb-1"
                    style={{ 
                      fontFamily: 'var(--font-inter), sans-serif', 
                      fontWeight: 600,
                      letterSpacing: '-0.01em'
                    }}
                  >
                    Shared Dining
                  </h3>
                  <p className="text-[#6B5B55] text-base">Interactive, communal meals that bring people together.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-[#C86A3A] text-xl">•</span>
                <div>
                  <h3 
                    className="text-[16px] md:text-[18px] lg:text-[20px] font-bold italic text-[#1E1B18] mb-1"
                    style={{ 
                      fontFamily: 'var(--font-inter), sans-serif', 
                      fontWeight: 600,
                      letterSpacing: '-0.01em'
                    }}
                  >
                    Enhancements
                  </h3>
                  <p className="text-[#6B5B55] text-base">Thoughtful additions like curated cocktail menus and venue décor to complete the ambiance.</p>
                </div>
              </div>
            </div>
            
            <p className="text-[#4B4B4B] text-lg mt-6 leading-relaxed">
              Every service is crafted to reflect our commitment to bold flavors, refined presentation, and unforgettable experiences. Let us work with you to create a dining experience that not only nourishes but also inspires.
            </p>
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
            Let&apos;s Create Something Special Together
          </h2>
          <p className="text-white/90 text-lg mb-10">
            Ready to bring authentic Tanzanian flavours to your next event?
          </p>
          <Link href="/contact" className="btn-primary !bg-white !text-[#1E1B18] hover:!bg-[#FBF8F3] hover:!text-[#1E1B18]">
            Get in Touch
          </Link>
        </div>
      </section>
    </>
  );
}
