import { z } from 'zod'

/**
 * Validation schemas for menu item and category operations
 */

export const menuCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  sort_order: z.number().int().nonnegative().default(0),
  is_active: z.boolean().default(true),
})

export const createMenuCategorySchema = menuCategorySchema

export const updateMenuCategorySchema = menuCategorySchema.partial().extend({
  id: z.string().uuid('Invalid category ID'),
})

export const menuItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  price: z.number().positive('Price must be greater than 0'),
  image_url: z.string().url('Invalid image URL').optional().nullable(),
  dietary_tags: z.array(z.string()).optional().nullable(),
  is_available: z.boolean().default(true),
  sort_order: z.number().int().nonnegative().default(0),
  category_id: z.string().uuid('Invalid category ID').optional().nullable(),
})

export const createMenuItemSchema = menuItemSchema

export const updateMenuItemSchema = menuItemSchema.partial().extend({
  id: z.string().uuid('Invalid menu item ID'),
})

export type MenuCategoryInput = z.infer<typeof menuCategorySchema>
export type CreateMenuCategoryInput = z.infer<typeof createMenuCategorySchema>
export type UpdateMenuCategoryInput = z.infer<typeof updateMenuCategorySchema>
export type MenuItemInput = z.infer<typeof menuItemSchema>
export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>

