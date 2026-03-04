#!/usr/bin/env node

/**
 * Apply migrations via Supabase SQL REST API
 * This approach uses fetch to send SQL to Supabase's SQL editor endpoint
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

async function executeSql(sql) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ sql_query: sql }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || response.statusText);
    }

    return { success: true, data: await response.json() };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function applyMigrations() {
  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`\n🚀 Applying ${files.length} migrations to ${SUPABASE_URL}\n`);
  console.log('📝 Note: Execute these migrations manually in Supabase Studio if API fails\n');

  let successCount = 0;
  let failCount = 0;
  const failedFiles = [];

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    process.stdout.write(`⏳ ${file}... `);

    const result = await executeSql(sql);

    if (result.success) {
      console.log('✅');
      successCount++;
    } else {
      console.log(`❌ (${result.error})`);
      failCount++;
      failedFiles.push(file);
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📁 Total: ${files.length}\n`);

  if (failedFiles.length > 0) {
    console.log('⚠️  Failed migrations:');
    failedFiles.forEach(f => console.log(`   - ${f}`));
    console.log('\n💡 Execute these manually in Supabase Studio:');
    console.log('   1. Go to SQL Editor');
    console.log(`   2. Copy content from supabase/migrations/\${filename}`);
    console.log('   3. Paste and click "Run"\n');
  }
}

// Main
applyMigrations().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
