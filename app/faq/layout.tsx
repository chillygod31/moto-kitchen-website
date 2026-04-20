import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ | Moto Kitchen",
  description: "Frequently asked questions about Moto Kitchen's Tanzanian catering services. Pricing, dietary options, delivery, and booking details.",
  alternates: { canonical: "https://motokitchen.nl/faq" },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return children;
}
