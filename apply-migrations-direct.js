#!/usr/bin/env node

/**
 * Try multiple approaches to apply migrations to Supabase
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('ERROR: Missing credentials');
  process.exit(1);
}

const projectId = SUPABASE_URL.split('.supabase.co')[0].replace('https://', '');

// Read migrations
const migrationFile = path.join(__dirname, 'MIGRATIONS-ALL.sql');
let fullSQL = fs.readFileSync(migrationFile, 'utf8');

// Remove comments
fullSQL = fullSQL
  .split('\n')
  .filter(line => {
    const trimmed = line.trim();
    return !trimmed.startsWith('--');
  })
  .join('\n')
  .trim();

console.log('='.repeat(70));
console.log('SUPABASE MIGRATION - MULTI APPROACH');
console.log('='.repeat(70));
console.log(`Project: ${projectId}`);
console.log(`SQL file: ${migrationFile}`);
console.log(`Size: ${fullSQL.length} bytes`);
console.log('');

// APPROACH 1: Try to use supabase CLI if available
console.log('APPROACH 1: Check Supabase CLI availability');
const { execSync } = require('child_process');
try {
  const version = execSync('supabase --version', { encoding: 'utf8' });
  console.log(`✓ Supabase CLI found: ${version.trim()}`);
  console.log('  Command: supabase db push');
  console.log('');
} catch (e) {
  console.log('✗ Supabase CLI not available');
  console.log('  Install with: npm install -g supabase');
  console.log('');
}

// APPROACH 2: Manual browser automation
console.log('APPROACH 2: Browser automation via Supabase Studio');
console.log(`URL: ${SUPABASE_URL}/dashboard/sql`);
console.log('');
console.log('Steps to apply manually:');
console.log('1. Open the URL above');
console.log('2. Click on "SQL" editor');
console.log('3. Click on "New Query" or open empty editor');
console.log('4. Copy entire MIGRATIONS-ALL.sql content');
console.log('5. Paste into SQL editor');
console.log('6. Click "RUN" button');
console.log('7. Wait 2-3 minutes for execution');
console.log('');

// APPROACH 3: Check if we can get correct connection details
console.log('APPROACH 3: Connection diagnostics');
console.log(`SUPABASE_URL: ${SUPABASE_URL}`);
console.log(`SERVICE_ROLE_KEY length: ${SERVICE_ROLE_KEY.length}`);
console.log('');

// Try to get connection string from Supabase dashboard API
console.log('APPROACH 4: Fetch database connection details from Supabase API');
console.log('');

async function getConnectionDetails() {
  try {
    // This would require API key to Supabase management API, which we don't have
    // But we can extract what we know from the dashboard

    // Try direct fetch to get database info
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/`,
      {
        headers: {
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.ok) {
      console.log('✓ Service role key is valid for REST API');
      return true;
    } else {
      console.log(`✗ Service role key returned ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`Error: ${error.message}`);
    return false;
  }
}

// APPROACH 5: Create migration chunks
console.log('APPROACH 5: Split migration into chunks');
const statements = fullSQL
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0);

console.log(`Found ${statements.length} SQL statements`);

// Save chunks to separate files
const chunksDir = path.join(__dirname, '.migrations-chunks');
if (!fs.existsSync(chunksDir)) {
  fs.mkdirSync(chunksDir, { recursive: true });
}

statements.forEach((stmt, idx) => {
  const filename = path.join(chunksDir, `${String(idx + 1).padStart(3, '0')}.sql`);
  fs.writeFileSync(filename, stmt + ';', 'utf8');
});

console.log(`✓ Saved ${statements.length} statements to: ${chunksDir}`);
console.log('');

// APPROACH 6: Provide curl commands
console.log('APPROACH 6: Using curl to execute via REST API');
console.log('(This won\'t work without a custom RPC function, but shown for reference)');
console.log('');
console.log(`curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \\`);
console.log(`  -H "Authorization: Bearer ${SERVICE_ROLE_KEY.substring(0, 20)}..." \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -d '{"sql": "SELECT NOW()"}'`);
console.log('');

// Summary
console.log('='.repeat(70));
console.log('RECOMMENDATION');
console.log('='.repeat(70));
console.log('');
console.log('Since direct PostgreSQL connection requires proper credentials,');
console.log('the best approach is to use Supabase Studio SQL Editor:');
console.log('');
console.log(`1. Open: ${SUPABASE_URL}/dashboard/sql`);
console.log('2. Create new query');
console.log('3. Paste MIGRATIONS-ALL.sql content');
console.log('4. Execute');
console.log('');
console.log('Alternative: Install and use Supabase CLI');
console.log('  npm install -g supabase');
console.log('  supabase link --project-ref ' + projectId);
console.log('  supabase db push');
console.log('');

// Check if migrations chunks were created
console.log(`Migration chunks saved to: .migrations-chunks/`);
console.log('You can execute them one by one if needed.');

getConnectionDetails();
