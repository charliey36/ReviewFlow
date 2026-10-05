import { NextResponse, type NextRequest } from 'next/server';
import { generateGeminiText } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

/**
 * Temporary test endpoint for the /ai-test page. Not linked from any
 * production navigation — exists only to verify the Gemini provider wiring
 * end-to-end. Safe to delete along with /ai-test once verified.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const prompt = typeof (body as { prompt?: unknown })?.prompt === 'string'
    ? (body as { prompt: string }).prompt
    : '';

  if (!prompt.trim()) {
    return NextResponse.json({ error: 'Prompt must not be empty.' }, { status: 400 });
  }

  try {
    const text = await generateGeminiText(prompt);
    return NextResponse.json({ text });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error calling Gemini.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
