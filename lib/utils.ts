/**
 * Generate a unique order number
 * Format: MOTO-{timestamp}-{random}
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `MOTO-${timestamp}-${random}`
}

/**
 * Extract postcode prefix from Dutch postcode
 * e.g., "1012AB" -> "10"
 */
export function extractPostcodePrefix(postcode: string): string {
  const match = postcode.match(/^(\d{1,2})/)
  return match ? match[1] : ''
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('nl-NL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (!email || email.trim() === '') return false
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
  return emailRegex.test(email.trim())
}

/**
 * Validate Dutch phone number
 * Accepts formats: +31XXXXXXXXX, 06XXXXXXXX, 0031XXXXXXXXX, etc.
 */
export function validatePhone(phone: string): boolean {
  if (!phone || phone.trim() === '') return false
  // Remove common separators and spaces
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '')
  // Dutch phone patterns:
  // +31 6 XXXXXXXX (mobile)
  // +31 XX XXXXXXX (landline)
  // 06 XXXXXXXX (mobile without country code)
  // 0031 XXXXXXXXX (with 00 prefix)
  const phoneRegex = /^(\+31|0031|0)?[1-9][0-9]{8,9}$/
  return phoneRegex.test(cleaned)
}

/**
 * Format phone number for display
 * Attempts to format Dutch phone numbers
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return ''
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '')
  
  // If it starts with +31, format as +31 X XXXX XXXX
  if (cleaned.startsWith('+31')) {
    const number = cleaned.slice(3)
    if (number.length === 9) {
      return `+31 ${number.slice(0, 1)} ${number.slice(1, 5)} ${number.slice(5)}`
    }
  }
  
  // If it starts with 06, format as 06-XXXX XXXX
  if (cleaned.startsWith('06')) {
    const number = cleaned.slice(2)
    if (number.length === 8) {
      return `06-${number.slice(0, 4)} ${number.slice(4)}`
    }
  }
  
  return phone
}

/**
 * Check if order meets minimum order requirement
 */
export function checkMinimumOrder(
  subtotal: number,
  minOrder: number
): { valid: boolean; message: string; amountNeeded: number } {
  if (minOrder <= 0) {
    return { valid: true, message: '', amountNeeded: 0 }
  }

  if (subtotal >= minOrder) {
    return { valid: true, message: '', amountNeeded: 0 }
  }

  const amountNeeded = minOrder - subtotal
  return {
    valid: false,
    message: `Add ${formatCurrency(amountNeeded)} more to reach the minimum order of ${formatCurrency(minOrder)}`,
    amountNeeded,
  }
}

/**
 * Get city from Dutch postcode
 * Uses static mapping for common Rotterdam area postcodes
 * Format: 1234AB -> returns "Rotterdam" or null if not found
 */
export async function getCityFromPostcode(postcode: string): Promise<string | null> {
  if (!postcode || postcode.trim() === '') return null
  
  // Clean postcode: remove spaces, convert to uppercase
  const cleaned = postcode.replace(/\s/g, '').toUpperCase()
  
  // Validate Dutch postcode format (4 digits + 2 letters)
  if (!/^\d{4}[A-Z]{2}$/.test(cleaned)) {
    return null
  }
  
  // Extract prefix (first 2 digits)
  const prefix = cleaned.substring(0, 2)
  
  // Static mapping for common Dutch cities
  // Based on Dutch postcode prefixes (first 2 digits)
  const cityMap: Record<string, string> = {
    '10': 'Amsterdam', // Amsterdam centrum
    '11': 'Rotterdam',
    '12': 'Rotterdam',
    '13': 'Rotterdam',
    '14': 'Rotterdam',
    '15': 'Rotterdam',
    '20': 'Rotterdam', // Rotterdam Zuid
    '22': 'Den Haag',
    '24': 'Den Haag',
    '25': 'Den Haag',
    '26': 'Den Haag',
    '29': 'Rotterdam',
    '30': 'Rotterdam', // Rotterdam Noord
    '31': 'Rotterdam',
    '35': 'Amersfoort', // Amersfoort area
  }
  
  // Lookup city by prefix
  return cityMap[prefix] || null
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }
  
  // Fallback for older browsers
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  
  try {
    document.execCommand('copy')
  } catch (error) {
    console.error('Failed to copy to clipboard (fallback):', error)
  }
  
  document.body.removeChild(textarea)
}

/**
 * Generate Google Maps URL for an address
 */
export function getGoogleMapsUrl(address: string): string {
  const encoded = encodeURIComponent(address)
  return `https://www.google.com/maps/search/?api=1&query=${encoded}`
}

/**
 * Parse dish name into Swahili and English parts
 * Handles both formats: "Swahili/English" or "English/Swahili"
 * Detects Swahili by common patterns (wa, na, Mchuzi, Ndizi, Urojo, Mshikaki, etc.)
 */
export function parseDishName(name: string): { swahili: string | null; english: string } {
  if (name.includes('/')) {
    const parts = name.split('/');
    const part1 = parts[0].trim();
    const part2 = parts[1].trim();
    
    // Common Swahili words/patterns
    const swahiliPatterns = [
      'wa ', 'na ', 'Mchuzi', 'Ndizi', 'Urojo', 'Mshikaki', 'Kisamvu', 
      'Njegere', 'Kachumbari', 'Vitumbua', 'Chapati', 'Pilau', 'Mbuzi',
      'Samaki', 'Kuku', 'Nyama', 'Wali', 'Maharage', 'Mahindi'
    ];
    
    // Check if first part looks like Swahili
    const part1IsSwahili = swahiliPatterns.some(pattern => 
      part1.includes(pattern) || part1.toLowerCase().includes(pattern.toLowerCase())
    );
    
    // Check if second part looks like Swahili
    const part2IsSwahili = swahiliPatterns.some(pattern => 
      part2.includes(pattern) || part2.toLowerCase().includes(pattern.toLowerCase())
    );
    
    // Determine which is Swahili and which is English
    if (part1IsSwahili && !part2IsSwahili) {
      // Format: "Swahili/English"
      return {
        swahili: part1,
        english: part2
      };
    } else if (part2IsSwahili && !part1IsSwahili) {
      // Format: "English/Swahili"
      return {
        swahili: part2,
        english: part1
      };
    } else {
      // If both or neither match, assume first is Swahili if it contains common Swahili words
      // Otherwise, check length - Swahili names are often longer
      if (part1.length > part2.length || part1.includes('wa') || part1.includes('na')) {
        return {
          swahili: part1,
          english: part2
        };
      } else {
        return {
          swahili: part2,
          english: part1
        };
      }
    }
  }
  // If no slash, assume it's English only
  return {
    swahili: null,
    english: name.trim()
  };
}

