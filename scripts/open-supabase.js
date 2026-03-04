#!/usr/bin/env node

/**
 * Open Supabase Studio and show migration instructions
 * Works on Windows, macOS, and Linux
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!SUPABASE_URL) {
  console.error('❌ Missing SUPABASE_URL in .env.local');
  process.exit(1);
}

const projectRef = SUPABASE_URL.split('//')[1].split('.')[0];
const sqlEditorUrl = `${SUPABASE_URL}/dashboard/sql`;
const migrationsPath = path.resolve(__dirname, '../MIGRATIONS-ALL.sql');

console.log(`
╔══════════════════════════════════════════════════════════════╗
║         🚀 SUPABASE MIGRATIONS - AUTO LAUNCHER 🚀            ║
╚══════════════════════════════════════════════════════════════╝

📍 Project: ${projectRef}
🌐 Opening: SQL Editor
📂 Migrations: MIGRATIONS-ALL.sql

`);

// Open browser
const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

let command;
if (isWindows) {
  command = `start "" "${sqlEditorUrl}"`;
} else if (isMac) {
  command = `open "${sqlEditorUrl}"`;
} else if (isLinux) {
  command = `xdg-open "${sqlEditorUrl}"`;
}

if (command) {
  require('child_process').exec(command, (error) => {
    if (error) {
      console.warn('⚠️  Could not auto-open browser. Please visit manually:');
      console.warn(`   ${sqlEditorUrl}\n`);
    }
  });
}

// Show instructions
console.log(`
✅ Opening Supabase Studio...
   (Waiting for browser to open...)

─────────────────────────────────────────────────────────────

📋 NEXT STEPS:

1️⃣  COPY MIGRATIONS
    └─ Go to: ${migrationsPath}
       └─ Open file with text editor
       └─ Select all (Ctrl+A)
       └─ Copy (Ctrl+C)

2️⃣  PASTE IN SUPABASE STUDIO
    └─ You should see SQL Editor open in browser
    └─ Click in the editor area
    └─ Paste (Ctrl+V) the migration SQL

3️⃣  EXECUTE
    └─ Click the blue "RUN" button
    └─ Wait 2-3 minutes
    └─ ⏳ Progress shows in real-time

4️⃣  VERIFY
    └─ Run this query after migrations complete:

    SELECT COUNT(*) as table_count
    FROM information_schema.tables
    WHERE table_schema = 'public';

    └─ Should return 15+

─────────────────────────────────────────────────────────────

⚡ QUICK COPY-PASTE:

   Windows/Mac: MIGRATIONS-ALL.sql is ready
   1. Open file
   2. Ctrl+A (select all)
   3. Ctrl+C (copy)
   4. Ctrl+V in Supabase (paste)
   5. Click RUN

─────────────────────────────────────────────────────────────

📊 Migration Details:
   • 29 migration files combined
   • 3300 lines of SQL
   • 575+ statements
   • Estimated time: 2-3 minutes
   • Risk: LOW (idempotent)

─────────────────────────────────────────────────────────────

🎯 Alternative: If browser doesn't open automatically:

   Manual URL: ${sqlEditorUrl}

   1. Copy the URL above
   2. Paste in your browser
   3. Press Enter
   4. Follow steps above

─────────────────────────────────────────────────────────────

✨ What will be created:

   Tables (15+):
   ├── users (with roles: admin, head, executor, qa)
   ├── tasks (with workflow status)
   ├── evidence (file uploads + links)
   ├── qa_reviews (approval/rejection)
   ├── audit_logs (complete history)
   ├── time_logs (time tracking)
   ├── marketplace_* (Amazon, Shopee, etc)
   ├── notifications
   ├── email_queue
   ├── analytics_*
   └── ... and more

   Security:
   ├── RLS (Row Level Security) on all tables
   ├── RBAC (Role-Based Access Control)
   ├── Audit trail via triggers
   └── Encrypted passwords

─────────────────────────────────────────────────────────────

⏱️  TIMING:
   • Setup: Already done ✅
   • Copy-paste: 30 seconds
   • Execution: 2-3 minutes
   • Verification: 1 minute
   • ─────────────────────
   • TOTAL: ~5 minutes

─────────────────────────────────────────────────────────────

🔐 SECURITY REMINDER:

   ⚠️  You exposed credentials earlier!

   REGENERATE KEYS NOW:
   1. Go to: Settings → API
   2. Click: "Rotate Keys"
   3. Copy: New keys
   4. Update: .env.local

   NEVER share credentials again!

─────────────────────────────────────────────────────────────

📞 NEED HELP?

   If something goes wrong:
   1. Check Supabase Dashboard → Logs
   2. Look for error message in SQL Editor (red text)
   3. Try executing migrations one-by-one from:
      supabase/migrations/ folder
   4. Or check: SUPABASE-SETUP-CHECKLIST.md

─────────────────────────────────────────────────────────────

🚀 READY?

   1. Open MIGRATIONS-ALL.sql file
   2. Ctrl+A → Ctrl+C
   3. Browser window should be opening now...
   4. Ctrl+V to paste
   5. Click RUN

   Good luck! 🎉

─────────────────────────────────────────────────────────────
`);

// Wait a bit then show message
setTimeout(() => {
  console.log(`
✨ Browser should be opening...
   If not, visit: ${sqlEditorUrl}

🎯 Go ahead and execute the migrations! 🚀
`);
}, 2000);
