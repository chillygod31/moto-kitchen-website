import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware for tenant resolution and routing
 * 
 * Resolves tenant from:
 * - Hostname (order.motokitchen.nl → moto-kitchen)
 * - Path (/order/* → moto-kitchen)
 * - Custom domains (lookup in tenant_domains table)
 * 
 * Injects headers:
 * - x-tenant-slug: Tenant slug
 * - x-tenant-id: Tenant UUID
 * - x-request-id: Unique request ID for tracing
 */
export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // Generate request ID for tracing
  const requestId = crypto.randomUUID()
  const response = NextResponse.next()
  response.headers.set('x-request-id', requestId)
  response.headers.set('x-pathname', pathname)

  // Skip tenant resolution for API routes, static files, and Next.js internals
  // API routes will resolve tenant themselves using headers
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return response
  }

  let tenantSlug: string | null = null
  let tenantId: string | null = null

  try {
    // Pattern-based resolution (fast, works in edge runtime)
    const cleanHostname = hostname.split(':')[0].toLowerCase()

    // Hardcoded tenant ID for moto-kitchen (Edge Runtime compatible)
    // TODO: Move to database lookup when using Node.js runtime
    const MOTO_KITCHEN_TENANT_ID = '25d9c39c-e499-4b46-ad4a-e5dfbbbaf808'

    // Check subdomain patterns
    if (cleanHostname.startsWith('order.') || cleanHostname.startsWith('orders.')) {
      tenantSlug = 'moto-kitchen'
      tenantId = MOTO_KITCHEN_TENANT_ID
    }
    // Check path patterns
    else if (pathname.startsWith('/order')) {
      tenantSlug = 'moto-kitchen'
      tenantId = MOTO_KITCHEN_TENANT_ID
    }
    // Check root domain and Vercel preview domains
    else if (cleanHostname === 'motokitchen.nl' || cleanHostname === 'localhost' || cleanHostname === '127.0.0.1' || cleanHostname.includes('vercel.app')) {
      // For root domain and preview URLs, set tenant if accessing order routes
      if (pathname.startsWith('/order')) {
        tenantSlug = 'moto-kitchen'
        tenantId = MOTO_KITCHEN_TENANT_ID
      }
    }

    // If tenant resolved, inject headers
    if (tenantSlug && tenantId) {
      response.headers.set('x-tenant-slug', tenantSlug)
      response.headers.set('x-tenant-id', tenantId)
    }
    // If on order routes but tenant not resolved, redirect to tenant-not-found
    else if (pathname.startsWith('/order')) {
      const url = request.nextUrl.clone()
      url.pathname = '/tenant-not-found'
      return NextResponse.rewrite(url)
    }
    // Block unknown hostnames accessing order routes
    else if (pathname.startsWith('/order') && !cleanHostname.includes('localhost') && !cleanHostname.includes('127.0.0.1')) {
      const url = request.nextUrl.clone()
      url.pathname = '/tenant-not-found'
      return NextResponse.rewrite(url)
    }

    // Handle subdomain routing for order.motokitchen.nl
    if (hostname.startsWith('order.') || hostname.startsWith('orders.')) {
      // Rewrite root path to /order
      if (pathname === '/') {
        const url = request.nextUrl.clone()
        url.pathname = '/order'
        return NextResponse.rewrite(url)
      }

      // Rewrite /order/* paths to themselves
      if (pathname.startsWith('/order')) {
        return response
      }

      // For any other path on subdomain, try /order prefix
      const orderRoutes = ['/cart', '/checkout', '/order-success']
      if (orderRoutes.some(route => pathname.startsWith(route))) {
        const url = request.nextUrl.clone()
        url.pathname = `/order${pathname}`
        return NextResponse.rewrite(url)
      }
    }

    return response
  } catch (error) {
    console.error(`[${requestId}] Middleware error:`, error)
    // On error, allow request through but log it
    return response
  }
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

