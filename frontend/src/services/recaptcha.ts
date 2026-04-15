/**
 * reCAPTCHA v3 service for frontend
 * Handles invisible reCAPTCHA verification
 */

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      render: (container: string | HTMLElement, options: object) => number;
    };
  }
}

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

let recaptchaReady = false;
let readyPromise: Promise<void> | null = null;

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

  readyPromise = new Promise((resolve) => {
    if (!RECAPTCHA_SITE_KEY) {
      console.warn('reCAPTCHA site key not configured');
      recaptchaReady = true;
      resolve();
      return;
    }

    // Check if grecaptcha is already loaded
    if (typeof window.grecaptcha !== 'undefined') {
      window.grecaptcha.ready(() => {
        recaptchaReady = true;
        resolve();
      });
    } else {
      // Wait for script to load
      const checkInterval = setInterval(() => {
        if (typeof window.grecaptcha !== 'undefined') {
          clearInterval(checkInterval);
          window.grecaptcha.ready(() => {
            recaptchaReady = true;
            resolve();
          });
        }
      }, 100);

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        console.warn('reCAPTCHA failed to load');
        recaptchaReady = true;
        resolve();
      }, 5000);
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
