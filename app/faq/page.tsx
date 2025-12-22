"use client";

import Link from "next/link";
import { useState } from "react";

const faqs = [
  {
    category: "General",
    questions: [
      {
        question: "What type of cuisine does Moto Kitchen offer?",
        answer: "We specialize in authentic Tanzanian and East African cuisine. Our menu features traditional dishes like Pilau, Nyama Choma, Mchuzi wa Kuku, Chapati, and many more, all prepared using recipes passed down through generations.",
      },
      {
        question: "Where do you provide catering services?",
        answer: "We cater events throughout the Netherlands. Whether you're in Amsterdam, Rotterdam, Utrecht, The Hague, or anywhere else in the country, we can bring authentic Tanzanian flavours to your event.",
      },
      {
        question: "What is the minimum number of guests you cater for?",
        answer: "We cater for both intimate gatherings and large events. Tell us your guest count and we'll propose the best setup.",
      },
      {
        question: "What makes Moto Kitchen different from other caterers?",
        answer: "Moto Kitchen brings 12+ years of authentic Tanzanian culinary expertise to the Netherlands. We're the official caterer for the Tanzanian Embassy, offering genuine East African flavors prepared by our 8-woman team using traditional recipes. Our commitment to quality, cultural authenticity, and personalized service sets us apart. We don't just serve food, we share the rich culinary heritage of Tanzania with every dish.",
      },
      {
        question: "Do you do cooking demonstrations or interactive experiences?",
        answer: "Yes! We offer live cooking demonstrations and interactive culinary experiences. Our team can showcase traditional cooking techniques, share stories behind the dishes, and engage your guests with the cultural significance of Tanzanian cuisine. This is perfect for corporate events, cultural celebrations, or anyone wanting a more immersive dining experience.",
      },
    ],
  },
  {
    category: "Booking & Pricing",
    questions: [
      {
        question: "How far in advance should I book?",
        answer: "We recommend booking at least 2 to 4 weeks in advance for most events. For weddings and large celebrations, 3 to 6 months advance notice is ideal to ensure availability.",
      },
      {
        question: "How does pricing work?",
        answer: "Our pricing is based on the number of guests, menu selection, and service style. We offer packages starting from €250 for small gatherings. Contact us for a custom quote tailored to your event.",
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept bank transfers, iDeal, and cash payments. For bookings, we require a deposit to secure your date. The standard deposit is 50% of the total cost, or 100% if booking within one week of the event date. The remaining balance is due one week before the event.",
      },
      {
        question: "Do you require a deposit?",
        answer: "Yes, we require a deposit to secure your booking. The standard deposit is 50% of the total cost. If booking within one week of the event date, we require 100% payment upfront. The remaining balance (if applicable) is due one week before the event.",
      },
      {
        question: "Do you charge delivery or travel fees?",
        answer: "For events within 50km of Rotterdam, delivery and travel are included in our pricing. For events beyond 50km, we charge a travel fee based on distance. We'll provide a detailed quote that includes all travel costs when you book. Contact us with your event location for an accurate estimate.",
      },
      {
        question: "What's included in your per-person pricing?",
        answer: "Our per-person pricing includes: the selected menu items, professional serving staff, all serving equipment (chafing dishes, serving utensils), setup and cleanup, and basic tableware (disposable or premium depending on package). Additional services like premium tableware upgrades, extra staff, or special equipment may incur additional costs. We'll provide a detailed breakdown in your custom quote.",
      },
      {
        question: "What is your cancellation policy?",
        answer: "Cancellations made more than 14 days before the event receive a full deposit refund. Cancellations within 14 days may forfeit the deposit, depending on circumstances.",
      },
    ],
  },
  {
    category: "Menu & Dietary",
    questions: [
      {
        question: "Can you accommodate dietary restrictions?",
        answer: "Absolutely! We can accommodate vegetarian, vegan, gluten free, halal, and other dietary requirements. Please let us know your needs when booking.",
      },
      {
        question: "Are all your dishes Halal?",
        answer: "Yes, all our dishes are Halal certified. We use only Halal certified ingredients and follow strict Halal preparation guidelines. Our kitchen and all food handling processes comply with Halal standards, so you can be confident that all our food meets Halal requirements.",
      },
      {
        question: "How spicy is your food?",
        answer: "Our food ranges from mild to medium spice levels. We use traditional Tanzanian spices and seasonings, but we can adjust the spice level to your preference. If you have guests with varying spice tolerances, we can prepare some dishes mild and offer spicy condiments on the side. Just let us know your preferences when booking.",
      },
      {
        question: "What does Tanzanian food taste like?",
        answer: "Tanzanian cuisine is a beautiful blend of flavors influenced by African, Arab, Indian, and European culinary traditions. Expect aromatic spices like cardamom, cinnamon, and cloves; rich coconut based sauces; tender slow cooked meats; and hearty grains. The food is flavorful but balanced, not overwhelmingly spicy, with a focus on fresh ingredients and complex, layered flavors. Think warming, comforting, and deeply satisfying dishes that tell a story with every bite.",
      },
      {
        question: "Can you provide vegetarian or vegan options?",
        answer: "Yes! We offer a variety of vegetarian and vegan options. Many traditional Tanzanian dishes are naturally vegetarian, and we can create fully vegetarian or vegan menus. Our vegetarian options include dishes like vegetable pilau, coconut bean curry, chapati, and various vegetable stews. Vegan options are available upon request, just let us know when booking, and we'll customize the menu accordingly.",
      },
      {
        question: "Can I customize the menu?",
        answer: "Yes! We work with you to create a custom menu that fits your preferences, dietary needs, and budget. We're happy to include specific dishes or create themed menus.",
      },
      {
        question: "Do you offer tasting sessions?",
        answer: "We offer complimentary tasting sessions for weddings and large events (50+ guests). This allows you to sample dishes and finalize your menu.",
      },
    ],
  },
  {
    category: "Service & Logistics",
    questions: [
      {
        question: "What service styles do you offer?",
        answer: "We offer buffet style, family-style service, plated dinners, and cocktail reception formats. We'll help you choose the best style for your venue and event type.",
      },
      {
        question: "How long does food setup take?",
        answer: "Setup time depends on the size of your event. For small gatherings (10 to 30 guests), setup typically takes 1 to 2 hours. For medium events (30 to 75 guests), allow 2 to 2.5 hours. For large events (75+ guests), setup can take 2 to 3 hours. We always arrive well in advance to ensure everything is ready before your guests arrive. We'll coordinate with you on arrival time based on your event schedule.",
      },
      {
        question: "How do you keep food warm/fresh during service?",
        answer: "We use professional grade chafing dishes, warming equipment, and insulated containers to keep all food at safe serving temperatures throughout your event. Our team monitors food temperatures continuously and replenishes dishes as needed. For longer events, we may prepare items in batches to ensure freshness. All hot dishes stay hot, and cold items stay properly chilled.",
      },
      {
        question: "Can you cater outdoor events?",
        answer: "Yes, we can cater outdoor events! We require access to power outlets for our warming equipment and chafing dishes. If your outdoor venue doesn't have power, we can discuss alternative solutions. We also recommend having a covered area for the serving station to protect food from weather. Please discuss your outdoor venue details with us when booking so we can ensure we have everything needed for a successful outdoor event.",
      },
      {
        question: "What if the guest count changes after booking?",
        answer: "We understand guest counts can fluctuate. If your guest count changes, please notify us at least 5 days before the event. Changes made 5+ days in advance can usually be accommodated without issues. Changes made within 5 days may be subject to availability and could incur additional charges. Final guest count confirmation is required 3 days before the event to ensure we prepare the correct amount of food.",
      },
      {
        question: "Do you provide serving staff?",
        answer: "Yes, we provide professional serving staff for all events. The number of staff depends on your guest count and service style.",
      },
      {
        question: "Do you provide plates, cutlery, and serving equipment?",
        answer: "Yes, all serving equipment is included. We can provide disposable or premium tableware depending on your package and preferences.",
      },
      {
        question: "Do you handle setup and cleanup?",
        answer: "Yes, we arrive early to set up and stay after to clean up. You can focus on enjoying your event while we handle the rest.",
      },
    ],
  },
  {
    category: "Food Safety & Quality",
    questions: [
      {
        question: "Are you licensed and insured?",
        answer: "Yes, we are fully licensed by the NVWA (Netherlands Food and Consumer Product Safety Authority) and carry comprehensive liability insurance. We operate from a certified commercial kitchen that meets all Dutch food safety standards. You can have complete peace of mind knowing we comply with all legal requirements and safety regulations.",
      },
      {
        question: "How do you ensure food quality and freshness?",
        answer: "We source the freshest ingredients from trusted suppliers and prepare everything in our certified commercial kitchen. All food is prepared fresh for your event, we don't use pre made or frozen dishes. Our team follows strict food safety protocols, including proper storage, temperature control, and hygiene practices. We take pride in serving only the highest quality, authentic Tanzanian cuisine.",
      },
      {
        question: "What happens if someone has a food allergy?",
        answer: "Food safety is our top priority. When you book, please inform us of any allergies or dietary restrictions. We'll work with you to ensure safe meal options and can prepare allergen-free dishes in separate areas when needed. Our team is trained in allergen awareness and cross-contamination prevention. However, if you have severe allergies, please discuss this with us in detail so we can take extra precautions. We always label dishes clearly, but guests with severe allergies should still exercise caution.",
      },
    ],
  },
  {
    category: "Wedding Specific",
    questions: [
      {
        question: "Do you offer wedding packages?",
        answer: "Yes! We offer comprehensive wedding packages starting from €25 per person. Our wedding packages include menu selection, professional serving staff, all equipment, setup and cleanup, and coordination with your wedding planner or venue. We also offer complimentary tasting sessions for wedding bookings so you can sample dishes and finalize your menu. Contact us to discuss your wedding vision and we'll create a custom package that fits your needs and budget.",
      },
      {
        question: "Can you handle large weddings (100+ guests)?",
        answer: "Absolutely! We regularly cater large weddings with 100+ guests and have experience with events up to 200+ guests. Our team and kitchen capacity can scale to accommodate your guest count. For very large weddings, we may bring additional staff and equipment to ensure smooth service. We'll work with you to plan logistics, timing, and service flow to make your big day perfect.",
      },
      {
        question: "Do you work with wedding planners/venues?",
        answer: "Yes, we have extensive experience collaborating with wedding planners and venues. We're happy to coordinate directly with your planner on timelines, setup requirements, and service details. We can also work with venue coordinators to ensure we meet all venue requirements and restrictions. Good communication and collaboration are key to a successful event, and we're experienced in being part of a larger wedding team.",
      },
    ],
  },
  {
    category: "About Moto Kitchen",
    questions: [
      {
        question: "How long have you been in business?",
        answer: "Moto Kitchen has been serving authentic Tanzanian cuisine for over 12 years. We've been operating officially as a registered business in the Netherlands since 2023, and we're proud to be the official caterer for the Tanzanian Embassy. Our team brings decades of combined culinary experience, and our recipes have been passed down through generations, ensuring authentic flavors in every dish.",
      },
      {
        question: "Who will be cooking and serving at my event?",
        answer: "Your event will be handled by our experienced 8 woman team. Depending on the size of your event, 2 to 4 team members will be present to cook, serve, and ensure everything runs smoothly. All team members are trained in food safety, professional service, and authentic Tanzanian cooking techniques. You'll meet your team on the day of the event, and they'll work behind the scenes to create a seamless experience for you and your guests.",
      },
      {
        question: "Can I meet you before booking?",
        answer: "Yes! We offer consultation meetings where you can meet our team, discuss your event vision, ask questions, and even sample some dishes if you'd like. Consultations can be done in person, via video call, or over the phone, whatever works best for you. We want to ensure you feel completely comfortable and confident before booking. Contact us to schedule a consultation.",
      },
    ],
  },
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({});

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-[#3A2A24]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">FAQ</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-white/80">
            Everything you need to know about our catering services
          </p>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="section-padding bg-[#FAF6EF]">
        <div className="max-w-3xl mx-auto">
          {faqs.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-12">
              <h2 className="text-2xl font-bold text-[#1F1F1F] mb-6 pb-2 border-b-2 border-[#C9653B]">
                {section.category}
              </h2>
              <div className="space-y-4">
                {section.questions.map((faq, faqIndex) => {
                  const key = `${sectionIndex}-${faqIndex}`;
                  const isOpen = openItems[key];
                  
                  return (
                    <div key={faqIndex} className="card">
                      <button
                        onClick={() => toggleItem(key)}
                        className="w-full flex justify-between items-center text-left gap-4"
                      >
                        <span className="font-semibold text-[#1F1F1F]">{faq.question}</span>
                        <svg
                          className={`w-5 h-5 text-[#C9653B] flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isOpen && (
                        <p className="mt-4 text-[#4B4B4B] leading-relaxed">{faq.answer}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-[#F1E7DA]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1F1F1F] mb-6">
            Still Have Questions?
          </h2>
          <p className="text-[#4B4B4B] text-lg mb-10">
            We&apos;re here to help. Get in touch and we&apos;ll get back to you within 24 hours.
          </p>
          <Link href="/contact" className="btn-primary text-lg">
            Contact Us
          </Link>
        </div>
      </section>
    </>
  );
}

