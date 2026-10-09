import { NextRequest, NextResponse } from 'next/server';
import { getEmailDiagnostics, formatDiagnostics } from '@/lib/email-sandbox';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/business';

/**
 * GET /api/email-diagnostics
 * 
 * Returns detailed email provider diagnostics for the admin panel.
 * Admin-only endpoint. No sensitive data exposed.
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const diagnostics = await getEmailDiagnostics();
    console.log('[Email Diagnostics]', formatDiagnostics(diagnostics));

    return NextResponse.json({
      success: true,
      data: diagnostics,
    });
  } catch (error) {
    console.error('[Email Diagnostics] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get diagnostics',
      },
      { status: 500 }
    );
  }
}
