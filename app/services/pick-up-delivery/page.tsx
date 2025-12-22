import ServicePageTemplate from "../../components/ServicePageTemplate";
import SplitWhatsIncluded from "../../components/SplitWhatsIncluded";
import { galleryItems } from "../../../lib/gallery-data";

export const metadata = {
  title: "Pick Up & Delivery | Moto Kitchen",
  description: "Convenient pick-up and delivery service for authentic Tanzanian cuisine across the Netherlands, Belgium, Germany, and beyond.",
};

const includedItems = [
  { icon: "🚗", title: "Nationwide Delivery", description: "We deliver across the Netherlands, Belgium, Germany, and beyond" },
  { icon: "📦", title: "Flexible Ordering", description: "Order in advance or same-day when available" },
  { icon: "🍽️", title: "Fresh Prepared", description: "All meals prepared fresh and ready to enjoy" },
  { icon: "📍", title: "Pick-Up Available", description: "Convenient pick-up from our kitchen location" },
  { icon: "⏰", title: "Scheduled Delivery", description: "Choose your preferred delivery time slot" },
  { icon: "💳", title: "Easy Payment", description: "Secure online payment or cash on delivery" },
];

const faqs = [
  { question: "What areas do you deliver to?", answer: "We deliver throughout the Netherlands, Belgium, Germany, and beyond. Delivery fees vary by location and distance." },
  { question: "How far in advance should I order?", answer: "We recommend ordering at least 24-48 hours in advance to ensure availability. Same-day orders may be available depending on our schedule." },
  { question: "What is the minimum order for delivery?", answer: "Minimum order varies by location. Contact us for specific requirements in your area." },
  { question: "Can I pick up my order instead?", answer: "Yes! Pick-up is available from our kitchen. This is often faster and more convenient if you're nearby." },
  { question: "How are the meals packaged for delivery?", answer: "All meals are packaged in secure, food-safe containers designed to maintain temperature and freshness during transport." },
  { question: "Do you offer hot or cold delivery?", answer: "We can provide both hot and cold delivery options depending on your order. Hot items are kept warm in insulated containers." },
  { question: "What payment methods do you accept?", answer: "We accept bank transfer, online payment, and cash on delivery (where available)." },
  { question: "Can I customize my order?", answer: "Absolutely! We can accommodate dietary restrictions and preferences. Just let us know when you place your order." },
  { question: "Do you deliver on weekends?", answer: "Yes, we offer delivery on weekends. Availability may vary, so please check with us when placing your order." },
  { question: "What if I'm not home for delivery?", answer: "We'll contact you to arrange an alternative delivery time or location. Please provide accurate contact information when ordering." },
];

const testimonials = [
  { quote: "The delivery was prompt and the food arrived still warm and delicious. Perfect for our family dinner!", author: "Fatima A.", location: "Amsterdam", eventType: "Delivery", rating: 5 },
  { quote: "Easy ordering process and the pick-up was quick. The food was amazing and our guests loved it!", author: "Michael B.", location: "Rotterdam", eventType: "Pick-Up", rating: 5 },
];

const howItWorksSteps = [
  { 
    number: "1", 
    title: "Inquiry", 
    bullets: [
      "Submit our quote form (2 minutes) or contact us directly",
      "Share your date, location, guest count, and budget",
      "Tell us any dietary needs or preferred dishes"
    ]
  },
  { 
    number: "2", 
    title: "Proposal", 
    bullets: [
      "Receive a tailored menu + quote within 24 to 48 hours",
      "Clear options based on your event style and budget",
      "Optional consultation call (if helpful)"
    ]
  },
  { 
    number: "3", 
    title: "Confirm", 
    bullets: [
      "Secure your date with a 50% deposit (or full payment if within 7 days)",
      "Final guest count confirmed 5 days before",
      "We finalize logistics with you/your venue"
    ]
  },
  { 
    number: "4", 
    title: "Event Day", 
    bullets: [
      "We arrive on time with fresh, beautifully presented food",
      "Seamless setup and service (as agreed)",
      "You enjoy the moment and we handle the rest"
    ]
  },
];

// Get only food images for the carousel, starting with delivery.jpg
const foodImages = [
  "/delivery.jpg",
  ...galleryItems
    .filter(item => item.category === "food")
    .map(item => item.src)
];

export default function PickUpDeliveryPage() {
  return (
    <ServicePageTemplate
      heroTitle="Pick Up & Delivery"
      heroSubtitle="Authentic Tanzanian cuisine delivered to your door or ready for pick-up"
      introText="Enjoy Moto Kitchen's authentic Tanzanian flavours from the comfort of your home or office. Our pick-up and delivery service brings our family recipes directly to you across the Netherlands, Belgium, Germany, and beyond. Whether you're planning a family meal, office lunch, or special occasion, we prepare everything fresh and deliver it ready to enjoy. Our team ensures your order arrives on time and at the perfect temperature, so you can focus on what matters most, sharing great food with the people you care about."
      includedItems={includedItems}
      galleryImages={[]}
      faqs={faqs}
      testimonials={testimonials}
      howItWorksSteps={howItWorksSteps}
      customWhatsIncluded={<SplitWhatsIncluded items={includedItems} images={foodImages} />}
    />
  );
}

