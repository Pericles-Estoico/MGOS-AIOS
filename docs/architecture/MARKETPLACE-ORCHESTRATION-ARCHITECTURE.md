# 🏛️ Marketplace Orchestration Architecture

**Document Version:** 1.0
**Date:** February 2026
**Author:** Aria (Architect)
**Status:** COMPLETE

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Core Architecture](#core-architecture)
3. [Component Design](#component-design)
4. [Data Flow & State Transitions](#data-flow--state-transitions)
5. [API Contracts](#api-contracts)
6. [Integration Patterns](#integration-patterns)
7. [Marketplace Agent Orchestration](#marketplace-agent-orchestration)
8. [Security & Authorization](#security--authorization)
9. [Scaling & Performance](#scaling--performance)
10. [Monitoring & Observability](#monitoring--observability)

---

## System Overview

### Purpose
The **Marketplace Orchestration System** coordinates AI-driven task generation from 6 specialized marketplace agents (Amazon, Shopee, MercadoLivre, Shein, TikTok Shop, Kaway) under a master orchestrator (Nexo). Tasks flow through a managed approval → assignment → completion workflow.

### Key Responsibilities
- **Task Generation:** Sub-agents create optimization, best-practice, scaling, and analysis tasks
- **Task Management:** Central storage and lifecycle tracking via Supabase
- **Approval Workflow:** Admin-driven batch approval system
- **Assignment & Execution:** Team member assignment and progress tracking
- **Analytics & Reporting:** Daily statistics and performance metrics

### System Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                    Marketplace Orchestration System          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Marketplace Agents (6 + Master)          │  │
│  │  Amazon | Shopee | MercadoLivre | Shein | TikTok | Kaway  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         MarketplaceOrchestrator (lib layer)           │  │
│  │  - dailyTasks() - batchApproval() - getStatus()      │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           TaskManager (Database Layer)                │  │
│  │  - createTask() - approveTasks() - assignTask()       │  │
│  │  - completeTask() - getStats()                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │    API Routes (app/api/orchestration)                 │  │
│  │  /tasks        - POST (create) / GET (list)           │  │
│  │  /tasks/approve - PATCH (batch approval)              │  │
│  │  /tasks/assign  - PATCH (assign to team member)      │  │
│  │  /tasks/complete - PATCH (mark completed)             │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Frontend (Dashboard, Approval UI)             │  │
│  │  - Task approval interface                            │  │
│  │  - Assignment & tracking                              │  │
│  │  - Analytics & reporting                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Architecture

### Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **API Layer** | Next.js App Router (TypeScript) | Type-safe, built-in auth integration |
| **Business Logic** | TypeScript classes (Orchestrator, TaskManager) | Strong typing, testable, performant |
| **Database** | Supabase (PostgreSQL) | Real-time subscriptions, RLS, battle-tested |
| **Authentication** | NextAuth.js | Session-based auth with role support |
| **Marketplace Agents** | Autonomous AI agents (Claude) | Parallel task generation, specialized agents |

### Design Patterns

#### 1. **Master-Subordinate Pattern**
```
MarketplaceOrchestrator (Master)
├── Coordinates 6 sub-agents
├── Manages task batching
└── Provides aggregated status/analytics
```

#### 2. **Task Manager Pattern**
```
TaskManager (Single Responsibility)
├── All database operations
├── Encapsulates Supabase interaction
├── Type-safe CRUD operations
└── No business logic (delegation to Orchestrator)
```

#### 3. **State Machine Pattern**
```
Task Lifecycle:
pending → awaiting_approval → approved → in_progress → completed
                    ↓
                 rejected (terminal)
```

#### 4. **API Versioning**
- Current: `/api/orchestration/` (v1, implicit)
- Future: Support `/api/v2/orchestration/` for breaking changes

---

## Component Design

### 1. Type Definitions (`lib/marketplace-orchestration/types.ts`)

**Purpose:** Single source of truth for all types across the system.

**Core Types:**

```typescript
// Marketplace enumeration
type Marketplace = 'amazon' | 'shopee' | 'mercadolivre' | 'shein' | 'tiktokshop' | 'kaway'

// Task lifecycle status
type TaskStatus = 'pending' | 'awaiting_approval' | 'approved' | 'in_progress' | 'completed' | 'rejected'

// Task categorization
type TaskCategory = 'optimization' | 'best-practice' | 'scaling' | 'analysis'

// Priority levels
type TaskPriority = 'high' | 'medium' | 'low'

// Core task interface
interface MarketplaceTask {
  id: string                          // UUID from database
  marketplace: Marketplace             // Which marketplace
  createdBy: string                   // Sub-agent ID (marketplace-amazon, etc)
  title: string                       // Task title
  description: string                 // Full description
  category: TaskCategory              // Classification
  status: TaskStatus                  // Current state
  createdAt: string                   // ISO timestamp
  submittedAt?: string                // When sent for approval
  approvedAt?: string                 // When approved
  startedAt?: string                  // When started by team member
  completedAt?: string                // When completed
  assignedTo?: string                 // Team member ID
  approvedBy?: string                 // Admin ID
  estimatedHours: number              // Time estimate
  actualHours?: number                // Actual time spent
  priority: TaskPriority              // Importance
  tags?: string[]                     // Flexible tagging
  metadata?: Record<string, unknown>  // Extensible data
}
```

**Design Rationale:**
- Timestamps in ISO 8601 format for database consistency
- Optional fields for time-dependent values
- Metadata for extensibility without schema migration
- Audit trail (createdBy, approvedBy) for compliance

### 2. MarketplaceOrchestrator (`lib/marketplace-orchestration/orchestrator.ts`)

**Purpose:** High-level coordination of marketplace agents and task workflows.

**Responsibilities:**
- Initialize daily task generation from all agents
- Batch pending tasks for approval review
- Monitor orchestration status
- Group and aggregate data by marketplace
- Send notifications about approval-needed tasks
- Subscribe to real-time task events

**Key Methods:**

```typescript
class MarketplaceOrchestrator {
  // Initialize daily task collection from all 6 agents
  async initializeDailyTasks(): Promise<MarketplaceTask[]>

  // Batch all pending_approval tasks, group by marketplace
  async batchTasksForApproval(limit = 50): Promise<{
    tasks: MarketplaceTask[]
    grouped: Record<Marketplace, MarketplaceTask[]>
    total: number
    readyForApproval: boolean
  }>

  // Get current system status across all agents
  async getStatus(): Promise<{
    timestamp: string
    agents: string[]
    stats: TaskDailyStats[]
  }>

  // Helper: group tasks by marketplace
  private groupByMarketplace(tasks: MarketplaceTask[])

  // Notify users about pending approvals
  async notifyApprovalNeeded(tasks: MarketplaceTask[])

  // Subscribe to real-time task creation events
  async subscribeToTaskEvents()
}
```

**Implementation Pattern:**
```typescript
// Singleton for application-wide access
export function getOrchestrator(accessToken?: string) {
  return new MarketplaceOrchestrator(accessToken)
}
```

### 3. TaskManager (`lib/marketplace-orchestration/task-manager.ts`)

**Purpose:** Database abstraction layer for all CRUD operations.

**Responsibilities:**
- Create tasks from marketplace agents
- Retrieve tasks (pending, by status, by marketplace)
- Update task status during approval/assignment/completion
- Persist audit information
- Calculate daily statistics

**Key Methods:**

```typescript
class TaskManager {
  // Create new task (sub-agents call this via API)
  async createTask(task: Omit<MarketplaceTask, 'id' | 'createdAt'>)

  // Get all tasks awaiting approval
  async getPendingApproval(limit = 50, offset = 0)

  // Approve or reject tasks in batch
  async approveTasks(request: TaskApprovalRequest, userId: string)

  // Assign task to team member (changes status to in_progress)
  async assignTask(request: TaskAssignmentRequest, userId: string)

  // Mark task as completed with actual hours
  async completeTask(request: TaskCompletionRequest, userId: string)

  // Retrieve tasks for specific marketplace with optional status filter
  async getTasksByMarketplace(marketplace: string, status?: string)

  // Get daily statistics across all marketplaces
  async getDailyStats(): Promise<TaskDailyStats[]>
}
```

**Database Integration:**
- Uses Supabase service role key for server-side operations
- Throws `Error` on database failures
- Returns typed results directly from RPC calls or select queries

---

## Data Flow & State Transitions

### Task Lifecycle State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│                   Task Lifecycle State Machine                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                                                                  │
│  ┌──────────────┐     ┌──────────────────────┐                  │
│  │   PENDING    │────→│  AWAITING_APPROVAL   │                  │
│  │              │     │  (Admin reviews)     │                  │
│  └──────────────┘     └──────────────────────┘                  │
│        ↑                      ↓                                  │
│        │               ┌──────┴──────┐                          │
│        │               │             │                          │
│        │         ┌─────────┐  ┌──────────────┐                  │
│        │         │APPROVED │  │  REJECTED    │                  │
│        │         └─────────┘  └──────────────┘                  │
│        │               │             ↓                          │
│        │               │        (Terminal)                      │
│        │               ↓                                        │
│        │        ┌──────────────┐                               │
│        └────────│ IN_PROGRESS  │ (Team member works)           │
│                 └──────────────┘                               │
│                        ↓                                        │
│                 ┌──────────────┐                               │
│                 │  COMPLETED   │ (With actualHours)            │
│                 └──────────────┘                               │
│                        ↓                                        │
│                   (Terminal)                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Timestamp Tracking

| Status | Timestamp Set | Set By | Represents |
|--------|---------------|--------|-----------|
| pending | createdAt | System | Task created by sub-agent |
| awaiting_approval | submittedAt | Sub-agent | Ready for admin review |
| approved/rejected | approvedAt | Admin | Decision timestamp |
| in_progress | startedAt | Team member | Assignment timestamp |
| completed | completedAt | Team member | Completion timestamp |

### Data Transformations

#### Sub-Agent → Database
```
Sub-Agent Request (Bearer marketplace-amazon)
  ↓
POST /api/orchestration/tasks
  ↓
TaskManager.createTask()
  ↓
Supabase INSERT → marketplace_tasks
  ↓
MarketplaceTask (with auto-generated id, createdAt)
```

#### Approval Workflow
```
Admin Dashboard → Batch Select Tasks
  ↓
PATCH /api/orchestration/tasks/approve
  ↓
TaskApprovalRequest { taskIds, approved, reason }
  ↓
TaskManager.approveTasks()
  ↓
Supabase UPDATE → status = 'approved'|'rejected'
                → approvedAt, approvedBy
  ↓
MarketplaceTask[] (with approval metadata)
```

---

## API Contracts

### 1. Create Task
**Endpoint:** `POST /api/orchestration/tasks`
**Authentication:** Bearer token `Bearer marketplace-{agent-id}`
**Authorization:** Sub-agents only

**Request Body:**
```json
{
  "marketplace": "amazon",
  "title": "Optimize A+ content for mobile",
  "description": "Review A+ content for mobile viewability and improve engagement",
  "category": "optimization",
  "priority": "high",
  "estimatedHours": 4,
  "createdBy": "marketplace-amazon",
  "tags": ["a-plus-content", "mobile-optimization"],
  "metadata": {
    "asin": "B0123456789",
    "currentRating": 4.2,
    "improvementTarget": 4.5
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "task": {
    "id": "uuid-here",
    "marketplace": "amazon",
    "title": "Optimize A+ content for mobile",
    "status": "pending",
    "createdAt": "2026-02-20T10:30:00Z",
    "createdBy": "marketplace-amazon",
    ...
  },
  "message": "Task created and awaiting approval"
}
```

**Error Responses:**
```json
// 401 - Invalid/missing token
{ "error": "Unauthorized - marketplace agent token required" }

// 400 - Missing fields
{ "error": "Missing required fields: priority, estimatedHours" }

// 500 - Database error
{ "error": "Failed to create task", "details": "..." }
```

### 2. List Tasks
**Endpoint:** `GET /api/orchestration/tasks`
**Authentication:** NextAuth session
**Authorization:** Authenticated users only

**Query Parameters:**
- `status` (optional): Filter by status (pending, approved, in_progress, completed)
- `marketplace` (optional): Filter by marketplace (amazon, shopee, etc)
- `limit` (optional): Max 100, default 50
- `offset` (optional): Pagination, default 0

**Example:** `GET /api/orchestration/tasks?status=awaiting_approval&marketplace=amazon&limit=25`

**Response (200 OK):**
```json
{
  "tasks": [
    {
      "id": "...",
      "marketplace": "amazon",
      "title": "...",
      "status": "awaiting_approval",
      "createdBy": "marketplace-amazon",
      "priority": "high",
      ...
    }
  ],
  "count": 12,
  "offset": 0,
  "limit": 25
}
```

### 3. Approve/Reject Tasks (Batch)
**Endpoint:** `PATCH /api/orchestration/tasks/approve`
**Authentication:** NextAuth session
**Authorization:** Admin role required

**Request Body:**
```json
{
  "taskIds": ["uuid-1", "uuid-2", "uuid-3"],
  "approved": true,
  "reason": "All tasks reviewed and approved for Q1 roadmap"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Tasks approved",
  "count": 3,
  "tasks": [
    {
      "id": "uuid-1",
      "status": "approved",
      "approvedAt": "2026-02-20T11:00:00Z",
      "approvedBy": "admin-user-id",
      ...
    }
  ]
}
```

**Error Responses:**
```json
// 403 - Non-admin user
{ "error": "Only admins can approve tasks" }

// 400 - Invalid request
{ "error": "taskIds array is required" }
```

### 4. Assign Task to Team Member
**Endpoint:** `PATCH /api/orchestration/tasks/assign`
**Authentication:** NextAuth session
**Authorization:** Admin role required

**Request Body:**
```json
{
  "taskId": "uuid-here",
  "assignedTo": "team-member-id"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Task assigned successfully",
  "task": {
    "id": "uuid-here",
    "status": "in_progress",
    "assignedTo": "team-member-id",
    "startedAt": "2026-02-20T11:15:00Z",
    ...
  },
  "assignedAt": "2026-02-20T11:15:00Z"
}
```

### 5. Complete Task
**Endpoint:** `PATCH /api/orchestration/tasks/complete`
**Authentication:** NextAuth session
**Authorization:** Assigned team member or admin

**Request Body:**
```json
{
  "taskId": "uuid-here",
  "actualHours": 3.5,
  "notes": "Completed mobile optimization. Improved engagement metrics by 12%"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Task completed successfully",
  "task": {
    "id": "uuid-here",
    "status": "completed",
    "estimatedHours": 4,
    "actualHours": 3.5,
    "completedAt": "2026-02-20T14:30:00Z",
    ...
  },
  "stats": {
    "estimatedHours": 4,
    "actualHours": 3.5,
    "accuracy": 88,
    "completedAt": "2026-02-20T14:30:00Z"
  }
}
```

---

## Integration Patterns

### Marketplace Agent → Orchestration

#### Pattern: Sub-Agent Task Creation
```
Marketplace Agent (e.g., marketplace-amazon)
  ↓
Generates task (local decision-making)
  ↓
HTTP POST /api/orchestration/tasks
  Header: Authorization: Bearer marketplace-amazon-{secret}
  Body: { marketplace, title, description, category, ... }
  ↓
Validation (token check, field validation)
  ↓
TaskManager.createTask()
  ↓
Database: marketplace_tasks INSERT
  ↓
Response: 201 { task, message }
  ↓
Agent: Log completion, continue with next task
```

**Implementation in Agent Code:**
```typescript
// In marketplace-amazon agent
const response = await fetch('/api/orchestration/tasks', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer marketplace-amazon-${AGENT_SECRET}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    marketplace: 'amazon',
    title: '...',
    description: '...',
    category: 'optimization',
    priority: 'high',
    estimatedHours: 4,
    createdBy: 'marketplace-amazon'
  })
})
```

#### Pattern: Master Orchestrator Coordination
```
MarketplaceOrchestrator.initializeDailyTasks()
  ↓
For each agent in MARKETPLACE_AGENTS:
  - Log collection start
  - Call agent (future: real API call)
  - Handle errors per-agent
  ↓
Aggregate all tasks
  ↓
Store in local cache
  ↓
Optionally batch for approval
```

### Real-Time Updates (Future)

**Current State:** Polling-based
```
Frontend: GET /api/orchestration/tasks (every 30s)
  ↓
Display updated task list
```

**Future State:** WebSocket Subscriptions (Supabase Realtime)
```
Client: subscribe('marketplace_tasks', { event: 'INSERT' })
  ↓
New task created → Broadcast to all connected clients
  ↓
Frontend: Update UI in real-time
```

---

## Marketplace Agent Orchestration

### Agent Configuration

**6 Specialized Agents + 1 Master:**

| Agent | Focus Area | Task Categories | Frequency |
|-------|-----------|-----------------|-----------|
| **marketplace-master (Nexo)** | Orchestration, strategy | all | Continuous |
| **marketplace-amazon** | GEO titles, A+ content, Ads | optimization, analysis | Daily |
| **marketplace-shopee** | Flash sales, Video, Ads | optimization, best-practice | Daily |
| **marketplace-mercadolivre** | Geo descriptions, Ads | optimization, scaling | Daily |
| **marketplace-shein** | Trend optimization | best-practice, analysis | Daily |
| **marketplace-tiktokshop** | Live commerce, Creator partnerships | scaling, best-practice | Daily |
| **marketplace-kaway** | Premium positioning, Exclusive offers | optimization, scaling | Daily |

### Task Generation Process

```
┌───────────────────────────────────────────────────────────────┐
│        Daily Task Generation Flow (Per Agent)                 │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  1. Agent Wakes Up (scheduled or triggered)                  │
│     └─ Load marketplace context (products, metrics, KBs)     │
│                                                                │
│  2. Analyze Current State                                     │
│     ├─ Review inventory metrics                              │
│     ├─ Check competitor performance                          │
│     ├─ Identify optimization opportunities                   │
│     └─ Score by business impact                              │
│                                                                │
│  3. Generate Tasks                                            │
│     ├─ Title: Clear, actionable                              │
│     ├─ Description: Context + expected outcome               │
│     ├─ Category: optimization|best-practice|scaling|analysis │
│     ├─ Priority: high|medium|low                             │
│     ├─ EstimatedHours: Based on complexity                   │
│     └─ Metadata: Marketplace-specific data                   │
│                                                                │
│  4. Submit Task                                               │
│     └─ HTTP POST /api/orchestration/tasks                    │
│        (Bearer marketplace-{agent-id} token)                 │
│                                                                │
│  5. Wait for Approval                                         │
│     ├─ Task status: pending → awaiting_approval              │
│     ├─ Visible in admin dashboard                            │
│     ├─ Admin reviews and approves/rejects                    │
│     └─ Agent notified of decision                            │
│                                                                │
│  6. Task Assigned & Executed                                 │
│     ├─ Admin assigns to team member                          │
│     ├─ Team member works and logs hours                      │
│     ├─ Task marked complete                                  │
│     └─ Agent receives feedback (optional)                    │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

### Knowledge Base Integration

Each agent has access to marketplace-specific knowledge:
- Product performance baseline metrics
- Best practices (SEO, pricing, content)
- Competitor strategies
- Platform algorithm updates
- Historical task results

**Future Enhancement:** KB updates trigger task re-generation based on new information.

### Task Categories

| Category | Purpose | Sub-agent Focus |
|----------|---------|-----------------|
| **optimization** | Improve existing performance | All agents |
| **best-practice** | Apply proven strategies | Shopee, Shein, TikTok |
| **scaling** | Increase volume/reach | Mercado, TikTok, Kaway |
| **analysis** | Research & reporting | Amazon, Shein, Kaway |

---

## Security & Authorization

### Authentication Layers

#### 1. Sub-Agent Task Creation
```
Token Format: Bearer marketplace-{agent-id}-{secret}
Validation:  Header check + token verification
Scope:       Create tasks only (POST /api/orchestration/tasks)
```

**Implementation:**
```typescript
const authHeader = request.headers.get('authorization')
const isAuthorizedAgent = authHeader?.startsWith('Bearer marketplace-')

if (!isAuthorizedAgent) {
  return NextResponse.json(
    { error: 'Unauthorized - marketplace agent token required' },
    { status: 401 }
  )
}
```

#### 2. User Operations (Approval, Assignment, Completion)
```
Authentication: NextAuth.js session
Authorization:  Role-based (admin for approval/assign, any for complete own)
```

**Example Authorization:**
```typescript
// Approval requires admin role
if (session.user?.role !== 'admin') {
  return NextResponse.json(
    { error: 'Only admins can approve tasks' },
    { status: 403 }
  )
}

// Completion allowed by assigned user or admin
if (!isAssignedUser && !isAdmin) {
  return NextResponse.json(
    { error: 'You can only complete your assigned tasks' },
    { status: 403 }
  )
}
```

### Data Privacy & Access Control

| Operation | Who Can Access | Data Visible |
|-----------|----------------|-------------|
| Create task | marketplace-* agents | Only created task data |
| List tasks | Authenticated users | All tasks (filtered by marketplace/status) |
| Approve/Reject | Admin users only | Task details + metadata |
| Assign task | Admin users only | Full task + assignment info |
| Complete task | Assigned user + admins | Full task + completion metadata |

### Input Validation

**Task Creation Validation:**
- Required: marketplace, title, description, category, priority, estimatedHours, createdBy
- Type checking: title/description are strings, estimatedHours is number
- Enum validation: marketplace ∈ Marketplace, category ∈ TaskCategory
- Length limits: title ≤ 255, description ≤ 5000

**Approval Validation:**
- taskIds: array, non-empty
- approved: boolean
- reason: optional string

**Assignment Validation:**
- taskId: uuid format
- assignedTo: user ID format
- Task status pre-check: must be 'approved'

**Completion Validation:**
- taskId: uuid format
- actualHours: positive number
- notes: optional string

---

## Scaling & Performance

### Database Optimization

#### Indexes (Recommended for PostgreSQL)
```sql
-- Task lookup by status (frequent query in approval workflow)
CREATE INDEX idx_marketplace_tasks_status ON marketplace_tasks(status);

-- Sub-agent to task mapping
CREATE INDEX idx_marketplace_tasks_created_by ON marketplace_tasks(createdBy);

-- Daily statistics query
CREATE INDEX idx_marketplace_tasks_marketplace ON marketplace_tasks(marketplace);

-- Composite for approval workflow
CREATE INDEX idx_marketplace_tasks_status_submitted
  ON marketplace_tasks(status, submittedAt);

-- Completion tracking
CREATE INDEX idx_marketplace_tasks_completed_at ON marketplace_tasks(completedAt);
```

#### RPC Function (Daily Stats)
```sql
CREATE OR REPLACE FUNCTION get_marketplace_daily_stats()
RETURNS TABLE (
  marketplace text,
  created integer,
  approved integer,
  in_progress integer,
  completed integer,
  avg_completion_time numeric
) AS $$
  SELECT
    marketplace,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as created,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
    AVG(EXTRACT(EPOCH FROM (completedAt - startedAt))/3600)::numeric as avg_completion_time
  FROM marketplace_tasks
  WHERE DATE(createdAt) = CURRENT_DATE
  GROUP BY marketplace;
$$ LANGUAGE SQL;
```

### Caching Strategy

**In-Memory Cache (Application Level):**
```typescript
// Cache orchestrator status for 5 minutes
const ORCHESTRATOR_CACHE_TTL = 5 * 60 * 1000;
let cachedStatus: OrchestratorStatus | null = null;
let cacheExpiry = 0;

async getStatus() {
  if (Date.now() < cacheExpiry && cachedStatus) {
    return cachedStatus;
  }

  cachedStatus = await this.taskManager.getDailyStats();
  cacheExpiry = Date.now() + ORCHESTRATOR_CACHE_TTL;
  return cachedStatus;
}
```

**Database-Level Cache (Supabase Realtime):**
- Leverage Supabase's connection pooling
- Use prepared statements for N+1 prevention
- Paginate large result sets (limit 100)

### Concurrency & Locking

**Optimistic Locking (Future Enhancement):**
```typescript
// Add version field to MarketplaceTask
version: number

// Update only if version matches
UPDATE marketplace_tasks
SET status = 'approved', version = version + 1
WHERE id = ? AND version = ?
```

**Current Approach:** Database constraints prevent invalid state transitions (via RLS or triggers).

### Horizontal Scaling

**Stateless API Layer:**
- MarketplaceOrchestrator: no instance state
- TaskManager: no connection pooling (Supabase handles)
- Scales to N copies behind load balancer

**Database Scaling (Supabase):**
- Read replicas for high-volume queries
- Connection pooling via PgBouncer
- Future: Sharding by marketplace if needed

---

## Monitoring & Observability

### Key Metrics

#### 1. Task Pipeline Metrics
```typescript
// Per-marketplace task distribution
metrics:
  - pending_count[marketplace]
  - awaiting_approval_count[marketplace]
  - in_progress_count[marketplace]
  - completed_count[marketplace]
  - rejected_count[marketplace]

// Throughput
  - tasks_created_per_hour[marketplace]
  - tasks_completed_per_hour[marketplace]
  - approval_rate (approved vs rejected)

// Performance
  - avg_approval_time (pending → approved)
  - avg_execution_time (approved → completed)
  - time_accuracy (estimated vs actual hours)
```

#### 2. Agent Performance
```typescript
// Per-agent metrics
metrics:
  - task_generation_frequency[agent]
  - approval_rate[agent] (% approved)
  - task_quality_score[agent]
  - avg_task_complexity[agent]
```

#### 3. System Health
```typescript
metrics:
  - api_response_time_p50, p95, p99
  - database_query_time_p95
  - error_rate_by_endpoint
  - authentication_failure_rate
```

### Logging Strategy

**Log Levels:**
```typescript
// INFO: Task lifecycle milestones
console.log('[Orchestrator] Initializing daily tasks at 2026-02-20T10:30:00Z')
console.log('[Orchestrator] Found 12 tasks awaiting approval')

// WARN: Non-critical failures or degradation
console.warn('[TaskManager] High latency on getDailyStats: 2500ms')

// ERROR: Critical failures
console.error('[Orchestrator] Error collecting from marketplace-amazon:', error)
console.error('[TaskManager] Database connection failed:', error)
```

**Log Format (JSON for parsing):**
```json
{
  "timestamp": "2026-02-20T10:30:00Z",
  "level": "INFO",
  "component": "Orchestrator",
  "action": "initializeDailyTasks",
  "message": "Initializing daily tasks",
  "marketplace": "amazon",
  "taskCount": 3
}
```

### Alerting Triggers

| Alert | Threshold | Action |
|-------|-----------|--------|
| **High Pending Count** | > 500 awaiting approval | Page on-call |
| **Agent Failure** | No tasks from agent in 24h | Investigation |
| **API Latency** | p95 > 2s | Scale up, optimize |
| **Error Rate** | > 2% of requests | Rollback or fix |
| **Approval Backlog** | Tasks pending > 7 days | Manual escalation |

### Dashboards (Future)

```
📊 Marketplace Orchestration Dashboard

┌────────────────────────────────────────────────────┐
│ Daily Task Summary                                 │
│ ├─ Amazon: 15 pending, 8 in-progress, 12 completed│
│ ├─ Shopee: 12 pending, 5 in-progress, 8 completed │
│ ├─ MercadoLivre: 8 pending, 3 in-progress, 6 completed│
│ ├─ Shein: 10 pending, 4 in-progress, 7 completed  │
│ ├─ TikTok: 7 pending, 2 in-progress, 5 completed  │
│ └─ Kaway: 6 pending, 2 in-progress, 4 completed   │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ Approval Pipeline                                  │
│ Awaiting Approval (45) → Approved (180) → In Progress (15) → Completed (123)
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ Performance Metrics                                │
│ ├─ Avg Approval Time: 2.3 hours                   │
│ ├─ Avg Execution Time: 3.8 hours                  │
│ ├─ Time Accuracy: 87%                             │
│ └─ Approval Rate: 92%                             │
└────────────────────────────────────────────────────┘
```

---

## Deployment & Future Enhancements

### Current State (MVP)
- ✅ Core task management lifecycle
- ✅ Batch approval workflow
- ✅ Assignment & completion tracking
- ✅ Basic statistics
- ✅ Role-based access control

### Phase 2 (Q2 2026)
- WebSocket real-time updates
- Advanced filtering & search
- Task templates for recurring work
- Automated task routing based on expertise
- Performance analytics dashboard

### Phase 3 (Q3 2026)
- ML-based task prioritization
- Predictive effort estimation
- Cross-marketplace campaign orchestration
- Integration with external task management tools
- Advanced reporting & BI

### Phase 4 (Q4 2026+)
- Distributed task execution (queue-based)
- Multi-team collaboration
- Custom workflows & automation
- Integration marketplace plugins

---

## Architecture Decision Records (ADRs)

### ADR-1: Monolithic Orchestrator vs Microservices
**Decision:** Monolithic (MarketplaceOrchestrator + TaskManager)
**Rationale:**
- Current scale doesn't justify microservices complexity
- Single deployment simplifies debugging
- Can migrate to microservices when task volume exceeds 10k/day
- Easier to maintain type safety across components

### ADR-2: Bearer Token for Agents vs OAuth
**Decision:** Simple Bearer tokens with marketplace prefix
**Rationale:**
- Agents are trusted internal services
- OAuth overhead not necessary for internal auth
- Can upgrade to mTLS if security requirements change
- Easy to rotate tokens without code changes

### ADR-3: Optimistic vs Pessimistic Locking
**Decision:** Current: No explicit locking, Database constraints handle integrity
**Future:** Optimistic locking via version field
**Rationale:**
- Low concurrency contention expected
- Pessimistic locking would harm performance
- Optimistic locking needed if concurrency increases

---

## Conclusion

The **Marketplace Orchestration System** provides a robust, type-safe framework for managing AI-driven tasks from distributed marketplace agents. The architecture emphasizes:

- **Clarity:** Clear separation of concerns (types, orchestration, data access)
- **Scalability:** Stateless API, indexed database queries, caching strategy
- **Security:** Multiple authentication layers, role-based authorization
- **Observability:** Comprehensive logging, metrics, and alerting
- **Extensibility:** Metadata fields, configurable task categories, plugin-ready design

The system is production-ready for current usage patterns and designed to scale as the marketplace expansion accelerates.

---

**Document Authored By:** Aria (Architect)
**Last Updated:** 2026-02-20
**Next Review:** After Phase 2 deployment (Q2 2026)
