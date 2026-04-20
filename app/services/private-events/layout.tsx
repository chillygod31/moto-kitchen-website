import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Private Event Catering | Moto Kitchen",
  description: "Authentic Tanzanian catering for private events in the Netherlands. Birthday parties, anniversaries, family gatherings, and intimate celebrations.",
  alternates: { canonical: "https://motokitchen.nl/services/private-events" },
};

export default function PrivateEventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
