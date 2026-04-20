import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | Moto Kitchen",
  description: "Get in touch with Moto Kitchen. Request a quote, ask a question, or book authentic Tanzanian catering for your event in the Netherlands.",
  alternates: { canonical: "https://motokitchen.nl/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
