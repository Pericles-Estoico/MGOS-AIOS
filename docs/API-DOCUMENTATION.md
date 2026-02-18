# EPIC 2 - API Documentation

**Version:** 2.0.0
**Status:** Complete
**Last Updated:** 2026-02-20

---

## 📋 Overview

This document describes all API endpoints implemented in Epic 2 (Task Execution & Timer Workflows). All endpoints require authentication via NextAuth.js and enforce role-based access control.

**Base URL:** `/api`
**Authentication:** NextAuth.js JWT (via HTTPOnly cookie)
**Format:** JSON request/response

---

## 🔐 Authentication & Authorization

### Authentication Header
All requests must include valid NextAuth session. Session is automatically included via HTTPOnly cookie.

### Role-Based Access
| Role | Access | Can Do |
|------|--------|--------|
| `executor` | Tasks assigned to them | Execute, submit evidence, log time |
| `qa` | Submitted & reviewing tasks | Review evidence, approve/reject |
| `head` | All tasks | Reassign, extend due dates, view analytics |
| `admin` | All tasks + system | Everything + user management |

---

## 📚 Endpoint Reference

### Task Management

#### 1. Get Task List
```
GET /api/tasks
```

**Query Parameters:**
- `offset` (number, default: 0) - Pagination offset
- `limit` (number, default: 20, max: 100) - Items per page
- `status` (string, optional) - Filter by status (pending, in_progress, submitted, qa_review, approved, rejected)

**Response (200):**
```json
{
  "data": [
    {
      "id": "task-123",
      "title": "Implement login form",
      "description": "Create login UI with validation",
      "status": "in_progress",
      "priority": "high",
      "assigned_to": "user-456",
      "due_date": "2026-02-25T00:00:00Z",
      "created_at": "2026-02-20T10:00:00Z",
      "updated_at": "2026-02-20T15:30:00Z"
    }
  ],
  "total": 45,
  "offset": 0,
  "limit": 20
}
```

**Errors:**
- `401 Unauthorized` - Missing session
- `500 Internal Server Error` - Database error

---

#### 2. Get Task Detail
```
GET /api/tasks/:id
```

**Response (200):**
```json
{
  "id": "task-123",
  "title": "Implement login form",
  "description": "Create login UI with validation",
  "status": "in_progress",
  "priority": "high",
  "assigned_to": "user-456",
  "due_date": "2026-02-25T00:00:00Z",
  "created_at": "2026-02-20T10:00:00Z",
  "updated_at": "2026-02-20T15:30:00Z",
  "evidence": [
    {
      "id": "evidence-789",
      "file_url": "https://example.com/screenshot.png",
      "description": "Login screen with validation",
      "created_at": "2026-02-20T14:00:00Z"
    }
  ],
  "qa_reviews": [
    {
      "id": "review-101",
      "status": "pending",
      "feedback": null,
      "created_at": "2026-02-20T15:00:00Z"
    }
  ],
  "status_history": [
    {
      "id": "hist-1",
      "operation": "status_change",
      "old_value": { "status": "pending" },
      "new_value": { "status": "in_progress" },
      "created_by": "user-456",
      "created_at": "2026-02-20T10:30:00Z"
    }
  ]
}
```

**Errors:**
- `401 Unauthorized` - Missing session
- `404 Not Found` - Task doesn't exist

---

### Task Execution

#### 3. Start Task
```
POST /api/tasks/:id/start
```

**Description:** Transition task from `pending` to `in_progress`. Executor can start work and begin timer.

**Request Body:** None (empty JSON object `{}`)

**Response (200):**
```json
{
  "id": "task-123",
  "status": "in_progress",
  "updated_at": "2026-02-20T15:30:00Z",
  "message": "Task started successfully"
}
```

**Errors:**
- `401 Unauthorized` - Missing session
- `403 Forbidden` - User is not executor of this task
- `404 Not Found` - Task doesn't exist
- `400 Bad Request` - Task status not "pending"

**Audit Log:**
- Operation: `start_task`
- Old value: `{ "status": "pending" }`
- New value: `{ "status": "in_progress" }`

---

### Time Tracking

#### 4. Log Work Time
```
POST /api/time-logs
```

