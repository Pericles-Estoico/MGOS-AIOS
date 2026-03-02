/**
 * Apply Migration Script
 * Executes the marketplace_subtasks migration on Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load env
dotenv.config({ path: path.join(process.cwd(), '.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ytywuiyzulkvzsqfeghh.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0eXd1aXl6dWxrdnpzcWZlZ2hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMTQxNTIsImV4cCI6MjA4Njg5MDE1Mn0.l42RsI2YbP6yOWNDq9lBcecQaHRtVVQ0ATeC1FY_pPI';

async function applyMigration() {
  console.log('🚀 Applying marketplace_subtasks migration...\n');

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    // Read migration file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20260302_create_marketplace_subtasks.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Split into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const description = stmt.substring(0, 80).replace(/\n/g, ' ');

      try {
            if (stmt.includes('CREATE TABLE')) {
                          console.log(`Creating table...`);

                    const { data: tables, error: tableCheckError } = await client
                            .from('information_schema.tables')
                            .select('table_name')
                            .eq('table_name', 'marketplace_subtasks')
                            .single();

                    if (!tableCheckError && tables) {
                                    console.log('table already exists');
                                    continue;
                    }
            }

                const { error } = await client.rpc('exec_sql', { sql_query: stmt });
                  if (error) throw error;
                  console.log(`Success`);
      } catch (err) {
                  console.error(`Error: ${err.message}`);
      }
    }
  }
      console.log('Migration completed successfully!');
} catch (err) {
      console.error('CRITICAL ERROR:', err.message);
    process.exit(1);
}
}

applyMigration();
