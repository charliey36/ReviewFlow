#!/usr/bin/env node

/**
 * Standalone test script for CSV import header matching.
 * Run with: node scripts/test-csv-import.mjs
 */

// Import the functions - we'll need to extract them since they're TypeScript
// For now, we'll duplicate the core logic here for testing

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mapCsvRowsToCustomers(rows) {
  if (rows.length === 0) return { rows: [], error: 'The file is empty.' };

  // Normalize header: lowercase and remove spaces/underscores/hyphens for matching
  const originalHeader = rows[0];
  const normalizedHeader = originalHeader.map((h) => h.trim().toLowerCase().replace(/[\s_-]/g, ''));

  // Find column indices using comprehensive alias lists
  const find = (aliases) => normalizedHeader.findIndex((h) => aliases.includes(h));

  const nameIndex = find([
    'name',
    'fullname',
    'customername',
    'customer',
    'clientname',
    'client',
  ]);

  const emailIndex = find([
    'email',
    'emailaddress',
    'emailaddr',
    'e-mail',
  ]);

  const phoneIndex = find([
    'phone',
    'phonenumber',
    'phoneno',
    'mobile',
    'telephone',
    'tel',
  ]);

  const amountIndex = find([
    'amount',
    'amountspent',
    'value',
    'spend',
    'revenue',
    'price',
    'cost',
    'fee',
    'total',
  ]);

  const serviceIndex = find([
    'service',
    'servicetype',
    'servicename',
    'job',
    'jobtype',
    'jobname',
    'worktype',
    'work',
    'description',
    'workcompleted',
  ]);

  const dateIndex = find([
    'date',
    'servicedate',
    'datecompleted',
    'completeddate',
    'jobdate',
    'visitdate',
    'lastservicedate',
    'dateofservice',
  ]);

  // Check for required columns only (name, email, date)
  const missing = [
    nameIndex === -1 && 'name',
    emailIndex === -1 && 'email',
    dateIndex === -1 && 'date',
  ].filter(Boolean);

  if (missing.length > 0) {
    const detectedHeaders = originalHeader.join(', ') || '(empty)';
    return {
      rows: [],
      error: `Missing required column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}. 
Required: name, email, date
Optional: service, phone, amount

Your headers: ${detectedHeaders}`,
    };
  }

  const cell = (r, i) => (i >= 0 ? r[i]?.trim() ?? '' : '');

  let warning = undefined;
  const result = rows.slice(1).map((r) => {
    let service = cell(r, serviceIndex);
    if (!service && serviceIndex === -1) {
      service = 'General Service';
      warning = "No service column detected. Imported customers will use 'General Service'.";
    } else if (!service) {
      service = 'General Service';
    }

    return {
      name: cell(r, nameIndex),
      email: cell(r, emailIndex),
      phone: cell(r, phoneIndex) || null,
      amountSpent: cell(r, amountIndex) || null,
      service,
      date: cell(r, dateIndex),
    };
  });

  return { rows: result, warning };
}

// Test utilities
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`✅ ${message}`);
  } else {
    failed++;
    console.error(`❌ ${message}`);
  }
}

function test(name, fn) {
  try {
    fn();
    console.log(`\n✓ ${name}`);
  } catch (e) {
    console.error(`\n✗ ${name}`);
    console.error(`  ${e.message}`);
    failed++;
  }
}

// Tests
console.log('\n🧪 CSV Import Header Matching Tests\n');

test('Real-world: Name,Email,Phone,AmountSpent,ServiceDate', () => {
  const rows = [
    ['Name', 'Email', 'Phone', 'AmountSpent', 'ServiceDate'],
    ['John Smith', 'john@example.com', '555-1234', '150.00', '2026-10-08'],
  ];
  const result = mapCsvRowsToCustomers(rows);
  assert(!result.error, 'No error');
  assert(result.rows.length === 1, 'One row imported');
  assert(result.rows[0].name === 'John Smith', 'Name parsed');
  assert(result.rows[0].email === 'john@example.com', 'Email parsed');
  assert(result.rows[0].phone === '555-1234', 'Phone parsed');
  assert(result.rows[0].amountSpent === '150.00', 'Amount parsed');
  assert(result.rows[0].service === 'General Service', 'Service defaults to General Service');
  assert(result.rows[0].date === '2026-10-08', 'Date parsed');
  assert(result.warning, 'Warning present for missing service column');
});

test('Real-world: Customer Name,Email Address,Job Type,Date Completed', () => {
  const rows = [
    ['Customer Name', 'Email Address', 'Job Type', 'Date Completed'],
    ['Bob Johnson', 'bob@example.com', 'Plumbing', '2026-10-06'],
  ];
  const result = mapCsvRowsToCustomers(rows);
  assert(!result.error, 'No error');
  assert(result.rows.length === 1, 'One row imported');
  assert(result.rows[0].name === 'Bob Johnson', 'Name parsed');
  assert(result.rows[0].email === 'bob@example.com', 'Email parsed');
  assert(result.rows[0].service === 'Plumbing', 'Service parsed from Job Type');
  assert(result.rows[0].date === '2026-10-06', 'Date parsed from Date Completed');
});

test('Standard format: name,email,service,date', () => {
  const rows = [
    ['name', 'email', 'service', 'date'],
    ['Alice Brown', 'alice@example.com', 'Electrical', '2026-10-05'],
  ];
  const result = mapCsvRowsToCustomers(rows);
  assert(!result.error, 'No error');
  assert(result.rows.length === 1, 'One row imported');
  assert(result.rows[0].service === 'Electrical', 'Service parsed');
});

