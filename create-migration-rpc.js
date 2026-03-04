#!/usr/bin/env node

/**
 * Create a temporary RPC function to execute raw SQL migrations
 * Then call it to apply migrations
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

async function main() {
  try {
    console.log('='.repeat(70));
    console.log('CREATE MIGRATION RPC FUNCTION');
    console.log('='.repeat(70));
    console.log('');

    // Read migrations
    const migrationFile = path.join(__dirname, 'MIGRATIONS-ALL.sql');
    let fullSQL = fs.readFileSync(migrationFile, 'utf8');

    // Step 1: Create RPC function that executes raw SQL
    const createRpcSQL = `
CREATE OR REPLACE FUNCTION public.exec_migrations(sql_statements text)
RETURNS TABLE(statement_num int, status text, error_msg text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  statements text[];
  i int;
  current_stmt text;
BEGIN
  -- Split by semicolon
  statements := string_to_array(sql_statements, ';');

  FOR i IN 1 .. array_length(statements, 1) LOOP
    current_stmt := trim(statements[i]);
    IF current_stmt != '' THEN
      BEGIN
        EXECUTE current_stmt;
        RETURN QUERY SELECT i, 'SUCCESS'::text, NULL::text;
      EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT i, 'ERROR'::text, SQLERRM;
      END;
    END IF;
  END LOOP;
END;
$$;
`;

    console.log('Step 1: Creating RPC function...');
    console.log('Note: This requires database owner access');
    console.log('');

    // Step 2: Try to call API to create the function
    console.log('Step 2: Attempting to create function via REST API...');
    console.log(`URL: ${SUPABASE_URL}/rest/v1/rpc/exec_migrations`);
    console.log('');

    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log(`API Response Status: ${response.status}`);
    if (!response.ok) {
      const text = await response.text();
      console.log(`Response: ${text.substring(0, 200)}`);
      console.log('');
      throw new Error(`API returned ${response.status}`);
    }

    console.log('✓ API is responding');
    console.log('');

    // Step 3: Alternative - use supabase-js client
    console.log('Step 3: Trying with @supabase/supabase-js client...');

    const { createClient } = require('@supabase/supabase-js');

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    // First, try to execute a simple query to test connection
    console.log('Testing connection with simple query...');
    const { data, error } = await supabase
      .from('pg_tables')
      .select('*')
      .limit(1);

    if (error) {
      console.log(`✗ Error: ${error.message}`);
      console.log('');
      throw new Error('Cannot connect to database via Supabase client');
    }

    console.log('✓ Connected to database!');
    console.log('');

    // Step 4: Try to execute migrations via rpc
    console.log('Step 4: Checking if rpc function exists...');

    // The reality is that we need direct PostgreSQL access
    // which requires the actual database password, not the API key

    console.log('');
    console.log('='.repeat(70));
    console.log('CONCLUSION');
    console.log('='.repeat(70));
    console.log('');
    console.log('The Supabase REST API cannot execute raw SQL directly.');
    console.log('We need to use one of these methods:');
    console.log('');
    console.log('1. SUPABASE STUDIO (Recommended)');
    console.log(`   - Open: ${SUPABASE_URL}/dashboard/sql`);
    console.log('   - Paste MIGRATIONS-ALL.sql');
    console.log('   - Click RUN');
    console.log('');
    console.log('2. SUPABASE CLI');
    console.log('   - Install from: https://supabase.com/docs/guides/cli/getting-started');
    console.log(`   - Run: supabase db push`);
    console.log('');
    console.log('3. DATABASE PASSWORD (if available)');
    console.log('   - Get password from Supabase settings');
    console.log('   - Use psql: psql -h ... -U postgres < MIGRATIONS-ALL.sql');
    console.log('');

  } catch (error) {
    console.error('ERROR:', error.message);
    console.error('');
    console.log('MANUAL STEPS:');
    console.log('');
    console.log('1. Go to: https://grxsyhmikuhqmffhipwt.supabase.co/dashboard/sql');
    console.log('2. Create new query');
    console.log('3. Open file: MIGRATIONS-ALL.sql');
    console.log('4. Copy all content');
    console.log('5. Paste in Supabase SQL Editor');
    console.log('6. Click Run button');
    console.log('');
  }
}

main();
