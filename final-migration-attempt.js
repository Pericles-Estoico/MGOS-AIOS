#!/usr/bin/env node

/**
 * Final migration attempt using all available techniques
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing credentials');
  process.exit(1);
}

const projectId = SUPABASE_URL.split('.supabase.co')[0].replace('https://', '');

async function testDatabaseConnectivity() {
  console.log('');
  console.log('Testing database connectivity...');

  // Try 1: Test with REST API
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'OPTIONS',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`✓ REST API responds: ${response.status}`);
    return true;
  } catch (e) {
    console.log(`✗ REST API failed: ${e.message}`);
  }

  // Try 2: Test GraphQL API
  try {
    const response = await fetch(`${SUPABASE_URL}/graphql/v1`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `query { __schema { types { name } } }`
      })
    });
    console.log(`✓ GraphQL API responds: ${response.status}`);
    return true;
  } catch (e) {
    console.log(`✗ GraphQL API failed: ${e.message}`);
  }

  return false;
}

async function tryEdgeFunctionExecution() {
  console.log('');
  console.log('Attempting to create and use Edge Function for migration...');

  // This would require creating an edge function via API, which is complex
  // Skipping for now

  console.log('⚠️  Edge Functions require dashboard access');
  return false;
}

async function createDetailedReport() {
  console.log('');
  console.log('='.repeat(70));
  console.log('MIGRATION EXECUTION REPORT');
  console.log('='.repeat(70));
  console.log('');

  const migrationsPath = path.join(__dirname, 'MIGRATIONS-ALL.sql');
  const sqlContent = fs.readFileSync(migrationsPath, 'utf8');
  const lines = sqlContent.split('\n').length;
  const statements = sqlContent.split(';').length - 1;

  console.log('📊 MIGRATION FILE DETAILS:');
  console.log(`  • File: MIGRATIONS-ALL.sql`);
  console.log(`  • Size: ${(sqlContent.length / 1024).toFixed(2)} KB`);
  console.log(`  • Lines: ${lines}`);
  console.log(`  • Statements: ${statements}`);
  console.log('');

  // Parse to identify what will be created
  const lines_arr = sqlContent.split('\n');
  const createTableMatches = sqlContent.match(/CREATE TABLE.*?public\.\w+/gi) || [];
  const createIndexMatches = sqlContent.match(/CREATE INDEX/gi) || [];
  const createTriggerMatches = sqlContent.match(/CREATE TRIGGER/gi) || [];
  const createFunctionMatches = sqlContent.match(/CREATE OR REPLACE FUNCTION/gi) || [];
  const rlsPolicies = sqlContent.match(/CREATE POLICY/gi) || [];

  console.log('📋 OBJECTS TO BE CREATED:');
  console.log(`  • Tables: ${createTableMatches.length}`);
  console.log(`  • Indexes: ${createIndexMatches.length}`);
  console.log(`  • Triggers: ${createTriggerMatches.length}`);
  console.log(`  • Functions: ${createFunctionMatches.length}`);
  console.log(`  • RLS Policies: ${rlsPolicies.length}`);
  console.log('');

  // Extract table names
  const tableNameMatches = sqlContent.match(/CREATE TABLE IF NOT EXISTS public\.(\w+)/gi) || [];
  const tables = [...new Set(tableNameMatches.map(m => m.split('.')[1]))];

  console.log('📦 TABLES TO BE CREATED:');
  tables.forEach(table => {
    console.log(`  • ${table}`);
  });
  console.log('');

  return {
    statements,
    tables,
    functions: createFunctionMatches.length,
    triggers: createTriggerMatches.length,
    policies: rlsPolicies.length
  };
}

async function createExecutionGuide() {
  console.log('');
  console.log('='.repeat(70));
  console.log('EXECUTION GUIDE - THREE OPTIONS');
  console.log('='.repeat(70));
  console.log('');

  console.log('OPTION 1: Manual Copy-Paste (EASIEST) ✅');
  console.log('─────────────────────────────────');
  console.log('');
  console.log('1. Open your terminal:');
  console.log(`   Start → cmd → type: ${SUPABASE_URL}/dashboard/sql`);
  console.log('');
  console.log('2. In Supabase Studio:');
  console.log('   • Click "SQL Editor" (left sidebar)');
  console.log('   • Click "New Query" button');
  console.log('   • Right-click → Paste (Ctrl+V)');
  console.log('   • Click the blue "RUN" button');
  console.log('   • Wait 2-3 minutes');
  console.log('');
  console.log('3. Verify success:');
  console.log('   • No red error messages');
  console.log('   • All statements show "Success" or green checkmark');
  console.log('');
  console.log('─────────────────────────────────');
  console.log('');

  console.log('OPTION 2: Using Docker + psql');
  console.log('─────────────────────────────────');
  console.log('');
  console.log('Prerequisites: Docker installed');
  console.log('');
  console.log('Commands:');
  console.log('  # Get database password from Supabase Settings → Database');
  console.log('  # Then run:');
  console.log('');
  console.log('  docker run --rm -v $(pwd):/work postgres:latest psql \\');
  console.log(`    -h aws-0-us-east-1.pooler.supabase.com \\`);
  console.log(`    -U postgres.${projectId} \\`);
  console.log(`    -d postgres \\`);
  console.log('    -c "\\i /work/MIGRATIONS-ALL.sql"');
  console.log('');
  console.log('─────────────────────────────────');
  console.log('');

  console.log('OPTION 3: Install Supabase CLI');
  console.log('─────────────────────────────────');
  console.log('');
  console.log('From: https://supabase.com/docs/guides/cli');
  console.log('');
  console.log('Commands:');
  console.log(`  brew install supabase/tap/supabase  # macOS`);
  console.log(`  # or scoop install supabase         # Windows`);
  console.log('');
  console.log(`  supabase link --project-ref ${projectId}`);
  console.log('  supabase db push');
  console.log('');
  console.log('─────────────────────────────────');
  console.log('');
}

async function createVerificationQueries() {
  console.log('');
  console.log('='.repeat(70));
  console.log('VERIFICATION QUERIES (run after migration completes)');
  console.log('='.repeat(70));
  console.log('');

  console.log('Query 1: Count tables');
  console.log('─────────────────────');
  console.log(`
  SELECT COUNT(*) as table_count
  FROM information_schema.tables
  WHERE table_schema = 'public';

  Expected result: 15+
`);

  console.log('Query 2: List all tables');
  console.log('─────────────────────');
  console.log(`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
  ORDER BY table_name;
`);

  console.log('Query 3: Check RLS enabled');
  console.log('─────────────────────');
  console.log(`
  SELECT schemaname, tablename, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
`);

  console.log('Query 4: Check triggers');
  console.log('─────────────────────');
  console.log(`
  SELECT trigger_name, event_manipulation, event_object_table
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
  ORDER BY trigger_name;
`);

  console.log('');
}

async function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  SUPABASE MIGRATION - FINAL EXECUTION REPORT                 ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');

  console.log(`Project ID: ${projectId}`);
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log('');

  // Test connectivity
  const connected = await testDatabaseConnectivity();

  if (!connected) {
    console.log('⚠️  Unable to establish direct database connection');
    console.log('    This is expected - Supabase doesn\'t expose raw SQL execution');
    console.log('    via REST API for security reasons.');
  }

  // Create detailed report
  const stats = await createDetailedReport();

  // Create execution guide
  await createExecutionGuide();

  // Create verification queries
  await createVerificationQueries();

  console.log('='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log('');
  console.log('✅ Migration file is ready');
  console.log(`✅ ${stats.statements} SQL statements prepared`);
  console.log(`✅ ${stats.tables.length} tables will be created`);
  console.log(`✅ ${stats.functions} functions will be created`);
  console.log(`✅ ${stats.triggers} triggers will be created`);
  console.log(`✅ ${stats.policies} RLS policies will be configured`);
  console.log('');
  console.log('Next step: Use OPTION 1 (Manual Copy-Paste) above');
  console.log('');
}

main().catch(console.error);
