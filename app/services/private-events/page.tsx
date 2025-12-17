import ServicePageTemplate from "../../components/ServicePageTemplate";

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

const galleryImages = [
  { src: "", alt: "Birthday celebration" },
  { src: "", alt: "Family gathering spread" },
  { src: "", alt: "Anniversary dinner" },
  { src: "", alt: "Home catering setup" },
  { src: "", alt: "Dessert table" },
  { src: "", alt: "Guests enjoying food" },
];

export default function PrivateEventsPage() {
  return (
    <ServicePageTemplate
      heroTitle="Private Event Catering"
      heroSubtitle="Bring people together with food that creates memories"
      introText="Life's special moments deserve exceptional food. Our dedicated team of eight women, all daughters of the original cooks and chefs who inspired Moto Kitchen, brings authentic Tanzanian cuisine to your celebrations. Whether you're celebrating a birthday, anniversary, graduation, or simply gathering loved ones together, we honor our family legacy in every dish, adding warmth and flavour to every occasion. We bring the feast to you — at home or your chosen venue."
      includedItems={includedItems}
      galleryImages={galleryImages}
      faqs={faqs}
      testimonials={testimonials}
    />
  );
}
