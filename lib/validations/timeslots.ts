import { z } from 'zod'

/**
 * Validation schemas for time slot operations
 */

export const timeSlotSchema = z.object({
  slot_time: z.string().datetime('Invalid date format'),
  max_orders: z.number().int().positive('Max orders must be positive').max(100),
  current_orders: z.number().int().nonnegative().default(0),
  is_available: z.boolean().default(true),
})

export const createTimeSlotSchema = timeSlotSchema

export const updateTimeSlotSchema = timeSlotSchema.partial().extend({
  id: z.string().uuid('Invalid time slot ID'),
})

export const bulkCreateTimeSlotsSchema = z.object({
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
  timeSlots: z.array(z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format')),
  maxOrdersPerSlot: z.number().int().positive().max(100),
})

export type TimeSlotInput = z.infer<typeof timeSlotSchema>
export type CreateTimeSlotInput = z.infer<typeof createTimeSlotSchema>
export type UpdateTimeSlotInput = z.infer<typeof updateTimeSlotSchema>
export type BulkCreateTimeSlotsInput = z.infer<typeof bulkCreateTimeSlotsSchema>

