// Pricing configuration for all service types
// Update these values as needed

export type ServiceType = "private-events" | "corporate" | "weddings" | "pick-up-delivery";

export interface PricingInfo {
  price: number;
  currency: string;
  unit: string;
}

export const pricingData: Record<ServiceType, PricingInfo> = {
  "private-events": {
    price: 15,
    currency: "€",
    unit: "per person",
  },
  corporate: {
    price: 15,
    currency: "€",
    unit: "per person",
  },
  weddings: {
    price: 35,
    currency: "€",
    unit: "per person",
  },
  "pick-up-delivery": {
    price: 15,
    currency: "€",
    unit: "per person",
  },
};

/**
 * Get pricing information for a service type
 */
export function getPricing(serviceType: ServiceType): PricingInfo {
  return pricingData[serviceType];
}

/**
 * Format pricing as "Starting from €X per person"
 */
export function formatPricing(serviceType: ServiceType): string {
  const pricing = getPricing(serviceType);
  return `Starting from ${pricing.currency}${pricing.price} ${pricing.unit}`;
}

