# Sanity CMS Setup Guide

## Quick Start

1. **Create a Sanity account** at https://sanity.io

2. **Create a new project** in the Sanity dashboard

3. **Get your credentials:**
   - Project ID (found in project settings)
   - Dataset name (usually "production")

4. **Add environment variables** to your `.env.local` file:
   ```
   NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
   NEXT_PUBLIC_SANITY_DATASET=production
   ```

5. **Install dependencies:**
   ```bash
   npm install
   ```

6. **Access the CMS:**
   - Run `npm run dev`
   - Go to `http://localhost:3000/studio`
   - Log in with your Sanity account

## Content Types

### Menu Items
- Name, description, category
- Image upload
- Dietary tags (Vegetarian, Vegan, Gluten-Free, Halal, Spicy)
- Display order

### Gallery Items
- Image upload
- Alt text for accessibility
- Category (Weddings, Corporate, Private, Food, Behind the Scenes)
- Display order

### Testimonials
- Quote text
- Author name and location
- Event type
- Rating (1-5 stars)
- Featured toggle (for homepage display)
- Optional author image

### FAQs
- Question and answer
- Category (General, Booking, Menu, Service, Weddings, Corporate, Private)
- Display order

## Tips

- **Images:** Upload high-quality images. Sanity automatically optimizes them.
- **Order:** Use the "Display Order" field to control item sequence (lower = first).
- **Featured:** Mark testimonials as "Featured" to show them on the homepage.
- **Categories:** Assign correct categories for filtering to work properly.

## Deployment

When deploying to Vercel:
1. Add the environment variables in Vercel project settings
2. The CMS will be available at `yourdomain.com/studio`

