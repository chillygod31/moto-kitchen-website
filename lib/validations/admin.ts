import { z } from 'zod'

/**
 * Validation schemas for admin operations
 */

export const updateOrderStatusSchema = z.object({
  status: z.enum(['new', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']).optional(),
  payment_status: z.enum(['unpaid', 'paid', 'refunded']).optional(),
  notes: z.string().max(1000).optional().nullable(),
})

export const updateQuoteStatusSchema = z.object({
  status: z.enum(['new', 'contacted', 'quoted', 'converted', 'lost']).optional(),
  notes: z.string().max(1000).optional().nullable(),
})

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
export type UpdateQuoteStatusInput = z.infer<typeof updateQuoteStatusSchema>

