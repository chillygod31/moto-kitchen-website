"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const dietaryOptions = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "gluten-free", label: "Gluten-Free" },
  { id: "halal", label: "Halal" },
  { id: "nut-free", label: "Nut-Free" },
  { id: "other", label: "Other (specify in notes)" },
];

export default function ContactPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    eventType: "",
    eventDate: "",
    dateFlexible: false,
    guestCount: "",
    location: "",
    dietary: [] as string[],
    message: "",
    howFound: "",
    // Honeypot field
    website: "",
  });

  const handleDietaryChange = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      dietary: prev.dietary.includes(id)
        ? prev.dietary.filter((d) => d !== id)
        : [...prev.dietary, id],
    }));
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

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          eventType: formData.eventType,
          eventDate: formData.dateFlexible ? "Flexible" : formData.eventDate,
          guestCount: formData.guestCount,
          location: formData.location,
          dietary: formData.dietary,
          message: formData.message,
          howFound: formData.howFound,
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
        <div className="max-w-6xl mx-auto">
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
                  <a href="https://instagram.com/motokitchen.nl" target="_blank" rel="noopener noreferrer" className="text-[#C9653B] hover:underline">
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
                        onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                        className="w-full px-4 py-3 border border-[#E6D9C8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9653B] focus:border-transparent bg-white"
                      >
                        <option value="">Select event type</option>
                        <option value="private">Private Party</option>
                        <option value="wedding">Wedding</option>
                        <option value="corporate">Corporate Event</option>
                        <option value="other">Other</option>
                      </select>
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
                      <select
                        required
                        value={formData.guestCount}
                        onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                        className="w-full px-4 py-3 border border-[#E6D9C8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9653B] focus:border-transparent bg-white"
                      >
                        <option value="">Select guest count</option>
                        <option value="10-20">10-20 guests</option>
                        <option value="20-50">20-50 guests</option>
                        <option value="50-100">50-100 guests</option>
                        <option value="100-150">100-150 guests</option>
                        <option value="150+">150+ guests</option>
                      </select>
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

                  {/* Contact Info */}
                  <div className="grid md:grid-cols-3 gap-6">
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
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-[#E6D9C8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9653B] focus:border-transparent bg-white"
                        placeholder="+31 6 00 00 00 00"
                      />
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
                      Tell us about your vision
                    </label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 border border-[#E6D9C8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9653B] focus:border-transparent resize-none bg-white"
                      placeholder="Share your event vision, any specific dishes you'd like, additional dietary details, etc..."
                    />
                  </div>

                  {/* How Found */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1F1F1F] mb-2">
                      How did you find us?
                    </label>
                    <select
                      value={formData.howFound}
                      onChange={(e) => setFormData({ ...formData, howFound: e.target.value })}
                      className="w-full px-4 py-3 border border-[#E6D9C8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9653B] focus:border-transparent bg-white"
                    >
                      <option value="">Select an option</option>
                      <option value="google">Google Search</option>
                      <option value="instagram">Instagram</option>
                      <option value="referral">Friend/Family Referral</option>
                      <option value="event">Saw us at an event</option>
                      <option value="other">Other</option>
                    </select>
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
