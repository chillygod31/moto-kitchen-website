import ServicePageTemplate from "../../components/ServicePageTemplate";

export const metadata = {
  title: "Corporate Catering | Moto Kitchen",
  description: "Professional Tanzanian catering for corporate events in the Netherlands. Team lunches, conferences, client meetings, and company celebrations.",
};

const includedItems = [
  { icon: "📊", title: "Flexible Packages", description: "Options for every budget and group size" },
  { icon: "⏰", title: "Punctual Delivery", description: "Reliable timing for your business schedule" },
  { icon: "🍱", title: "Individual Portions", description: "Pre-packaged options for meetings available" },
  { icon: "🏢", title: "Office Setup", description: "We handle setup in your workspace" },
  { icon: "🥗", title: "Dietary Labels", description: "Clear labeling for all dietary options" },
  { icon: "♻️", title: "Eco-Friendly", description: "Sustainable packaging options available" },
  { icon: "📞", title: "Dedicated Contact", description: "Single point of contact for your event" },
  { icon: "🔄", title: "Repeat Discounts", description: "Special rates for regular corporate clients" },
];

const faqs = [
  { question: "What is the minimum order for corporate events?", answer: "We cater corporate events from 10 guests and up. For smaller meetings, we offer boxed lunch options." },
  { question: "How far in advance should we book?", answer: "We recommend 1-2 weeks notice for most corporate events. For large events (100+), 3-4 weeks is ideal." },
  { question: "Do you offer recurring catering services?", answer: "Yes! We offer special rates for regular corporate clients. Weekly team lunches, monthly events — we can arrange a schedule." },
  { question: "Can you accommodate dietary restrictions?", answer: "Absolutely. We provide vegetarian, vegan, gluten-free, halal, and allergy-friendly options with clear labeling." },
  { question: "Do you provide individual portions?", answer: "Yes, we offer boxed meals and individual portions perfect for meetings and conferences." },
  { question: "What about setup and cleanup?", answer: "We handle all setup and can arrange cleanup. For drop-off service, we provide all necessary serving items." },
  { question: "Can you cater at our office?", answer: "Yes, we cater at offices, conference venues, and corporate event spaces throughout the Netherlands." },
  { question: "Do you offer vegetarian/vegan menus?", answer: "Yes, we have extensive vegetarian and vegan options. Many traditional Tanzanian dishes are naturally plant-based." },
  { question: "What payment options do you accept?", answer: "We accept bank transfer and can provide invoices for corporate accounting. NET 14 terms available for established clients." },
  { question: "Can you cater outdoor company events?", answer: "Absolutely! We cater company picnics, team building events, and outdoor celebrations." },
];

const testimonials = [
  { quote: "Our team loved the unique flavours! Moto Kitchen has become our go-to for company events. Professional, reliable, and delicious.", author: "Thomas K.", location: "Rotterdam", eventType: "Corporate Event", rating: 5 },
  { quote: "Outstanding service for our annual conference. The food was the highlight and everyone was impressed by the authentic Tanzanian dishes.", author: "Mark van den Berg", location: "Eindhoven", eventType: "Corporate Event", rating: 5 },
];

const galleryImages = [
  { src: "", alt: "Corporate buffet setup" },
  { src: "", alt: "Team lunch spread" },
  { src: "", alt: "Conference catering" },
  { src: "", alt: "Individual boxed meals" },
  { src: "", alt: "Office event setup" },
  { src: "", alt: "Professional presentation" },
];

export default function CorporatePage() {
  return (
    <ServicePageTemplate
      heroTitle="Corporate Catering"
      heroSubtitle="Impress your team and clients with authentic Tanzanian cuisine"
      introText="Elevate your corporate events with something memorable. Our dedicated team of eight women, continuing the legacy of three generations of family cooks, brings authentic Tanzanian cuisine to your business events. Whether it's a team lunch, client meeting, conference, or company celebration, our heritage-inspired dishes bring people together and create talking points. Professional service, reliable timing, and exceptional food — every time."
      includedItems={includedItems}
      galleryImages={galleryImages}
      faqs={faqs}
      testimonials={testimonials}
    />
  );
}
