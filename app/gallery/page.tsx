import GalleryGrid from "../components/GalleryGrid";

export const metadata = {
  title: "Gallery | Moto Kitchen",
  description: "Browse photos from Moto Kitchen's catering events. Weddings, corporate events, private parties, and delicious Tanzanian food.",
};

// Placeholder gallery items - to be replaced with CMS data
const galleryItems = [
  { id: 1, src: "", alt: "Wedding buffet setup", category: "weddings" },
  { id: 2, src: "", alt: "Corporate lunch spread", category: "corporate" },
  { id: 3, src: "", alt: "Pilau rice dish", category: "food" },
  { id: 4, src: "", alt: "Private birthday party", category: "private" },
  { id: 5, src: "", alt: "Nyama Choma grilling", category: "food" },
  { id: 6, src: "", alt: "Wedding table decoration", category: "weddings" },
  { id: 7, src: "", alt: "Chef preparing food", category: "behind" },
  { id: 8, src: "", alt: "Corporate event service", category: "corporate" },
  { id: 9, src: "", alt: "Chapati making", category: "behind" },
  { id: 10, src: "", alt: "Samosas appetizer", category: "food" },
  { id: 11, src: "", alt: "Family gathering", category: "private" },
  { id: 12, src: "", alt: "Wedding ceremony catering", category: "weddings" },
  { id: 13, src: "", alt: "Dessert display", category: "food" },
  { id: 14, src: "", alt: "Team lunch setup", category: "corporate" },
  { id: 15, src: "", alt: "Kitchen preparation", category: "behind" },
  { id: 16, src: "", alt: "Anniversary dinner", category: "private" },
];

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
