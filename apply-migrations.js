#!/usr/bin/env node

/**
 * Script to apply MIGRATIONS-ALL.sql to Supabase via postgres.js
 * Usage: node apply-migrations.js
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const postgres = require('postgres');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('ERROR: Missing SUPABASE credentials in .env.local');
  process.exit(1);
}

// Extract project ID
const projectId = SUPABASE_URL.split('.supabase.co')[0].replace('https://', '');

async function applyMigrations() {
  let sql;

  try {
    console.log('='.repeat(70));
    console.log('SUPABASE MIGRATION EXECUTOR');
    console.log('='.repeat(70));
    console.log(`Project ID: ${projectId}`);
    console.log('');

    // Create connection using postgres.js
    // postgres.js handles SSL better than pg module
    sql = postgres({
      host: 'aws-0-us-east-1.pooler.supabase.com',
      port: 6543,
      database: 'postgres',
      username: `postgres.${projectId}`,
      password: SERVICE_ROLE_KEY,
      ssl: 'require',
      max: 1
    });

    console.log('Connecting to PostgreSQL...');

    // Test connection
    const result = await sql`SELECT NOW()`;
    console.log(`Connected successfully! Time: ${result[0].now}`);
    console.log('');

    // Read migration file
    const migrationFile = path.join(__dirname, 'MIGRATIONS-ALL.sql');
    if (!fs.existsSync(migrationFile)) {
      throw new Error(`Migration file not found: ${migrationFile}`);
    }

    let content = fs.readFileSync(migrationFile, 'utf8');

    // Remove comment lines
    const lines = content
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return !trimmed.startsWith('--') && trimmed.length > 0;
      })
      .map(line => {
        const commentIndex = line.indexOf('--');
        return commentIndex > -1 ? line.substring(0, commentIndex) : line;
      });

    const fullContent = lines.join('\n');

    // Split by statements (simple approach: split by ;)
    const statements = fullContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute`);
    console.log('');

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const progress = `[${String(i + 1).padStart(3)}/${statements.length}]`;

      try {
        const preview = stmt
          .substring(0, 70)
          .replace(/\n/g, ' ')
          .replace(/\s+/g, ' ');

        process.stdout.write(`${progress} ${preview}... `);

        // Execute raw SQL
        await sql.unsafe(stmt);
        console.log('✓');
        successCount++;
      } catch (error) {
        console.log('✗');
        errorCount++;

        // Don't fail on extension already exists errors
        if (error.message.includes('already exists')) {
          successCount++;
          errorCount--;
          console.log('  (already exists - OK)');
          continue;
        }

        errors.push({
          index: i + 1,
          preview: stmt.substring(0, 100),
          error: error.message,
          detail: error.detail,
          code: error.code
        });

        // Some errors are non-fatal
        if (error.code === '42P07' || error.code === '42710') { // Already exists
          console.log(`  (non-fatal: ${error.code})`);
          successCount++;
          errorCount--;
        } else {
          console.error(`  Error [${error.code}]: ${error.message}`);
        }
      }
    }

    console.log('');
    console.log('='.repeat(70));
    console.log('MIGRATION COMPLETE');
    console.log('='.repeat(70));
    console.log(`✓ Successful: ${successCount} statements`);
    console.log(`✗ Failed: ${errorCount} statements`);

    if (errors.length > 0) {
      console.log('');
      console.log('CRITICAL ERRORS:');
      errors.forEach(err => {
        console.log(`\n[${err.index}] ${err.code || 'Unknown'}`);
        console.log(`  SQL: ${err.preview}...`);
        console.log(`  Error: ${err.error}`);
        if (err.detail) console.log(`  Detail: ${err.detail}`);
      });
    }

    if (successCount > 0) {
      console.log('');
      console.log('✓ MIGRATION APPLIED - Checking database schema...');

      // List created tables
      const tables = await sql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `;

      console.log(`\nTables created: ${tables.length}`);
      tables.forEach(t => console.log(`  - ${t.table_name}`));
    }

    process.exit(errorCount > 0 ? 1 : 0);

  } catch (error) {
    console.error('');
    console.error('FATAL ERROR:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (sql) {
      await sql.end();
    }
  }
}

applyMigrations();
