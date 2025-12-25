import { z } from 'zod'

/**
 * Validation schemas for order-related operations
 */

export const orderItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  price: z.number().positive(),
  quantity: z.number().int().positive().max(100),
  notes: z.string().optional().nullable(),
})

export const createOrderSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').max(200),
  customerEmail: z.string().email('Invalid email address').optional().nullable(),
  customerPhone: z.string().min(1, 'Phone number is required').max(50),
  fulfillmentType: z.enum(['pickup', 'delivery'], {
    errorMap: () => ({ message: 'Fulfillment type must be pickup or delivery' }),
  }),
  deliveryAddress: z.string().max(500).optional().nullable(),
  postcode: z.string().max(20).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  scheduledFor: z.string().datetime('Invalid date format').or(z.string().min(1)),
  cartItems: z.array(orderItemSchema).min(1, 'Cart must contain at least one item'),
  subtotal: z.number().nonnegative(),
  deliveryFee: z.number().nonnegative().default(0),
  serviceFee: z.number().nonnegative().default(0),
  adminFee: z.number().nonnegative().default(0),
  total: z.number().positive('Total must be greater than 0'),
  notes: z.string().max(1000).optional().nullable(),
}).refine(
  (data) => {
    if (data.fulfillmentType === 'delivery') {
      return !!data.deliveryAddress && !!data.postcode && !!data.city
    }
    return true
  },
  {
    message: 'Delivery address, postcode, and city are required for delivery orders',
    path: ['deliveryAddress'],
  }
)

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type OrderItemInput = z.infer<typeof orderItemSchema>

