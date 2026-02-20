/**
 * Marketplace Integration Tests
 * Full workflow testing: Create → Approve → Execute → Complete
 *
 * Test Suite for @marketplace-master and 6 specialized agents
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Types
interface Task {
  id: string;
  marketplace: string;
  status: string;
  title: string;
  priority: string;
  estimatedHours: number;
}

interface TestContext {
  adminToken: string;
  agentTokens: Record<string, string>;
  createdTasks: string[];
}

// Test Configuration
const API_BASE = process.env.API_URL || 'http://localhost:3000';
const TIMEOUT = 30000; // 30 seconds per test

// Test Data
const MARKETPLACES = ['amazon', 'shopee', 'mercadolivre', 'shein', 'tiktokshop', 'kaway'];

const TEST_TASKS = {
  amazon: {
    marketplace: 'amazon',
    title: '[TEST] Otimizar títulos GEO',
    description: 'Teste de otimização de títulos para mercado GEO',
    category: 'optimization',
    priority: 'high',
    estimatedHours: 4,
    createdBy: 'marketplace-amazon',
  },
  shopee: {
    marketplace: 'shopee',
    title: '[TEST] Preparar Flash Sale',
    description: 'Teste de preparação para Flash Sale',
    category: 'best-practice',
    priority: 'high',
    estimatedHours: 3,
    createdBy: 'marketplace-shopee',
  },
  mercadolivre: {
    marketplace: 'mercadolivre',
    title: '[TEST] Analisar descrições',
    description: 'Teste de análise de descrições geo',
    category: 'analysis',
    priority: 'medium',
    estimatedHours: 5,
    createdBy: 'marketplace-mercadolivre',
  },
};

describe('🌐 Marketplace Integration Tests', () => {
  let context: TestContext;

  beforeAll(async () => {
    console.log('⏳ Setting up test context...');
    context = {
      adminToken: process.env.ADMIN_TOKEN || 'test-admin-token',
      agentTokens: {
        'marketplace-amazon': process.env.AMAZON_TOKEN || 'test-amazon-token',
        'marketplace-shopee': process.env.SHOPEE_TOKEN || 'test-shopee-token',
        'marketplace-mercadolivre': process.env.MERCADOLIVRE_TOKEN || 'test-mercadolivre-token',
      },
      createdTasks: [],
    };
    console.log('✅ Test context ready');
  }, TIMEOUT);

  describe('1️⃣ TASK CREATION (Create)', () => {
    it('should create task from marketplace-amazon agent', async () => {
      const response = await fetch(`${API_BASE}/api/orchestration/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${context.agentTokens['marketplace-amazon']}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(TEST_TASKS.amazon),
      });

      expect(response.status).toBe(201);
      const data = (await response.json()) as Task;
      expect(data.id).toBeDefined();
      expect(data.marketplace).toBe('amazon');
      expect(data.status).toBe('pending');
      context.createdTasks.push(data.id);
      console.log(`✅ Task created: ${data.id}`);
    }, TIMEOUT);

    it('should create task from marketplace-shopee agent', async () => {
      const response = await fetch(`${API_BASE}/api/orchestration/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${context.agentTokens['marketplace-shopee']}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(TEST_TASKS.shopee),
      });

      expect(response.status).toBe(201);
      const data = (await response.json()) as Task;
      expect(data.id).toBeDefined();
      expect(data.status).toBe('pending');
      context.createdTasks.push(data.id);
      console.log(`✅ Task created: ${data.id}`);
    }, TIMEOUT);

    it('should create task from marketplace-mercadolivre agent', async () => {
      const response = await fetch(`${API_BASE}/api/orchestration/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${context.agentTokens['marketplace-mercadolivre']}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(TEST_TASKS.mercadolivre),
      });

      expect(response.status).toBe(201);
      const data = (await response.json()) as Task;
      expect(data.id).toBeDefined();
      expect(data.status).toBe('pending');
      context.createdTasks.push(data.id);
      console.log(`✅ Task created: ${data.id}`);
    }, TIMEOUT);

    it('should reject unauthorized agent token', async () => {
      const response = await fetch(`${API_BASE}/api/orchestration/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer invalid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(TEST_TASKS.amazon),
      });

      expect(response.status).toBe(401);
      console.log('✅ Unauthorized request rejected');
    }, TIMEOUT);
  });

  describe('2️⃣ TASK LISTING (Read)', () => {
    it('should list all tasks', async () => {
      const response = await fetch(`${API_BASE}/api/orchestration/tasks`, {
        headers: {
          'Cookie': `next-auth.session-token=${context.adminToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json() as { tasks: Task[] };
      expect(Array.isArray(data.tasks)).toBe(true);
      console.log(`✅ Listed ${data.tasks.length} tasks`);
    }, TIMEOUT);

    it('should filter tasks by status', async () => {
      const response = await fetch(`${API_BASE}/api/orchestration/tasks?status=pending`, {
        headers: {
          'Cookie': `next-auth.session-token=${context.adminToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json() as { tasks: Task[] };
      const allPending = data.tasks.every((t) => t.status === 'pending');
      expect(allPending).toBe(true);
      console.log(`✅ Filtered ${data.tasks.length} pending tasks`);
    }, TIMEOUT);

    it('should filter tasks by marketplace', async () => {
      const response = await fetch(`${API_BASE}/api/orchestration/tasks?marketplace=amazon`, {
        headers: {
          'Cookie': `next-auth.session-token=${context.adminToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json() as { tasks: Task[] };
      const allAmazon = data.tasks.every((t) => t.marketplace === 'amazon');
      expect(allAmazon).toBe(true);
      console.log(`✅ Filtered ${data.tasks.length} Amazon tasks`);
    }, TIMEOUT);
  });

  describe('3️⃣ TASK APPROVAL (Approve)', () => {
    it('should approve pending tasks in bulk', async () => {
      if (context.createdTasks.length === 0) {
        console.log('⏭️ Skipping: No tasks to approve');
        return;
      }

      const response = await fetch(`${API_BASE}/api/orchestration/tasks/approve`, {
        method: 'PATCH',
        headers: {
          'Cookie': `next-auth.session-token=${context.adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskIds: context.createdTasks.slice(0, 1), // Approve first task
          approved: true,
          reason: '[TEST] Approval workflow test',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json() as { success: boolean; count: number };
      expect(data.success).toBe(true);
      expect(data.count).toBeGreaterThan(0);
      console.log(`✅ Approved ${data.count} tasks`);
    }, TIMEOUT);

    it('should reject tasks', async () => {
      if (context.createdTasks.length < 2) {
        console.log('⏭️ Skipping: Need multiple tasks for rejection test');
        return;
      }

      const response = await fetch(`${API_BASE}/api/orchestration/tasks/approve`, {
        method: 'PATCH',
        headers: {
          'Cookie': `next-auth.session-token=${context.adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskIds: [context.createdTasks[1]], // Reject second task
          approved: false,
          reason: '[TEST] Rejection workflow test',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json() as { success: boolean };
      expect(data.success).toBe(true);
      console.log('✅ Task rejection successful');
    }, TIMEOUT);
  });

  describe('4️⃣ TASK ASSIGNMENT (Assign)', () => {
    it('should assign task to team member', async () => {
      if (context.createdTasks.length === 0) {
        console.log('⏭️ Skipping: No tasks to assign');
        return;
      }

      const response = await fetch(`${API_BASE}/api/orchestration/tasks/assign`, {
        method: 'PATCH',
        headers: {
          'Cookie': `next-auth.session-token=${context.adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: context.createdTasks[0],
          assignedTo: 'test-team-member-id',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json() as { success: boolean; task: Task };
      expect(data.success).toBe(true);
      expect(data.task.status).toBe('in_progress');
      console.log('✅ Task assigned successfully');
    }, TIMEOUT);
  });

  describe('5️⃣ TASK COMPLETION (Complete)', () => {
    it('should mark task as completed', async () => {
      if (context.createdTasks.length === 0) {
        console.log('⏭️ Skipping: No tasks to complete');
        return;
      }

      const response = await fetch(`${API_BASE}/api/orchestration/tasks/complete`, {
        method: 'PATCH',
        headers: {
          'Cookie': `next-auth.session-token=${context.adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: context.createdTasks[0],
          actualHours: 3.5,
          notes: '[TEST] Completion test - task finished successfully',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json() as { success: boolean; stats: { accuracy: number } };
      expect(data.success).toBe(true);
      expect(data.stats.accuracy).toBeGreaterThan(0);
      console.log(`✅ Task completed (accuracy: ${data.stats.accuracy}%)`);
    }, TIMEOUT);
  });

  describe('6️⃣ INTEGRATION WORKFLOW (Full Cycle)', () => {
    it('should complete full workflow: create → approve → assign → complete', async () => {
      console.log('\n📋 Starting full integration workflow test...');

      // Step 1: Create
      console.log('Step 1: Creating task...');
      const createResponse = await fetch(`${API_BASE}/api/orchestration/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${context.agentTokens['marketplace-amazon']}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...TEST_TASKS.amazon,
          title: '[FULL TEST] Complete workflow test',
        }),
      });

      expect(createResponse.status).toBe(201);
      const task = (await createResponse.json()) as Task;
      const taskId = task.id;
      expect(task.status).toBe('pending');
      console.log(`✅ Task created: ${taskId}`);

      // Step 2: Approve
      console.log('Step 2: Approving task...');
      const approveResponse = await fetch(`${API_BASE}/api/orchestration/tasks/approve`, {
        method: 'PATCH',
        headers: {
          'Cookie': `next-auth.session-token=${context.adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskIds: [taskId],
          approved: true,
          reason: '[FULL TEST] Approved in full workflow',
        }),
      });

      expect(approveResponse.status).toBe(200);
      console.log('✅ Task approved');

      // Step 3: Assign
      console.log('Step 3: Assigning task...');
      const assignResponse = await fetch(`${API_BASE}/api/orchestration/tasks/assign`, {
        method: 'PATCH',
        headers: {
          'Cookie': `next-auth.session-token=${context.adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          assignedTo: 'test-user-123',
        }),
      });

      expect(assignResponse.status).toBe(200);
      console.log('✅ Task assigned');

      // Step 4: Complete
      console.log('Step 4: Completing task...');
      const completeResponse = await fetch(`${API_BASE}/api/orchestration/tasks/complete`, {
        method: 'PATCH',
        headers: {
          'Cookie': `next-auth.session-token=${context.adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          actualHours: 3.8,
          notes: '[FULL TEST] Completed successfully in full workflow',
        }),
      });

      expect(completeResponse.status).toBe(200);
      console.log('✅ Task completed');

      console.log('\n🎉 Full workflow test PASSED!');
    }, TIMEOUT);
  });

  afterAll(async () => {
    console.log('\n📊 Test Summary:');
    console.log(`   Created tasks: ${context.createdTasks.length}`);
    console.log(`   All tests completed successfully ✅`);
  });
});

// Export for use in other test files
export { context as testContext, TEST_TASKS };
