"use client";

import { useState } from "react";
import Image from "next/image";
import CTASection from "../components/CTASection";
import { dishes } from "../../lib/menu-data";
import { parseDishName } from "../../lib/utils";

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
                style={{ fontFamily: 'var(--font-heading-display), serif', fontWeight: 400 }}
                className={`px-4 py-2 rounded-full text-lg transition-colors ${
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
            {filteredDishes.map((dish) => {
              const { swahili, english } = parseDishName(dish.name);
              return (
              <div key={dish.id} className="card">
                <div className="relative aspect-[4/3] bg-[#F1E7DA] rounded-lg mb-4 overflow-hidden border border-[#E6D9C8] flex items-center justify-center">
                  {dish.image ? (
                    <Image
                      src={`/${dish.image}`}
                      alt={swahili || english}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-4xl">🍽️</span>
                  )}
                </div>
                {swahili ? (
                  <>
                    <h3 className="dish-name-swahili -mt-2 text-center">{swahili}</h3>
                    <p className="dish-name-english text-center">{english}</p>
                  </>
                ) : (
                  <h3 style={{ fontFamily: 'var(--font-heading-display), serif', fontWeight: 700 }} className="text-xl text-[#1F1F1F] -mt-2 mb-2 text-center">
                    {english}
                  </h3>
                )}
                <p className="text-sm text-[#4B4B4B] text-center leading-relaxed mb-2 italic">{dish.description}</p>
                {dish.tags && dish.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap justify-center">
                    {dish.tags.map((tag, index) => {
                      const tagStyles: Record<string, string> = {
                        vegetarian: "bg-[#e8f5e9] text-[#2e7d32]",
                        vegan: "bg-[#e8f5e9] text-[#1b5e20]",
                        "gluten-free": "bg-[#fff3e0] text-[#e65100]",
                        "dairy-free": "bg-[#e1f5fe] text-[#0277bd]",
                        spicy: "bg-[#ffebee] text-[#c62828]",
                      };
                      const tagLabels: Record<string, string> = {
                        vegetarian: "V",
                        vegan: "VG",
                        "gluten-free": "GF",
                        "dairy-free": "DF",
                        spicy: "🌶️",
                      };
                      return (
                        <span
                          key={index}
                          className={`text-xs px-2 py-0.5 rounded font-medium ${tagStyles[tag.type] || "bg-gray-100 text-gray-600"}`}
                          title={tag.label}
                        >
                          {tagLabels[tag.type] || tag.label}
                        </span>
                      );
                    })}
                  </div>
                )}
                {dish.note && (
                  <p className="text-xs text-[#C9653B] mt-2 italic text-center">{dish.note}</p>
                )}
              </div>
              );
            })}
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