**Description:** Record time spent on a task. Duration is rounded up (30s → 1 min, 61s → 2 min).

**Request Body:**
```json
{
  "task_id": "task-123",
  "duration_minutes": 45,
  "description": "Implemented form validation",
  "log_date": "2026-02-20"
}
```

**Validation:**
- `task_id` - Required, must exist
- `duration_minutes` - Required, 1-1440 (1 min to 24 hours)
- `description` - Optional, max 500 chars
- `log_date` - Optional, defaults to today

**Response (201):**
```json
{
  "id": "timelog-456",
  "task_id": "task-123",
  "duration_minutes": 45,
  "description": "Implemented form validation",
  "log_date": "2026-02-20",
  "created_at": "2026-02-20T15:35:00Z"
}
```

**Errors:**
- `401 Unauthorized` - Missing session
- `403 Forbidden` - Only executor can log time
- `404 Not Found` - Task doesn't exist
- `400 Bad Request` - Invalid duration (< 1 or > 1440)

---

### Evidence Submission

#### 5. Submit Evidence
```
POST /api/evidence
```

**Description:** Submit proof of task completion (URL to file, screenshot, or documentation).

**Request Body:**
```json
{
  "task_id": "task-123",
  "file_url": "https://github.com/myrepo/pull/123",
  "description": "Pull request with implementation and tests"
}
```

**Validation:**
- `task_id` - Required, must exist
- `file_url` - Required, valid HTTP(S) URL
- `description` - Optional, max 1000 chars

**Response (201):**
```json
{
  "id": "evidence-789",
  "task_id": "task-123",
  "file_url": "https://github.com/myrepo/pull/123",
  "description": "Pull request with implementation and tests",
  "created_at": "2026-02-20T15:40:00Z"
}
```

**Errors:**
- `401 Unauthorized` - Missing session
- `403 Forbidden` - Only executor can submit evidence
- `404 Not Found` - Task doesn't exist
- `400 Bad Request` - Invalid URL or missing task_id

---

### QA Review

#### 6. Submit QA Review
```
POST /api/qa-reviews
```

**Description:** QA team reviews submitted evidence and approves or rejects.

**Request Body:**
```json
{
  "task_id": "task-123",
  "status": "approved",
  "feedback": "Implementation looks great! All tests pass."
}
```

**Status Values:**
- `approved` - Task meets quality standards
- `rejected` - Task needs changes
- `changes_requested` - Minor adjustments needed

**Validation:**
- `task_id` - Required, must exist
- `status` - Required, one of [approved, rejected, changes_requested]
- `feedback` - Optional, max 1000 chars

**Response (201):**
```json
{
  "id": "review-101",
  "task_id": "task-123",
  "status": "approved",
  "feedback": "Implementation looks great! All tests pass.",
  "created_by": "qa-user-789",
  "created_at": "2026-02-20T16:00:00Z"
}
```

**Task Status Update:**
When QA review is submitted, task status updates:
- `approved` → task.status = "approved"
- `rejected` → task.status = "rejected"
- `changes_requested` → task.status = "qa_review"

**Errors:**
- `401 Unauthorized` - Missing session
- `403 Forbidden` - Only QA role can review
- `404 Not Found` - Task doesn't exist
- `400 Bad Request` - Invalid status value

---

### Admin/Head Features

#### 7. Reassign Task
```
POST /api/tasks/:id/reassign
```

**Description:** Reassign task to different team member. Only admin/head can do this.

**Request Body:**
```json
{
  "assigned_to": "user-999"
}
```

**Validation:**
- `assigned_to` - Required, user ID or name

**Response (200):**
```json
{
  "id": "task-123",
  "assigned_to": "user-999",
  "updated_at": "2026-02-20T16:15:00Z",
  "message": "Task reassigned successfully"
}
```

**Audit Log:**
- Operation: `reassign_task`
- Old value: `{ "assigned_to": "user-456" }`
- New value: `{ "assigned_to": "user-999" }`

**Errors:**
- `401 Unauthorized` - Missing session
- `403 Forbidden` - Only admin/head can reassign
- `404 Not Found` - Task doesn't exist
- `400 Bad Request` - Missing assigned_to

---

#### 8. Extend Due Date
```
POST /api/tasks/:id/extend-due-date
```

