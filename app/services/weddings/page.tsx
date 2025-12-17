"use client";

import Link from "next/link";
import { useState } from "react";

const faqs = [
  {
    question: "How far in advance should we book?",
    answer: "We recommend booking at least 3-6 months in advance for weddings to ensure availability and allow time for menu planning and tastings.",
  },
  {
    question: "Do you offer tasting sessions?",
    answer: "Yes! We offer complimentary tasting sessions for weddings over 50 guests. This allows you to sample dishes and finalize your menu.",
  },
  {
    question: "Can you accommodate dietary restrictions?",
    answer: "Absolutely. We can accommodate vegetarian, vegan, gluten-free, halal, and other dietary requirements. Just let us know when planning your menu.",
  },
  {
    question: "What service styles do you offer?",
    answer: "We offer buffet style, family-style service, and plated dinner options. We'll help you choose the best style for your venue and guest count.",
  },
  {
    question: "Do you provide serving staff?",
    answer: "Yes, we provide professional serving staff for all wedding events. The number of staff depends on your guest count and service style.",
  },
];

const included = [
  "Custom menu planning consultation",
  "Complimentary tasting session",
  "Professional serving staff",
  "All tableware and serving equipment",
  "Setup and cleanup",
  "Dietary accommodation",
  "Day-of coordination",
];

const serviceStyles = [
  {
    name: "Buffet Style",
    description: "Guests serve themselves from beautifully arranged food stations. Perfect for a relaxed, social atmosphere.",
  },
  {
    name: "Family Style",
    description: "Dishes are placed on tables for guests to share. Creates an intimate, communal dining experience.",
  },
  {
    name: "Plated Service",
    description: "Individual plates served to each guest. Elegant and formal, ideal for traditional wedding receptions.",
  },
];

export default function WeddingsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-[#3A2A24] relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">Weddings</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Make Your Special Day Unforgettable
          </h1>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Celebrate your love with authentic Tanzanian cuisine that tells your cultural story and delights every guest.
          </p>
          <Link href="/contact" className="btn-primary text-lg">
            Request a Quote
          </Link>
        </div>
      </section>

      {/* What's Included */}
      <section className="section-padding bg-[#FAF6EF]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">What&apos;s Included</p>
              <h2 className="text-3xl md:text-4xl font-bold text-[#1F1F1F] mb-6">
                Full-Service Wedding Catering
              </h2>
              <p className="text-[#4B4B4B] mb-8">
                We handle everything from menu planning to cleanup, so you can focus on enjoying your special day.
              </p>
              <ul className="space-y-4">
                {included.map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-[#1F1F1F]">
                    <svg className="w-5 h-5 text-[#C9653B] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="aspect-[4/3] bg-[#F1E7DA] rounded-lg border border-[#E6D9C8] flex items-center justify-center">
              <div className="text-center text-[#4B4B4B]">
                <p className="text-6xl mb-4">💒</p>
                <p className="text-sm">Wedding Photo</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Styles */}
      <section className="section-padding bg-[#F1E7DA]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">Service Options</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1F1F1F]">
              Choose Your Style
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {serviceStyles.map((style, index) => (
              <div key={index} className="card text-center">
                <h3 className="text-xl font-semibold text-[#1F1F1F] mb-4">{style.name}</h3>
                <p className="text-[#4B4B4B]">{style.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding bg-[#3A2A24]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">Simple Process</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              How It Works
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Inquiry", description: "Share your vision and requirements" },
              { step: "2", title: "Proposal", description: "Receive a custom menu and quote" },
              { step: "3", title: "Confirm", description: "Finalize menu and secure your date" },
              { step: "4", title: "Wedding Day", description: "We deliver a perfect experience" },
            ].map((item, index) => (
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

      {/* Gallery Strip */}
      <section className="section-padding bg-[#FAF6EF]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1F1F1F]">Wedding Gallery</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="aspect-square bg-[#F1E7DA] rounded-lg border border-[#E6D9C8] flex items-center justify-center">
                <span className="text-3xl">🍽️</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/gallery" className="text-[#C9653B] font-semibold hover:underline">
              View Full Gallery →
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-padding bg-[#F1E7DA]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1F1F1F]">What Couples Say</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                quote: "Moto Kitchen made our wedding day absolutely perfect. The food was incredible and our guests are still talking about it!",
                author: "Maria & David",
                location: "Amsterdam",
              },
              {
                quote: "The team was professional, the food was authentic, and they accommodated all our dietary needs beautifully.",
                author: "Amina & James",
                location: "Rotterdam",
              },
            ].map((testimonial, index) => (
              <div key={index} className="card">
                <div className="text-[#C9653B] text-4xl mb-4">&ldquo;</div>
                <p className="text-[#4B4B4B] mb-6 leading-relaxed">{testimonial.quote}</p>
                <div>
                  <p className="font-semibold text-[#1F1F1F]">{testimonial.author}</p>
                  <p className="text-sm text-[#C9653B]">{testimonial.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-[#FAF6EF]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">FAQ</p>
            <h2 className="text-3xl font-bold text-[#1F1F1F]">Common Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="card">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex justify-between items-center text-left"
                >
                  <span className="font-semibold text-[#1F1F1F]">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-[#C9653B] transition-transform ${openFaq === index ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === index && (
                  <p className="mt-4 text-[#4B4B4B] leading-relaxed">{faq.answer}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-[#C9653B]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Plan Your Wedding Menu?
          </h2>
          <p className="text-white/90 text-lg mb-10">
            Let&apos;s create an unforgettable culinary experience for your special day.
          </p>
          <Link href="/contact" className="bg-white text-[#C9653B] px-8 py-4 rounded-md font-semibold text-lg hover:bg-[#FAF6EF] transition-colors inline-block">
            Request a Quote
          </Link>
        </div>
      </section>
    </>
  );
}