test('Header aliases: NAME variations', () => {
  const testCases = [
    'name',
    'customer',
    'customername',
    'customer_name',
    'fullname',
    'full_name',
    'Full Name',
  ];

  testCases.forEach((header) => {
    const rows = [
      [header, 'email', 'date'],
      ['Test Name', 'test@example.com', '2026-10-08'],
    ];
    const result = mapCsvRowsToCustomers(rows);
    assert(!result.error, `"${header}" matched as NAME`);
    assert(result.rows[0].name === 'Test Name', `NAME extracted correctly from "${header}"`);
  });
});

test('Header aliases: EMAIL variations', () => {
  const testCases = [
    'email',
    'emailaddress',
    'email_address',
    'Email Address',
  ];

  testCases.forEach((header) => {
    const rows = [
      ['name', header, 'date'],
      ['Test', 'test@example.com', '2026-10-08'],
    ];
    const result = mapCsvRowsToCustomers(rows);
    assert(!result.error, `"${header}" matched as EMAIL`);
    assert(result.rows[0].email === 'test@example.com', `EMAIL extracted correctly from "${header}"`);
  });
});

test('Header aliases: SERVICE variations', () => {
  const testCases = [
    'service',
    'servicetype',
    'service_type',
    'job',
    'jobtype',
    'job_type',
    'description',
  ];

  testCases.forEach((header) => {
    const rows = [
      ['name', 'email', header, 'date'],
      ['Test', 'test@example.com', 'Repair', '2026-10-08'],
    ];
    const result = mapCsvRowsToCustomers(rows);
    assert(!result.error, `"${header}" matched as SERVICE`);
    assert(result.rows[0].service === 'Repair', `SERVICE extracted correctly from "${header}"`);
  });
});

test('Header aliases: DATE variations', () => {
  const testCases = [
    'date',
    'servicedate',
    'service_date',
    'datecompleted',
    'completeddate',
    'completed_date',
  ];

  testCases.forEach((header) => {
    const rows = [
      ['name', 'email', header],
      ['Test', 'test@example.com', '2026-10-08'],
    ];
    const result = mapCsvRowsToCustomers(rows);
    assert(!result.error, `"${header}" matched as DATE`);
    assert(result.rows[0].date === '2026-10-08', `DATE extracted correctly from "${header}"`);
  });
});

test('Case-insensitive headers', () => {
  const rows = [
    ['NAME', 'EMAIL', 'SERVICE', 'DATE'],
    ['Test', 'test@example.com', 'Repair', '2026-10-08'],
  ];
  const result = mapCsvRowsToCustomers(rows);
  assert(!result.error, 'Uppercase headers work');
  assert(result.rows[0].name === 'Test', 'All caps NAME matched');
});

test('Spaces and symbols treated as identical', () => {
  const formats = [
    ['name', 'email', 'service date', 'date'],
    ['name', 'email', 'service_date', 'date'],
    ['name', 'email', 'service-date', 'date'],
  ];

  formats.forEach((header, i) => {
    const rows = [header, ['Test', 'test@example.com', '2026-10-08']];
    const result = mapCsvRowsToCustomers(rows);
    assert(!result.error, `Format ${i + 1} (spaces/underscores/hyphens) works`);
  });
});

test('Optional columns: phone not required', () => {
  const rows = [
    ['name', 'email', 'date'],
    ['Test', 'test@example.com', '2026-10-08'],
  ];
  const result = mapCsvRowsToCustomers(rows);
  assert(!result.error, 'Import succeeds without phone');
  assert(result.rows[0].phone === null, 'Phone is null when not provided');
});

test('Optional columns: amount not required', () => {
  const rows = [
    ['name', 'email', 'date'],
    ['Test', 'test@example.com', '2026-10-08'],
  ];
  const result = mapCsvRowsToCustomers(rows);
  assert(!result.error, 'Import succeeds without amount');
  assert(result.rows[0].amountSpent === null, 'Amount is null when not provided');
});

test('Required columns: name required', () => {
  const rows = [
    ['email', 'date'],
    ['test@example.com', '2026-10-08'],
  ];
  const result = mapCsvRowsToCustomers(rows);
  assert(result.error && result.error.includes('name'), 'Error when name missing');
});

test('Required columns: email required', () => {
  const rows = [
    ['name', 'date'],
    ['Test', '2026-10-08'],
  ];
  const result = mapCsvRowsToCustomers(rows);
  assert(result.error && result.error.includes('email'), 'Error when email missing');
});

test('Required columns: date required', () => {
  const rows = [
    ['name', 'email'],
    ['Test', 'test@example.com'],
  ];
  const result = mapCsvRowsToCustomers(rows);
  assert(result.error && result.error.includes('date'), 'Error when date missing');
});

test('Extra columns handled gracefully', () => {
  const rows = [
    ['name', 'email', 'date', 'extra1', 'extra2', 'extra3'],
    ['Test', 'test@example.com', '2026-10-08', 'value1', 'value2', 'value3'],
  ];
  const result = mapCsvRowsToCustomers(rows);
  assert(!result.error, 'Extra columns do not cause error');
  assert(result.rows.length === 1, 'Row imported successfully');
});

console.log(`\n${'─'.repeat(50)}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`${'─'.repeat(50)}\n`);

process.exit(failed > 0 ? 1 : 0);
