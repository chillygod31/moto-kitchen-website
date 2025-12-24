import { Inter, DM_Sans, Manrope } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-manrope",
});

const sampleFAQs = [
  {
    question: "How does pricing work?",
    answer: "Our pricing is based on the number of guests, menu selection, and service style. We offer packages starting from €250 for small gatherings. Contact us for a custom quote tailored to your event.",
  },
  {
    question: "Do you offer wedding packages?",
    answer: "Yes! We offer comprehensive wedding packages starting from €35 per person. Our wedding packages include menu selection, professional serving staff, all equipment, setup and cleanup, and coordination with your wedding planner or venue.",
  },
  {
    question: "Can you accommodate dietary restrictions?",
    answer: "Absolutely! We can accommodate vegetarian, vegan, gluten free, halal, and other dietary requirements. Please let us know your needs when booking.",
  },
];

const fontOptions = [
  {
    name: "Option A: Inter",
    description: "Super readable, modern, 'Apple-like'",
    fontFamily: "var(--font-inter), sans-serif",
    questionWeight: 600,
    answerWeight: 400,
  },
  {
    name: "Option B: DM Sans",
    description: "A little friendlier than Inter, still very premium",
    fontFamily: "var(--font-dm-sans), sans-serif",
    questionWeight: 600,
    answerWeight: 400,
  },
  {
    name: "Option C: Manrope",
    description: "Modern, crisp, slightly distinctive",
    fontFamily: "var(--font-manrope), sans-serif",
    questionWeight: 600,
    answerWeight: 400,
  },
];

export default function FAQFontPreviewPage() {
  return (
    <div className={`min-h-screen bg-[#FAF6EF] pt-32 pb-20 ${inter.variable} ${dmSans.variable} ${manrope.variable}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[#1F1F1F] mb-4">
            FAQ Font Preview
          </h1>
          <p className="text-[#4B4B4B] text-lg">
            Compare the three font options for FAQ questions and answers
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {fontOptions.map((option, optionIndex) => (
            <div key={optionIndex} className="bg-white rounded-lg p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#1F1F1F] mb-2">
                  {option.name}
                </h2>
                <p className="text-[#4B4B4B] text-sm">
                  {option.description}
                </p>
                <div className="mt-3 text-xs text-[#4B4B4B] space-y-1">
                  <p><strong>Questions:</strong> {option.name.split(': ')[1]} {option.questionWeight}</p>
                  <p><strong>Answers:</strong> {option.name.split(': ')[1]} {option.answerWeight}</p>
                </div>
              </div>

              <div className="space-y-4">
                {sampleFAQs.map((faq, faqIndex) => (
                  <div key={faqIndex} className="border border-[#E6D9C8] rounded-lg p-4">
                    <button className="w-full text-left">
                      <span
                        className="font-bold text-lg text-[#1F1F1F] block mb-3"
                        style={{
                          fontFamily: option.fontFamily,
                          fontWeight: option.questionWeight,
                        }}
                      >
                        {faq.question}
                      </span>
                    </button>
                    <p
                      className="text-[#4B4B4B] leading-relaxed"
                      style={{
                        fontFamily: option.fontFamily,
                        fontWeight: option.answerWeight,
                      }}
                    >
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-[#4B4B4B] text-sm">
            Visit <code className="bg-[#F1E7DA] px-2 py-1 rounded">/faq</code> to see the current FAQ styling
          </p>
        </div>
      </div>
    </div>
  );
}

