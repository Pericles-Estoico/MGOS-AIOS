#!/usr/bin/env node

/**
 * Apply database migrations to Supabase
 * This script uses the Supabase JS client to execute SQL migrations
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing env vars');
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyMigrations() {
  try {
    console.log('🚀 Starting migration application...');
    console.log(`📍 Supabase URL: ${SUPABASE_URL}`);

    // Read migration script
    const migrationSQL = fs.readFileSync('/tmp/migrations.sql', 'utf-8');

    console.log(`\n📝 Executing ${migrationSQL.split('\n').length} lines of SQL...`);

    // Execute via RPC (Supabase doesn't expose direct SQL execution via REST)
    // We'll use sql() function if available
    const { error, data } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Migration failed:');
      console.error('  Error:', error.message);
      console.error('  Details:', error);
      console.log(`\n⚠️  If you see "function exec_sql does not exist", use the manual method:`);
      console.log(`  1. Go to https://app.supabase.com/project/ytywuiyzulkvzsqfeghh/sql`);
      console.log(`  2. Paste content of /tmp/migrations.sql`);
      console.log(`  3. Click "Run"`);
      process.exit(1);
    }

    console.log('✅ Migrations applied successfully!');
    console.log('📊 Result:', data);

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log(`\n⚠️  Error applying migrations. Please apply manually:`);
    console.log(`\n📋 Manual Steps:`);
    console.log(`1. Go to: https://app.supabase.com/project/ytywuiyzulkvzsqfeghh/sql`);
    console.log(`2. Create a new query`);
    console.log(`3. Paste the content of: /tmp/migrations.sql`);
    console.log(`4. Click "Run" button`);
    console.log(`\n📄 Or copy this command:`);
    console.log(`   cat /tmp/migrations.sql`);
    process.exit(1);
  }
}

applyMigrations();
