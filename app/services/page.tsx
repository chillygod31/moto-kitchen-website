import Link from "next/link";

export const metadata = {
  title: "Our Services | Moto Kitchen",
  description: "Explore Moto Kitchen's catering services for weddings, corporate events, and private parties. Authentic Tanzanian cuisine across the Netherlands.",
};

const services = [
  {
    href: "/services/weddings",
    title: "Weddings",
    image: "💒",
    description: "Make your special day unforgettable with authentic Tanzanian cuisine that tells your cultural story.",
    features: ["Custom menu planning", "Tasting sessions", "Full service catering", "Dietary accommodations"],
  },
  {
    href: "/services/corporate",
    title: "Corporate Events",
    image: "🏢",
    description: "Impress your clients and team with unique East African flavours for meetings, conferences, and company celebrations.",
    features: ["Office lunches", "Conference catering", "Team celebrations", "Client entertainment"],
  },
  {
    href: "/services/private-events",
    title: "Private Events",
    image: "🎉",
    description: "From birthday parties to family reunions, we bring the warmth of Tanzanian hospitality to your gathering.",
    features: ["Birthday parties", "Anniversaries", "Family gatherings", "Cultural celebrations"],
  },
];

export default function ServicesPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-[#3A2A24]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">What We Offer</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Our Services
          </h1>
          <p className="text-xl text-white/80">
            Authentic Tanzanian catering for every occasion
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section-padding bg-[#FAF6EF]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="card flex flex-col">
                <div className="text-6xl mb-6">{service.image}</div>
                <h2 className="text-2xl font-bold text-[#1F1F1F] mb-4">{service.title}</h2>
                <p className="text-[#4B4B4B] mb-6 flex-grow">{service.description}</p>
                <ul className="space-y-2 mb-6">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-[#4B4B4B] text-sm">
                      <svg className="w-4 h-4 text-[#C9653B]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href={service.href} className="btn-primary text-center">
                  Learn More
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding bg-[#F1E7DA]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">Simple Process</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1F1F1F]">
              How It Works
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Inquiry", description: "Tell us about your event and requirements" },
              { step: "2", title: "Proposal", description: "Receive a custom menu and quote" },
              { step: "3", title: "Confirm", description: "Finalize details and secure your date" },
              { step: "4", title: "Catering Day", description: "We deliver an unforgettable experience" },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-[#C9653B] rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-white">{item.step}</span>
                </div>
                <h3 className="text-xl font-semibold text-[#1F1F1F] mb-3">{item.title}</h3>
                <p className="text-[#4B4B4B]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-[#C9653B]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Plan Your Event?
          </h2>
          <p className="text-white/90 text-lg mb-10">
            Contact us for a free consultation and custom quote.
          </p>
          <Link href="/contact" className="bg-white text-[#C9653B] px-8 py-4 rounded-md font-semibold text-lg hover:bg-[#FAF6EF] transition-colors inline-block">
            Request a Quote
          </Link>
        </div>
      </section>
    </>
  );
}

