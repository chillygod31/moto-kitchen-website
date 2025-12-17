import ServiceCard from "../components/ServiceCard";
import CTASection from "../components/CTASection";

export const metadata = {
  title: "Catering Services | Moto Kitchen",
  description: "Authentic Tanzanian catering for weddings, corporate events, and private parties across the Netherlands. Custom menus, professional service.",
};

const services = [
  {
    href: "/services/weddings",
    title: "Wedding Catering",
    description: "Make your special day unforgettable with authentic Tanzanian cuisine. From intimate ceremonies to grand celebrations.",
    icon: "💒",
    features: [
      "Custom menu planning",
      "Tasting sessions",
      "Full-service staff",
      "Setup & cleanup",
    ],
  },
  {
    href: "/services/corporate",
    title: "Corporate Events",
    description: "Impress your team and clients with unique flavours. Perfect for team lunches, conferences, and company celebrations.",
    icon: "🏢",
    features: [
      "Flexible packages",
      "Professional presentation",
      "Dietary accommodations",
      "Reliable service",
    ],
  },
  {
    href: "/services/private-events",
    title: "Private Events",
    description: "Birthday parties, family gatherings, anniversaries — bring people together with food that creates memories.",
    icon: "🎉",
    features: [
      "Personalized menus",
      "Intimate to large groups",
      "Family-style options",
      "Cultural celebrations",
    ],
  },
];

export default function ServicesPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-[#3A2A24]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">What We Do</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Our Catering Services
          </h1>
          <p className="text-xl text-white/80">
            Authentic Tanzanian cuisine for every occasion
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section-padding bg-[#FAF6EF]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service) => (
              <ServiceCard key={service.href} {...service} />
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section-padding bg-[#F1E7DA]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">Why Moto Kitchen</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1F1F1F]">What Sets Us Apart</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="font-semibold text-[#1F1F1F] mb-2">Authentic Recipes</h3>
              <p className="text-[#4B4B4B] text-sm">Traditional Tanzanian dishes made with authentic spices and techniques</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">👨‍🍳</div>
              <h3 className="font-semibold text-[#1F1F1F] mb-2">Expert Chefs</h3>
              <p className="text-[#4B4B4B] text-sm">Passionate team with deep knowledge of East African cuisine</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="font-semibold text-[#1F1F1F] mb-2">Tailored Service</h3>
              <p className="text-[#4B4B4B] text-sm">Custom menus designed around your event and preferences</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🇳🇱</div>
              <h3 className="font-semibold text-[#1F1F1F] mb-2">Nationwide</h3>
              <p className="text-[#4B4B4B] text-sm">We cater events throughout the Netherlands</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <CTASection
        title="Ready to Plan Your Event?"
        description="Contact us today for a custom quote tailored to your needs."
        variant="primary"
      />
    </>
  );
}
