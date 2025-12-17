export const metadata = {
  title: "Privacy Policy | Moto Kitchen",
  description: "Moto Kitchen's privacy policy. Learn how we collect, use, and protect your personal information.",
};

export default function PrivacyPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-12 bg-[#3A2A24]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-white/70">Last updated: December 2024</p>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding bg-[#FAF6EF]">
        <div className="max-w-3xl mx-auto prose prose-lg">
          <div className="card space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-[#1F1F1F] mb-4">1. Introduction</h2>
              <p className="text-[#4B4B4B] leading-relaxed">
                Moto Kitchen (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, and safeguard your personal information 
                when you use our website and services.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#1F1F1F] mb-4">2. Information We Collect</h2>
              <p className="text-[#4B4B4B] leading-relaxed mb-4">
                We collect information you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 text-[#4B4B4B] space-y-2">
                <li>Name, email address, and phone number</li>
                <li>Event details (date, location, guest count)</li>
                <li>Dietary requirements and preferences</li>
                <li>Any other information you choose to provide in your inquiry</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#1F1F1F] mb-4">3. How We Use Your Information</h2>
              <p className="text-[#4B4B4B] leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-[#4B4B4B] space-y-2">
                <li>Respond to your inquiries and provide quotes</li>
                <li>Plan and deliver our catering services</li>
                <li>Communicate with you about your event</li>
                <li>Improve our services and website</li>
                <li>Send you marketing communications (only with your consent)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#1F1F1F] mb-4">4. Information Sharing</h2>
              <p className="text-[#4B4B4B] leading-relaxed">
                We do not sell, trade, or rent your personal information to third parties. 
                We may share your information with service providers who assist us in operating 
                our business, but only to the extent necessary to provide our services to you.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#1F1F1F] mb-4">5. Data Security</h2>
              <p className="text-[#4B4B4B] leading-relaxed">
                We implement appropriate security measures to protect your personal information 
                against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#1F1F1F] mb-4">6. Your Rights</h2>
              <p className="text-[#4B4B4B] leading-relaxed mb-4">
                Under GDPR, you have the right to:
              </p>
              <ul className="list-disc pl-6 text-[#4B4B4B] space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Request data portability</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#1F1F1F] mb-4">7. Contact Us</h2>
              <p className="text-[#4B4B4B] leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at:<br />
                Email: info@motokitchen.nl
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

