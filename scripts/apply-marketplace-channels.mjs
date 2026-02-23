#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Get credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🚀 Aplicando migration: marketplace_channels\n');

    // Read migration file
    const migrationPath = path.join(
      process.cwd(),
      'supabase/migrations/20260223_marketplace_channels.sql'
    );

    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Split SQL into statements (by semicolon)
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Executando ${statements.length} statements SQL...\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const statementType = statement.substring(0, 20).toUpperCase();

      process.stdout.write(`  [${i + 1}/${statements.length}] ${statementType}...`);

      try {
        const { error } = await supabase.rpc('exec', {
          sql: statement + ';',
        });

        if (error) {
          console.log(` ⚠️ ${error.message}`);
        } else {
          console.log(' ✅');
        }
      } catch (err) {
        console.log(` ⚠️ RPC not available`);
      }
    }

    console.log('\n✅ Migration file prepared!');
    console.log('\n📋 Next steps:');
    console.log('   1. Open Supabase dashboard: https://app.supabase.com/project/ytywuiyzulkvzsqfeghh');
    console.log('   2. Go to SQL Editor');
    console.log('   3. Create new query');
    console.log('   4. Paste content of: supabase/migrations/20260223_marketplace_channels.sql');
    console.log('   5. Click "Run"');
    console.log('\n   OR use: supabase db push --project-ref ytywuiyzulkvzsqfeghh');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

applyMigration();
