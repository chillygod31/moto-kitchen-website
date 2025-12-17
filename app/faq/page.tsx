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
        answer: "We cater events of all sizes, from intimate gatherings of 10 guests to large celebrations of 200+. Contact us to discuss your specific needs.",
      },
    ],
  },
  {
    category: "Booking & Pricing",
    questions: [
      {
        question: "How far in advance should I book?",
        answer: "We recommend booking at least 2-4 weeks in advance for most events. For weddings and large celebrations, 3-6 months advance notice is ideal to ensure availability.",
      },
      {
        question: "How does pricing work?",
        answer: "Our pricing is based on the number of guests, menu selection, and service style. We offer packages starting from €250 for small gatherings. Contact us for a custom quote tailored to your event.",
      },
      {
        question: "Do you require a deposit?",
        answer: "Yes, we require a 30% deposit to secure your booking. The remaining balance is due one week before the event.",
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
        answer: "Absolutely! We can accommodate vegetarian, vegan, gluten-free, halal, and other dietary requirements. Please let us know your needs when booking.",
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

