import { NextRequest, NextResponse } from 'next/server';
import { sendMessage } from '@/lib/messaging';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/business';
import { APP_NAME } from '@/lib/brand';

/**
 * POST /api/send-test-email
 * 
 * Sends a test email to the admin user's email address.
 * Useful for verifying the email pipeline is working correctly.
 * Admin-only endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const senderEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';

    console.log(`[Test Email] Sending test email to ${user.email}`);

    await sendMessage(
      {
        channel: 'email',
        to: { email: user.email },
        subject: `${APP_NAME} Email Configuration Test`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2>${APP_NAME} Email Configuration Test</h2>
            <p>This is a test email sent from ${APP_NAME}.</p>
            
            <h3>Configuration Details:</h3>
            <ul>
              <li><strong>Sent from:</strong> ${senderEmail}</li>
              <li><strong>Sent to:</strong> ${user.email}</li>
              <li><strong>Time:</strong> ${new Date().toISOString()}</li>
              <li><strong>App URL:</strong> ${appUrl}</li>
            </ul>
            
            <p>If you received this email, your email provider (Resend) is configured correctly!</p>
            
            <hr style="margin: 30px 0;">
            <p style="font-size: 12px; color: #666;">
              This is an automated test message from ${APP_NAME}. You received this because you are an administrator.
            </p>
          </div>
        `,
        text: `${APP_NAME} Email Configuration Test - This is a test email sent from ${APP_NAME} to verify your email configuration is working correctly.`,
      },
      `${APP_NAME} Test`
    );

    console.log(`[Test Email] ✅ Test email sent successfully to ${user.email}`);

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${user.email}`,
      senderEmail,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to send test email';
    console.error('[Test Email] ❌ Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}
