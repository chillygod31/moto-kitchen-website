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
      <section className="pt-32 pb-12 bg-[#3A2A24]">
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

      {/* Gallery Grid with Filters */}
      <GalleryGrid items={galleryItems} />
    </>
  );
}