**Description:** Extend task deadline. Only admin/head can do this. Due date must be in future.

**Request Body:**
```json
{
  "due_date": "2026-03-05T00:00:00Z"
}
```

**Validation:**
- `due_date` - Required, ISO 8601 format, must be future date
- Cannot set due date in past (prevents backdating)

**Response (200):**
```json
{
  "id": "task-123",
  "due_date": "2026-03-05T00:00:00Z",
  "updated_at": "2026-02-20T16:20:00Z",
  "message": "Due date extended successfully"
}
```

**Audit Log:**
- Operation: `extend_due_date`
- Old value: `{ "due_date": "2026-02-25T00:00:00Z" }`
- New value: `{ "due_date": "2026-03-05T00:00:00Z" }`

**Errors:**
- `401 Unauthorized` - Missing session
- `403 Forbidden` - Only admin/head can extend
- `404 Not Found` - Task doesn't exist
- `400 Bad Request` - Missing due_date or date in past

---

## 📊 Status Codes Reference

| Code | Meaning | When |
|------|---------|------|
| `200 OK` | Success | GET, PUT, POST (action) |
| `201 Created` | Resource created | POST (create) |
| `400 Bad Request` | Invalid input | Missing fields, validation failure |
| `401 Unauthorized` | No session | Must login first |
| `403 Forbidden` | No permission | Role-based access denied |
| `404 Not Found` | Resource missing | Task/evidence doesn't exist |
| `500 Internal Server Error` | Server error | Database error, unexpected exception |

---

## 🔄 Common Workflows

### Executor Workflow: Execute Task → Log Time → Submit Evidence

```bash
# 1. Get my tasks
curl -X GET "/api/tasks?assigned_to=me"

# 2. Start a task
curl -X POST "/api/tasks/task-123/start" \
  -H "Content-Type: application/json" \
  -d '{}'

# 3. Log time
curl -X POST "/api/time-logs" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "task-123",
    "duration_minutes": 45,
    "description": "Implemented and tested feature"
  }'

# 4. Submit evidence
curl -X POST "/api/evidence" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "task-123",
    "file_url": "https://github.com/myrepo/pull/456",
    "description": "PR with implementation"
  }'
```

### QA Workflow: Review Evidence → Approve/Reject

```bash
# 1. Get tasks needing review
curl -X GET "/api/tasks?status=submitted"

# 2. Get task detail with evidence
curl -X GET "/api/tasks/task-123"

# 3. Submit review
curl -X POST "/api/qa-reviews" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "task-123",
    "status": "approved",
    "feedback": "Looks good!"
  }'
```

### Admin Workflow: Monitor & Manage Team

```bash
# 1. Get all tasks
curl -X GET "/api/tasks?limit=100"

# 2. Check task status
curl -X GET "/api/tasks/task-123"

# 3. Reassign task
curl -X POST "/api/tasks/task-123/reassign" \
  -H "Content-Type: application/json" \
  -d '{ "assigned_to": "user-999" }'

# 4. Extend due date
curl -X POST "/api/tasks/task-123/extend-due-date" \
  -H "Content-Type: application/json" \
  -d '{ "due_date": "2026-03-05T00:00:00Z" }'
```

---

## 🚀 Implementation Notes

### Error Response Format
```json
{
  "error": "User does not have permission",
  "status": 403,
  "message": "Only QA role can review tasks"
}
```

### Audit Logging
All mutations (create, update, delete) create audit log entries:
- `table_name` - Table being modified
- `record_id` - ID of record
- `operation` - What changed (start_task, reassign_task, etc)
- `old_value` - Previous state
- `new_value` - New state
- `created_by` - User who made change
- `created_at` - When change happened

### RLS Enforcement
All queries are filtered by Supabase RLS policies:
- Executors see only their assigned tasks
- QA see only submitted tasks
- Admin/head see all tasks
- Users can only update their own records

---

## 📞 Support

For API issues or questions:
- Check test files: `tests/api/tasks.test.ts`
- Review implementation: `app/api/` folder
- Check middleware: `app/middleware.ts`

---

**Last Updated:** 2026-02-20
**Maintained By:** Development Team
**Status:** ✅ Complete for Epic 2
