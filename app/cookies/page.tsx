export const metadata = {
  title: "Cookie Policy | Moto Kitchen",
  description: "Moto Kitchen's cookie policy. Learn how we use cookies on our website.",
};

export default function CookiesPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-12 bg-[#3A2A24]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Cookie Policy
          </h1>
          <p className="text-white/70">Last updated: December 2024</p>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding bg-[#FAF6EF]">
        <div className="max-w-3xl mx-auto">
          <div className="card space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-[#1F1F1F] mb-4">What Are Cookies?</h2>
              <p className="text-[#4B4B4B] leading-relaxed">
                Cookies are small text files that are stored on your device when you visit a website. 
                They help the website remember your preferences and improve your browsing experience.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#1F1F1F] mb-4">How We Use Cookies</h2>
              <p className="text-[#4B4B4B] leading-relaxed mb-4">
                We use cookies for the following purposes:
              </p>
              <ul className="list-disc pl-6 text-[#4B4B4B] space-y-2">
                <li><strong>Essential cookies:</strong> Required for the website to function properly</li>
                <li><strong>Preference cookies:</strong> Remember your settings and preferences</li>
                <li><strong>Analytics cookies:</strong> Help us understand how visitors use our website</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#1F1F1F] mb-4">Types of Cookies We Use</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E6D9C8]">
                      <th className="py-3 pr-4 text-[#1F1F1F] font-semibold">Cookie</th>
                      <th className="py-3 pr-4 text-[#1F1F1F] font-semibold">Purpose</th>
                      <th className="py-3 text-[#1F1F1F] font-semibold">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#4B4B4B]">
                    <tr className="border-b border-[#E6D9C8]">
                      <td className="py-3 pr-4">Session</td>
                      <td className="py-3 pr-4">Essential for site functionality</td>
                      <td className="py-3">Session</td>
                    </tr>
                    <tr className="border-b border-[#E6D9C8]">
                      <td className="py-3 pr-4">Preferences</td>
                      <td className="py-3 pr-4">Remembers your preferences</td>
                      <td className="py-3">1 year</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#1F1F1F] mb-4">Managing Cookies</h2>
              <p className="text-[#4B4B4B] leading-relaxed">
                You can control and manage cookies through your browser settings. 
                Please note that disabling certain cookies may affect the functionality of our website.
                Most browsers allow you to:
              </p>
              <ul className="list-disc pl-6 text-[#4B4B4B] space-y-2 mt-4">
                <li>View what cookies are stored and delete them individually</li>
                <li>Block third-party cookies</li>
                <li>Block cookies from specific sites</li>
                <li>Block all cookies</li>
                <li>Delete all cookies when you close your browser</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#1F1F1F] mb-4">Contact Us</h2>
              <p className="text-[#4B4B4B] leading-relaxed">
                If you have any questions about our use of cookies, please contact us at:<br />
                Email: info@motokitchen.nl
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

