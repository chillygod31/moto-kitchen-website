/**
 * Generate a unique order number
 * Format: MOTO-{timestamp}-{random}
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `MOTO-${timestamp}-${random}`
}

/**
 * Extract postcode prefix from Dutch postcode
 * e.g., "1012AB" -> "10"
 */
export function extractPostcodePrefix(postcode: string): string {
  const match = postcode.match(/^(\d{1,2})/)
  return match ? match[1] : ''
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('nl-NL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

