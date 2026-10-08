import { NextResponse, type NextRequest } from 'next/server';
import { resolveBusinessByApiKey } from '@/lib/api-keys';
import { parseServiceDate } from '@/lib/eligibility';
import { isValidEmail } from '@/lib/customers';
import { importServiceVisit } from '@/lib/service-import';

export const dynamic = 'force-dynamic';

/** Request DTO: see public/openapi.json */
type ServiceCompletedRequest = {
  customerName: string;
  email: string;
  phone?: string;
  amountSpent?: number;
  serviceDate: string; // YYYY-MM-DD
};

const fail = (status: number, error: string, errors?: string[]) =>
  NextResponse.json({ success: false, error, ...(errors ? { errors } : {}) }, { status });

export async function POST(request: NextRequest) {
  const businessId = await resolveBusinessByApiKey(request.headers.get('x-api-key'));
  if (!businessId) return fail(401, 'Invalid or missing x-api-key header.');

  let body: Partial<ServiceCompletedRequest>;
  try {
    body = await request.json();
  } catch {
    return fail(400, 'Body must be valid JSON.');
  }

  // Validation
  const errors: string[] = [];
  const name = typeof body.customerName === 'string' ? body.customerName.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const amount = body.amountSpent ?? 0;
  const serviceDate = typeof body.serviceDate === 'string' ? parseServiceDate(body.serviceDate) : null;

  if (!name || name.length > 200) errors.push('customerName is required (max 200 characters).');
  if (!isValidEmail(email)) errors.push('email must be a valid email address.');
  if (phone.length > 40) errors.push('phone must be 40 characters or fewer.');
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0 || amount > 1_000_000)
    errors.push('amountSpent must be a number between 0 and 1,000,000.');
  if (!serviceDate) errors.push('serviceDate is required in YYYY-MM-DD format.');
  else if (Date.parse(serviceDate) > Date.now() + 86_400_000) errors.push('serviceDate cannot be in the future.');
  if (errors.length > 0 || !serviceDate) return fail(400, 'Validation failed.', errors);

  try {
    const result = await importServiceVisit(businessId, { name, email, phone, amount, serviceDate });
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    return fail(500, e instanceof Error ? e.message : 'Import failed.');
  }
}
