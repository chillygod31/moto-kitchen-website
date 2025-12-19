import ServicePageTemplate from "../../components/ServicePageTemplate";
import SplitWhatsIncluded from "../../components/SplitWhatsIncluded";
import { galleryItems } from "../../../lib/gallery-data";
import { formatPricing } from "../../../lib/pricing-data";

export const metadata = {
  title: "Private Event Catering | Moto Kitchen",
  description: "Authentic Tanzanian catering for private events in the Netherlands. Birthday parties, anniversaries, family gatherings, and celebrations.",
};

const includedItems = [
  { icon: "🎂", title: "Celebration Menus", description: "Special menus for birthdays, anniversaries & milestones" },
  { icon: "👨‍👩‍👧‍👦", title: "Family-Style Options", description: "Shared platters that bring people together" },
  { icon: "🎨", title: "Themed Menus", description: "Cultural celebrations and themed events" },
  { icon: "🏠", title: "Home Catering", description: "We come to your home or chosen venue" },
  { icon: "📏", title: "Any Size", description: "From intimate dinners to large gatherings" },
  { icon: "🍰", title: "Desserts Included", description: "Traditional Tanzanian sweets and treats" },
  { icon: "🥂", title: "Special Occasions", description: "Engagement parties, graduations & more" },
  { icon: "❤️", title: "Personal Touch", description: "Customized to your family's preferences" },
];

const faqs = [
  { question: "What is the minimum guest count?", answer: "We cater private events from 10 guests. For smaller gatherings, contact us to discuss options." },
  { question: "Can you cater at my home?", answer: "Yes! We regularly cater at private homes. We just need access to a basic setup area and electricity." },
  { question: "How do I choose a menu?", answer: "We'll discuss your preferences, dietary needs, and event style, then create a custom menu proposal for your approval." },
  { question: "Do you cater cultural celebrations?", answer: "Absolutely! We specialize in Tanzanian cuisine and can create authentic menus for cultural celebrations and heritage events." },
  { question: "What about dietary restrictions?", answer: "We accommodate all dietary needs including vegetarian, vegan, gluten-free, halal, and allergies. Just let us know." },
  { question: "Can I request specific dishes?", answer: "Yes! If there's a specific Tanzanian dish you love or want to try, let us know and we'll include it." },
  { question: "Do you provide serving staff for home events?", answer: "Yes, we can provide servers for your home event so you can relax and enjoy with your guests." },
  { question: "What's included in the price?", answer: "Our quotes include food, serving equipment, setup, and cleanup. Staff is included for full-service packages." },
  { question: "How far in advance should I book?", answer: "We recommend 2-3 weeks for most private events. For larger gatherings or peak seasons, book earlier." },
  { question: "Do you offer kids' menus?", answer: "Yes, we can prepare kid-friendly options alongside the main menu for family events." },
];

const testimonials = [
  { quote: "As a Tanzanian living in the Netherlands, this felt like home. The chapati and pilau were perfect! My family loved every dish.", author: "Amina J.", location: "Utrecht", eventType: "Family Gathering", rating: 5 },
  { quote: "We hired Moto Kitchen for our daughter's graduation party. The food was fresh, flavourful, and the service was impeccable.", author: "Sarah M.", location: "The Hague", eventType: "Private Party", rating: 5 },
];

// Get both private and corporate images from gallery data
const eventImages = galleryItems
  .filter(item => item.category === "private" || item.category === "corporate")
  .map(item => item.src);

export default function PrivateEventsPage() {
  return (
    <ServicePageTemplate
      heroTitle="Private Event Catering"
      heroSubtitle="Bring people together with food that creates memories"
      introText="Life's special moments deserve exceptional food. Our team of eight women, running Moto Kitchen like family, brings authentic Tanzanian cuisine to your celebrations. Our recipes were learned from our mothers and grandmothers, using spices from Tanzania and Zanzibar whenever we can. Whether you're celebrating a birthday, anniversary, graduation, or simply gathering loved ones together, we add warmth and flavour to every occasion. We bring the feast to you at home or your chosen venue."
      includedItems={includedItems}
      galleryImages={[]}
      faqs={faqs}
      testimonials={testimonials}
      customWhatsIncluded={<SplitWhatsIncluded items={includedItems} images={eventImages} />}
      pricing={formatPricing("private-events")}
    />
  );
}
