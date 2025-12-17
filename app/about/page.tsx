import Link from "next/link";

export const metadata = {
  title: "About Us | Moto Kitchen",
  description: "Learn about Moto Kitchen's story, our passion for Tanzanian cuisine, and our mission to bring authentic East African flavours to the Netherlands.",
};

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-[#3A2A24]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">Our Story</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            A Culinary Legacy
          </h1>
          <p className="text-xl text-white/80">
            A Culinary Journey from Tanzania to Elegance
          </p>
        </div>
      </section>

      {/* Origin Story */}
      <section className="section-padding bg-[#FAF6EF]">
        <div className="max-w-4xl mx-auto">
          <div className="card space-y-6">
            <p className="text-[#4B4B4B] text-lg leading-relaxed">
              Moto Kitchen was born in the heart of a family, where three extraordinary women, a grandmother, mother, and aunt, turned their passion for cooking into a cherished legacy. Inspired by their success and the profound impact of their culinary artistry, they all envisioned something greater. What began as a family tradition soon evolved into a thriving venture, with Moto Kitchen organizing wedding buffets, participating in festivals and conferences, and building a strong community presence across the Benelux region through social platforms. Today, it stands as a vibrant story of connection, flavor, and artistry.
            </p>
            
            <p className="text-[#4B4B4B] text-lg leading-relaxed">
              A defining moment came when the Tanzanian Embassy in the Netherlands invited Moto Kitchen to cater a special event. The ambassador&apos;s praise not only solidified our reputation but also opened doors to new opportunities. Since then, the embassy has become one of our most valued clients, entrusting us to deliver exceptional culinary experiences for their events.
            </p>
          </div>
        </div>
      </section>

      {/* Culinary Heritage */}
      <section className="section-padding bg-[#F1E7DA]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[#1F1F1F]">
                Our Culinary Heritage
              </h2>
              <p className="text-[#4B4B4B] text-lg mb-6 leading-relaxed">
                At Moto Kitchen, every dish is a celebration of heritage. Tanzanian cuisine, shaped by Indian, Middle Eastern, and African influences, reflects a unique culinary crossroads. Situated along ancient trade routes, Tanzania&apos;s food culture has absorbed the spices of India, the aromatics of the Middle East, and the vibrant traditions of Africa.
              </p>
              <p className="text-[#4B4B4B] text-lg leading-relaxed">
                The result is a harmonious blend of flavors — spiced pilau, coconut curries, and dishes like nyama choma — that tell the story of a nation&apos;s rich history and diversity. We honor this legacy in every dish, crafting bold, authentic flavors that bridge heritage and taste.
              </p>
            </div>
            <div className="aspect-square bg-[#FAF6EF] rounded-lg border border-[#E6D9C8] overflow-hidden">
              <div className="w-full h-full flex items-center justify-center text-[#4B4B4B]">
                <div className="text-center">
                  <p className="text-6xl mb-4">🌍</p>
                  <p className="text-sm">Heritage Photo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="section-padding bg-[#FAF6EF]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[#1F1F1F]">
            Our Dedicated Team
          </h2>
          <p className="text-[#4B4B4B] text-lg leading-relaxed mb-8">
            Our dedicated team of eight women, all daughters of the original cooks and chefs who inspired Moto Kitchen, continues this legacy with passion and precision. They bring a deep-rooted understanding of tradition while embracing innovation to elevate our culinary offerings. Every dish is prepared with care, ensuring that each event reflects the warmth, dedication, and excellence that define us.
          </p>
        </div>
      </section>

      {/* Our Services */}
      <section className="section-padding bg-[#F1E7DA]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">What We Offer</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1F1F1F]">
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
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <span className="text-[#C9653B] text-xl">•</span>
                <div>
                  <h3 className="font-semibold text-[#1F1F1F] mb-1">Buffets</h3>
                  <p className="text-[#4B4B4B] text-sm">A diverse array of dishes that celebrate bold flavors and cultural richness.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-[#C9653B] text-xl">•</span>
                <div>
                  <h3 className="font-semibold text-[#1F1F1F] mb-1">Shared Dining</h3>
                  <p className="text-[#4B4B4B] text-sm">Interactive, communal meals that bring people together.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-[#C9653B] text-xl">•</span>
                <div>
                  <h3 className="font-semibold text-[#1F1F1F] mb-1">Plated Dinners</h3>
                  <p className="text-[#4B4B4B] text-sm">Elegantly presented courses for a refined dining experience.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-[#C9653B] text-xl">•</span>
                <div>
                  <h3 className="font-semibold text-[#1F1F1F] mb-1">Enhancements</h3>
                  <p className="text-[#4B4B4B] text-sm">Thoughtful additions like curated wine pairings and venue décor to complete the ambiance.</p>
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
      <section className="section-padding bg-[#C9653B]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Let&apos;s Create Something Special Together
          </h2>
          <p className="text-white/90 text-lg mb-10">
            Ready to bring authentic Tanzanian flavours to your next event?
          </p>
          <Link href="/contact" className="bg-white text-[#C9653B] px-8 py-4 rounded-md font-semibold text-lg hover:bg-[#FAF6EF] transition-colors inline-block">
            Get in Touch
          </Link>
        </div>
      </section>
    </>
  );
}
