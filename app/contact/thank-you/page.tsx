import Link from "next/link";

export const metadata = {
  title: "Thank You | Moto Kitchen",
  description: "Thank you for your inquiry. We'll be in touch soon!",
};

export default function ThankYouPage() {
  return (
    <section className="pt-32 pb-20 bg-[#FAF6EF] min-h-screen flex items-center">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <div className="w-20 h-20 bg-[#C9653B] rounded-full flex items-center justify-center mx-auto mb-8">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-[#1F1F1F] mb-6">
          Thank You!
        </h1>
        
        <p className="text-xl text-[#4B4B4B] mb-4">
          We&apos;ve received your inquiry and will get back to you within 24 hours.
        </p>
        
        <p className="text-[#4B4B4B] mb-10">
          In the meantime, feel free to browse our menu or check out our gallery for inspiration.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="btn-primary">
            Back to Home
          </Link>
          <Link href="/menu" className="btn-secondary">
            View Our Menu
          </Link>
        </div>

      </div>
    </section>
  );
}

