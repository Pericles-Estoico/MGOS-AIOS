/**
 * One-time recovery script for stuck marketplace analyses
 * Approves all pending analyses and creates Phase 1 tasks
 * Run from project root: node /tmp/recover-analyses.js
 */

require('dotenv').config({ path: '/home/finaa/repos/MGOS-AIOS/.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createPhase1TasksForPlan(planId, planData) {
  try {
    // Get first channel from plan
    const channel = planData.channels?.[0] || 'amazon';

    // Find Phase 1 in plan data or auto-generate
    let phase1 = planData.phases?.find(p => p.number === 1);

    if (!phase1) {
      // Auto-generate from opportunities
      const highPriorityOpps = (planData.opportunities || [])
        .filter(opp => opp.priority === 'alta')
        .slice(0, 5);

      if (highPriorityOpps.length === 0) {
        throw new Error('No Phase 1 and no high-priority opportunities');
      }

      phase1 = {
        number: 1,
        name: 'Fase 1 - Otimizações Rápidas',
        weeks: 'Semanas 1-4',
        tasks: highPriorityOpps.map(opp => `${opp.title}: ${opp.what}`),
        investment: 'Equipe interna',
        expectedImpact: '15-20% de melhoria',
      };
    }

    if (!phase1.tasks || phase1.tasks.length === 0) {
      throw new Error('Phase 1 has no tasks');
    }

    const dueDateString = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const tasksToInsert = phase1.tasks.map((taskTitle, idx) => ({
      title: taskTitle,
      description: `Tarefa da Fase 1 do plano de análise`,
      channel,
      priority: idx === 0 ? 'high' : 'medium',
      status: 'pending',
      source_type: 'analysis_approved',
      admin_approved: false,
      estimated_hours: 8,
      due_date: dueDateString,
      created_at: new Date().toISOString(),
    }));

    const { data: insertedTasks, error: insertError } = await supabase
      .from('tasks')
      .insert(tasksToInsert)
      .select('id');

    if (insertError) throw insertError;

    const taskIds = insertedTasks?.map(t => t.id) || [];

    // Update plan with task tracking
    await supabase
      .from('marketplace_plans')
      .update({
        phase1_tasks_created: true,
        phase1_created_at: new Date().toISOString(),
        phase1_task_ids: taskIds,
      })
      .eq('id', planId);

    return taskIds;
  } catch (error) {
    console.error(`❌ Error creating Phase 1 tasks: ${error.message}`);
    throw error;
  }
}

async function recoverAnalyses() {
  console.log('🔍 Finding stuck analyses...\n');

  // Find all pending analyses
  const { data: pendingPlans, error: fetchError } = await supabase
    .from('marketplace_plans')
    .select('*')
    .eq('status', 'pending')
    .eq('phase1_tasks_created', false)
    .order('created_at', { ascending: true });

  if (fetchError) {
    console.error('❌ Error fetching pending plans:', fetchError);
    return;
  }

  if (!pendingPlans || pendingPlans.length === 0) {
    console.log('✅ No stuck analyses found\n');
    return;
  }

  console.log(`📊 Found ${pendingPlans.length} stuck analyses\n`);

  const results = [];

  for (const plan of pendingPlans) {
    const timeStuck = Math.round(
      (Date.now() - new Date(plan.created_at).getTime()) / 1000 / 60
    );

    console.log(`⏳ Recovering: ${plan.title} (stuck ${timeStuck}m)`);

    try {
      // Create Phase 1 tasks
      const taskIds = await createPhase1TasksForPlan(plan.id, plan.plan_data);

      // Approve the plan
      const { error: approveError } = await supabase
        .from('marketplace_plans')
        .update({
          status: 'approved',
          approved_by: 'recovery-script',
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', plan.id);

      if (approveError) throw approveError;

      console.log(`✅ Recovered: ${taskIds.length} tasks created\n`);

      results.push({
        planId: plan.id,
        title: plan.title,
        success: true,
        taskIds,
        timeStuck,
      });
    } catch (error) {
      console.error(`❌ Recovery failed: ${error.message}\n`);

      results.push({
        planId: plan.id,
        title: plan.title,
        success: false,
        error: error.message,
        timeStuck,
      });
    }
  }

  // Summary
  const successCount = results.filter(r => r.success).length;
  const totalTasks = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.taskIds.length, 0);

  console.log('─────────────────────────────────────────────');
  console.log(`📊 RECOVERY SUMMARY`);
  console.log('─────────────────────────────────────────────');
  console.log(`✅ Recovered: ${successCount}/${results.length}`);
  console.log(`📝 Tasks Created: ${totalTasks}`);
  console.log('─────────────────────────────────────────────\n');

  results.forEach(r => {
    if (r.success) {
      console.log(`  ✅ ${r.title}`);
      console.log(`     → ${r.taskIds.length} tarefas | ${r.timeStuck}m travada`);
    } else {
      console.log(`  ❌ ${r.title}`);
      console.log(`     → ${r.error}`);
    }
  });

  console.log('\n✅ Recovery complete!');
}

recoverAnalyses().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
