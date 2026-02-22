#!/usr/bin/env node

/**
 * Run all database migrations on Supabase
 * Usage: node scripts/run-migrations.js
 */

const fs = require('fs');
const path = require('path');

// Get credentials from env
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase...');
console.log(`URL: ${SUPABASE_URL}`);

// Get all migration files
const migrationsDir = path.join(__dirname, '../supabase/migrations');
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log(`\n📁 Found ${migrationFiles.length} migrations:`);
migrationFiles.forEach(f => console.log(`  - ${f}`));

// Read all SQL content
const allSQL = migrationFiles
  .map(f => {
    const content = fs.readFileSync(path.join(migrationsDir, f), 'utf-8');
    return `\n-- ============ ${f} ============\n${content}`;
  })
  .join('\n');

// Create a SQL script to execute
const scriptContent = `
-- Auto-generated migration script
-- Generated at ${new Date().toISOString()}

BEGIN;

${allSQL}

COMMIT;
`;

// Write to temp file
const tempFile = '/tmp/migrations.sql';
fs.writeFileSync(tempFile, scriptContent);

console.log(`\n✅ Generated migration script: ${tempFile}`);
console.log(`📊 Total SQL lines: ${scriptContent.split('\n').length}`);

console.log(`
\n🚀 To apply migrations, run one of:

Option 1: Via Supabase Dashboard
- Go to https://app.supabase.com/project/ytywuiyzulkvzsqfeghh/sql
- Copy-paste the content of: ${tempFile}
- Click "Run"

Option 2: Via psql (if installed)
- psql "postgresql://postgres:[password]@ytywuiyzulkvzsqfeghh.supabase.co:5432/postgres" < ${tempFile}

Option 3: Via Supabase CLI (if installed)
- supabase db push

Content preview (first 1000 chars):
${scriptContent.substring(0, 1000)}...
`);
