#!/usr/bin/env node

/**
 * Apply all Supabase migrations to production project
 * Usage: node scripts/apply-migrations.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function executeSql(sql, filename) {
  try {
    console.log(`⏳ Executing: ${filename}`);
    const { error } = await supabase.rpc('exec', { sql_query: sql });

    if (error) throw error;
    console.log(`✅ Success: ${filename}\n`);
    return true;
  } catch (err) {
    // If exec function doesn't exist, try alternative method
    if (err.message.includes('does not exist')) {
      return await executeSqlDirect(sql, filename);
    }
    console.error(`❌ Error in ${filename}:`, err.message);
    return false;
  }
}

async function executeSqlDirect(sql, filename) {
  try {
    console.log(`⏳ Executing (direct): ${filename}`);
    // Split by ; but keep comments
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.query(statement);
        if (error) throw error;
      }
    }
    console.log(`✅ Success: ${filename}\n`);
    return true;
  } catch (err) {
    console.error(`❌ Error in ${filename}:`, err.message);
    return false;
  }
}

async function applyMigrations() {
  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`\n🚀 Applying ${files.length} migrations to ${SUPABASE_URL}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    const success = await executeSql(sql, file);
    if (success) successCount++;
    else failCount++;
  }

  console.log(`\n📊 Results:`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📁 Total: ${files.length}\n`);

  if (failCount > 0) {
    process.exit(1);
  }
}

// Main
applyMigrations().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
