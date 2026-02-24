/**
 * NEXO Orchestration - Browser Console Test Script
 *
 * Como usar:
 * 1. Login em https://www.sellerops.com.br
 * 2. Abra o DevTools (F12 ou Ctrl+Shift+I)
 * 3. Vá para a aba "Console"
 * 4. Cole este script inteiro e aperte Enter
 * 5. Observe os testes rodando
 */

async function testNexoOrchestration() {
  const BASE_URL = window.location.origin;
  const tests = [];
  let passed = 0;
  let failed = 0;

  console.log('%c🚀 NEXO ORCHESTRATION - BROWSER CONSOLE TEST', 'font-size: 16px; font-weight: bold; color: #00aa00;');
  console.log(`API Base: ${BASE_URL}\n`);

  // Test 1: Get Status
  try {
    console.log('%c▶ Test 1: GET /api/marketplace/orchestration/status', 'color: #0099ff;');
    const response = await fetch(`${BASE_URL}/api/marketplace/orchestration/status`);
    const data = await response.json();

    if (response.ok) {
      console.log('%c✅ Status endpoint working!', 'color: #00aa00;');
      console.log(`   Active Agents: ${data.summary?.activeAgents || 0}`);
      console.log(`   Total Tasks Generated: ${data.summary?.totalTasksGenerated || 0}`);
      console.log(`   Success Rate: ${data.summary?.overallSuccessRate || 0}%\n`);
      passed++;
    } else {
      console.log('%c❌ Status endpoint failed:', 'color: #ff0000;', response.status, data.error);
      failed++;
    }
  } catch (error) {
    console.log('%c❌ Error:', 'color: #ff0000;', error.message);
    failed++;
  }

  // Test 2: Get Metrics
  try {
    console.log('%c▶ Test 2: GET /api/marketplace/orchestration/metrics', 'color: #0099ff;');
    const response = await fetch(`${BASE_URL}/api/marketplace/orchestration/metrics`);
    const data = await response.json();

    if (response.ok) {
      console.log('%c✅ Metrics endpoint working!', 'color: #00aa00;');
      console.log(`   System Health: ${data.system?.systemHealth || 'N/A'}`);
      console.log(`   Total Agents: ${data.agents?.length || 0}`);

      if (data.agents && data.agents.length > 0) {
        console.log('   Agent Performance Scores:');
        data.agents.forEach(agent => {
          console.log(`     - ${agent.agentName}: ${agent.performanceScore}/100`);
        });
      }
      console.log('');
      passed++;
    } else {
      console.log('%c❌ Metrics endpoint failed:', 'color: #ff0000;', response.status, data.error);
      failed++;
    }
  } catch (error) {
    console.log('%c❌ Error:', 'color: #ff0000;', error.message);
    failed++;
  }

  // Test 3: Get Agent Metrics (Alex)
  try {
    console.log('%c▶ Test 3: GET /api/marketplace/orchestration/metrics?agent=alex', 'color: #0099ff;');
    const response = await fetch(`${BASE_URL}/api/marketplace/orchestration/metrics?agent=alex`);
    const data = await response.json();

    if (response.ok && data.metrics) {
      console.log('%c✅ Agent metrics endpoint working!', 'color: #00aa00;');
      const m = data.metrics;
      console.log(`   Agent: ${m.agentName}`);
      console.log(`   Tasks Generated: ${m.tasksGenerated}`);
      console.log(`   Approval Rate: ${m.approvalRate.toFixed(1)}%`);
      console.log(`   Completion Rate: ${m.completionRate.toFixed(1)}%`);
      console.log(`   Performance Score: ${m.performanceScore}/100\n`);
      passed++;
    } else {
      console.log('%c❌ Agent metrics endpoint failed:', 'color: #ff0000;', response.status);
      failed++;
    }
  } catch (error) {
    console.log('%c❌ Error:', 'color: #ff0000;', error.message);
    failed++;
  }

  // Test 4: Get Channel Metrics (Amazon)
  try {
    console.log('%c▶ Test 4: GET /api/marketplace/orchestration/metrics?channel=amazon', 'color: #0099ff;');
    const response = await fetch(`${BASE_URL}/api/marketplace/orchestration/metrics?channel=amazon`);
    const data = await response.json();

    if (response.ok && data.metrics) {
      console.log('%c✅ Channel metrics endpoint working!', 'color: #00aa00;');
      const m = data.metrics;
      console.log(`   Channel: ${m.channel}`);
      console.log(`   Total Tasks: ${m.totalTasks}`);
      console.log(`   Completion Rate: ${m.completionRate.toFixed(1)}%`);
      console.log(`   Active Agents: ${m.activeAgents}`);
      if (m.recommendations && m.recommendations.length > 0) {
        console.log('   Recommendations:');
        m.recommendations.forEach(rec => console.log(`     - ${rec}`));
      }
      console.log('');
      passed++;
    } else {
      console.log('%c❌ Channel metrics endpoint failed:', 'color: #ff0000;', response.status);
      failed++;
    }
  } catch (error) {
    console.log('%c❌ Error:', 'color: #ff0000;', error.message);
    failed++;
  }

  // Test 5: Activate Orchestration (will likely fail without admin role, but test the endpoint)
  try {
    console.log('%c▶ Test 5: POST /api/marketplace/orchestration/activate', 'color: #0099ff;');
    const response = await fetch(`${BASE_URL}/api/marketplace/orchestration/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channels: ['amazon', 'mercadolivre']
      })
    });
    const data = await response.json();

    if (response.status === 403) {
      console.log('%c⚠️ Activation requires admin/head role', 'color: #ffaa00;');
      console.log(`   Your role doesn't have permission\n`);
      passed++;
    } else if (response.ok) {
      console.log('%c✅ Orchestration activated!', 'color: #00aa00;');
      console.log(`   Plan ID: ${data.plan?.planId}`);
      console.log(`   Tasks Generated: ${data.plan?.totalTasksGenerated}\n`);
      passed++;
    } else {
      console.log('%c❌ Activation failed:', 'color: #ff0000;', response.status, data.error);
      failed++;
    }
  } catch (error) {
    console.log('%c❌ Error:', 'color: #ff0000;', error.message);
    failed++;
  }

  // Summary
  console.log('%c═══════════════════════════════════════════', 'color: #0099ff;');
  console.log('%c📊 TEST SUMMARY', 'font-size: 14px; font-weight: bold; color: #0099ff;');
  console.log('%c═══════════════════════════════════════════', 'color: #0099ff;');
  console.log(`%cPassed: ${passed}`, 'color: #00aa00; font-weight: bold;');
  console.log(`%cFailed: ${failed}`, failed > 0 ? 'color: #ff0000; font-weight: bold;' : 'color: #00aa00; font-weight: bold;');
  console.log(`%cSuccess Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`, 'color: #0099ff; font-weight: bold;');
  console.log('%c═══════════════════════════════════════════\n', 'color: #0099ff;');

  if (failed === 0) {
    console.log('%c✅ ALL TESTS PASSED! NEXO Orchestration is working correctly!', 'font-size: 14px; font-weight: bold; color: #00aa00; background: #001100; padding: 10px;');
  }
}

// Run tests
testNexoOrchestration();
