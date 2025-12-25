import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    
    // Check subdomain patterns
    if (cleanHostname.startsWith('order.') || cleanHostname.startsWith('orders.')) {
      tenantSlug = 'moto-kitchen'
    }
    // Check path patterns
    else if (pathname.startsWith('/order')) {
      tenantSlug = 'moto-kitchen'
    }
    // Check root domain
    else if (cleanHostname === 'motokitchen.nl' || cleanHostname === 'localhost' || cleanHostname === '127.0.0.1') {
      // For root domain, only set tenant if accessing order routes
      if (pathname.startsWith('/order')) {
        tenantSlug = 'moto-kitchen'
      }
    }
    // For custom domains, try DB lookup (requires service role key)
    else {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      
      if (supabaseUrl && supabaseServiceKey) {
        try {
          const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { persistSession: false }
          })
          
          const { data: domain, error } = await supabase
            .from('tenant_domains')
            .select('tenant_id, tenants!inner(slug, id, status)')
            .eq('domain', cleanHostname)
            .eq('is_verified', true)
            .single()

          if (!error && domain && domain.tenants) {
            const tenant = domain.tenants as any
            // Only allow active tenants
            if (tenant.status === 'active') {
              tenantSlug = tenant.slug
              tenantId = tenant.id
            }
          }
        } catch (error) {
          console.error(`[${requestId}] Error looking up tenant domain:`, error)
        }
      }
    }

    // If tenant slug resolved but not ID, look it up
    if (tenantSlug && !tenantId) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      
      if (supabaseUrl && supabaseServiceKey) {
        try {
          const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { persistSession: false }
          })
          
          const { data: tenant, error } = await supabase
            .from('tenants')
            .select('id, status')
            .eq('slug', tenantSlug)
            .eq('status', 'active')
            .single()

          if (!error && tenant) {
            tenantId = tenant.id
          } else {
            // Tenant not found or inactive
            tenantSlug = null
          }
        } catch (error) {
          console.error(`[${requestId}] Error looking up tenant:`, error)
          tenantSlug = null
        }
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

