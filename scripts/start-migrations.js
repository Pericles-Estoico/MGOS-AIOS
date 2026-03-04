#!/usr/bin/env node

/**
 * Interactive guide to apply migrations to Supabase
 * Opens browser and provides copy-paste instructions
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const MIGRATIONS_DIR = path.join(__dirname, '../supabase/migrations');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(q) {
  return new Promise(resolve => rl.question(q, resolve));
}

async function openBrowser() {
  const supabaseStudio = `${SUPABASE_URL}/dashboard/sql`;

  let command;
  if (process.platform === 'win32') {
    command = `start ${supabaseStudio}`;
  } else if (process.platform === 'darwin') {
    command = `open "${supabaseStudio}"`;
  } else {
    command = `xdg-open "${supabaseStudio}"`;
  }

  console.log(`\n🌐 Opening Supabase Studio...\n`);
  require('child_process').exec(command);
}

async function getMigrationContent(filename) {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  return fs.readFileSync(filePath, 'utf8');
}

async function listMigrations() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`\n📂 Found ${files.length} migrations:\n`);
  files.forEach((f, i) => {
    console.log(`  ${i + 1}. ${f}`);
  });

  return files;
}

async function showMigration(filename) {
  const content = await getMigrationContent(filename);
  const lines = content.split('\n').length;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📄 ${filename} (${lines} lines)`);
  console.log(`${'='.repeat(60)}\n`);
  console.log(content.slice(0, 1000) + (content.length > 1000 ? '\n...' : ''));
  console.log(`\n${'='.repeat(60)}\n`);
}

async function createCombinedMigration() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const combined = files
    .map(f => {
      const filePath = path.join(MIGRATIONS_DIR, f);
      const content = fs.readFileSync(filePath, 'utf8');
      return `-- ============================================\n-- File: ${f}\n-- ============================================\n${content}\n`;
    })
    .join('\n\n');

  const outputPath = path.join(__dirname, '../MIGRATIONS-ALL.sql');
  fs.writeFileSync(outputPath, combined);
  console.log(`\n✅ Created combined migration file: ${outputPath}`);
  console.log(`   (You can paste this entire file into Supabase Studio)\n`);

  return outputPath;
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║     🚀 Supabase Migration Guide                            ║
║                                                            ║
║  Project: ${SUPABASE_URL}
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);

  const migrations = await listMigrations();

  console.log(`\n📋 Options:\n`);
  console.log(`  1. View migration (choose one)`);
  console.log(`  2. Create combined migration file`);
  console.log(`  3. Open Supabase Studio (browser)`);
  console.log(`  4. Show execution instructions`);
  console.log(`  5. Exit\n`);

  while (true) {
    const choice = await question('Choose an option (1-5): ');

    switch (choice.trim()) {
      case '1':
        const idx = parseInt(await question('\nEnter migration number: ')) - 1;
        if (idx >= 0 && idx < migrations.length) {
          await showMigration(migrations[idx]);
        } else {
          console.log('❌ Invalid number');
        }
        break;

      case '2':
        const outputPath = await createCombinedMigration();
        console.log(`\n📋 Usage Instructions:\n`);
        console.log(`  1. Open: ${outputPath}`);
        console.log(`  2. Copy ALL content (Ctrl+A then Ctrl+C)`);
        console.log(`  3. Go to Supabase Studio → SQL Editor`);
        console.log(`  4. Paste content (Ctrl+V)`);
        console.log(`  5. Click "RUN"\n`);
        break;

      case '3':
        await openBrowser();
        await question('\nPress ENTER once Supabase Studio is open...');
        break;

      case '4':
        console.log(`\n📖 INSTRUCTIONS:\n`);
        console.log(`1. Visit: ${SUPABASE_URL}/dashboard/sql`);
        console.log(`2. Click "New Query" (top right)`);
        console.log(`3. Copy SQL from migration file`);
        console.log(`4. Paste into editor`);
        console.log(`5. Click "RUN" button`);
        console.log(`6. Check for errors (should be none)`);
        console.log(`7. Repeat for each migration file\n`);
        console.log(`⏱️  Estimated time: 15-20 minutes for all 29 migrations\n`);
        break;

      case '5':
        console.log('\nGoodbye! 👋\n');
        rl.close();
        process.exit(0);

      default:
        console.log('❌ Invalid option, try again\n');
    }
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
