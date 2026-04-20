import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menu | Moto Kitchen",
  description: "Explore Moto Kitchen's authentic Tanzanian menu. Grilled meats, stews, rice dishes, and more — perfect for catering events across the Netherlands.",
  alternates: { canonical: "https://motokitchen.nl/menu" },
};

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return children;
}
