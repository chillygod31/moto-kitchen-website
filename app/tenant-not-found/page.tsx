import Link from "next/link";

export default function TenantNotFound() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-[#FAF6EF] pt-20">
      <div className="max-w-xl mx-auto px-6 text-center">
        <p className="text-8xl mb-6">🏪</p>
        <h1 className="text-6xl font-bold text-[#1F1F1F] mb-4">Tenant Not Found</h1>
        <h2 className="text-2xl font-semibold text-[#1F1F1F] mb-4">
          This store is not available
        </h2>
        <p className="text-[#4B4B4B] mb-8">
          We couldn&apos;t find the store you&apos;re looking for. 
          The domain or store identifier may be incorrect, or the store may no longer be active.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="btn-primary">
            Go Home
          </Link>
          <Link href="/contact" className="btn-secondary">
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
}
