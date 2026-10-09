/**
 * Resend sandbox mode detection and error parsing.
 * 
 * Resend accounts in sandbox mode can only send to the verified owner email.
 * This module detects sandbox restrictions and transforms provider errors into
 * human-readable messages that guide users toward production setup.
 */

import { Resend } from 'resend';
import { APP_NAME } from '@/lib/brand';

export interface ResendDiagnostics {
  connected: boolean;
  mode: 'sandbox' | 'production' | 'unknown';
  verifiedDomain: string | null;
  allowedRecipient: string | null;
  senderAddress: string;
  error: string | null;
}

const SANDBOX_ERROR_PATTERNS = [
  /you can only send testing emails to your own email address/i,
  /verify a domain at resend\.com\/domains/i,
  /sandbox/i,
];

/**
 * Detect if an error message is a Resend sandbox restriction error.
 * Returns the detected allowed recipient email if found.
 */
export function parseSandboxError(errorMessage: string): {
  isSandboxError: boolean;
  allowedEmail?: string;
} {
  const isSandbox = SANDBOX_ERROR_PATTERNS.some((pattern) => pattern.test(errorMessage));

  // Extract email address from the sandbox error message
  // Pattern: "you can only send testing emails to your own email address (charlieyoults123@gmail.com)"
  const emailMatch = errorMessage.match(/\(([^)]+@[^)]+)\)/);
  const allowedEmail = emailMatch?.[1];

  return {
    isSandboxError: isSandbox,
    allowedEmail,
  };
}

/**
 * Transform a Resend error into a human-readable message.
 */
export function transformResendError(errorMessage: string): string {
  const { isSandboxError, allowedEmail } = parseSandboxError(errorMessage);

  if (isSandboxError && allowedEmail) {
    return `Email blocked by Resend Sandbox Mode. Only ${allowedEmail} can receive test emails until a sending domain is verified. Visit resend.com/domains to add a custom domain.`;
  }

  if (isSandboxError) {
    return 'Email blocked by Resend Sandbox Mode. To send emails to customers, verify a domain at resend.com/domains.';
  }

  // Return original error for non-sandbox errors
  return errorMessage;
}

/**
 * Attempt to detect Resend account mode by trying to send a test email.
 * This is called during diagnostics but not on every send.
 */
export async function detectResendMode(
  apiKey: string,
  testEmail: string
): Promise<{ mode: 'sandbox' | 'production'; allowedRecipient?: string; verifiedDomain?: string }> {
  try {
    const resend = new Resend(apiKey);
    const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';

    // Try to send a test email
    const { error } = await resend.emails.send({
      from: `${APP_NAME} Test <${from}>`,
      to: testEmail,
      subject: `${APP_NAME} Email Configuration Test`,
      text: 'This is a test email to detect your Resend account configuration.',
      html: '<p>This is a test email to detect your Resend account configuration.</p>',
    });

    if (error) {
      const errorMsg = typeof error === 'string' ? error : error.message;
      const { isSandboxError, allowedEmail } = parseSandboxError(errorMsg);

      if (isSandboxError) {
        return {
          mode: 'sandbox',
          allowedRecipient: allowedEmail,
        };
      }
    }

    // If no error or error wasn't sandbox-related, assume production
    return { mode: 'production' };
  } catch (e) {
    // If detection fails, assume unknown
    console.error('[Email Sandbox Detection] Failed to detect mode:', e);
    return { mode: 'production' };
  }
}

/**
 * Get comprehensive email diagnostics for the admin panel.
 */
export async function getEmailDiagnostics(): Promise<ResendDiagnostics> {
  const apiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';

  if (!apiKey) {
    return {
      connected: false,
      mode: 'unknown',
      verifiedDomain: null,
      allowedRecipient: null,
      senderAddress: emailFrom,
      error: 'RESEND_API_KEY not configured',
    };
  }

  try {
    // Detect mode by attempting a test send
    const modeDetection = await detectResendMode(apiKey, adminEmail);

    // Extract domain info from sender address
    const fromDomain = emailFrom.includes('@') ? emailFrom.split('@')[1] : null;
    const isCustomDomain = fromDomain && !fromDomain.includes('resend.dev');

    return {
      connected: true,
      mode: modeDetection.mode,
      verifiedDomain: isCustomDomain ? fromDomain : null,
      allowedRecipient: modeDetection.allowedRecipient || null,
      senderAddress: emailFrom,
      error: null,
    };
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : 'Unknown error';
    return {
      connected: false,
      mode: 'unknown',
      verifiedDomain: null,
      allowedRecipient: null,
      senderAddress: emailFrom,
      error: errorMsg,
    };
  }
}

/**
 * Format diagnostics for logging.
 */
export function formatDiagnostics(diag: ResendDiagnostics): string {
  const status = diag.connected ? '✅' : '❌';
  const modeStr = diag.mode === 'sandbox' ? '🧪 Sandbox' : diag.mode === 'production' ? '🚀 Production' : '❓ Unknown';

  let output = `${status} Email Provider: Resend
   Status: ${diag.connected ? 'Connected' : 'Disconnected'}
   Mode: ${modeStr}
   Sender: ${diag.senderAddress}`;

  if (diag.verifiedDomain) {
    output += `\n   Verified Domain: ${diag.verifiedDomain}`;
  }

  if (diag.allowedRecipient) {
    output += `\n   Sandbox Recipient: ${diag.allowedRecipient}`;
  }

  if (diag.error) {
    output += `\n   Error: ${diag.error}`;
  }

  return output;
}
