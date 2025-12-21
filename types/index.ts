// Tenant Types
export interface Tenant {
  id: string
  name: string
  slug: string
  owner_email: string
  owner_name: string | null
  owner_phone: string | null
  status: 'active' | 'suspended' | 'cancelled'
  onboarding_completed: boolean
  onboarding_step: 'branding' | 'menu' | 'business_settings' | 'test_order' | 'completed' | null
  created_at: string
  updated_at: string
}

// Menu Types
export interface MenuCategory {
  id: string
  tenant_id: string
  name: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MenuItem {
  id: string
  tenant_id: string
  category_id: string | null
  name: string
  description: string | null
  price: number
  image_url: string | null
  dietary_tags: string[] | null
  is_available: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// Order Types
export interface Order {
  id: string
  tenant_id: string
  order_number: string
  customer_name: string
  customer_email: string | null
  customer_phone: string
  fulfillment_type: 'pickup' | 'delivery'
  scheduled_for: string | null
  delivery_address: string | null
  postcode: string | null
  city: string | null
  subtotal: number
  delivery_fee: number
  service_fee: number
  admin_fee: number
  total: number
  status: 'new' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  payment_status: 'unpaid' | 'paid' | 'refunded'
  notes: string | null
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  name_snapshot: string
  unit_price: number
  quantity: number
  line_total: number
  notes: string | null
  created_at: string
}

// Subscription Types
export interface SubscriptionPlan {
  id: string
  name: string
  slug: string
  price_monthly: number
  price_annual: number | null
  max_orders_per_month: number | null
  features: Record<string, boolean>
  is_active: boolean
  created_at: string
}

