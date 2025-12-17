import Link from "next/link";

export default function Home() {
  const signatureDishes = [
    { name: "Pilau", description: "Aromatic spiced rice with tender meat", tags: ["GF"] },
    { name: "Mchuzi wa Kuku", description: "Chicken in rich coconut curry", tags: ["GF"] },
    { name: "Nyama Choma", description: "Grilled meat with East African spices", tags: ["GF", "Spicy"] },
    { name: "Chapati", description: "Soft, layered flatbread", tags: ["V"] },
    { name: "Samaki wa Kupaka", description: "Fish in creamy coconut sauce", tags: ["GF"] },
    { name: "Maharage", description: "Spiced beans in coconut milk", tags: ["V", "GF"] },
    { name: "Mshikaki", description: "Marinated meat skewers", tags: ["GF", "Spicy"] },
    { name: "Mandazi", description: "Sweet fried dough, perfect with chai", tags: ["V"] },
  ];

  const trustPoints = [
    "Available Nationwide",
    "Custom Menus",
    "Dietary Options",
    "Professional Service",
    "Authentic Recipes",
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
            className="w-full h-full object-cover"
            poster="/hero-poster.jpg"
          >
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/50" />
        </div>
        
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <p className="text-[#C9653B] text-lg mb-4 tracking-widest uppercase">Karibu</p>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Authentic Tanzanian Catering Across the Netherlands
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-10 max-w-2xl mx-auto">
            From intimate dinners to large weddings & corporate events.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="btn-primary text-lg">
              Request a Quote
            </Link>
            <Link href="/menu" className="btn-secondary text-lg !text-white !border-white hover:!bg-white hover:!text-[#1F1F1F]">
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
                Moto Kitchen was born from a love of Tanzanian cuisine and a desire to share the rich, 
                bold flavours of East Africa with the Netherlands. Every dish we create carries the 
                warmth and tradition of home-cooked Tanzanian meals.
              </p>
              <p className="text-[#4B4B4B] text-lg mb-8 leading-relaxed">
                &ldquo;Moto&rdquo; means fire in Swahili — and we bring that fire to every event we cater.
              </p>
              <Link href="/about" className="text-[#C9653B] font-semibold hover:underline inline-flex items-center gap-2">
                Read Our Full Story
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
            <div className="relative">
              <div className="aspect-[4/5] bg-[#F1E7DA] rounded-lg overflow-hidden border border-[#E6D9C8]">
                <div className="w-full h-full flex items-center justify-center text-[#4B4B4B]">
                  <div className="text-center">
                    <p className="text-6xl mb-4">🍲</p>
                    <p className="text-sm">Chef Photo</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[#C9653B] rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  <p className="text-3xl font-bold">10+</p>
                  <p className="text-xs uppercase tracking-wider">Years of Passion</p>
                </div>
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

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                href: "/services/weddings",
                image: "💒",
                title: "Weddings",
                description: "Make your special day unforgettable with a menu that tells your cultural story."
              },
              {
                href: "/services/corporate",
                image: "🏢",
                title: "Corporate",
                description: "Impress your clients and team with unique East African cuisine for meetings and events."
              },
              {
                href: "/services/private-events",
                image: "🎉",
                title: "Private Events",
                description: "Birthday parties, anniversaries, and family gatherings with authentic flavours."
              }
            ].map((service, index) => (
              <Link 
                key={index}
                href={service.href}
                className="card hover:shadow-md transition-shadow group"
              >
                <div className="text-5xl mb-6">{service.image}</div>
                <h3 className="text-xl font-semibold text-[#1F1F1F] mb-4 group-hover:text-[#C9653B] transition-colors">
                  {service.title}
                </h3>
                <p className="text-[#4B4B4B]">
                  {service.description}
                </p>
                <span className="inline-flex items-center gap-1 mt-4 text-[#C9653B] font-semibold text-sm">
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
              <div key={index} className="card text-center">
                <h3 className="text-lg font-semibold text-[#1F1F1F] mb-2">{dish.name}</h3>
                <p className="text-[#4B4B4B] text-sm mb-3">{dish.description}</p>
                <div className="flex justify-center gap-2">
                  {dish.tags.map((tag, i) => (
                    <span 
                      key={i} 
                      className={`tag ${
                        tag === "V" ? "tag-v" : 
                        tag === "GF" ? "tag-gf" : 
                        tag === "Spicy" ? "tag-spicy" : ""
                      }`}
                    >
                      {tag === "V" ? "Vegetarian" : tag === "GF" ? "Gluten-Free" : tag}
                    </span>
                  ))}
                </div>
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
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="aspect-square bg-[#F1E7DA] rounded-lg border border-[#E6D9C8] flex items-center justify-center">
                <span className="text-4xl">🍽️</span>
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
