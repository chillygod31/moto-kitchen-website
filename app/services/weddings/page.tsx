import ServicePageTemplate from "../../components/ServicePageTemplate";

export const metadata = {
  title: "Wedding Catering | Moto Kitchen",
  description: "Authentic Tanzanian wedding catering in the Netherlands. Custom menus, tasting sessions, and full-service for your special day.",
};

const includedItems = [
  { icon: "📋", title: "Menu Consultation", description: "Personalized planning to create your perfect menu" },
  { icon: "🍽️", title: "Tasting Session", description: "Sample dishes before your big day (50+ guests)" },
  { icon: "👨‍🍳", title: "Professional Chefs", description: "Experienced team preparing fresh on-site or delivered" },
  { icon: "🍴", title: "Full Service Staff", description: "Attentive servers for seamless dining experience" },
  { icon: "🏺", title: "Serving Equipment", description: "All plates, cutlery, and serving ware included" },
  { icon: "🧹", title: "Setup & Cleanup", description: "We handle everything so you can enjoy your day" },
  { icon: "🥗", title: "Dietary Options", description: "Vegetarian, vegan, halal, and allergy-friendly choices" },
  { icon: "🎨", title: "Custom Presentation", description: "Beautiful displays that match your theme" },
];

const faqs = [
  { question: "How far in advance should we book?", answer: "We recommend booking 3-6 months in advance for weddings to ensure availability and allow time for menu planning and tasting sessions." },
  { question: "Do you offer tasting sessions?", answer: "Yes! Complimentary tasting sessions are available for weddings with 50+ guests. This allows you to sample dishes and finalize your menu." },
  { question: "Can you accommodate dietary restrictions?", answer: "Absolutely. We can prepare vegetarian, vegan, gluten-free, halal, and other dietary options. Please inform us during the planning process." },
  { question: "What service styles do you offer?", answer: "We offer buffet, family-style, plated service, and cocktail reception formats. We'll help you choose the best style for your venue and vision." },
  { question: "Do you provide serving staff?", answer: "Yes, we provide professional serving staff. Serving staff is an additional cost. The number of staff depends on your guest count and service style, and we'll include this in your custom quote." },
  { question: "What is your pricing structure?", answer: "Pricing is based on guest count, menu selection, and service style. We provide custom quotes after understanding your specific needs." },
  { question: "Do you travel throughout the Netherlands?", answer: "Yes, we cater weddings anywhere in the Netherlands. Travel fees may apply for locations far from our base." },
  { question: "What is your cancellation policy?", answer: "Cancellations more than 30 days before receive a full deposit refund. Please see our terms for full details." },
  { question: "Can we customize the menu?", answer: "Absolutely! We work with you to create a menu that reflects your preferences, cultural background, and dietary needs." },
  { question: "Do you handle setup and cleanup?", answer: "Yes, we arrive early to set up and stay after to clean up. You can focus on enjoying your special day." },
];

const testimonials = [
  { quote: "Moto Kitchen made our wedding day absolutely perfect. The food was incredible and our guests couldn't stop talking about it!", author: "Maria & David", location: "Amsterdam", eventType: "Wedding", rating: 5 },
  { quote: "From the tasting to the big day, everything was flawless. The team was professional and the Tanzanian dishes were a unique touch our guests loved.", author: "Lisa & James", location: "Rotterdam", eventType: "Wedding", rating: 5 },
];

const galleryImages = [
  { src: "", alt: "Wedding buffet setup" },
  { src: "", alt: "Elegant table presentation" },
  { src: "", alt: "Nyama Choma station" },
  { src: "", alt: "Dessert display" },
  { src: "", alt: "Guests enjoying food" },
  { src: "", alt: "Chef preparing dishes" },
];

export default function WeddingsPage() {
  return (
    <ServicePageTemplate
      heroTitle="Wedding Catering"
      heroSubtitle="Create unforgettable memories with authentic Tanzanian cuisine on your special day"
      introText="Your wedding day deserves food that tells a story. Our team of eight women, running Moto Kitchen like family, brings the rich, vibrant flavours of Tanzania to your celebration. Our recipes were learned from our mothers and grandmothers, using spices from Tanzania and Zanzibar whenever we can. The flavours carry warmth, comfort, and a little spark, the kind that makes people pause after the first bite and say, 'this tastes like home.' From intimate ceremonies to grand celebrations, we tailor every detail to your vision."
      includedItems={includedItems}
      galleryImages={galleryImages}
      faqs={faqs}
      testimonials={testimonials}
    />
  );
}
