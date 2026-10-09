/**
 * Brand guard: the product is "Pentriq". This fails if the old name creeps
 * back into user-facing source, and checks the central brand constants and
 * that rendered emails carry the new name.
 */
import { describe, it, expect } from '@jest/globals';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';
import {
  APP_NAME,
  APP_NAME_ACCENT,
  APP_NAME_LEAD,
  APP_SLUG,
  APP_TITLE,
  senderDisplayName,
} from '../brand';
import { renderMessage } from '../templates';
import { buildNotificationEmail } from '../email';

const ROOT = join(__dirname, '..', '..', '..');
const OLD_NAME = /review[\s_-]?flow/i;

/**
 * Places the old name may legitimately remain:
 *  - brand.ts: LEGACY_STORAGE_KEYS (preserves users' saved preferences)
 *  - this test file
 */
const ALLOWED = new Set(['src/lib/brand.ts', 'src/lib/__tests__/brand.test.ts']);
const SCAN_DIRS = ['src', 'public', 'scripts'];
const TEXT_EXT = /\.(ts|tsx|js|mjs|json|svg|csv|css|md|txt)$/;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (TEXT_EXT.test(entry)) out.push(full);
  }
  return out;
}

describe('brand constants', () => {
  it('uses Pentriq as the single source of truth', () => {
    expect(APP_NAME).toBe('Pentriq');
    expect(APP_NAME_LEAD + APP_NAME_ACCENT).toBe(APP_NAME);
    expect(APP_SLUG).toBe('pentriq');
    expect(APP_TITLE.startsWith('Pentriq')).toBe(true);
    expect(senderDisplayName('Acme')).toBe('Acme via Pentriq');
  });
});

describe('rendered output carries the Pentriq name', () => {
  const ctx = {
    businessName: 'Acme Coffee',
    customerName: 'Alex',
    publicReviewUrl: 'https://app.test/r',
    privateFeedbackUrl: 'https://app.test/f',
    unsubscribeUrl: 'https://app.test/u',
  };

  it('review request + reminder emails', () => {
    for (const purpose of ['review_request', 'review_reminder'] as const) {
      const { html, text } = renderMessage(purpose, 'email', ctx);
      expect(html).toContain('Sent via Pentriq');
      expect(html).toContain('Pentr<span');
      expect(text).toContain('Sent via Pentriq');
      expect(html).not.toMatch(OLD_NAME);
      expect(text).not.toMatch(OLD_NAME);
    }
  });

  it('other message emails use the Pentriq footer', () => {
    const { html } = renderMessage('rebooking_reminder', 'email', { ...ctx, rebookingUrl: 'https://app.test/b' });
    expect(html).toContain('via Pentriq');
    expect(html).not.toMatch(OLD_NAME);
  });

  it('welcome / campaign / trial notification emails', () => {
    for (const kind of ['welcome', 'campaign', 'trial_ending'] as const) {
      const { subject, html } = buildNotificationEmail(kind, 'Acme');
      expect(html).toContain('Pentriq');
      expect(`${subject} ${html}`).not.toMatch(OLD_NAME);
    }
    expect(buildNotificationEmail('welcome', 'Acme').subject).toBe('Welcome to Pentriq');
  });
});

describe('no remaining references to the old product name', () => {
  it('src, public and scripts are clean (except documented allowances)', () => {
    const offenders: string[] = [];
    for (const dir of SCAN_DIRS) {
      for (const file of walk(join(ROOT, dir))) {
        const rel = relative(ROOT, file);
        if (ALLOWED.has(rel)) continue;
        const lines = readFileSync(file, 'utf8').split('\n');
        lines.forEach((line, i) => {
          if (OLD_NAME.test(line)) offenders.push(`${rel}:${i + 1}: ${line.trim().slice(0, 100)}`);
        });
      }
    }
    expect(offenders).toEqual([]);
  });
});
