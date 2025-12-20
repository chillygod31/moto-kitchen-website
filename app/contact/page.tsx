"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const dietaryOptions = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "gluten-free", label: "Gluten-Free" },
  { id: "nut-free", label: "Nut-Free" },
  { id: "other", label: "Other (specify in notes)" },
];

const countries = [
  { code: "+31", flag: "🇳🇱", name: "Netherlands" },
  { code: "+32", flag: "🇧🇪", name: "Belgium" },
  { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+1", flag: "🇺🇸", name: "United States" },
  { code: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "+33", flag: "🇫🇷", name: "France" },
  { code: "+39", flag: "🇮🇹", name: "Italy" },
  { code: "+34", flag: "🇪🇸", name: "Spain" },
  { code: "+41", flag: "🇨🇭", name: "Switzerland" },
  { code: "+43", flag: "🇦🇹", name: "Austria" },
  { code: "+45", flag: "🇩🇰", name: "Denmark" },
  { code: "+46", flag: "🇸🇪", name: "Sweden" },
  { code: "+47", flag: "🇳🇴", name: "Norway" },
  { code: "+351", flag: "🇵🇹", name: "Portugal" },
  { code: "+353", flag: "🇮🇪", name: "Ireland" },
  { code: "+358", flag: "🇫🇮", name: "Finland" },
  { code: "+48", flag: "🇵🇱", name: "Poland" },
  { code: "+420", flag: "🇨🇿", name: "Czech Republic" },
  { code: "+352", flag: "🇱🇺", name: "Luxembourg" },
  { code: "+385", flag: "🇭🇷", name: "Croatia" },
  { code: "+386", flag: "🇸🇮", name: "Slovenia" },
  { code: "+380", flag: "🇺🇦", name: "Ukraine" },
  { code: "+40", flag: "🇷🇴", name: "Romania" },
  { code: "+36", flag: "🇭🇺", name: "Hungary" },
  { code: "+30", flag: "🇬🇷", name: "Greece" },
  { code: "+421", flag: "🇸🇰", name: "Slovakia" },
  { code: "+359", flag: "🇧🇬", name: "Bulgaria" },
  { code: "+370", flag: "🇱🇹", name: "Lithuania" },
  { code: "+371", flag: "🇱🇻", name: "Latvia" },
  { code: "+372", flag: "🇪🇪", name: "Estonia" },
  { code: "+356", flag: "🇲🇹", name: "Malta" },
  { code: "+357", flag: "🇨🇾", name: "Cyprus" },
  { code: "+354", flag: "🇮🇸", name: "Iceland" },
  { code: "+7", flag: "🇷🇺", name: "Russia" },
  { code: "+27", flag: "🇿🇦", name: "South Africa" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+64", flag: "🇳🇿", name: "New Zealand" },
  { code: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "+82", flag: "🇰🇷", name: "South Korea" },
  { code: "+86", flag: "🇨🇳", name: "China" },
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+255", flag: "🇹🇿", name: "Tanzania" },
  { code: "+254", flag: "🇰🇪", name: "Kenya" },
  { code: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "+20", flag: "🇪🇬", name: "Egypt" },
  { code: "+212", flag: "🇲🇦", name: "Morocco" },
  { code: "+233", flag: "🇬🇭", name: "Ghana" },
  { code: "+90", flag: "🇹🇷", name: "Turkey" },
  { code: "+65", flag: "🇸🇬", name: "Singapore" },
  { code: "+60", flag: "🇲🇾", name: "Malaysia" },
  { code: "+66", flag: "🇹🇭", name: "Thailand" },
  { code: "+84", flag: "🇻🇳", name: "Vietnam" },
  { code: "+62", flag: "🇮🇩", name: "Indonesia" },
  { code: "+63", flag: "🇵🇭", name: "Philippines" },
  { code: "+92", flag: "🇵🇰", name: "Pakistan" },
  { code: "+880", flag: "🇧🇩", name: "Bangladesh" },
  { code: "+94", flag: "🇱🇰", name: "Sri Lanka" },
  { code: "+961", flag: "🇱🇧", name: "Lebanon" },
  { code: "+962", flag: "🇯🇴", name: "Jordan" },
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+972", flag: "🇮🇱", name: "Israel" },
  { code: "+381", flag: "🇷🇸", name: "Serbia" },
  { code: "+382", flag: "🇲🇪", name: "Montenegro" },
  { code: "+387", flag: "🇧🇦", name: "Bosnia" },
  { code: "+389", flag: "🇲🇰", name: "North Macedonia" },
  { code: "+355", flag: "🇦🇱", name: "Albania" },
  { code: "+373", flag: "🇲🇩", name: "Moldova" },
  { code: "+375", flag: "🇧🇾", name: "Belarus" },
  { code: "+374", flag: "🇦🇲", name: "Armenia" },
  { code: "+995", flag: "🇬🇪", name: "Georgia" },
  { code: "+994", flag: "🇦🇿", name: "Azerbaijan" },
  { code: "+850", flag: "🇰🇵", name: "North Korea" },
  { code: "+852", flag: "🇭🇰", name: "Hong Kong" },
  { code: "+853", flag: "🇲🇴", name: "Macau" },
  { code: "+886", flag: "🇹🇼", name: "Taiwan" },
  { code: "+213", flag: "🇩🇿", name: "Algeria" },
  { code: "+216", flag: "🇹🇳", name: "Tunisia" },
  { code: "+218", flag: "🇱🇾", name: "Libya" },
  { code: "+220", flag: "🇬🇲", name: "Gambia" },
  { code: "+221", flag: "🇸🇳", name: "Senegal" },
  { code: "+223", flag: "🇲🇱", name: "Mali" },
  { code: "+224", flag: "🇬🇳", name: "Guinea" },
  { code: "+225", flag: "🇨🇮", name: "Côte d'Ivoire" },
  { code: "+226", flag: "🇧🇫", name: "Burkina Faso" },
  { code: "+227", flag: "🇳🇪", name: "Niger" },
  { code: "+228", flag: "🇹🇬", name: "Togo" },
  { code: "+229", flag: "🇧🇯", name: "Benin" },
  { code: "+230", flag: "🇲🇺", name: "Mauritius" },
  { code: "+231", flag: "🇱🇷", name: "Liberia" },
  { code: "+232", flag: "🇸🇱", name: "Sierra Leone" },
  { code: "+235", flag: "🇹🇩", name: "Chad" },
  { code: "+236", flag: "🇨🇫", name: "Central African Republic" },
  { code: "+237", flag: "🇨🇲", name: "Cameroon" },
  { code: "+238", flag: "🇨🇻", name: "Cape Verde" },
  { code: "+240", flag: "🇬🇶", name: "Equatorial Guinea" },
  { code: "+241", flag: "🇬🇦", name: "Gabon" },
  { code: "+242", flag: "🇨🇬", name: "Republic of the Congo" },
  { code: "+243", flag: "🇨🇩", name: "Democratic Republic of the Congo" },
  { code: "+244", flag: "🇦🇴", name: "Angola" },
  { code: "+245", flag: "🇬🇼", name: "Guinea-Bissau" },
  { code: "+248", flag: "🇸🇨", name: "Seychelles" },
  { code: "+249", flag: "🇸🇩", name: "Sudan" },
  { code: "+250", flag: "🇷🇼", name: "Rwanda" },
  { code: "+251", flag: "🇪🇹", name: "Ethiopia" },
  { code: "+252", flag: "🇸🇴", name: "Somalia" },
  { code: "+253", flag: "🇩🇯", name: "Djibouti" },
  { code: "+256", flag: "🇺🇬", name: "Uganda" },
  { code: "+257", flag: "🇧🇮", name: "Burundi" },
  { code: "+258", flag: "🇲🇿", name: "Mozambique" },
  { code: "+260", flag: "🇿🇲", name: "Zambia" },
  { code: "+261", flag: "🇲🇬", name: "Madagascar" },
  { code: "+262", flag: "🇷🇪", name: "Réunion" },
  { code: "+263", flag: "🇿🇼", name: "Zimbabwe" },
  { code: "+264", flag: "🇳🇦", name: "Namibia" },
  { code: "+265", flag: "🇲🇼", name: "Malawi" },
  { code: "+266", flag: "🇱🇸", name: "Lesotho" },
  { code: "+267", flag: "🇧🇼", name: "Botswana" },
  { code: "+268", flag: "🇸🇿", name: "Eswatini" },
  { code: "+269", flag: "🇰🇲", name: "Comoros" },
  { code: "+270", flag: "🇸🇸", name: "South Sudan" },
  { code: "+291", flag: "🇪🇷", name: "Eritrea" },
];

const primaryMarkets = countries.filter(c => ["+31", "+32", "+49"].includes(c.code));
const otherCountries = countries.filter(c => !["+31", "+32", "+49"].includes(c.code));

export default function ContactPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    countryCode: "+31", // Default to Netherlands
    phone: "",
    eventType: "",
    eventTypeOther: "",
    eventDate: "",
    dateFlexible: false,
    guestCount: "",
    location: "",
    serviceType: "",
    dietary: [] as string[],
    message: "",
    howFound: "",
    howFoundOther: "",
    budget: "",
    // Honeypot field
    website: "",
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedCountry = countries.find(c => c.code === formData.countryCode) || countries[0];

  const handleCountrySelect = (code: string) => {
    setFormData({ ...formData, countryCode: code });
    setIsCountryDropdownOpen(false);
  };

  const handleDietaryChange = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      dietary: prev.dietary.includes(id)
        ? prev.dietary.filter((d) => d !== id)
        : [...prev.dietary, id],
    }));
  };

  // Helper function to check if budget is required
  const isBudgetRequired = () => {
    return formData.serviceType !== "pickup-only" && formData.serviceType !== "not-sure-service";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Honeypot check - if filled, it's a bot
    if (formData.website) {
      // Silently reject
      router.push("/contact/thank-you");
      return;
    }

    // Conditional budget validation
    if (isBudgetRequired() && !formData.budget) {
      setError("Please select an estimated budget");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: `${formData.countryCode} ${formData.phone}`,
          eventType: formData.eventType === "other" && formData.eventTypeOther 
            ? `Other: ${formData.eventTypeOther}` 
            : formData.eventType,
          eventDate: formData.dateFlexible ? "Flexible" : formData.eventDate,
          guestCount: formData.guestCount,
          location: formData.location,
          serviceType: formData.serviceType,
          dietary: formData.dietary,
          message: formData.message,
          howFound: formData.howFound === "other" && formData.howFoundOther 
            ? `Other: ${formData.howFoundOther}` 
            : formData.howFound,
          budget: formData.budget,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      router.push("/contact/thank-you");
    } catch (err) {
      setError("Something went wrong. Please try again or contact us directly via email.");
    } finally {
    setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-[#3A2A24]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">Get in Touch</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Request a Quote
          </h1>
          <p className="text-xl text-white/80">
            Tell us about your event and we&apos;ll create a custom proposal
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="section-padding bg-[#FAF6EF]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div className="md:col-span-1">
              <h2 className="text-2xl font-bold text-[#1F1F1F] mb-6">
                Get in Touch
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-[#1F1F1F] mb-2">Email</h3>
                  <a href="mailto:contact@motokitchen.nl" className="text-[#C9653B] hover:underline">
                    contact@motokitchen.nl
                  </a>
                </div>
                
                <div>
                  <h3 className="font-semibold text-[#1F1F1F] mb-2">Instagram</h3>
                  <a href="https://instagram.com/motokitchen.nl" target="_blank" rel="noopener noreferrer" className="text-[#C9653B] hover:underline flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    @motokitchen.nl
                  </a>
                </div>
                
                <div>
                  <h3 className="font-semibold text-[#1F1F1F] mb-2">TikTok</h3>
                  <a href="https://www.tiktok.com/@motokitchen.nl" target="_blank" rel="noopener noreferrer" className="text-[#C9653B] hover:underline flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    @motokitchen.nl
                  </a>
                </div>
                
                <div>
                  <h3 className="font-semibold text-[#1F1F1F] mb-2">Location</h3>
                  <p className="text-[#4B4B4B]">Netherlands</p>
                  <p className="text-[#4B4B4B] text-sm mt-1">Serving the Netherlands, Belgium, Germany, and beyond</p>
                </div>
              </div>

              <div className="mt-8 p-6 bg-[#F1E7DA] rounded-lg border border-[#E6D9C8]">
                <p className="font-semibold text-[#1F1F1F] mb-2">Response Time</p>
                <p className="text-[#4B4B4B] text-sm">
                  We typically respond within 24 hours.
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="md:col-span-2">
              <div className="card">
                <h2 className="text-2xl font-bold text-[#1F1F1F] mb-6">
                  Tell Us About Your Event
                </h2>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Honeypot - hidden from users */}
                  <input
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="hidden"
                    tabIndex={-1}
                    autoComplete="off"
                  />

                  {/* Event Type & Date */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#1F1F1F] mb-2">
                        Event Type <span className="text-[#C9653B]">*</span>
                      </label>
                      <select
                        required
                        value={formData.eventType}
                        onChange={(e) => setFormData({ ...formData, eventType: e.target.value, eventTypeOther: "" })}
                        className="w-full px-4 py-3 border border-[#E6D9C8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9653B] focus:border-transparent bg-white"
                      >
                        <option value="">Select event type</option>
                        <option value="private">Private Event</option>
                        <option value="corporate">Corporate</option>
                        <option value="wedding">Wedding</option>
                        <option value="pickup-only">Pick Up Only</option>
                        <option value="other">Other (please specify)</option>
                      </select>
                      {formData.eventType === "other" && (
                        <div className="mt-3">
                          <input
                            type="text"
                            required
                            value={formData.eventTypeOther}
                            onChange={(e) => setFormData({ ...formData, eventTypeOther: e.target.value })}
                            placeholder="Please specify event type..."
                            className="w-full px-4 py-3 border border-[#E6D9C8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9653B] focus:border-transparent bg-white"
                          />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-[#1F1F1F] mb-2">
                        Event Date
                      </label>
                      <input
                        type="date"
                        value={formData.eventDate}
                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                        disabled={formData.dateFlexible}
                        className="w-full px-4 py-3 border border-[#E6D9C8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9653B] focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                      <label className="flex items-center gap-2 mt-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.dateFlexible}
                          onChange={(e) => setFormData({ ...formData, dateFlexible: e.target.checked, eventDate: "" })}
                          className="w-4 h-4 text-[#C9653B] border-[#E6D9C8] rounded focus:ring-[#C9653B]"
                        />
                        <span className="text-sm text-[#4B4B4B]">Date is flexible</span>
                      </label>
                    </div>
                  </div>

                  {/* Guest Count & Location */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#1F1F1F] mb-2">
                        Number of Guests <span className="text-[#C9653B]">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.guestCount}
                        onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                        className="w-full px-4 py-3 border border-[#E6D9C8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9653B] focus:border-transparent bg-white"
                        placeholder="e.g. 50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-[#1F1F1F] mb-2">
                        City / Location <span className="text-[#C9653B]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-4 py-3 border border-[#E6D9C8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9653B] focus:border-transparent bg-white"
                        placeholder="e.g. Amsterdam"
                      />
                    </div>
                  </div>

                  {/* Service Type */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1F1F1F] mb-3">
                      Service Type <span className="text-[#C9653B]">*</span>
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: "full-catering", label: "Full Catering Service", description: "We deliver, set up, serve, and clean up" },
                        { value: "drop-off", label: "Drop-Off Catering", description: "We deliver fresh food, you handle serving" },
                        { value: "pickup-only", label: "Pick-Up Only", description: "You collect from our location in Rotterdam" },
                        { value: "not-sure-service", label: "Not sure yet", description: "We'll help you decide" },
                      ].map((option) => (
                        <label key={option.value} className="flex items-start gap-3 cursor-pointer p-3 border border-[#E6D9C8] rounded-md hover:bg-[#F1E7DA] transition-colors">
                          <input
                            type="radio"
                            name="serviceType"
                            required
                            value={option.value}
                            checked={formData.serviceType === option.value}
                            onChange={(e) => {
                              const newServiceType = e.target.value;
                              setFormData({ 
                                ...formData, 
                                serviceType: newServiceType,
                                budget: (newServiceType === "pickup-only" || newServiceType === "not-sure-service") ? "" : formData.budget
                              });
                            }}
                            className="w-4 h-4 text-[#C9653B] border-[#E6D9C8] focus:ring-[#C9653B] mt-0.5 flex-shrink-0"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-[#1F1F1F] block">{option.label}</span>
                            <span className="text-xs text-[#4B4B4B] block mt-1">{option.description}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Budget Range */}
                  <div className={isBudgetRequired() ? "" : "opacity-50 pointer-events-none"}>
                    <label className="block text-sm font-semibold text-[#1F1F1F] mb-3">
                      Estimated Budget {isBudgetRequired() && <span className="text-[#C9653B]">*</span>}
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        { value: "100-250", label: "€100-250" },
                        { value: "250-500", label: "€250-500" },
                        { value: "500-1000", label: "€500-1,000" },
                        { value: "1000-2500", label: "€1,000-2,500" },
                        { value: "2500-5000", label: "€2,500-5,000" },
                        { value: "5000+", label: "€5,000+" },
                        { value: "not-sure", label: "Not sure yet" },
                      ].map((option) => (
                        <label key={option.value} className={`flex items-center gap-2 p-3 border border-[#E6D9C8] rounded-md transition-colors ${isBudgetRequired() ? "cursor-pointer hover:bg-[#F1E7DA]" : "cursor-not-allowed"}`}>
                          <input
                            type="radio"
                            name="budget"
                            required={isBudgetRequired()}
                            disabled={!isBudgetRequired()}
                            value={option.value}
                            checked={formData.budget === option.value}
                            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                            className="w-4 h-4 text-[#C9653B] border-[#E6D9C8] focus:ring-[#C9653B]"
                          />
                          <span className="text-sm text-[#4B4B4B]">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#1F1F1F] mb-2">
                        Name <span className="text-[#C9653B]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-[#E6D9C8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9653B] focus:border-transparent bg-white"
                        placeholder="Your name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-[#1F1F1F] mb-2">
                        Email <span className="text-[#C9653B]">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 border border-[#E6D9C8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9653B] focus:border-transparent bg-white"
                        placeholder="your@email.com"
                      />
                  </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#1F1F1F] mb-2">
                        Phone <span className="text-[#C9653B]">*</span>
                      </label>
                      <div className="flex border border-[#E6D9C8] rounded-md overflow-visible focus-within:ring-2 focus-within:ring-[#C9653B] focus-within:border-transparent bg-white relative">
                        <div ref={countryDropdownRef} className="relative">
                          <button
                            type="button"
                            onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                            className="px-3 py-3 border-0 border-r border-[#E6D9C8] focus:outline-none bg-white text-sm cursor-pointer flex items-center gap-1.5 hover:bg-gray-50 whitespace-nowrap"
                          >
                            <span>{selectedCountry.flag}</span>
                            <span>{selectedCountry.code}</span>
                            <svg
                              className={`w-4 h-4 text-[#4B4B4B] transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          
                          {isCountryDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 bg-white border border-[#E6D9C8] rounded-md shadow-lg z-50 max-h-80 overflow-y-auto w-[calc(100vw-3rem)] sm:w-80">
                              <div className="py-1">
                                <div className="px-3 py-2 text-xs font-semibold text-[#4B4B4B] bg-gray-50 sticky top-0">
                                  Primary Markets
                                </div>
                                {primaryMarkets.map((country) => (
                                  <button
                                    key={country.code}
                                    type="button"
                                    onClick={() => handleCountrySelect(country.code)}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                                      formData.countryCode === country.code ? 'bg-[#F1E7DA]' : ''
                                    }`}
                                  >
                                    <span>{country.flag}</span>
                                    <span>{country.name} ({country.code})</span>
                                  </button>
                                ))}
                                <div className="px-3 py-2 text-xs font-semibold text-[#4B4B4B] bg-gray-50 sticky top-0 border-t border-[#E6D9C8] mt-1">
                                  Other Countries
                                </div>
                                {otherCountries.map((country) => (
                                  <button
                                    key={country.code}
                                    type="button"
                                    onClick={() => handleCountrySelect(country.code)}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                                      formData.countryCode === country.code ? 'bg-[#F1E7DA]' : ''
                                    }`}
                                  >
                                    <span>{country.flag}</span>
                                    <span>{country.name} ({country.code})</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="flex-1 px-4 py-3 border-0 focus:outline-none bg-white"
                          placeholder="000000000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dietary Requirements */}
                    <div>
                    <label className="block text-sm font-semibold text-[#1F1F1F] mb-3">
                      Dietary Requirements
                      </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {dietaryOptions.map((option) => (
                        <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.dietary.includes(option.id)}
                            onChange={() => handleDietaryChange(option.id)}
                            className="w-4 h-4 text-[#C9653B] border-[#E6D9C8] rounded focus:ring-[#C9653B]"
                          />
                          <span className="text-sm text-[#4B4B4B]">{option.label}</span>
                      </label>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1F1F1F] mb-2">
                      Tell us about your event vision
                    </label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 border border-[#E6D9C8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9653B] focus:border-transparent resize-none bg-white"
                      placeholder="Share your event vision, any specific dishes you'd like, additional dietary details, or special requests. Example: 'It's my mother's 60th birthday. She loves Tanzanian food and we want guests to experience authentic flavors. Looking for a buffet setup with both meat and vegetarian options.'"
                    />
                  </div>

                  {/* How Found */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1F1F1F] mb-2">
                      How did you find us?
                    </label>
                    <select
                      value={formData.howFound}
                      onChange={(e) => setFormData({ ...formData, howFound: e.target.value, howFoundOther: "" })}
                      className="w-full px-4 py-3 border border-[#E6D9C8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9653B] focus:border-transparent bg-white"
                    >
                      <option value="">Select an option</option>
                      <option value="google">Google Search</option>
                      <option value="instagram">Instagram</option>
                      <option value="tiktok">TikTok</option>
                      <option value="referral">Friend/Family Referral</option>
                      <option value="event">Saw you at an event</option>
                      <option value="facebook">Facebook</option>
                      <option value="other">Other</option>
                    </select>
                    {formData.howFound === "other" && (
                      <div className="mt-3">
                        <input
                          type="text"
                          value={formData.howFoundOther}
                          onChange={(e) => setFormData({ ...formData, howFoundOther: e.target.value })}
                          placeholder="Please specify..."
                          className="w-full px-4 py-3 border border-[#E6D9C8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9653B] focus:border-transparent bg-white"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full text-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Sending..." : "Send Inquiry"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
