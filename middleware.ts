import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware for subdomain routing
 * 
 * When order.motokitchen.nl is configured:
 * - Routes requests from subdomain to /order/* pages
 * - Keeps path structure intact for easy migration
 */
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // If request is to order.motokitchen.nl or orders.motokitchen.nl
  if (hostname.startsWith('order.') || hostname.startsWith('orders.')) {
    // Rewrite root path to /order
    if (pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/order'
      return NextResponse.rewrite(url)
    }

    // Rewrite /order/* paths to themselves (they're already correct)
    // This ensures the subdomain works with existing route structure
    if (pathname.startsWith('/order')) {
      return NextResponse.next()
    }

    // For any other path on subdomain, try /order prefix
    // (e.g., /cart → /order/cart)
    const orderRoutes = ['/cart', '/checkout', '/order-success']
    if (orderRoutes.some(route => pathname.startsWith(route))) {
      const url = request.nextUrl.clone()
      url.pathname = `/order${pathname}`
      return NextResponse.rewrite(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - files with extensions
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}

