// Shared gallery items data
export const galleryItems = [
  // Private Events (6)
  { id: 1, src: "/private-1.jpg", alt: "Private event", category: "private" },
  { id: 2, src: "/private-2.jpg", alt: "Private event", category: "private" },
  { id: 3, src: "/private-3.jpg", alt: "Private event", category: "private" },
  { id: 4, src: "/private-4.jpg", alt: "Private event", category: "private" },
  { id: 5, src: "/private-5.jpg", alt: "Private event", category: "private" },
  { id: 6, src: "/private-6.jpg", alt: "Private event", category: "private" },
  
  // Corporate (8)
  { id: 11, src: "/corporate-1.jpg", alt: "Corporate event", category: "corporate" },
  { id: 12, src: "/corporate-2.jpg", alt: "Corporate event", category: "corporate" },
  { id: 13, src: "/corporate-3.jpg", alt: "Corporate event", category: "corporate" },
  { id: 14, src: "/corporate-4.jpg", alt: "Corporate event", category: "corporate" },
  { id: 15, src: "/corporate-5.jpg", alt: "Corporate event", category: "corporate" },
  { id: 16, src: "/corporate-11.jpg", alt: "Corporate event", category: "corporate" },
  { id: 17, src: "/corporate-12.jpg", alt: "Corporate event", category: "corporate" },
  { id: 18, src: "/corporate-13.jpg", alt: "Corporate event", category: "corporate" },
  
  // Food (10)
  { id: 20, src: "/food-1.jpg", alt: "Food close-up", category: "food" },
  { id: 21, src: "/food-2.jpg", alt: "Food close-up", category: "food" },
  { id: 22, src: "/food-3.jpg", alt: "Food close-up", category: "food" },
  { id: 23, src: "/food-4.jpg", alt: "Food close-up", category: "food" },
  { id: 24, src: "/food-5.jpg", alt: "Food close-up", category: "food" },
  { id: 25, src: "/food-6.jpg", alt: "Food close-up", category: "food" },
  { id: 26, src: "/food-7.jpg", alt: "Food close-up", category: "food" },
  { id: 27, src: "/food-8.jpg", alt: "Food close-up", category: "food" },
  { id: 28, src: "/food-9.jpg", alt: "Food close-up", category: "food" },
  { id: 29, src: "/food-10.jpg", alt: "Food close-up", category: "food" },
  
  // Behind the Scenes (7)
  { id: 30, src: "/behind-1.jpg", alt: "Behind the scenes", category: "behind" },
  { id: 31, src: "/behind-2.jpg", alt: "Behind the scenes", category: "behind" },
  { id: 32, src: "/behind-3.jpg", alt: "Behind the scenes", category: "behind" },
  { id: 33, src: "/behind-4.jpg", alt: "Behind the scenes", category: "behind" },
  { id: 34, src: "/behind-5.jpg", alt: "Behind the scenes", category: "behind" },
  { id: 35, src: "/behind-6.jpg", alt: "Behind the scenes", category: "behind" },
  { id: 36, src: "/behind-7.jpg", alt: "Behind the scenes", category: "behind" },
];

// Helper function to get random gallery images (excluding behind the scenes)
export function getRandomGalleryImages(count: number = 6) {
  const filtered = galleryItems.filter(item => item.category !== "behind");
  const shuffled = [...filtered].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

