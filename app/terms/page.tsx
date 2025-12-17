export const metadata = {
  title: "Terms of Service | Moto Kitchen",
  description: "Moto Kitchen's terms of service. Read our terms and conditions for catering services.",
};

export default function TermsPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-12 bg-[#3A2A24]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-white/70">Last updated: December 2024</p>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding bg-[#FAF6EF]">
        <div className="max-w-3xl mx-auto">
          <div className="card space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-[#1F1F1F] mb-4">1. Agreement to Terms</h2>
              <p className="text-[#4B4B4B] leading-relaxed">
                By booking our catering services, you agree to these Terms of Service. 
                Please read them carefully before making a booking.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#1F1F1F] mb-4">2. Booking & Confirmation</h2>
              <p className="text-[#4B4B4B] leading-relaxed">
                A booking is confirmed once we receive your signed agreement and deposit payment. 
                We will provide a detailed quote and menu proposal before confirmation. 
                Final guest counts must be confirmed at least 7 days before the event.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#1F1F1F] mb-4">3. Payment Terms</h2>
              <ul className="list-disc pl-6 text-[#4B4B4B] space-y-2">
                <li>A 30% deposit is required to secure your booking</li>
                <li>The remaining balance is due 7 days before the event</li>
                <li>We accept bank transfer and major payment methods</li>
                <li>All prices are inclusive of VAT unless otherwise stated</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#1F1F1F] mb-4">4. Cancellation Policy</h2>
              <ul className="list-disc pl-6 text-[#4B4B4B] space-y-2">
                <li><strong>More than 30 days before:</strong> Full deposit refund</li>
                <li><strong>15-30 days before:</strong> 50% deposit refund</li>
                <li><strong>Less than 14 days before:</strong> Deposit is non-refundable</li>
                <li><strong>Less than 7 days before:</strong> Full payment may be required</li>
              </ul>
              <p className="text-[#4B4B4B] leading-relaxed mt-4">
                We understand that circumstances can change. Please contact us as soon as possible 
                if you need to cancel or reschedule.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#1F1F1F] mb-4">5. Menu Changes</h2>
              <p className="text-[#4B4B4B] leading-relaxed">
                Menu changes can be made up to 14 days before the event at no additional charge. 
                Changes requested within 14 days may incur additional costs depending on ingredient 
                availability and preparation requirements.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#1F1F1F] mb-4">6. Dietary Requirements</h2>
              <p className="text-[#4B4B4B] leading-relaxed">
                We take dietary requirements seriously. Please inform us of any allergies or 
                dietary restrictions at the time of booking. While we take every precaution, 
                we cannot guarantee a completely allergen-free environment.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#1F1F1F] mb-4">7. Venue Requirements</h2>
              <p className="text-[#4B4B4B] leading-relaxed">
                We require access to the venue at least 2 hours before the event start time. 
                The venue must provide access to electricity and water. Any additional venue 
                requirements will be discussed during the planning process.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#1F1F1F] mb-4">8. Liability</h2>
              <p className="text-[#4B4B4B] leading-relaxed">
                Moto Kitchen maintains appropriate insurance coverage. Our liability is limited 
                to the value of the catering services provided. We are not liable for circumstances 
                beyond our reasonable control.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#1F1F1F] mb-4">9. Contact</h2>
              <p className="text-[#4B4B4B] leading-relaxed">
                If you have any questions about these terms, please contact us at:<br />
                Email: info@motokitchen.nl
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

