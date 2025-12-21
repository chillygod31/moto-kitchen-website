/**
 * Cart management using localStorage
 */

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image_url?: string | null
  notes?: string
}

const CART_STORAGE_KEY = 'moto-kitchen-cart'

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  
  try {
    const cartJson = localStorage.getItem(CART_STORAGE_KEY)
    return cartJson ? JSON.parse(cartJson) : []
  } catch (error) {
    console.error('Error reading cart from localStorage:', error)
    return []
  }
}

export function saveCart(cart: CartItem[]): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  } catch (error) {
    console.error('Error saving cart to localStorage:', error)
  }
}

export function addToCart(item: Omit<CartItem, 'quantity'>, quantity: number = 1): CartItem[] {
  const cart = getCart()
  const existingIndex = cart.findIndex((i) => i.id === item.id)

  if (existingIndex >= 0) {
    cart[existingIndex].quantity += quantity
  } else {
    cart.push({ ...item, quantity })
  }

  saveCart(cart)
  return cart
}

export function updateCartItemQuantity(itemId: string, quantity: number): CartItem[] {
  const cart = getCart()
  const itemIndex = cart.findIndex((item) => item.id === itemId)

  if (itemIndex >= 0) {
    if (quantity <= 0) {
      cart.splice(itemIndex, 1)
    } else {
      cart[itemIndex].quantity = quantity
    }
    saveCart(cart)
  }

  return cart
}

export function removeFromCart(itemId: string): CartItem[] {
  const cart = getCart()
  const filteredCart = cart.filter((item) => item.id !== itemId)
  saveCart(filteredCart)
  return filteredCart
}

export function clearCart(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CART_STORAGE_KEY)
}

export function getCartTotal(cart: CartItem[]): number {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0)
}

export function getCartItemCount(cart: CartItem[]): number {
  return cart.reduce((count, item) => count + item.quantity, 0)
}

