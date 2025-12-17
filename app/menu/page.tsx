"use client";

import { useState } from "react";
import DishCard from "../components/DishCard";
import CTASection from "../components/CTASection";

const categories = [
  { id: "appetizers", label: "Appetizers" },
  { id: "mains", label: "Mains" },
  { id: "sides", label: "Sides & Starches" },
  { id: "desserts", label: "Desserts" },
  { id: "beverages", label: "Beverages" },
];

const dishes = [
  // Appetizers
  {
    id: 1,
    name: "Samosas",
    description: "Crispy triangular pastries filled with spiced minced meat or vegetables. A beloved East African appetizer perfect for starting any meal.",
    category: "appetizers",
    tags: [{ label: "Halal", type: "halal" as const }],
  },
  {
    id: 2,
    name: "Mishkaki",
    description: "Tender marinated beef or chicken skewers grilled to perfection over open flames. Served with tangy tamarind sauce.",
    category: "appetizers",
    tags: [{ label: "Halal", type: "halal" as const }],
  },
  {
    id: 3,
    name: "Vegetable Bhajias",
    description: "Assorted vegetables coated in spiced chickpea batter and deep-fried until golden. Crispy, flavourful, and perfect for sharing.",
    category: "appetizers",
    tags: [{ label: "Vegetarian", type: "vegetarian" as const }, { label: "Vegan", type: "vegan" as const }],
  },
  {
    id: 4,
    name: "Mbaazi wa Nazi",
    description: "Pigeon peas slow-cooked in rich coconut milk with aromatic spices. A traditional Tanzanian starter with deep, comforting flavours.",
    category: "appetizers",
    tags: [{ label: "Vegetarian", type: "vegetarian" as const }, { label: "Vegan", type: "vegan" as const }],
  },

  // Mains
  {
    id: 5,
    name: "Nyama Choma",
    description: "The king of East African cuisine. Slow-grilled marinated beef or goat, charred to perfection. Served with kachumbari salad and your choice of starch.",
    category: "mains",
    tags: [{ label: "Halal", type: "halal" as const }],
  },
  {
    id: 6,
    name: "Mchuzi wa Kuku",
    description: "Tender chicken pieces simmered in a rich, aromatic coconut curry sauce. A staple of Tanzanian home cooking with complex layers of spice.",
    category: "mains",
    tags: [{ label: "Halal", type: "halal" as const }, { label: "Gluten-Free", type: "gluten-free" as const }],
  },
  {
    id: 7,
    name: "Pilau",
    description: "Fragrant spiced rice cooked with tender meat in a blend of cumin, cardamom, and cinnamon. The aromatic centerpiece of any celebration.",
    category: "mains",
    tags: [{ label: "Halal", type: "halal" as const }],
  },
  {
    id: 8,
    name: "Biryani",
    description: "Layered rice and meat dish with saffron, fried onions, and a complex spice blend. Rich, celebratory, and utterly satisfying.",
    category: "mains",
    tags: [{ label: "Halal", type: "halal" as const }],
  },
  {
    id: 9,
    name: "Wali wa Nazi",
    description: "Coconut rice cooked to fluffy perfection with a subtle sweetness. The perfect accompaniment to curries and grilled meats.",
    category: "mains",
    tags: [{ label: "Vegetarian", type: "vegetarian" as const }, { label: "Vegan", type: "vegan" as const }, { label: "Gluten-Free", type: "gluten-free" as const }],
  },
  {
    id: 10,
    name: "Ndizi Nyama",
    description: "Beef stewed with green bananas in a savory sauce. A unique Tanzanian comfort dish with subtle sweetness and rich depth.",
    category: "mains",
    tags: [{ label: "Halal", type: "halal" as const }, { label: "Gluten-Free", type: "gluten-free" as const }],
  },

  // Sides
  {
    id: 11,
    name: "Chapati",
    description: "Flaky, layered flatbread cooked on a hot griddle. Perfect for scooping up curries and stews. A must-have at any Tanzanian meal.",
    category: "sides",
    tags: [{ label: "Vegetarian", type: "vegetarian" as const }, { label: "Vegan", type: "vegan" as const }],
  },
  {
    id: 12,
    name: "Ugali",
    description: "Traditional cornmeal porridge with a firm, satisfying texture. The staple starch of East Africa, meant to be eaten with your hands.",
    category: "sides",
    tags: [{ label: "Vegetarian", type: "vegetarian" as const }, { label: "Vegan", type: "vegan" as const }, { label: "Gluten-Free", type: "gluten-free" as const }],
  },
  {
    id: 13,
    name: "Kachumbari",
    description: "Fresh tomato and onion salad with cilantro and lime. Bright, acidic, and refreshing — the perfect counterpoint to rich grilled meats.",
    category: "sides",
    tags: [{ label: "Vegetarian", type: "vegetarian" as const }, { label: "Vegan", type: "vegan" as const }, { label: "Gluten-Free", type: "gluten-free" as const }],
  },
  {
    id: 14,
    name: "Sukuma Wiki",
    description: "Sautéed collard greens with onions and tomatoes. Simple, nutritious, and deeply comforting. A everyday staple in Tanzanian homes.",
    category: "sides",
    tags: [{ label: "Vegetarian", type: "vegetarian" as const }, { label: "Vegan", type: "vegan" as const }, { label: "Gluten-Free", type: "gluten-free" as const }],
  },
  {
    id: 15,
    name: "Maharage ya Nazi",
    description: "Red kidney beans simmered in creamy coconut sauce. Rich in protein and flavour, this dish is comfort food at its finest.",
    category: "sides",
    tags: [{ label: "Vegetarian", type: "vegetarian" as const }, { label: "Vegan", type: "vegan" as const }, { label: "Gluten-Free", type: "gluten-free" as const }],
  },

  // Desserts
  {
    id: 16,
    name: "Mandazi",
    description: "East African doughnuts with a hint of cardamom and coconut. Light, fluffy, and slightly sweet — perfect with chai.",
    category: "desserts",
    tags: [{ label: "Vegetarian", type: "vegetarian" as const }],
  },
  {
    id: 17,
    name: "Kashata",
    description: "Traditional coconut and sugar confection. Crunchy, sweet, and utterly addictive. A beloved Tanzanian treat.",
    category: "desserts",
    tags: [{ label: "Vegetarian", type: "vegetarian" as const }, { label: "Vegan", type: "vegan" as const }, { label: "Gluten-Free", type: "gluten-free" as const }],
  },
  {
    id: 18,
    name: "Vitumbua",
    description: "Sweet rice pancakes with coconut milk and cardamom. Soft, pillowy, and perfect for dessert or breakfast.",
    category: "desserts",
    tags: [{ label: "Vegetarian", type: "vegetarian" as const }, { label: "Gluten-Free", type: "gluten-free" as const }],
  },

  // Beverages
  {
    id: 19,
    name: "Chai ya Tangawizi",
    description: "Spiced ginger tea brewed with milk and aromatic spices. Warming, comforting, and quintessentially East African.",
    category: "beverages",
    tags: [{ label: "Vegetarian", type: "vegetarian" as const }, { label: "Gluten-Free", type: "gluten-free" as const }],
  },
  {
    id: 20,
    name: "Tamarind Juice",
    description: "Refreshing sweet-sour drink made from tamarind pods. A traditional thirst-quencher perfect for warm days.",
    category: "beverages",
    tags: [{ label: "Vegetarian", type: "vegetarian" as const }, { label: "Vegan", type: "vegan" as const }, { label: "Gluten-Free", type: "gluten-free" as const }],
  },
  {
    id: 21,
    name: "Fresh Passion Fruit Juice",
    description: "Tropical passion fruit blended with a touch of sweetness. Vibrant, tangy, and refreshing.",
    category: "beverages",
    tags: [{ label: "Vegetarian", type: "vegetarian" as const }, { label: "Vegan", type: "vegan" as const }, { label: "Gluten-Free", type: "gluten-free" as const }],
  },
];

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState("appetizers");

  const filteredDishes = dishes.filter((dish) => dish.category === activeCategory);

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-[#3A2A24]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">Our Food</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Sample Menu
          </h1>
          <p className="text-xl text-white/80">
            Authentic Tanzanian dishes crafted with traditional recipes
          </p>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="py-6 bg-[#F1E7DA] border-b border-[#E6D9C8] sticky top-[72px] z-40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === category.id
                    ? "bg-[#C9653B] text-white"
                    : "bg-white border border-[#E6D9C8] text-[#4B4B4B] hover:bg-[#C9653B] hover:text-white hover:border-[#C9653B]"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Menu Grid */}
      <section className="section-padding bg-[#FAF6EF]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDishes.map((dish) => (
              <DishCard
                key={dish.id}
                name={dish.name}
                description={dish.description}
                tags={dish.tags}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Note */}
      <section className="py-12 bg-[#F1E7DA]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-[#4B4B4B]">
            <strong>Note:</strong> This is a sample of our dishes. We create custom menus for each event 
            based on your preferences, guest count, and dietary requirements. Contact us to discuss your perfect menu.
          </p>
        </div>
      </section>

      {/* CTA */}
      <CTASection
        title="Ready to Create Your Menu?"
        description="Let's design a custom menu for your event."
        variant="primary"
      />
    </>
  );
}
