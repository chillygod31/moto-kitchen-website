"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const dietaryOptions = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "gluten-free", label: "Gluten-Free" },
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
                        onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                        className="w-full px-4 py-3 border border-[#E6D9C8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9653B] focus:border-transparent bg-white"
                      >
                        <option value="">Select event type</option>
                        <option value="private">Private Events</option>
                        <option value="corporate">Corporate</option>
                        <option value="wedding">Wedding</option>
                        <option value="pickup-delivery">Pick Up & Delivery</option>
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
