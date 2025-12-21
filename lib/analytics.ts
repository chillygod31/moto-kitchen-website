/**
 * Google Analytics 4 Event Tracking
 * Tracks conversion funnel: view_menu → add_to_cart → view_cart → begin_checkout → purchase
 */

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void
  }
}

/**
 * Track a custom event
 */
export function trackEvent(
  eventName: string,
  parameters?: Record<string, any>
): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return
  }

  window.gtag('event', eventName, parameters)
}

/**
 * Track when user views the menu page
 */
export function trackViewMenu(): void {
  trackEvent('view_menu')
}

/**
 * Track when item is added to cart
 */
export function trackAddToCart(
  itemId: string,
  itemName: string,
  price: number,
  quantity: number = 1
): void {
  trackEvent('add_to_cart', {
    currency: 'EUR',
    value: price * quantity,
    items: [
      {
        item_id: itemId,
        item_name: itemName,
        price: price,
        quantity: quantity,
      },
    ],
  })
}

/**
 * Track when item is removed from cart
 */
export function trackRemoveFromCart(itemId: string, itemName: string): void {
  trackEvent('remove_from_cart', {
    item_id: itemId,
    item_name: itemName,
  })
}

/**
 * Track when cart quantity is updated
 */
export function trackUpdateCart(itemId: string, quantity: number): void {
  trackEvent('update_cart', {
    item_id: itemId,
    quantity: quantity,
  })
}

/**
 * Track when user views cart page
 */
export function trackViewCart(cartValue: number, itemCount: number): void {
  trackEvent('view_cart', {
    currency: 'EUR',
    value: cartValue,
    item_count: itemCount,
  })
}

/**
 * Track when user begins checkout
 */
export function trackBeginCheckout(
  cartValue: number,
  itemCount: number
): void {
  trackEvent('begin_checkout', {
    currency: 'EUR',
    value: cartValue,
    item_count: itemCount,
  })
}

/**
 * Track purchase completion
 */
export function trackPurchase(
  transactionId: string,
  value: number,
  items: Array<{
    item_id: string
    item_name: string
    price: number
    quantity: number
  }>
): void {
  trackEvent('purchase', {
    transaction_id: transactionId,
    currency: 'EUR',
    value: value,
    items: items,
  })
}

