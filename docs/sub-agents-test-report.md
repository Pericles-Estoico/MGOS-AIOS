
╔════════════════════════════════════════════════════════════════════╗
║          SUB-AGENTS API ENDPOINTS TEST SPECIFICATION              ║
╚════════════════════════════════════════════════════════════════════╝

📌 Base URL: http://localhost:3000/api/marketplace/sub-agents

─────────────────────────────────────────────────────────────────────

ENDPOINT 1: Initialize Decomposition
─────────────────────────────────────────────────────────────────────
POST /execute
Authorization: Required (Admin role)
Body: {
  "task_id": "uuid-of-approved-task"
}

Expected Response (200):
{
  "success": true,
  "message": "Tarefa decomposta em 3 subtarefas",
  "task_id": "...",
  "subtask_ids": ["id1", "id2", "id3"],
  "first_job_id": "subagent-..."
}

Test Command:
curl -X POST http://localhost:3000/api/marketplace/sub-agents/execute \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"task_id":"YOUR_TASK_ID"}'

─────────────────────────────────────────────────────────────────────

ENDPOINT 2: Get Subtasks Status
─────────────────────────────────────────────────────────────────────
GET /[taskId]/status
Authorization: Required

Expected Response (200):
{
  "success": true,
  "task_id": "...",
  "summary": {
    "total": 3,
    "pending": 1,
    "in_progress": 1,
    "awaiting_checkpoint": 1,
    "completed": 0,
    "failed": 0
  },
  "subtasks": [
    {
      "id": "...",
      "type": "analysis",
      "title": "Market Analysis...",
      "status": "awaiting_checkpoint",
      "sub_agent_id": "marketplace-analyzer",
      "order_index": 0,
      "created_at": "2026-03-02T...",
      "updated_at": "2026-03-02T..."
    }
  ],
  "next_checkpoint": {
    "id": "...",
    "type": "analysis",
    "title": "...",
    "checkpoint_data": { ... }
  }
}

Test Command:
curl http://localhost:3000/api/marketplace/sub-agents/YOUR_TASK_ID/status \
  -H "Authorization: Bearer YOUR_TOKEN"

─────────────────────────────────────────────────────────────────────

ENDPOINT 3: Approve Checkpoint
─────────────────────────────────────────────────────────────────────
POST /[subtaskId]/checkpoint/approve
Authorization: Required
Body: {
  "notes": "Approved - looks good"
}

Expected Response (200):
{
  "success": true,
  "message": "Checkpoint aprovado com sucesso",
  "subtask_id": "...",
  "approved_by": "user-id",
  "approved_at": "2026-03-02T...",
  "next_subtask_id": "id-of-next-subtask",
  "next_job_id": "job-id-for-next-execution"
}

Test Command:
curl -X POST http://localhost:3000/api/marketplace/sub-agents/SUBTASK_ID/checkpoint/approve \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Approved"}'

─────────────────────────────────────────────────────────────────────

ENDPOINT 4: Reject Checkpoint
─────────────────────────────────────────────────────────────────────
POST /[subtaskId]/checkpoint/reject
Authorization: Required
Body: {
  "reason": "Content needs revision"
}

Expected Response (200):
{
  "success": true,
  "message": "Checkpoint rejeitado - subtarefa será re-executada",
  "subtask_id": "...",
  "rejected_by": "user-id",
  "rejected_at": "2026-03-02T...",
  "rejection_reason": "Content needs revision",
  "requeue_job_id": "new-job-id"
}

Test Command:
curl -X POST http://localhost:3000/api/marketplace/sub-agents/SUBTASK_ID/checkpoint/reject \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Content needs revision"}'

─────────────────────────────────────────────────────────────────────

ENDPOINT 5: Get Consolidated Results
─────────────────────────────────────────────────────────────────────
GET /[taskId]/results
Authorization: Required

Expected Response (200):
{
  "success": true,
  "task_id": "...",
  "overall_status": "completed",
  "results": {
    "parent_task_id": "...",
    "completed_at": "2026-03-02T...",
    "subtasks": [
      {
        "id": "...",
        "type": "analysis",
        "status": "completed",
        "result_data": { ... },
        "checkpoint_data": { ... }
      }
    ],
    "consolidated_by_type": {
      "analysis": [ { ... } ],
      "content_generation": [ { ... } ],
      "delegation": [ { ... } ]
    }
  }
}

Test Command:
curl http://localhost:3000/api/marketplace/sub-agents/YOUR_TASK_ID/results \
  -H "Authorization: Bearer YOUR_TOKEN"

═════════════════════════════════════════════════════════════════════

🎯 TESTING WORKFLOW

1️⃣  Start the server:
    npm run dev

2️⃣  Go to marketplace and approve a task:
    http://localhost:3000/marketplace/tasks

3️⃣  After approval, check sub-agents:
    http://localhost:3000/marketplace/tasks/[taskId]/sub-agents

4️⃣  Monitor the dashboard:
    - See all subtasks being created
    - Watch status changes in real-time
    - Review checkpoint data
    - Click Approve/Reject buttons

5️⃣  Test API manually:
    Use the curl commands above with your task/subtask IDs

═════════════════════════════════════════════════════════════════════

📊 DATABASE SCHEMA

Table: marketplace_subtasks
├── id (UUID, PK)
├── parent_task_id (UUID, FK to tasks)
├── sub_agent_id (TEXT) - 'marketplace-analyzer', 'content-generator', 'task-delegator'
├── type (TEXT) - 'analysis', 'content_generation', 'delegation'
├── title (TEXT)
├── description (TEXT)
├── status (TEXT) - 'pending', 'in_progress', 'awaiting_checkpoint', 'completed', 'failed'
├── checkpoint_data (JSONB) - Data for human review
├── result_data (JSONB) - Final results
├── checkpoint_approved_by (TEXT)
├── checkpoint_approved_at (TIMESTAMPTZ)
├── order_index (INTEGER) - Execution order
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

Indexes:
✓ idx_marketplace_subtasks_parent_task_id
✓ idx_marketplace_subtasks_status
✓ idx_marketplace_subtasks_awaiting_checkpoint
✓ idx_marketplace_subtasks_order
✓ idx_marketplace_subtasks_in_progress

═════════════════════════════════════════════════════════════════════

🚨 TROUBLESHOOTING

Issue: 401 Unauthorized
→ Make sure you have a valid session/auth token

Issue: 403 Forbidden
→ Ensure you have admin role (required for sub-agent endpoints)

Issue: marketplace_subtasks table not found
→ Apply the migration via Supabase dashboard:
  supabase db execute 'supabase/migrations/20260302_create_marketplace_subtasks.sql'

Issue: No subtasks created
→ Make sure you approve a marketplace task first via the approval endpoint

═════════════════════════════════════════════════════════════════════
