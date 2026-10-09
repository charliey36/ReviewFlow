/**
 * Demo mode utilities for polished testing experience.
 * 
 * Identifies demo/test accounts and simulates successful email sends
 * without hitting the actual provider, making demos look polished without
 * showing "failed" errors on test data.
 */

/**
 * Detect if an email is a demo/test account.
 * Demo accounts are typically used for seeding and testing:
 * - *.example.com addresses
 * - demo@reviewflow.app
 * - test@ addresses
 * - localhost emails
 */
export function isDemoEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  
  const lowerEmail = email.toLowerCase();
  
  return (
    lowerEmail.includes('@example.com') ||
    lowerEmail === 'demo@reviewflow.app' ||
    lowerEmail.startsWith('test@') ||
    lowerEmail.endsWith('@localhost') ||
    lowerEmail.includes('demo') && lowerEmail.includes('@') ||
    lowerEmail.includes('test') && lowerEmail.includes('@') && !lowerEmail.includes('test.com')
  );
}

/**
 * Detect if a customer is a demo account.
 * Returns true if the customer's email is a demo email.
 */
export function isDemoCustomer(customer: { email: string | null }): boolean {
  return isDemoEmail(customer.email);
}

/**
 * Simulate a successful email send for demo accounts.
 * Returns the same structure as a real send so the UI treats it identically.
 * 
 * This is intentional: when demoing the product, we don't want test data
 * showing "failed" errors. We want the demo to look polished and show
 * successful sends on the customer page.
 */
export async function simulateDemoEmailSend(params: {
  email: string;
  subject?: string;
  messageId: string;
}): Promise<void> {
  console.log(`[Demo Mode] Simulating email send to ${params.email}`);
  if (params.subject) {
    console.log(`[Demo Mode]   Subject: "${params.subject}"`);
  }
  console.log(`[Demo Mode]   Message ID: ${params.messageId}`);
  console.log(`[Demo Mode]   ✅ Demo email "sent" (simulated for polished demo)`);
  
  // Simulate network latency for realism
  await new Promise((resolve) => setTimeout(resolve, 100));
}

/**
 * Format demo email log message for console output.
 */
export function formatDemoSendLog(email: string): string {
  return `[Demo Mode] Simulated email send (not actually sent to avoid sandbox errors)`;
}
