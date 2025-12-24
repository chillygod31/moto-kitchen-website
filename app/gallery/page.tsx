import GalleryGrid from "../components/GalleryGrid";
import { galleryItems } from "../../lib/gallery-data";

export const metadata = {
  title: "Gallery | Moto Kitchen",
  description: "Browse photos from Moto Kitchen's catering events. Weddings, corporate events, private parties, and delicious Tanzanian food.",
};

export default function GalleryPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-12 bg-[#2B1E1A]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[#C86A3A] text-sm uppercase tracking-widest mb-4">Our Work</p>
          <h1 
            className="text-4xl md:text-6xl font-bold text-white mb-6"
            style={{ 
              fontFamily: 'var(--font-dm-serif-display), serif', 
              fontWeight: 500,
              letterSpacing: '-0.02em',
              lineHeight: '1.1'
            }}
          >
            Gallery
          </h1>
          <p className="text-xl text-white/80">
            A taste of what we create for our clients
          </p>
        </div>
      </section>

      {/* Gallery Grid with Filters */}
      <GalleryGrid items={galleryItems} />
    </>
  );
}
