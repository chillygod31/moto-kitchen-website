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
            About Moto Kitchen
          </h1>
          <p className="text-xl text-white/80">
            Bringing the fire and flavour of Tanzania to the Netherlands
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="section-padding bg-[#FAF6EF]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[#1F1F1F]">
                The Meaning Behind &ldquo;Moto&rdquo;
              </h2>
              <p className="text-[#4B4B4B] text-lg mb-6 leading-relaxed">
                In Swahili, &ldquo;Moto&rdquo; means fire. It represents the heart of our cooking — the flames 
                that transform simple ingredients into extraordinary dishes, the warmth of gathering 
                around food, and the passion we bring to every meal we prepare.
              </p>
              <p className="text-[#4B4B4B] text-lg mb-6 leading-relaxed">
                Moto Kitchen was founded with a simple mission: to share the authentic flavours of 
                Tanzania with people in the Netherlands. Every recipe we use has been passed down 
                through generations, carrying the stories and traditions of East African cuisine.
              </p>
              <p className="text-[#4B4B4B] text-lg leading-relaxed">
                Whether it&apos;s the aromatic spices of pilau, the comfort of freshly made chapati, or 
                the rich flavours of mchuzi wa kuku, we pour our heritage into every dish.
              </p>
            </div>
            <div className="order-1 md:order-2">
              <div className="aspect-square bg-[#F1E7DA] rounded-lg border border-[#E6D9C8] overflow-hidden">
                <div className="w-full h-full flex items-center justify-center text-[#4B4B4B]">
                  <div className="text-center">
                    <p className="text-6xl mb-4">🔥</p>
                    <p className="text-sm">Kitchen Photo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section-padding bg-[#F1E7DA]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">What We Believe</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1F1F1F]">
              Our Values
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Authenticity",
                description: "We stay true to traditional Tanzanian recipes and cooking methods. No shortcuts, no compromises on flavour."
              },
              {
                title: "Quality",
                description: "We source the freshest ingredients and prepare everything with care. Your event deserves the best."
              },
              {
                title: "Hospitality",
                description: "In Tanzania, we say 'Karibu' — welcome. We treat every client like family and every event like our own."
              }
            ].map((value, index) => (
              <div key={index} className="card text-center">
                <div className="w-16 h-16 bg-[#C9653B] rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-2xl font-bold">{index + 1}</span>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-[#1F1F1F]">
                  {value.title}
                </h3>
                <p className="text-[#4B4B4B]">
                  {value.description}
                </p>
              </div>
            ))}
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
