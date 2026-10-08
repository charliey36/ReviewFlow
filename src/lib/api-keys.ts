import { createHash, randomBytes } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

const hash = (key: string) => createHash('sha256').update(key).digest('hex');

/** Creates (or replaces) the business's API key. Returns the plaintext key: shown once, never stored. */
export async function generateApiKey(businessId: string): Promise<string> {
  const key = `rf_live_${randomBytes(24).toString('base64url')}`;
  const { error } = await createAdminClient()
    .from('api_keys')
    .upsert(
      { business_id: businessId, key_hash: hash(key), key_prefix: key.slice(0, 12), is_active: true },
      { onConflict: 'business_id' }
    );
  if (error) throw new Error(`Failed to save API key: ${error.message}`);
  return key;
}

export async function getApiKeyInfo(businessId: string) {
  const { data } = await createAdminClient()
    .from('api_keys')
    .select('key_prefix, created_at')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .maybeSingle();
  return data;
}

/** Resolves an x-api-key header value to a business id, or null. */
export async function resolveBusinessByApiKey(key: string | null): Promise<string | null> {
  if (!key) return null;
  const { data } = await createAdminClient()
    .from('api_keys')
    .select('business_id')
    .eq('key_hash', hash(key))
    .eq('is_active', true)
    .maybeSingle();
  return data?.business_id ?? null;
}
