"use client";

import { useState } from "react";

interface FAQ {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  faqs: FAQ[];
  title?: string;
  showTitle?: boolean;
}

export default function FAQAccordion({
  faqs,
  title = "Frequently Asked Questions",
  showTitle = true,
}: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="section-padding bg-[#FAF6EF]">
      <div className="max-w-3xl mx-auto">
        {showTitle && (
          <div className="text-center mb-12">
            <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1F1F1F]">{title}</h2>
          </div>
        )}

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="card">
              <button
                onClick={() => toggleItem(index)}
                className="w-full flex justify-between items-center text-left gap-4"
              >
                <span className="font-semibold text-[#1F1F1F]">{faq.question}</span>
                <svg
                  className={`w-5 h-5 text-[#C9653B] flex-shrink-0 transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === index && (
                <p className="mt-4 text-[#4B4B4B] leading-relaxed">{faq.answer}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

