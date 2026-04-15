/**
 * reCAPTCHA v3 service for frontend
 * Handles invisible reCAPTCHA verification
 */

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

let recaptchaReady = false;
let readyPromise: Promise<void> | null = null;
let scriptLoaded = false;

/**
 * Dynamically load reCAPTCHA script with site key
 */
function loadRecaptchaScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (scriptLoaded || !RECAPTCHA_SITE_KEY) {
      resolve();
      return;
    }

    // Check if already loaded
    if (document.querySelector(`script[src*="recaptcha/api.js"]`)) {
      scriptLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load reCAPTCHA script'));
    };

    document.head.appendChild(script);
  });
}

/**
 * Wait for reCAPTCHA to be ready
 */
function waitForRecaptcha(): Promise<void> {
  if (recaptchaReady) {
    return Promise.resolve();
  }

  if (readyPromise) {
    return readyPromise;
  }

  readyPromise = new Promise(async (resolve) => {
    if (!RECAPTCHA_SITE_KEY) {
      console.warn('reCAPTCHA site key not configured');
      recaptchaReady = true;
      resolve();
      return;
    }

    try {
      // Load script dynamically
      await loadRecaptchaScript();
      
      // Wait for grecaptcha to be ready
      const checkReady = () => {
        if (typeof window.grecaptcha !== 'undefined' && window.grecaptcha.ready) {
          window.grecaptcha.ready(() => {
            recaptchaReady = true;
            resolve();
          });
        } else {
          setTimeout(checkReady, 100);
        }
      };
      
      checkReady();
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (!recaptchaReady) {
          console.warn('reCAPTCHA ready timeout');
          recaptchaReady = true;
          resolve();
        }
      }, 10000);
    } catch (error) {
      console.error('Failed to load reCAPTCHA:', error);
      recaptchaReady = true;
      resolve();
    }
  });

  return readyPromise;
}

/**
 * Get reCAPTCHA token for an action
 * @param action - The action name (e.g., 'create_plan', 'add_expense')
 * @returns The reCAPTCHA token or empty string if not configured
 */
export async function getRecaptchaToken(action: string): Promise<string> {
  if (!RECAPTCHA_SITE_KEY) {
    return '';
  }

  try {
    await waitForRecaptcha();
    
    if (typeof window.grecaptcha === 'undefined') {
      console.warn('reCAPTCHA not available');
      return '';
    }

    const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
    return token;
  } catch (error) {
    console.error('reCAPTCHA error:', error);
    return '';
  }
}

/**
 * Check if reCAPTCHA is enabled
 */
export function isRecaptchaEnabled(): boolean {
  return Boolean(RECAPTCHA_SITE_KEY);
}
