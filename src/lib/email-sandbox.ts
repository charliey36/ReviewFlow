/**
 * Resend sandbox error parsing.
 *
 * Resend accounts in sandbox mode can only send to the verified owner email.
 * This module recognises that restriction in provider errors and rewrites it
 * into a human-readable message that guides users toward production setup.
 */

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
