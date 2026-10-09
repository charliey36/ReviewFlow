import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

type Db = SupabaseClient<Database>;

export interface SchemaValidationResult {
  isValid: boolean;
  missingColumns: string[];
  errors: string[];
}

/**
 * Validates that all required schema elements exist in the database.
 * Called on app startup to detect missing migrations early.
 * 
 * Returns a result object that can be logged or acted upon.
 * If invalid, the app should log clearly and potentially fail gracefully.
 */
export async function validateDatabaseSchema(supabase: Db): Promise<SchemaValidationResult> {
  const result: SchemaValidationResult = {
    isValid: true,
    missingColumns: [],
    errors: [],
  };

  try {
    // Check if messages table has visit_id column
    // We do this by attempting a query that would fail if the column doesn't exist
    const { data, error } = await supabase
      .from('messages')
      .select('id, visit_id')
      .limit(1);

    if (error) {
      if (error.message.includes('visit_id') && error.message.includes('schema cache')) {
        result.isValid = false;
        result.missingColumns.push('messages.visit_id');
        result.errors.push(
          'Missing required column: messages.visit_id\n' +
          'This column should exist from migration 0011_review_queue.sql or 0013_ensure_visit_id.sql\n' +
          'To fix: Run the missing migrations in your Supabase project via SQL editor:\n' +
          '  supabase/migrations/0013_ensure_visit_id.sql'
        );
      } else {
        result.errors.push(`Messages table error: ${error.message}`);
      }
    }

    // Check if visits table exists and has required columns
    const { data: visitData, error: visitError } = await supabase
      .from('visits')
      .select('id, customer_id, service_id, visited_at')
      .limit(1);

    if (visitError) {
      result.errors.push(`Visits table error: ${visitError.message}`);
    }

    // Check if customers table has required columns
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('id, name, email, business_id')
      .limit(1);

    if (customerError) {
      result.errors.push(`Customers table error: ${customerError.message}`);
    }

    if (result.errors.length > 0) {
      result.isValid = false;
    }
  } catch (e) {
    result.isValid = false;
    result.errors.push(`Unexpected validation error: ${e instanceof Error ? e.message : 'unknown error'}`);
  }

  return result;
}

/**
 * Logs schema validation results in a clear, actionable format.
 * Should be called during app startup.
 */
export function logSchemaValidation(result: SchemaValidationResult): void {
  if (result.isValid) {
    console.log('✓ Database schema validation passed');
    return;
  }

  console.error('\n❌ DATABASE SCHEMA VALIDATION FAILED\n');
  console.error('═══════════════════════════════════════════════════════════════');

  if (result.missingColumns.length > 0) {
    console.error('\nMissing columns:');
    result.missingColumns.forEach((col) => console.error(`  - ${col}`));
  }

  if (result.errors.length > 0) {
    console.error('\nErrors:');
    result.errors.forEach((err) => console.error(`  ${err}`));
  }

  console.error('\n═══════════════════════════════════════════════════════════════');
  console.error(
    '\nTo fix: Run the required migrations in your Supabase project:\n' +
    '  1. Go to your Supabase project dashboard\n' +
    '  2. Navigate to SQL editor\n' +
    '  3. Run the files in supabase/migrations/ in order\n' +
    '  4. Restart the application\n'
  );
}
