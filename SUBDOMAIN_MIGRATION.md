# Subdomain Migration Guide

## Overview

The ordering system is now structured to support both:
- **Main domain routing**: `motokitchen.nl/order/*` (current setup)
- **Subdomain routing**: `order.motokitchen.nl/*` (future setup)

This document explains how to migrate from path-based to subdomain-based routing.

## Current Setup

✅ Routes are grouped under `/order/*` route group  
✅ Dynamic route utilities (`lib/routes.ts`) detect hostname  
✅ Tenant detection supports hostname-based routing  
✅ Middleware is in place for subdomain routing  

## Migration Steps

### 1. Add Subdomain in Vercel

1. Go to your Vercel project settings
2. Navigate to **Settings** → **Domains**
3. Add `order.motokitchen.nl` (or `orders.motokitchen.nl`)
4. Follow Vercel's DNS instructions to configure the subdomain

### 2. Configure Environment Variable (Optional)

For explicit control, you can set:

```bash
NEXT_PUBLIC_ORDER_BASE_PATH=
```

When set to empty string, the route utilities will use root paths (`/`, `/cart`, etc.) instead of `/order/*`.

### 3. Add Redirects (Preserve SEO & Links)

Add to `next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ... existing config ...
  
  async redirects() {
    return [
      {
        source: '/order/:path*',
        destination: 'https://order.motokitchen.nl/:path*',
        permanent: true, // 301 redirect
      },
    ]
  },
}
```

This redirects:
- `motokitchen.nl/order` → `order.motokitchen.nl/`
- `motokitchen.nl/order/cart` → `order.motokitchen.nl/cart`
- etc.

### 4. Test the Migration

1. **Test subdomain**: Visit `order.motokitchen.nl` - should show menu
2. **Test redirects**: Visit `motokitchen.nl/order` - should redirect to subdomain
3. **Test all routes**: Menu, cart, checkout, order-success
4. **Test tenant detection**: Verify orders are associated with correct tenant

## How It Works

### Route Detection

The `lib/routes.ts` utilities automatically detect the hostname:

- **Main domain** (`motokitchen.nl`): Returns `/order`, `/order/cart`, etc.
- **Subdomain** (`order.motokitchen.nl`): Returns `/`, `/cart`, etc.

### Tenant Detection

The `lib/tenant.ts` functions automatically detect tenant from hostname:

- **Phase 1 (Current)**: Always returns `'moto-kitchen'` (single tenant)
- **Phase 2 (SaaS)**: Will extract tenant from subdomain or custom domain

### Middleware

The `middleware.ts` file handles subdomain routing:

- Requests to `order.motokitchen.nl/` → Rewrites to `/order`
- Requests to `order.motokitchen.nl/cart` → Rewrites to `/order/cart`
- This ensures existing route structure works on subdomain

## White-Label SaaS (Future)

For multi-tenant SaaS, the system is structured to support:

1. **Subdomain-based tenants**: `tenant-slug.orderapp.com`
2. **Custom domains**: `order.restaurant.com` → lookup in `tenant_domains` table
3. **Path-based tenants**: `/tenant-slug/order` (less common)

### Phase 2 Implementation Notes

Update `lib/tenant.ts` → `getTenantSlugFromHostname()`:

```typescript
async function getTenantSlugFromHostname(hostname?: string | null): Promise<string> {
  if (!hostname) return 'moto-kitchen' // Default/fallback
  
  const supabase = createServerClient()
  
  // Check custom domains first
  const { data: domain } = await supabase
    .from('tenant_domains')
    .select('tenant_id')
    .eq('domain', hostname)
    .single()
  
  if (domain) {
    // Get tenant slug from tenant_id
    const { data: tenant } = await supabase
      .from('tenants')
      .select('slug')
      .eq('id', domain.tenant_id)
      .single()
    return tenant?.slug || 'moto-kitchen'
  }
  
  // Extract from subdomain: tenant-slug.orderapp.com
  const parts = hostname.split('.')
  if (parts.length >= 3) {
    const subdomain = parts[0]
    // Map subdomain to tenant slug (could query tenants table)
    return subdomain
  }
  
  return 'moto-kitchen' // Default/fallback
}
```

## Rollback Plan

If you need to rollback:

1. Remove subdomain from Vercel
2. Remove redirects from `next.config.ts`
3. Set `NEXT_PUBLIC_ORDER_BASE_PATH=/order` in environment variables
4. Redeploy

The code will continue working on `motokitchen.nl/order/*` paths.

## Benefits

✅ **No hardcoded paths** - All routes use utility functions  
✅ **SEO-friendly** - 301 redirects preserve link juice  
✅ **Flexible** - Supports both path and subdomain routing  
✅ **SaaS-ready** - Structure supports multi-tenant white-label  
✅ **Backward compatible** - Existing `/order/*` paths continue working  

