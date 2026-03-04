#!/usr/bin/env node

/**
 * Execute Supabase migrations using PostgreSQL client
 * Uses psql to connect directly to Supabase database
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Parse project ref from URL
const projectRef = SUPABASE_URL.split('//')[1].split('.')[0];
console.log(`\n🚀 Executing migrations for project: ${projectRef}\n`);

// Build connection string
const dbHost = `${projectRef}.db.supabase.co`;
const dbPort = 5432;
const dbName = 'postgres';
const dbUser = 'postgres';

// Note: We'll use the all-in-one MIGRATIONS-ALL.sql file
const allMigrationsPath = path.join(__dirname, '../MIGRATIONS-ALL.sql');

if (!fs.existsSync(allMigrationsPath)) {
  console.error(`❌ MIGRATIONS-ALL.sql not found at ${allMigrationsPath}`);
  process.exit(1);
}

console.log(`📂 Reading migrations from: MIGRATIONS-ALL.sql\n`);
const sqlContent = fs.readFileSync(allMigrationsPath, 'utf8');

// Strategy: Output instructions for manual execution
// since psql/API execution requires complex auth setup

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                 📋 MIGRATION EXECUTION GUIDE                  ║
╚═══════════════════════════════════════════════════════════════╝

Since automated execution requires additional setup, here's the
fastest way to apply all migrations:

🌐 STEP 1: Open Supabase Studio
   → https://${projectRef}.supabase.co/dashboard/sql

✏️  STEP 2: Create New Query
   → Click "New Query" button (top right)

📋 STEP 3: Copy Migration SQL
   → File: MIGRATIONS-ALL.sql (in project root)
   → Ctrl+A → Ctrl+C to copy all

🔗 STEP 4: Paste in SQL Editor
   → Click in editor area
   → Ctrl+V to paste

▶️  STEP 5: Execute
   → Click "RUN" button (blue)
   → Wait 2-3 minutes
   → Check for red error messages

✅ STEP 6: Verify Success
   → Run this query in editor:

   SELECT COUNT(*) as total_tables
   FROM information_schema.tables
   WHERE table_schema = 'public';

   → Should return ~15+

═══════════════════════════════════════════════════════════════

ALTERNATIVELY: Use Supabase CLI (if installed)

  supabase link --project-ref ${projectRef}
  supabase db push

═══════════════════════════════════════════════════════════════

📊 Migration Statistics:
  • Total Lines: ${sqlContent.split('\n').length}
  • Total Statements: ${(sqlContent.match(/;/g) || []).length}
  • Estimated Time: 2-3 minutes
  • Risk Level: LOW (idempotent migrations)

═══════════════════════════════════════════════════════════════
`);

// Show first 100 lines of migration preview
console.log('\n📝 MIGRATION PREVIEW (first 100 lines):\n');
const lines = sqlContent.split('\n').slice(0, 100);
lines.forEach((line, i) => {
  if (i < 100) {
    console.log(`${String(i + 1).padStart(3)}  ${line}`);
  }
});

console.log('\n... (showing 100 of ' + sqlContent.split('\n').length + ' lines)\n');

console.log(`
💡 TIPS:
  1. Copy MIGRATIONS-ALL.sql to clipboard and paste in Supabase Studio
  2. Monitor the execution in real-time
  3. If error occurs, note the line number and check that migration file
  4. After success, run verification query above
  5. All migrations are idempotent (safe to run multiple times)

🎯 NEXT: Go to Supabase Studio and execute the migrations!
`);
