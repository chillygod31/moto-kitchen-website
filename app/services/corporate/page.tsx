"use client";

import Link from "next/link";
import { useState } from "react";

const faqs = [
  {
    question: "What's the minimum order for corporate catering?",
    answer: "We cater events of all sizes. For office lunches, we typically start at 10 people. Contact us for smaller groups and we'll find a solution.",
  },
  {
    question: "How much notice do you need?",
    answer: "For regular office lunches, 3-5 business days is ideal. For larger events or conferences, we recommend 2-4 weeks advance notice.",
  },
  {
    question: "Do you offer recurring catering services?",
    answer: "Yes! We offer weekly or monthly catering packages for offices. This is a great way to boost team morale with unique cuisine.",
  },
  {
    question: "Can you accommodate dietary restrictions?",
    answer: "Absolutely. We can accommodate vegetarian, vegan, gluten-free, halal, and other dietary requirements. Just let us know in advance.",
  },
  {
    question: "Do you provide invoicing for businesses?",
    answer: "Yes, we provide proper invoicing for all corporate clients. We can also set up recurring billing for regular orders.",
  },
];

const included = [
  "Custom menu planning",
  "Professional delivery and setup",
  "All serving equipment included",
  "Dietary labels and allergen information",
  "Cleanup service available",
  "Flexible ordering options",
  "Corporate invoicing",
];

const serviceStyles = [
  {
    name: "Buffet Setup",
    description: "Self-service stations perfect for conferences, networking events, and team celebrations.",
  },
  {
    name: "Individual Boxes",
    description: "Pre-packaged meals for meetings, working lunches, and socially-distanced events.",
  },
  {
    name: "Plated Service",
    description: "Formal seated dining for client entertainment and executive meetings.",
  },
];

export default function CorporatePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-[#3A2A24] relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">Corporate</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Impress Your Clients & Team
          </h1>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Stand out with unique East African cuisine for meetings, conferences, and company celebrations.
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
                Professional Corporate Catering
              </h2>
              <p className="text-[#4B4B4B] mb-8">
                From office lunches to large conferences, we deliver exceptional food and service that reflects well on your business.
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
                <p className="text-6xl mb-4">🏢</p>
                <p className="text-sm">Corporate Event Photo</p>
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
              { step: "1", title: "Inquiry", description: "Tell us about your event needs" },
              { step: "2", title: "Proposal", description: "Receive a custom menu and quote" },
              { step: "3", title: "Confirm", description: "Finalize details and confirm order" },
              { step: "4", title: "Event Day", description: "We deliver and set up for you" },
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
            <h2 className="text-3xl font-bold text-[#1F1F1F]">Corporate Events Gallery</h2>
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
                quote: "Our team loved the unique flavours! Moto Kitchen has become our go-to caterer for office events and client meetings.",
                author: "Thomas K.",
                company: "Tech Startup, Amsterdam",
              },
              {
                quote: "Professional service, delicious food, and they made our company celebration truly memorable. Highly recommended!",
                author: "Lisa van der Berg",
                company: "Marketing Agency, Rotterdam",
              },
            ].map((testimonial, index) => (
              <div key={index} className="card">
                <div className="text-[#C9653B] text-4xl mb-4">&ldquo;</div>
                <p className="text-[#4B4B4B] mb-6 leading-relaxed">{testimonial.quote}</p>
                <div>
                  <p className="font-semibold text-[#1F1F1F]">{testimonial.author}</p>
                  <p className="text-sm text-[#C9653B]">{testimonial.company}</p>
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
            Ready to Elevate Your Corporate Events?
          </h2>
          <p className="text-white/90 text-lg mb-10">
            Contact us for a custom quote tailored to your business needs.
          </p>
          <Link href="/contact" className="bg-white text-[#C9653B] px-8 py-4 rounded-md font-semibold text-lg hover:bg-[#FAF6EF] transition-colors inline-block">
            Request a Quote
          </Link>
        </div>
      </section>
    </>
  );
}

