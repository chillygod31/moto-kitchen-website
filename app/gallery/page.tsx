import Link from "next/link";

export const metadata = {
  title: "Gallery | Moto Kitchen",
  description: "Browse photos of our authentic Tanzanian dishes and catered events. See the quality and presentation Moto Kitchen brings to every occasion.",
};

// Placeholder gallery items - replace with real images later
const galleryItems = [
  { id: 1, category: "food", alt: "Pilau with kachumbari" },
  { id: 2, category: "food", alt: "Fresh chapati" },
  { id: 3, category: "weddings", alt: "Wedding reception setup" },
  { id: 4, category: "food", alt: "Nyama choma platter" },
  { id: 5, category: "food", alt: "Samaki wa kupaka" },
  { id: 6, category: "corporate", alt: "Corporate event buffet" },
  { id: 7, category: "food", alt: "Mandazi and chai" },
  { id: 8, category: "food", alt: "Mchuzi wa kuku" },
  { id: 9, category: "private", alt: "Birthday party spread" },
  { id: 10, category: "weddings", alt: "Wedding catering" },
  { id: 11, category: "food", alt: "Mshikaki skewers" },
  { id: 12, category: "behind", alt: "Kitchen preparation" },
];

const categories = [
  { id: "all", label: "All" },
  { id: "food", label: "Food" },
  { id: "weddings", label: "Weddings" },
  { id: "corporate", label: "Corporate" },
  { id: "private", label: "Private Events" },
  { id: "behind", label: "Behind the Scenes" },
];

export default function GalleryPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-[#3A2A24]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[#C9653B] text-sm uppercase tracking-widest mb-4">Our Work</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Gallery
          </h1>
          <p className="text-xl text-white/80">
            A taste of what we create for our clients
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="py-6 bg-[#F1E7DA] border-b border-[#E6D9C8] sticky top-[72px] z-40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                className="px-4 py-2 rounded-full text-sm font-medium transition-colors bg-white border border-[#E6D9C8] text-[#4B4B4B] hover:bg-[#C9653B] hover:text-white hover:border-[#C9653B]"
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="section-padding bg-[#FAF6EF]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryItems.map((item) => (
              <div 
                key={item.id}
                className="aspect-square bg-[#F1E7DA] rounded-lg border border-[#E6D9C8] overflow-hidden group cursor-pointer relative"
              >
                {/* Placeholder - replace with actual images */}
                <div className="w-full h-full flex items-center justify-center text-[#4B4B4B] group-hover:text-[#C9653B] transition-colors">
                  <div className="text-center">
                    <p className="text-4xl mb-2">
                      {item.category === 'food' ? '🍲' : 
                       item.category === 'weddings' ? '💒' : 
                       item.category === 'corporate' ? '🏢' : 
                       item.category === 'private' ? '🎉' : '👨‍🍳'}
                    </p>
                    <p className="text-xs px-2">{item.alt}</p>
                  </div>
                </div>
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-[#C9653B]/0 group-hover:bg-[#C9653B]/20 transition-colors" />
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-[#4B4B4B] mb-6">
              Follow us on Instagram for more photos of our dishes and events
            </p>
            <a 
              href="https://instagram.com/motokitchen" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-secondary inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              @motokitchen
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-[#3A2A24]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Want This for Your Event?
          </h2>
          <p className="text-white/80 text-lg mb-10">
            Let us create a memorable culinary experience for your guests.
          </p>
          <Link href="/contact" className="btn-primary text-lg">
            Request a Quote
          </Link>
        </div>
      </section>
    </>
  );
}
