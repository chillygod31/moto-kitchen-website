import Link from "next/link";

export const metadata = {
  title: "Menu & Packages | Moto Kitchen",
  description: "Explore our authentic Tanzanian catering menu. From pilau to chapati, discover the flavours we can bring to your event.",
};

const menuCategories = [
  {
    name: "Main Dishes",
    items: [
      { name: "Pilau", description: "Aromatic spiced rice cooked with meat, a Tanzanian celebration staple", tags: ["GF"] },
      { name: "Wali wa Nazi", description: "Fragrant coconut rice, a coastal Tanzanian favourite", tags: ["V", "GF"] },
      { name: "Mchuzi wa Kuku", description: "Traditional chicken curry in rich coconut sauce", tags: ["GF"] },
      { name: "Nyama Choma", description: "Grilled meat seasoned with East African spices", tags: ["GF", "Spicy"] },
      { name: "Mshikaki", description: "Marinated meat skewers, perfect for any gathering", tags: ["GF", "Spicy"] },
      { name: "Samaki wa Kupaka", description: "Fish in creamy coconut sauce with Swahili spices", tags: ["GF"] },
    ],
  },
  {
    name: "Sides & Accompaniments",
    items: [
      { name: "Chapati", description: "Soft, layered flatbread made fresh", tags: ["V"] },
      { name: "Ugali", description: "Traditional maize porridge, the heart of Tanzanian meals", tags: ["V", "GF"] },
      { name: "Maharage", description: "Spiced bean stew in coconut milk", tags: ["V", "GF"] },
      { name: "Kachumbari", description: "Fresh tomato and onion salad", tags: ["V", "GF"] },
      { name: "Mchicha", description: "Sautéed amaranth greens with coconut", tags: ["V", "GF"] },
    ],
  },
  {
    name: "Snacks & Appetizers",
    items: [
      { name: "Samosa", description: "Crispy pastries filled with spiced meat or vegetables", tags: [] },
      { name: "Mandazi", description: "Sweet fried dough, perfect with chai", tags: ["V"] },
      { name: "Vitumbua", description: "Coconut rice pancakes", tags: ["V"] },
      { name: "Mishkaki Appetizer", description: "Mini meat skewers for starters", tags: ["GF"] },
    ],
  },
  {
    name: "Beverages",
    items: [
      { name: "Chai ya Tangawizi", description: "Spiced ginger tea", tags: ["V"] },
      { name: "Fresh Juices", description: "Passion fruit, mango, and tropical blends", tags: ["V", "GF"] },
    ],
  },
];

const packages = [
  {
    name: "Starter Package",
    guests: "10-20 guests",
    description: "Perfect for intimate gatherings and small parties",
    includes: ["2 main dishes", "2 sides", "1 appetizer", "Serving & setup"],
    price: "From €250",
  },
  {
    name: "Classic Package",
    guests: "20-50 guests",
    description: "Ideal for medium-sized events and celebrations",
    includes: ["3 main dishes", "3 sides", "2 appetizers", "Beverages", "Serving & setup", "Disposable tableware"],
    price: "From €500",
    popular: true,
  },
  {
    name: "Grand Feast",
    guests: "50+ guests",
    description: "Full catering experience for large events",
    includes: ["4+ main dishes", "4 sides", "3 appetizers", "Beverages", "Full service staff", "Premium tableware", "Custom menu planning"],
    price: "Custom quote",
  },
];

export default function MenuPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-[#3A2A24]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">Our Offerings</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Menu & Packages
          </h1>
          <p className="text-xl text-white/80">
            Authentic Tanzanian dishes crafted with love and tradition
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="py-12 bg-[#F1E7DA] border-b border-[#E6D9C8]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[#4B4B4B] text-lg leading-relaxed">
            Tanzanian cuisine is a vibrant blend of African, Arab, and Indian influences. 
            Our dishes feature aromatic spices, fresh coconut, and bold flavours that have been 
            perfected over generations. Every menu is customizable to your preferences and dietary needs.
          </p>
        </div>
      </section>

      {/* Packages Section */}
      <section className="section-padding bg-[#FAF6EF]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">Catering Packages</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1F1F1F]">
              Choose Your Experience
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {packages.map((pkg, index) => (
              <div 
                key={index}
                className={`card flex flex-col relative ${pkg.popular ? 'ring-2 ring-[#C9653B]' : ''}`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C9653B] text-white text-xs px-4 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold text-[#1F1F1F] mb-2">
                  {pkg.name}
                </h3>
                <p className="text-[#C9653B] font-semibold mb-4">{pkg.guests}</p>
                <p className="text-[#4B4B4B] mb-6">
                  {pkg.description}
                </p>
                <ul className="space-y-2 mb-8 flex-grow">
                  {pkg.includes.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-[#4B4B4B]">
                      <svg className="w-5 h-5 text-[#C9653B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="border-t border-[#E6D9C8] pt-6">
                  <p className="text-2xl font-bold text-[#1F1F1F] mb-4">
                    {pkg.price}
                  </p>
                  <Link 
                    href="/contact" 
                    className={pkg.popular ? 'btn-primary w-full text-center block' : 'btn-secondary w-full text-center block'}
                  >
                    Get a Quote
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-[#4B4B4B] mt-8">
            All packages can be customized to your preferences and dietary requirements.
          </p>
        </div>
      </section>

      {/* Menu Section */}
      <section className="section-padding bg-[#F1E7DA]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">Our Dishes</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1F1F1F]">
              What We Serve
            </h2>
            <div className="flex justify-center gap-4 mt-6">
              <span className="tag tag-v">V = Vegetarian</span>
              <span className="tag tag-gf">GF = Gluten-Free</span>
              <span className="tag tag-spicy">Spicy</span>
            </div>
          </div>

          <div className="space-y-12">
            {menuCategories.map((category, catIndex) => (
              <div key={catIndex}>
                <h3 className="text-2xl font-bold text-[#1F1F1F] mb-8 pb-4 border-b-2 border-[#C9653B]">
                  {category.name}
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {category.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="card">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-semibold text-[#1F1F1F] text-lg">{item.name}</h4>
                          <p className="text-[#4B4B4B] mt-1">{item.description}</p>
                        </div>
                        {item.tags.length > 0 && (
                          <div className="flex gap-1 flex-shrink-0">
                            {item.tags.map((tag, i) => (
                              <span 
                                key={i} 
                                className={`tag ${
                                  tag === "V" ? "tag-v" : 
                                  tag === "GF" ? "tag-gf" : 
                                  tag === "Spicy" ? "tag-spicy" : ""
                                }`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-[#C9653B]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Plan Your Menu?
          </h2>
          <p className="text-white/90 text-lg mb-10">
            Contact us to discuss your event and create a custom menu that fits your needs.
          </p>
          <Link href="/contact" className="bg-white text-[#C9653B] px-8 py-4 rounded-md font-semibold text-lg hover:bg-[#FAF6EF] transition-colors inline-block">
            Request a Custom Menu
          </Link>
        </div>
      </section>
    </>
  );
}
