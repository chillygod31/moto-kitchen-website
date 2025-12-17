import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'your-project-id',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: process.env.NODE_ENV === 'production',
})

const builder = imageUrlBuilder(client)

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

// Query helpers
export async function getMenuItems() {
  return client.fetch(`
    *[_type == "menuItem"] | order(order asc, name asc) {
      _id,
      name,
      description,
      category,
      image,
      dietaryTags,
      order
    }
  `)
}

export async function getGalleryItems() {
  return client.fetch(`
    *[_type == "galleryItem"] | order(order asc) {
      _id,
      image,
      alt,
      category,
      order
    }
  `)
}

export async function getTestimonials(featured?: boolean) {
  const filter = featured ? ' && featured == true' : ''
  return client.fetch(`
    *[_type == "testimonial"${filter}] | order(_createdAt desc) {
      _id,
      quote,
      author,
      location,
      eventType,
      rating,
      featured,
      image
    }
  `)
}

export async function getFAQs(category?: string) {
  const filter = category ? ` && category == "${category}"` : ''
  return client.fetch(`
    *[_type == "faq"${filter}] | order(order asc, question asc) {
      _id,
      question,
      answer,
      category,
      order
    }
  `)
}

