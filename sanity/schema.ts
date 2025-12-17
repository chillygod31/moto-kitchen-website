import { type SchemaTypeDefinition } from 'sanity'

// Menu Item Schema
const menuItem: SchemaTypeDefinition = {
  name: 'menuItem',
  title: 'Menu Item',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Appetizers', value: 'appetizers' },
          { title: 'Mains', value: 'mains' },
          { title: 'Sides & Starches', value: 'sides' },
          { title: 'Desserts', value: 'desserts' },
          { title: 'Beverages', value: 'beverages' },
        ],
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'dietaryTags',
      title: 'Dietary Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Vegetarian', value: 'vegetarian' },
          { title: 'Vegan', value: 'vegan' },
          { title: 'Gluten-Free', value: 'gluten-free' },
          { title: 'Halal', value: 'halal' },
          { title: 'Spicy', value: 'spicy' },
        ],
      },
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first',
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'category',
      media: 'image',
    },
  },
}

// Gallery Item Schema
const galleryItem: SchemaTypeDefinition = {
  name: 'galleryItem',
  title: 'Gallery Item',
  type: 'document',
  fields: [
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'alt',
      title: 'Alt Text',
      type: 'string',
      description: 'Describe the image for accessibility',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Weddings', value: 'weddings' },
          { title: 'Corporate', value: 'corporate' },
          { title: 'Private Events', value: 'private' },
          { title: 'Food Close-ups', value: 'food' },
          { title: 'Behind the Scenes', value: 'behind' },
        ],
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first',
    },
  ],
  preview: {
    select: {
      title: 'alt',
      subtitle: 'category',
      media: 'image',
    },
  },
}

// Testimonial Schema
const testimonial: SchemaTypeDefinition = {
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    {
      name: 'quote',
      title: 'Quote',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'author',
      title: 'Author Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'e.g. Amsterdam',
    },
    {
      name: 'eventType',
      title: 'Event Type',
      type: 'string',
      options: {
        list: [
          { title: 'Wedding', value: 'Wedding' },
          { title: 'Corporate Event', value: 'Corporate Event' },
          { title: 'Private Party', value: 'Private Party' },
          { title: 'Family Gathering', value: 'Family Gathering' },
        ],
      },
    },
    {
      name: 'rating',
      title: 'Rating',
      type: 'number',
      options: {
        list: [1, 2, 3, 4, 5],
      },
      initialValue: 5,
    },
    {
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description: 'Show on homepage and service pages',
      initialValue: false,
    },
    {
      name: 'image',
      title: 'Author Image (optional)',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
  ],
  preview: {
    select: {
      title: 'author',
      subtitle: 'eventType',
      media: 'image',
    },
  },
}

// FAQ Schema
const faq: SchemaTypeDefinition = {
  name: 'faq',
  title: 'FAQ',
  type: 'document',
  fields: [
    {
      name: 'question',
      title: 'Question',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'answer',
      title: 'Answer',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'General', value: 'general' },
          { title: 'Booking & Pricing', value: 'booking' },
          { title: 'Menu & Dietary', value: 'menu' },
          { title: 'Service & Logistics', value: 'service' },
          { title: 'Weddings', value: 'weddings' },
          { title: 'Corporate', value: 'corporate' },
          { title: 'Private Events', value: 'private' },
        ],
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first',
    },
  ],
  preview: {
    select: {
      title: 'question',
      subtitle: 'category',
    },
  },
}

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [menuItem, galleryItem, testimonial, faq],
}

