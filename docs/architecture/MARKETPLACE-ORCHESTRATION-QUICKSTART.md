# 🚀 Marketplace Orchestration — Quick Start Guide

**For Developers & Integrators**
**Updated:** February 2026

---

## Table of Contents
1. [System Overview (30 seconds)](#overview)
2. [Getting Started](#getting-started)
3. [Common Tasks](#common-tasks)
4. [Integration Examples](#integration-examples)
5. [Troubleshooting](#troubleshooting)

---

## Overview

The **Marketplace Orchestration System** manages task workflows from 6 AI-driven marketplace agents (Amazon, Shopee, etc.).

**Simple Flow:**
```
Agent Creates Task → Stored in DB → Admin Approves → Team Member Executes → Task Complete
```

**Key Files:**
- `lib/marketplace-orchestration/` — Core library (types, orchestrator, task manager)
- `app/api/orchestration/` — REST API endpoints

---

## Getting Started

### 1. Import the Orchestrator

```typescript
import { getOrchestrator } from '@/lib/marketplace-orchestration/orchestrator';
import { TaskManager } from '@/lib/marketplace-orchestration/task-manager';

// Get orchestrator instance
const orchestrator = getOrchestrator();
const taskManager = new TaskManager();
```

### 2. Create a Task (from Marketplace Agent)

```typescript
// In marketplace-amazon agent code
import { TaskManager } from '@/lib/marketplace-orchestration/task-manager';

const taskManager = new TaskManager();

const task = await taskManager.createTask({
  marketplace: 'amazon',
  title: 'Optimize A+ content for mobile',
  description: 'Review mobile viewability and improve engagement metrics',
  category: 'optimization',
  priority: 'high',
  estimatedHours: 4,
  createdBy: 'marketplace-amazon',
  tags: ['a-plus-content', 'mobile'],
  metadata: {
    asin: 'B0123456789',
    currentRating: 4.2,
    targetRating: 4.5
  }
});

console.log(`Task created: ${task.id}`);
```

### 3. Use the API Directly (via HTTP)

#### Create Task (Agent)
```bash
curl -X POST http://localhost:3000/api/orchestration/tasks \
  -H "Authorization: Bearer marketplace-amazon-secret123" \
  -H "Content-Type: application/json" \
  -d '{
    "marketplace": "amazon",
    "title": "Optimize A+ content",
    "description": "...",
    "category": "optimization",
    "priority": "high",
    "estimatedHours": 4,
    "createdBy": "marketplace-amazon"
  }'
```

#### List Tasks (Authenticated User)
```bash
curl http://localhost:3000/api/orchestration/tasks \
  -H "Cookie: next-auth.session-token=..." \
  -H "Content-Type: application/json"

# Filter by status
curl "http://localhost:3000/api/orchestration/tasks?status=awaiting_approval&limit=50"

# Filter by marketplace
curl "http://localhost:3000/api/orchestration/tasks?marketplace=amazon&status=in_progress"
```

#### Approve Tasks (Admin)
```bash
curl -X PATCH http://localhost:3000/api/orchestration/tasks/approve \
  -H "Cookie: next-auth.session-token=..." \
  -H "Content-Type: application/json" \
  -d '{
    "taskIds": ["uuid-1", "uuid-2", "uuid-3"],
    "approved": true,
    "reason": "Reviewed and approved for Q1 roadmap"
  }'
```

#### Assign Task (Admin)
```bash
curl -X PATCH http://localhost:3000/api/orchestration/tasks/assign \
  -H "Cookie: next-auth.session-token=..." \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "uuid-here",
    "assignedTo": "team-member-user-id"
  }'
```

#### Complete Task (Team Member)
```bash
curl -X PATCH http://localhost:3000/api/orchestration/tasks/complete \
  -H "Cookie: next-auth.session-token=..." \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "uuid-here",
    "actualHours": 3.5,
    "notes": "Completed optimization. 12% engagement increase."
  }'
```

---

## Common Tasks

### List Pending Approval Tasks
```typescript
const taskManager = new TaskManager();
const { tasks, total } = await taskManager.getPendingApproval(limit = 50);

console.log(`${total} tasks awaiting approval:`);
tasks.forEach(task => {
  console.log(`- [${task.marketplace}] ${task.title} (${task.priority})`);
});
```

### Get Tasks by Marketplace
```typescript
const tasks = await taskManager.getTasksByMarketplace('amazon', 'in_progress');

tasks.forEach(task => {
  console.log(`${task.title} - Assigned to: ${task.assignedTo}`);
});
```

### Get Daily Statistics
```typescript
const stats = await taskManager.getDailyStats();

stats.forEach(stat => {
  console.log(`
    ${stat.marketplace}:
    - Created: ${stat.created}
    - Approved: ${stat.approved}
    - In Progress: ${stat.inProgress}
    - Completed: ${stat.completed}
    - Avg Time: ${stat.avgCompletionTime.toFixed(1)}h
  `);
});
```

### Get Orchestrator Status
```typescript
const orchestrator = getOrchestrator();
const status = await orchestrator.getStatus();

console.log(`System Status:`);
console.log(`Agents: ${status.agents.join(', ')}`);
console.log(`Stats:`, status.stats);
```

### Batch Approve Tasks
```typescript
const orchestrator = getOrchestrator();
const { tasks, grouped, total } = await orchestrator.batchTasksForApproval(limit = 50);

console.log(`Total tasks awaiting approval: ${total}`);
Object.entries(grouped).forEach(([marketplace, tasks]) => {
  console.log(`${marketplace}: ${tasks.length} tasks`);
});
```

---

## Integration Examples

### Example 1: Dashboard Component

```typescript
// app/components/TaskApprovalDashboard.tsx
import { useEffect, useState } from 'react';
import type { MarketplaceTask } from '@/lib/marketplace-orchestration/types';

export function TaskApprovalDashboard() {
  const [tasks, setTasks] = useState<MarketplaceTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      const response = await fetch('/api/orchestration/tasks?status=awaiting_approval');
      const data = await response.json();
      setTasks(data.tasks);
      setLoading(false);
    };

    fetchTasks();
    const interval = setInterval(fetchTasks, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (taskIds: string[]) => {
    const response = await fetch('/api/orchestration/tasks/approve', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskIds,
        approved: true,
        reason: 'Approved via dashboard'
      })
    });

    if (response.ok) {
      // Refresh tasks
      const newResponse = await fetch('/api/orchestration/tasks?status=awaiting_approval');
      const data = await newResponse.json();
      setTasks(data.tasks);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Tasks Awaiting Approval ({tasks.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Marketplace</th>
            <th>Title</th>
            <th>Category</th>
            <th>Priority</th>
            <th>Estimated Hours</th>
            <th>Created By</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => (
            <tr key={task.id}>
              <td>{task.marketplace}</td>
              <td>{task.title}</td>
              <td>{task.category}</td>
              <td>{task.priority}</td>
              <td>{task.estimatedHours}</td>
              <td>{task.createdBy}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => handleApprove(tasks.map(t => t.id))}>
        Approve All ({tasks.length})
      </button>
    </div>
  );
}
```

### Example 2: Marketplace Agent Task Creation

```typescript
// In marketplace-amazon agent
import { TaskManager } from '@/lib/marketplace-orchestration/task-manager';

export class AmazonAgent {
  private taskManager: TaskManager;

  constructor() {
    this.taskManager = new TaskManager();
  }

  async runDailyAnalysis() {
    // Analyze Amazon products
    const opportunities = await this.analyzeListings();

    // Create tasks for each opportunity
    for (const opportunity of opportunities) {
      const task = await this.taskManager.createTask({
        marketplace: 'amazon',
        title: opportunity.title,
        description: opportunity.description,
        category: opportunity.category, // 'optimization' | 'best-practice' | 'scaling' | 'analysis'
        priority: this.calculatePriority(opportunity),
        estimatedHours: this.estimateEffort(opportunity),
        createdBy: 'marketplace-amazon',
        tags: opportunity.tags,
        metadata: {
          asin: opportunity.asin,
          currentRating: opportunity.rating,
          estimatedImpact: opportunity.estimatedImpact,
          competitors: opportunity.topCompetitors
        }
      });

      console.log(`Created task: ${task.id}`);
    }
  }

  private calculatePriority(opportunity) {
    if (opportunity.estimatedImpact > 15) return 'high';
    if (opportunity.estimatedImpact > 5) return 'medium';
    return 'low';
  }

  private estimateEffort(opportunity) {
    return opportunity.complexity * 2; // hours
  }

  private async analyzeListings() {
    // Your analysis logic here
    return [];
  }
}
```

### Example 3: Task Assignment Flow

```typescript
// app/api/tasks/assign-intelligent/route.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TaskManager } from '@/lib/marketplace-orchestration/task-manager';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (session.user?.role !== 'admin') {
    return new Response('Unauthorized', { status: 403 });
  }

  const { taskId, strategy } = await request.json();

  const taskManager = new TaskManager(session.user?.email);
  const task = await getTask(taskId); // Get from DB

  // Strategy 1: Assign to specialist
  if (strategy === 'specialist') {
    const specialist = await findSpecialist(task.marketplace, task.category);
    await taskManager.assignTask(
      { taskId, assignedTo: specialist.id },
      session.user?.id || 'unknown'
    );
  }

  // Strategy 2: Round-robin assignment
  if (strategy === 'roundrobin') {
    const nextTeamMember = await getNextTeamMember(task.marketplace);
    await taskManager.assignTask(
      { taskId, assignedTo: nextTeamMember.id },
      session.user?.id || 'unknown'
    );
  }

  return new Response('Task assigned', { status: 200 });
}
```

---

## Troubleshooting

### Issue: "Unauthorized - marketplace agent token required"

**Cause:** Missing or invalid `Authorization` header when creating tasks.

**Fix:**
```typescript
// ✅ Correct
const response = await fetch('/api/orchestration/tasks', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer marketplace-amazon-secret123', // ← Include this
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({...})
});

// ❌ Wrong
const response = await fetch('/api/orchestration/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }, // ← Missing auth
  body: JSON.stringify({...})
});
```

### Issue: "Only admins can approve tasks"

**Cause:** Non-admin user trying to approve tasks.

**Fix:**
- Check user role in NextAuth session: `session.user?.role === 'admin'`
- Ensure user has admin role in auth database
- Contact admin to grant approval permissions

### Issue: "taskId and assignedTo are required"

**Cause:** Missing required fields in assign request.

**Fix:**
```typescript
// ✅ Correct
await fetch('/api/orchestration/tasks/assign', {
  method: 'PATCH',
  body: JSON.stringify({
    taskId: 'uuid-here',      // ← Required
    assignedTo: 'user-id-here' // ← Required
  })
});

// ❌ Wrong
await fetch('/api/orchestration/tasks/assign', {
  method: 'PATCH',
  body: JSON.stringify({
    taskId: 'uuid-here'  // ← Missing assignedTo
  })
});
```

### Issue: "Failed to complete task"

**Common Causes:**
1. Task not in `approved` or `in_progress` status
2. `actualHours` is negative or not a number
3. `taskId` doesn't exist

**Debug:**
```typescript
// Check task status first
const { tasks } = await fetch(`/api/orchestration/tasks?id=${taskId}`)
console.log(`Current status: ${tasks[0].status}`); // Must be 'in_progress'

// Ensure valid data
console.log(`actualHours: ${actualHours}, type: ${typeof actualHours}`); // Must be number > 0
```

### Issue: Database Connection Errors

**Cause:** Supabase not configured or service key missing.

**Fix:**
```bash
# Check environment variables
echo $SUPABASE_SERVICE_ROLE_KEY  # Should not be empty
echo $NEXT_PUBLIC_SUPABASE_URL    # Should be valid URL

# If missing, add to .env.local
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

### Issue: High Latency on getDailyStats()

**Cause:** Missing database indexes.

**Fix:**
```sql
-- Run in Supabase SQL editor
CREATE INDEX IF NOT EXISTS idx_marketplace_tasks_marketplace
  ON marketplace_tasks(marketplace);

CREATE INDEX IF NOT EXISTS idx_marketplace_tasks_created_at
  ON marketplace_tasks(createdAt);

-- Verify
EXPLAIN ANALYZE
SELECT marketplace, COUNT(*) FROM marketplace_tasks GROUP BY marketplace;
```

---

## Key Concepts

### Task Status Flow
```
pending → awaiting_approval → approved → in_progress → completed
                    ↓
                 rejected (terminal)
```

### Marketplace Types
- `amazon` — AWS marketplace (A+ content, ads)
- `shopee` — Southeast Asian platform (flash sales, video)
- `mercadolivre` — Latin American platform (descriptions, ads)
- `shein` — Fashion-focused (trend optimization)
- `tiktokshop` — TikTok commerce (live, creators)
- `kaway` — Premium positioning platform

### Task Categories
- `optimization` — Performance improvement
- `best-practice` — Apply proven strategies
- `scaling` — Increase volume/reach
- `analysis` — Research & reporting

### Priority Levels
- `high` — Urgent, high impact
- `medium` — Normal priority
- `low` — Nice-to-have

---

## Testing

### Unit Test Example

```typescript
// __tests__/marketplace-orchestration.test.ts
import { TaskManager } from '@/lib/marketplace-orchestration/task-manager';

describe('TaskManager', () => {
  let taskManager: TaskManager;

  beforeEach(() => {
    taskManager = new TaskManager();
  });

  it('should create a task', async () => {
    const task = await taskManager.createTask({
      marketplace: 'amazon',
      title: 'Test task',
      description: 'Test description',
      category: 'optimization',
      priority: 'high',
      estimatedHours: 2,
      createdBy: 'marketplace-amazon'
    });

    expect(task.id).toBeDefined();
    expect(task.status).toBe('pending');
    expect(task.marketplace).toBe('amazon');
  });

  it('should get pending approval tasks', async () => {
    const { tasks, total } = await taskManager.getPendingApproval(10);

    expect(Array.isArray(tasks)).toBe(true);
    expect(typeof total).toBe('number');
  });
});
```

---

## Performance Tips

1. **Use pagination:** Always use `limit` and `offset` for list endpoints
   ```typescript
   // Good
   GET /api/orchestration/tasks?limit=50&offset=0

   // Bad (fetches 100k+ records)
   GET /api/orchestration/tasks
   ```

2. **Filter early:** Use `status` and `marketplace` to reduce data
   ```typescript
   // Good
   GET /api/orchestration/tasks?status=awaiting_approval&marketplace=amazon

   // Bad (fetches all, filters in code)
   GET /api/orchestration/tasks
   ```

3. **Cache orchestrator status:** Use 5-minute TTL
   ```typescript
   const orchestrator = getOrchestrator();
   const status = await orchestrator.getStatus(); // Cached for 5min
   ```

4. **Batch approvals:** Approve multiple tasks in one request
   ```typescript
   // Good (1 request)
   PATCH /api/orchestration/tasks/approve with 50 taskIds

   // Bad (50 requests)
   for (taskId in taskIds) {
     PATCH /api/orchestration/tasks/[taskId]/approve
   }
   ```

---

## Next Steps

- Read full architecture: [MARKETPLACE-ORCHESTRATION-ARCHITECTURE.md](./MARKETPLACE-ORCHESTRATION-ARCHITECTURE.md)
- Set up dashboard UI with React components
- Configure CI/CD for agent deployment
- Plan Phase 2: WebSocket real-time updates

---

**Need help?** Check the full architecture document or reach out to @architect (Aria).
