import type { FastifyRequest, FastifyReply } from 'fastify';

const RECAPTCHA_SECRET = process.env['RECAPTCHA_SECRET_KEY'];
const RECAPTCHA_ENABLED = process.env['RECAPTCHA_ENABLED'] === 'true';
const MIN_SCORE = parseFloat(process.env['RECAPTCHA_MIN_SCORE'] ?? '0.5');

interface RecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

/**
 * reCAPTCHA v3 verification middleware
 * Validates the invisible reCAPTCHA token sent in x-recaptcha-token header
 */
export async function verifyRecaptcha(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Skip verification if disabled (for development/testing)
  if (!RECAPTCHA_ENABLED) {
    request.log.debug('reCAPTCHA verification skipped (disabled)');
    return;
  }

  if (!RECAPTCHA_SECRET) {
    request.log.warn('RECAPTCHA_SECRET_KEY not configured');
    return; // Fail open if not configured (log warning)
  }

  const token = request.headers['x-recaptcha-token'] as string | undefined;

  if (!token) {
    return reply.status(400).send({ 
      error: 'Missing reCAPTCHA verification',
      code: 'RECAPTCHA_MISSING'
    });
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: RECAPTCHA_SECRET,
        response: token,
        remoteip: request.ip,
      }),
    });

    const data: RecaptchaResponse = await response.json();

    if (!data.success) {
      request.log.warn({ errors: data['error-codes'] }, 'reCAPTCHA verification failed');
      return reply.status(403).send({ 
        error: 'Verification failed',
        code: 'RECAPTCHA_FAILED'
      });
    }

    // Check score (0.0 = likely bot, 1.0 = likely human)
    if (data.score !== undefined && data.score < MIN_SCORE) {
      request.log.warn({ score: data.score }, 'reCAPTCHA score too low');
      return reply.status(403).send({ 
        error: 'Verification failed',
        code: 'RECAPTCHA_LOW_SCORE'
      });
    }

    request.log.debug({ score: data.score, action: data.action }, 'reCAPTCHA verified');
  } catch (error) {
    request.log.error({ err: error }, 'reCAPTCHA verification error');
    // Fail open on network errors to avoid blocking legitimate users
    // In high-security scenarios, you might want to fail closed instead
  }
}

/**
 * Factory to create reCAPTCHA middleware for specific actions
 * Note: Action validation is logged but not enforced client-side
 */
export function recaptchaForAction(_expectedAction: string) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // First run normal verification
    await verifyRecaptcha(request, reply);
    
    // If reply was already sent (error), stop
    if (reply.sent) return;

    // Action validation could be added here if needed
    // The action is set client-side and can help detect token reuse
  };
}
