"use client";

import { useState } from "react";
import CTASection from "../components/CTASection";
import { dishes } from "../../lib/menu-data";

const categories = [
  { id: "poultry-fish-meats", label: "Poultry, Fish & Meats" },
  { id: "vegetables-stews", label: "Vegetables & Stews" },
  { id: "sides", label: "Sides" },
  { id: "bites-snacks", label: "Bites & Snacks" },
  { id: "dessert", label: "Dessert" },
  { id: "drinks", label: "Drinks" },
];

// Use shared dishes data
const allDishes = dishes;

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState("poultry-fish-meats");

  const filteredDishes = allDishes.filter((dish) => dish.category === activeCategory);

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-[#3A2A24]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">Our Food</p>
          <h1 className="text-4xl md:text-6xl text-white mb-6">
            Menu
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
                onClick={() => handleCategoryChange(category.id)}
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
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDishes.map((dish) => (
              <div key={dish.id} className="card">
                <div className="aspect-[4/3] bg-[#F1E7DA] rounded-lg mb-4 overflow-hidden border border-[#E6D9C8] flex items-center justify-center">
                  {dish.image ? (
                    <img src={`/${dish.image}`} alt={dish.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">🍽️</span>
                  )}
                </div>
                <h3 className="text-lg font-medium text-[#1F1F1F] mb-2 text-center">{dish.name}</h3>
                <p className="text-sm text-[#4B4B4B] text-center">{dish.description}</p>
                {dish.note && (
                  <p className="text-xs text-[#C9653B] mt-2 italic text-center">{dish.note}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Note */}
      <section className="py-12 bg-[#F1E7DA]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-[#4B4B4B]">
            <strong>Note:</strong> We create custom menus for each event based on your preferences, 
            guest count, and dietary requirements. Contact us to discuss your perfect menu.
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
