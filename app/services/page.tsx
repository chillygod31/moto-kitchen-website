import ServiceCard from "../components/ServiceCard";
import CTASection from "../components/CTASection";

export const metadata = {
  title: "Catering Services | Moto Kitchen",
  description: "Authentic Tanzanian catering for weddings, corporate events, and private parties across the Netherlands. Custom menus, professional service.",
};

const services = [
  {
    href: "/services/private-events",
    title: "Special Events",
    description: "Weddings, corporate events, birthday parties, anniversaries, and family gatherings — bring people together with food that creates memories.",
    image: "/food-8.jpg",
    features: [
      "Personalized menus",
      "Intimate to large groups",
      "Family-style options",
      "Cultural celebrations",
    ],
  },
  {
    href: "/services/pick-up-delivery",
    title: "Pick Up & Delivery",
    description: "Convenient pick-up and delivery service across the Netherlands, Belgium, and Germany, and beyond.",
    image: "/delivery.jpg",
    features: [
      "Nationwide delivery",
      "Flexible ordering",
      "Fresh prepared meals",
      "Easy pick-up options",
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
          <div className="grid md:grid-cols-2 gap-8 justify-items-center max-w-4xl mx-auto">
            {services.map((service) => (
              <ServiceCard key={service.href} {...service} />
            ))}
          </div>
        </div>
      </section>

      {/* Our Legacy */}
      <section className="section-padding bg-[#F1E7DA]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">Our Story</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1F1F1F] mb-6">A Family Legacy</h2>
          <p className="text-[#4B4B4B] text-lg leading-relaxed mb-6">
            Moto Kitchen began in a home kitchen, with a grandmother, a mother, and an aunt cooking for the people around them. That was about 12 to 13 years ago. Over time, people started asking if we could cook for them, first for birthdays and small celebrations, then for bigger moments where the food needed to feel like home.
          </p>
          <p className="text-[#4B4B4B] text-lg leading-relaxed mb-6">
            In 2023 we officially started Moto Kitchen as a business. Today, we are a team of eight women, and we run Moto Kitchen like family. Our recipes were learned from our mothers and grandmothers, and we try to stay as close to home as possible, using spices from Tanzania and Zanzibar whenever we can.
          </p>
          <p className="text-[#4B4B4B] text-lg leading-relaxed">
            Moto means fire in Swahili. For us, it is the fire in our kitchen and the passion in our veins, the kind of fire that turns a meal into a memory.
          </p>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section-padding bg-[#FAF6EF]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">Why Moto Kitchen</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1F1F1F]">What Sets Us Apart</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="aspect-square mb-4 rounded-lg overflow-hidden border border-[#E6D9C8]">
                <img src="/authenticreceipe.png" alt="Authentic Recipes" className="w-full h-full object-cover" />
              </div>
              <h3 className="font-semibold text-[#1F1F1F] mb-2">Authentic Recipes</h3>
              <p className="text-[#4B4B4B] text-sm">Traditional Tanzanian dishes made with authentic spices and techniques</p>
            </div>
            <div className="text-center">
              <div className="aspect-square mb-4 rounded-lg overflow-hidden border border-[#E6D9C8]">
                <img src="/behind-3.jpg" alt="Expert Chefs" className="w-full h-full object-cover" />
              </div>
              <h3 className="font-semibold text-[#1F1F1F] mb-2">Expert Chefs</h3>
              <p className="text-[#4B4B4B] text-sm">Passionate team with deep knowledge of East African cuisine</p>
            </div>
            <div className="text-center">
              <div className="aspect-square mb-4 rounded-lg overflow-hidden border border-[#E6D9C8]">
                <img src="/food-7.jpg" alt="Tailored Service" className="w-full h-full object-cover" />
              </div>
              <h3 className="font-semibold text-[#1F1F1F] mb-2">Tailored Service</h3>
              <p className="text-[#4B4B4B] text-sm">Custom menus designed around your event and preferences</p>
            </div>
            <div className="text-center">
              <div className="aspect-square mb-4 rounded-lg overflow-hidden border border-[#E6D9C8]">
                <img src="/nationwide.png" alt="Nationwide" className="w-full h-full object-cover" />
              </div>
              <h3 className="font-semibold text-[#1F1F1F] mb-2">Nationwide</h3>
              <p className="text-[#4B4B4B] text-sm">Serving the Netherlands, Belgium, Germany, and beyond</p>
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
