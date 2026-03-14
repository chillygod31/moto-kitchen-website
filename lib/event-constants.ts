/**
 * Event Planner Constants
 * Operational knowledge for food prep planning at festivals/events.
 * Based on Moto Kitchen manager's data and past event experience.
 */

// Portion standards (per serving)
export const PORTION_STANDARDS: Record<string, {
  raw_grams?: number
  cooked_grams?: number
  sticks?: number
  pieces_per_portion?: number
  sides?: string[]
  side_grams?: number
  kachumbari_grams?: number
  pili_pili_grams?: number
  price?: number
}> = {
  'Mshikaki plate': { raw_grams: 200, sticks: 3, sides: ['kachumbari', 'pili_pili'] },
  'Mshikaki single': { raw_grams: 67, sticks: 1 },
  'Mbuzi only': { cooked_grams: 230, kachumbari_grams: 60, pili_pili_grams: 20, price: 7.50 },
  'Mbuzi plate': { cooked_grams: 200, side_grams: 220, kachumbari_grams: 70, pili_pili_grams: 20 },
  'Wings': { pieces_per_portion: 3 },
  'Fries': { cooked_grams: 230 },
  'Cassava': { cooked_grams: 210 },
  'Plantain': { cooked_grams: 210 },
}

// Yield factors (raw → cooked/edible)
export const YIELD_FACTORS: Record<string, number> = {
  mbuzi_bone_in: 0.40,   // 1kg raw = 0.4kg edible cooked deboned
  mshikaki: 0.85,        // minimal shrinkage
  wings: 0.75,
  fries: 0.80,
  cassava: 0.75,
  plantain: 0.75,
}

// Purchase units
export const PURCHASE_UNITS: Record<string, { box_kg?: number; unit: string }> = {
  cassava: { box_kg: 18, unit: 'box' },
  plantain: { box_kg: 18, unit: 'box' },
  mshikaki: { unit: 'kg' },
  mbuzi: { unit: 'kg (bone-in)' },
  wings: { unit: 'kg' },
  fries: { unit: 'kg' },
  kachumbari: { unit: 'kg' },
}

// Pack templates (kg per item for a 10-hour festival, based on 100kg mshikaki anchor)
export const PACK_TEMPLATES: Record<string, Record<string, { min: number; max: number }>> = {
  pack1: {
    'Mshikaki': { min: 100, max: 100 },
    'Mbuzi': { min: 65, max: 70 },
    'Wings': { min: 45, max: 50 },
    'Cassava': { min: 50, max: 60 },
    'Plantain': { min: 28, max: 35 },
    'Fries': { min: 65, max: 75 },
    'Kachumbari': { min: 55, max: 65 },
  },
  pack2: {
    'Mshikaki': { min: 100, max: 100 },
    'Mbuzi': { min: 80, max: 90 },
    'Wings': { min: 70, max: 80 },
    'Cassava': { min: 65, max: 75 },
    'Plantain': { min: 35, max: 45 },
    'Fries': { min: 85, max: 95 },
    'Kachumbari': { min: 65, max: 75 },
  },
}

// Side split forecast (when customer chooses a side)
export const SIDE_SPLIT: Record<string, number> = {
  fries: 0.45,
  cassava: 0.35,
  plantain: 0.20,
}

// Default prep items for a new event (the standard items Moto Kitchen sells)
export const DEFAULT_PREP_ITEMS = [
  { item_name: 'Mshikaki', category: 'Main', sell_price: 5.00, cost_per_kg: null },
  { item_name: 'Mbuzi plate', category: 'Main', sell_price: 12.00, cost_per_kg: null },
  { item_name: 'Mbuzi only', category: 'Main', sell_price: 7.50, cost_per_kg: null },
  { item_name: 'Wings', category: 'Main', sell_price: 8.00, cost_per_kg: null },
  { item_name: 'Fries', category: 'Side', sell_price: 4.00, cost_per_kg: null },
  { item_name: 'Cassava', category: 'Side', sell_price: 4.00, cost_per_kg: null },
  { item_name: 'Plantain', category: 'Side', sell_price: 4.00, cost_per_kg: null },
  { item_name: 'Kachumbari', category: 'Condiment', sell_price: 0, cost_per_kg: null },
  { item_name: 'Sambusa (beef)', category: 'Snack', sell_price: 2.50, cost_per_kg: null },
  { item_name: 'Sambusa (veg)', category: 'Snack', sell_price: 2.00, cost_per_kg: null },
  { item_name: 'Fresh juice', category: 'Drink', sell_price: 4.00, cost_per_kg: null },
]

/**
 * Calculate raw kg needed from planned portions
 */
export function calculateRawKg(itemName: string, portions: number): number | null {
  const key = itemName.toLowerCase()
  const standard = PORTION_STANDARDS[itemName]

  if (!standard) return null

  const gramsPerPortion = standard.raw_grams || standard.cooked_grams
  if (!gramsPerPortion) return null

  const totalCookedKg = (portions * gramsPerPortion) / 1000

  // Apply yield factor to get raw kg
  // Find matching yield factor key
  const yieldKey = Object.keys(YIELD_FACTORS).find(k => key.includes(k))
  if (yieldKey) {
    return Math.round((totalCookedKg / YIELD_FACTORS[yieldKey]) * 100) / 100
  }

  return Math.round(totalCookedKg * 100) / 100
}

/**
 * Calculate boxes needed for boxed items
 */
export function calculateBoxes(itemName: string, rawKg: number): number | null {
  const key = itemName.toLowerCase()
  const purchaseUnit = Object.entries(PURCHASE_UNITS).find(([k]) => key.includes(k))

  if (!purchaseUnit || !purchaseUnit[1].box_kg) return null

  return Math.ceil(rawKg / purchaseUnit[1].box_kg)
}

/**
 * Get pack template values for an item
 */
export function getPackTemplateKg(packLevel: 'pack1' | 'pack2', itemName: string): { min: number; max: number } | null {
  const template = PACK_TEMPLATES[packLevel]
  if (!template) return null

  // Find matching template key
  const key = Object.keys(template).find(k => itemName.toLowerCase().includes(k.toLowerCase()))
  if (!key) return null

  return template[key]
}
