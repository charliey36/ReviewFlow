import { parseServiceDate } from '@/lib/eligibility';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { enrollCustomerInJourney } from '@/lib/journeys';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

export type BulkImportRow = { name: string; email: string; phone?: string; lastServiceDate?: string };

export type BulkImportRowResult =
  | { row: number; status: 'created'; name: string; email: string }
  | { row: number; status: 'skipped_duplicate'; name: string; email: string }
  | { row: number; status: 'error'; name: string; email: string; reason: string };

export type BulkImportSummary = {
  totalRows: number;
  created: number;
  duplicates: number;
  errors: number;
  results: BulkImportRowResult[];
};

/**
 * Shared bulk-insert logic used by CSV import. Validates each row, skips
 * rows that duplicate an email already on file for this business (checked
 * against existing customers and against earlier rows in the same file),
 * inserts the rest, and schedules a review request for each new customer —
 * the same send_at = now + business.delay_hours calculation used when a
 * single customer is added via the Customers page form.
 */
export async function bulkImportCustomers(
  supabase: SupabaseClient<Database>,
  businessId: string,
  delayHours: number,
  rows: BulkImportRow[],
  windowDays = 14
): Promise<BulkImportSummary> {
  const results: BulkImportRowResult[] = [];
  const seenEmails = new Set<string>();

  const { data: existing } = await supabase
    .from('customers')
    .select('email')
    .eq('business_id', businessId);

  const existingEmails = new Set((existing ?? []).map((c) => c.email.toLowerCase()));

  const sendAt = new Date(Date.now() + delayHours * 60 * 60 * 1000).toISOString();

  const { data: journey } = await supabase
    .from('journeys')
    .select('*')
    .eq('business_id', businessId)
    .eq('key', 'review_sequence')
    .eq('is_active', true)
    .maybeSingle();

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 1;
    const name = rows[i].name.trim();
    const email = rows[i].email.trim().toLowerCase();

    if (!name) {
      results.push({ row: rowNumber, status: 'error', name, email, reason: 'Name is required.' });
      continue;
    }

    if (!isValidEmail(email)) {
      results.push({ row: rowNumber, status: 'error', name, email, reason: 'Invalid email address.' });
      continue;
    }

    if (existingEmails.has(email) || seenEmails.has(email)) {
      results.push({ row: rowNumber, status: 'skipped_duplicate', name, email });
      continue;
    }

    const rawDate = (rows[i].lastServiceDate ?? '').trim();
    const serviceDate = rawDate ? parseServiceDate(rawDate) : null;
    if (rawDate && !serviceDate) {
      results.push({ row: rowNumber, status: 'error', name, email, reason: 'Invalid LastServiceDate (use YYYY-MM-DD or DD/MM/YYYY).' });
      continue;
    }

    seenEmails.add(email);

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        business_id: businessId,
        name,
        email,
        phone: rows[i].phone?.trim() || null,
        last_service_date: serviceDate,
      })
      .select('id')
      .single();

    if (customerError || !customer) {
      results.push({
        row: rowNumber,
        status: 'error',
        name,
        email,
        reason: customerError?.message ?? 'Failed to create customer.',
      });
      continue;
    }

    results.push({ row: rowNumber, status: 'created', name, email });
  }

  return {
    totalRows: rows.length,
    created: results.filter((r) => r.status === 'created').length,
    duplicates: results.filter((r) => r.status === 'skipped_duplicate').length,
    errors: results.filter((r) => r.status === 'error').length,
    results,
  };
}

/**
 * Minimal CSV parser sufficient for a simple name/email customer list.
 * Handles quoted fields (with escaped "" inside quotes) and both \n and
 * \r\n line endings. Not a full RFC 4180 implementation, but covers what
 * spreadsheet exports (Excel, Google Sheets, Apple Numbers) produce.
 */
export function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  // Strip a UTF-8 BOM if present (common in Excel-exported CSVs).
  const text = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim().length > 0));
}

/**
 * Maps parsed CSV rows to { name, email } using a case-insensitive header
 * lookup. Accepts common header variants (e.g. "Full Name", "E-mail").
 */
export function mapCsvRowsToCustomers(rows: string[][]): {
  rows: BulkImportRow[];
  error?: string;
} {
  if (rows.length === 0) {
    return { rows: [], error: 'The file is empty.' };
  }

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const phoneIndex = rows[0].map((h) => h.trim().toLowerCase()).findIndex((h) => ['phone', 'phone number', 'mobile'].includes(h));
  const dateIndex = rows[0].map((h) => h.trim().toLowerCase().replace(/[\s_]/g, '')).findIndex((h) => h === 'lastservicedate');
  const nameIndex = header.findIndex((h) => ['name', 'full name', 'customer name'].includes(h));
  const emailIndex = header.findIndex((h) => ['email', 'e-mail', 'email address'].includes(h));

  if (nameIndex === -1 || emailIndex === -1) {
    return {
      rows: [],
      error: 'Could not find "name" and "email" columns. The first row must be a header row.',
    };
  }

  const dataRows = rows.slice(1);
  const mapped = dataRows.map((r) => ({
    name: r[nameIndex] ?? '',
    email: r[emailIndex] ?? '',
    phone: phoneIndex >= 0 ? r[phoneIndex] ?? '' : '',
    lastServiceDate: dateIndex >= 0 ? r[dateIndex] ?? '' : '',
  }));

  return { rows: mapped };
}
