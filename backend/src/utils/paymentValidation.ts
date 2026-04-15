/**
 * Payment URL validation utilities
 * Validates payment links to prevent phishing attacks
 */

// Allowed payment service domains (Colombian and international payment services)
const ALLOWED_PAYMENT_DOMAINS = [
  // Colombian payment services
  'nequi.com.co',
  'nequi.com',
  'daviplata.com',
  'davivienda.com',
  'bancolombia.com',
  'bancodebogota.com',
  'pse.com.co',
  'rappi.com.co',
  'rappi.com',
  // International payment services
  'paypal.com',
  'paypal.me',
  'venmo.com',
  'cash.app',
  'square.com',
  'revolut.com',
  'wise.com',
  'zelle.com',
  // Banking links
  'bancolombia.com.co',
  'davivienda.com.co',
];

// Regex to match common payment link patterns (reserved for future use)
// const PAYMENT_LINK_PATTERNS = [
//   // Nequi format: https://nequi.com.co/xxx or similar
//   /^https?:\/\/(www\.)?nequi\.(com\.co|com)\//i,
//   // Daviplata
//   /^https?:\/\/(www\.)?daviplata\.com\//i,
//   // PayPal.me links
//   /^https?:\/\/(www\.)?paypal\.(com|me)\//i,
//   // Generic HTTPS URLs to allowed domains
//   /^https:\/\//i,
// ];

/**
 * Validates if a payment URL is from a trusted domain
 */
export function isValidPaymentUrl(url: string): boolean {
  if (!url || url.trim() === '') {
    return true; // Empty is valid (optional field)
  }

  try {
    const parsed = new URL(url);
    
    // Must be HTTPS (except for development localhost)
    if (parsed.protocol !== 'https:' && !parsed.hostname.includes('localhost')) {
      return false;
    }

    // Check if domain is in allowed list
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
    
    // Check exact match or subdomain match
    const isAllowed = ALLOWED_PAYMENT_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );

    return isAllowed;
  } catch {
    // Invalid URL format
    return false;
  }
}

/**
 * Sanitize payment URL - returns null if invalid, trimmed URL if valid
 */
export function sanitizePaymentUrl(url: string | undefined | null): string | null {
  if (!url || url.trim() === '') {
    return null;
  }

  const trimmed = url.trim();
  
  // Max length check
  if (trimmed.length > 500) {
    return null;
  }

  // Validate URL format and domain
  if (!isValidPaymentUrl(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Error message for invalid payment URL
 */
export const INVALID_PAYMENT_URL_MESSAGE = 
  'Link de pago inválido. Usa links de servicios conocidos como Nequi, Daviplata, PayPal, etc.';
