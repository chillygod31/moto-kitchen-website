/**
 * Route utilities for order system
 * Supports both /order (main domain) and / (subdomain) routing
 */

/**
 * Get the base path for order routes
 * Client-side version - detects from current hostname
 * 
 * @returns Base path: '/order' for main domain, '' for subdomain
 */
export function getOrderBasePath(): string {
  // In browser: Detect from hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    // If subdomain is 'order' or 'orders', use root path
    if (hostname.startsWith('order.') || hostname.startsWith('orders.')) {
      return ''
    }
  }
  
  // Default: Use environment variable if set
  const basePath = process.env.NEXT_PUBLIC_ORDER_BASE_PATH
  if (basePath !== undefined) {
    return basePath
  }
  
  // Fallback: /order for main domain
  return '/order'
}

/**
 * Get the base path for order routes (server-side)
 * Detects from request headers
 * 
 * @param hostname - Optional hostname from request headers
 * @returns Base path: '/order' for main domain, '' for subdomain
 */
export function getOrderBasePathServer(hostname?: string | null): string {
  // If subdomain is 'order' or 'orders', use root path
  if (hostname && (hostname.startsWith('order.') || hostname.startsWith('orders.'))) {
    return ''
  }
  
  // Default: Use environment variable if set
  const basePath = process.env.NEXT_PUBLIC_ORDER_BASE_PATH
  if (basePath !== undefined) {
    return basePath
  }
  
  // Fallback: /order for main domain
  return '/order'
}

/**
 * Order route helpers
 * Use these instead of hardcoded paths
 */
export const orderRoutes = {
  menu: () => `${getOrderBasePath()}`,
  cart: () => `${getOrderBasePath()}/cart`,
  checkout: () => `${getOrderBasePath()}/checkout`,
  success: () => `${getOrderBasePath()}/order-success`,
}

/**
 * Server-side order route helpers
 */
export function getOrderRoutesServer(hostname?: string | null) {
  const base = getOrderBasePathServer(hostname)
  return {
    menu: base,
    cart: `${base}/cart`,
    checkout: `${base}/checkout`,
    success: `${base}/order-success`,
  }
}

