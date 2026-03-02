#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Checking tasks table structure...\n');

try {
  // Test if table exists and can be queried
  const { data, error, count } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Error accessing tasks table:', error.message);
    console.error('\nPossible causes:');
    console.error('1. Table does not exist - need to run migration 01-schema.sql');
    console.error('2. RLS policies blocking access - need service role key');
    console.error('3. Supabase project not linked - check NEXT_PUBLIC_SUPABASE_URL');
    process.exit(1);
  }

  console.log('✅ tasks table exists');
  console.log(`📊 Total tasks: ${count || 0}`);

  // Try to insert a test task with NULL assigned_to and due_date
  console.log('\n🧪 Testing NULL column constraints...');

  const testTask = {
    title: 'TEST_TASK_CONSTRAINT_CHECK',
    description: 'Test task for constraint validation',
    status: 'a_fazer',
    priority: 'medium',
    assigned_to: null,
    created_by: '00000000-0000-0000-0000-000000000001', // Dummy UUID
    due_date: null,
  };

  const { data: inserted, error: insertError } = await supabase
    .from('tasks')
    .insert([testTask])
    .select()
    .single();

  if (insertError) {
    if (insertError.message.includes('NOT NULL')) {
      console.error('❌ Column constraints are still NOT NULL');
      console.error('   Error:', insertError.message);
      console.error('\n📝 Need to run migration: 20260302_fix_tasks_constraints.sql');
      console.error('\nSteps to fix:');
      console.error('1. Go to Supabase Dashboard → SQL Editor');
      console.error('2. Paste the SQL from: supabase/migrations/20260302_fix_tasks_constraints.sql');
      console.error('3. Run the query');
      process.exit(1);
    } else {
      console.error('❌ Insert error:', insertError.message);
      process.exit(1);
    }
  }

  // Clean up test record
  if (inserted) {
    await supabase.from('tasks').delete().eq('id', inserted.id);
    console.log('✅ Test insert successful - NULL values are allowed');
    console.log('✅ Test record cleaned up');
  }

  console.log('\n✅ All checks passed! Tasks table is ready for production');

} catch (err) {
  console.error('❌ Unexpected error:', err.message);
  process.exit(1);
}
