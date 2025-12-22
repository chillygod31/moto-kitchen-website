# Order System Password Protection

The ordering system (`/order` and all sub-routes) is currently password-protected to prevent public access before launch.

## How It Works

- All `/order/*` routes are protected by a password screen
- Password is stored in `sessionStorage` (clears when browser closes)
- Users must enter the correct password to access any ordering pages

## Changing the Password

**Option 1: Environment Variable (Recommended)**
Add to your `.env.local` file:
```
NEXT_PUBLIC_ORDER_PASSWORD=your-secure-password-here
```

**Option 2: Hardcoded (Quick but less secure)**
Edit `app/order/components/OrderPasswordProtection.tsx`:
```typescript
const ORDER_PASSWORD = 'your-new-password'
```

## Removing Password Protection

When ready to go live, simply delete or comment out the layout wrapper:

1. Delete `app/order/layout.tsx` OR
2. Comment out the wrapper in `app/order/layout.tsx`:
```typescript
export default function OrderLayout({ children }: { children: React.ReactNode }) {
  // return (
  //   <OrderPasswordProtection>
  //     {children}
  //   </OrderPasswordProtection>
  // )
  return <>{children}</>
}
```

## Default Password

The default password is: `moto2024`

**⚠️ IMPORTANT:** Change this before going live!

