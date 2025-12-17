"use client";

import Link from "next/link";
import { useState } from "react";

const faqs = [
  {
    question: "What's the minimum guest count?",
    answer: "We cater events of all sizes! From intimate dinners of 10 guests to large celebrations of 200+. Contact us to discuss your specific needs.",
  },
  {
    question: "How far in advance should I book?",
    answer: "For most private events, 2-4 weeks notice is ideal. For larger celebrations or peak seasons, we recommend booking 4-6 weeks ahead.",
  },
  {
    question: "Can you cater at my home?",
    answer: "Absolutely! We regularly cater at private homes. We just need access to a power outlet and some counter space for setup.",
  },
  {
    question: "Do you handle setup and cleanup?",
    answer: "Yes, we take care of everything. We arrive early to set up and stay after to clean up, so you can focus on enjoying your event.",
  },
  {
    question: "Can you accommodate dietary restrictions?",
    answer: "Of course! We can accommodate vegetarian, vegan, gluten-free, halal, and other dietary requirements. Just let us know when planning your menu.",
  },
];

const included = [
  "Custom menu planning",
  "Professional delivery and setup",
  "All serving equipment and tableware",
  "Dietary accommodation",
  "Cleanup service",
  "Flexible timing",
  "Personal service",
];

const serviceStyles = [
  {
    name: "Buffet Style",
    description: "Guests serve themselves from beautifully arranged stations. Great for relaxed gatherings.",
  },
  {
    name: "Family Style",
    description: "Dishes placed on tables for sharing. Creates a warm, communal atmosphere.",
  },
  {
    name: "Cocktail Reception",
    description: "Passed appetizers and small bites. Perfect for mingling and networking.",
  },
];

const eventTypes = [
  "Birthday Parties",
  "Anniversary Celebrations",
  "Family Reunions",
  "Cultural Celebrations",
  "Graduation Parties",
  "Holiday Gatherings",
  "Engagement Parties",
  "Baby Showers",
];

export default function PrivateEventsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-[#3A2A24] relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">Private Events</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Celebrate Life&apos;s Special Moments
          </h1>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            From birthday parties to family reunions, we bring the warmth of Tanzanian hospitality to your gathering.
          </p>
          <Link href="/contact" className="btn-primary text-lg">
            Request a Quote
          </Link>
        </div>
      </section>

      {/* Event Types */}
      <section className="py-8 bg-[#F1E7DA] border-y border-[#E6D9C8]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-3">
            {eventTypes.map((type, index) => (
              <span key={index} className="trust-chip">
                {type}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="section-padding bg-[#FAF6EF]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">What&apos;s Included</p>
              <h2 className="text-3xl md:text-4xl font-bold text-[#1F1F1F] mb-6">
                Stress-Free Event Catering
              </h2>
              <p className="text-[#4B4B4B] mb-8">
                We handle the food so you can focus on celebrating with your guests. From planning to cleanup, we&apos;ve got you covered.
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
                <p className="text-6xl mb-4">🎉</p>
                <p className="text-sm">Party Photo</p>
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
              { step: "1", title: "Inquiry", description: "Tell us about your celebration" },
              { step: "2", title: "Proposal", description: "Receive a custom menu and quote" },
              { step: "3", title: "Confirm", description: "Finalize details and confirm" },
              { step: "4", title: "Party Time", description: "We deliver a perfect experience" },
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
            <h2 className="text-3xl font-bold text-[#1F1F1F]">Private Events Gallery</h2>
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
            <h2 className="text-3xl font-bold text-[#1F1F1F]">What Clients Say</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                quote: "The food was absolutely incredible! Our guests couldn't stop talking about the flavours. Moto Kitchen made our party truly special.",
                author: "Sarah M.",
                event: "Birthday Party, Amsterdam",
              },
              {
                quote: "As a Tanzanian living in the Netherlands, this felt like home. The chapati and pilau were perfect! My family loved every dish.",
                author: "Amina J.",
                event: "Family Gathering, Utrecht",
              },
            ].map((testimonial, index) => (
              <div key={index} className="card">
                <div className="text-[#C9653B] text-4xl mb-4">&ldquo;</div>
                <p className="text-[#4B4B4B] mb-6 leading-relaxed">{testimonial.quote}</p>
                <div>
                  <p className="font-semibold text-[#1F1F1F]">{testimonial.author}</p>
                  <p className="text-sm text-[#C9653B]">{testimonial.event}</p>
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
            Ready to Plan Your Celebration?
          </h2>
          <p className="text-white/90 text-lg mb-10">
            Let&apos;s create an unforgettable experience for you and your guests.
          </p>
          <Link href="/contact" className="bg-white text-[#C9653B] px-8 py-4 rounded-md font-semibold text-lg hover:bg-[#FAF6EF] transition-colors inline-block">
            Request a Quote
          </Link>
        </div>
      </section>
    </>
  );
}

