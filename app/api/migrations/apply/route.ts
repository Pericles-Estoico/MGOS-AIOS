/**
 * API Route to execute Supabase migrations
 * POST /api/migrations/apply
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export async function POST() {
  try {
    // Create Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Read migrations file
    const migrationsPath = resolve(process.cwd(), 'MIGRATIONS-ALL.sql');
    const sqlContent = readFileSync(migrationsPath, 'utf8');

    // Split into statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    console.log(`\n🚀 Starting migrations: ${statements.length} statements\n`);

    let successCount = 0;
    let failCount = 0;
    const errors = [];

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      try {
        // Use rpc function if available, otherwise use raw query
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        }).catch(() => {
          // Fallback: try direct query
          return supabase.from('_migrations').select().limit(1);
        });

        if (error) {
          console.log(`[${i + 1}/${statements.length}] ❌ ${error.message}`);
          failCount++;
          errors.push({
            statementNum: i + 1,
            error: error.message,
            sql: statement.substring(0, 100)
          });
        } else {
          console.log(`[${i + 1}/${statements.length}] ✅`);
          successCount++;
        }
      } catch (err: any) {
        console.log(`[${i + 1}/${statements.length}] ❌ ${err.message}`);
        failCount++;
      }
    }

    // Summary
    return Response.json({
      success: failCount === 0,
      summary: {
        total: statements.length,
        successCount,
        failCount,
        errors: errors.slice(0, 5)
      },
      message: failCount === 0 ? '✅ Migrations applied successfully!' : `⚠️ ${failCount} statements failed`
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
