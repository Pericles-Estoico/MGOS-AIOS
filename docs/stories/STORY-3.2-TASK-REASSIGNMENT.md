# STORY 3.2 - TASK REASSIGNMENT WORKFLOW

**Status:** Done
**Duration:** 1-2 hours
**Priority:** High - Core Workflow
**Assigned to:** @dev (Dex)
**Created:** 2026-02-18

---

## 📋 Story Overview

As a team lead, I need to reassign tasks between team members so I can balance workload, redistribute work when team members are unavailable, and optimize task allocation.

---

## ✅ Acceptance Criteria

```
AC-3.2.1: Reassign Task from Task Detail Page
  ✓ View current assignee in task detail
  ✓ Click "Reassign" button
  ✓ Select new assignee from dropdown (all team members)
  ✓ Add optional reassignment reason/comment
  ✓ Confirm reassignment
  ✓ Update task in database
  ✓ Send notification email to new assignee
  ✓ Log audit entry with old & new assignee

AC-3.2.2: Reassign from Task List
  ✓ Quick reassign action (dropdown in row)
  ✓ Select new assignee
  ✓ Instant update (no modal needed)
  ✓ Toast confirmation message
  ✓ Email notification sent

AC-3.2.3: Bulk Reassign
  ✓ Select multiple tasks from list
  ✓ "Bulk Reassign" action button
  ✓ Select new assignee
  ✓ Confirm action
  ✓ Reassign all selected tasks in one operation
  ✓ Send batch notification emails
  ✓ Log audit entries for each task

AC-3.2.4: Reassignment Rules
  ✓ Only admin/head can reassign tasks
  ✓ Cannot reassign task to self (current assignee)
  ✓ Cannot reassign completed/approved tasks
  ✓ Show error: "Cannot reassign completed task"
  ✓ Show error: "Insufficient permissions"

AC-3.2.5: History & Tracking
  ✓ Display reassignment history in task detail
  ✓ Show: "Reassigned from John to Jane on 2026-02-18 14:30"
  ✓ Show reason/comment if provided
  ✓ Display who performed the reassignment
  ✓ Audit log entries searchable

AC-3.2.6: Notifications
  ✓ Email sent to new assignee
  ✓ Subject: "Task Reassigned: [Task Title]"
  ✓ Include: old assignee, new assignee, reason
  ✓ Include: task link to task detail page
  ✓ Honor notification preferences

AC-3.2.7: Performance & UX
  ✓ Reassign completes instantly (<500ms)
  ✓ No page refresh required
  ✓ Dropdown loads quickly with all users
  ✓ Confirmation modal is clear and simple
  ✓ Toast message provides clear feedback
```

---

## 🛠️ Tasks

### Phase 1: API Endpoint

- [x] **T-3.2.1: Create reassign endpoint**
  - [x] POST /api/tasks/[id]/reassign (already exists from email integration!)
  - [x] Validate: user is admin/head
  - [x] Validate: task exists and not completed
  - [x] Validate: new_assignee_id is valid user
  - [x] Update task.assigned_to
  - [x] Create reassignment_history entry
  - [x] Create audit log
  - [x] Trigger email notification
  - [x] Return updated task

### Phase 2: Task Detail Page Enhancement

- [x] **T-3.2.2: Add reassign modal to task detail**
  - [x] Import ReassignModal component
  - [x] Show "Reassign" button in task header
  - [x] Modal: dropdown for assignee selection
  - [x] Modal: optional reason textarea
  - [x] Modal: confirm/cancel buttons
  - [x] Call POST /api/tasks/[id]/reassign
  - [x] Handle success/error responses
  - [x] Show toast message

### Phase 3: Task List Enhancement

- [x] **T-3.2.3: Add quick reassign to task list**
  - [x] Add dropdown button in task row
  - [x] Show assignee options when clicked
  - [x] Click to reassign instantly
  - [x] Show toast: "Reassigned to [User]"
  - [x] Update UI without refresh

- [x] **T-3.2.4: Implement bulk reassign**
  - [x] Add checkbox to each task row
  - [x] Show "Bulk actions" bar when rows selected
  - [x] "Reassign All" button
  - [x] Modal: select new assignee
  - [x] Submit: reassign all selected
  - [x] Handle batch operation

### Phase 4: History & Audit

- [x] **T-3.2.5: Show reassignment history in task detail**
  - [x] Fetch reassignment_history for task
  - [x] Display timeline of reassignments
  - [x] Show: old assignee → new assignee
  - [x] Show: timestamp, reason, performed by
  - [x] Optional: expandable comments

- [x] **T-3.2.6: Create reassignment_history table**
  - [x] Columns: id, task_id, old_assignee_id, new_assignee_id, reason, reassigned_by, created_at
  - [x] Index on task_id for fast lookup
  - [x] RLS policy for access control

### Phase 5: Testing

- [x] **T-3.2.7: Create test suite**
  - [x] API endpoint tests (success, validation errors)
  - [x] Permission tests (admin vs executor)
  - [x] Smoke tests for UI components
  - [x] Email notification trigger tests

---

## 📊 Dev Agent Record

### Database Schema

**reassignment_history table:**
```sql
CREATE TABLE reassignment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  old_assignee_id UUID NOT NULL REFERENCES users(id),
  new_assignee_id UUID NOT NULL REFERENCES users(id),
  reason TEXT,
  reassigned_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reassignment_history_task_id ON reassignment_history(task_id);
```

### API Endpoint

**POST /api/tasks/[id]/reassign**
```json
REQUEST:
{
  "new_assignee_id": "uuid",
  "reason": "Optional reason for reassignment"
}

RESPONSE (200):
{
  "id": "task-uuid",
  "title": "Task Title",
  "assigned_to": "new-assignee-uuid",
  "status": "in_progress",
  "updated_at": "2026-02-18T14:30:00Z"
}

ERRORS:
- 401: Not authenticated
- 403: User is not admin/head
- 400: Task completed, cannot reassign
- 400: Invalid assignee
- 404: Task not found
```

### Components

**ReassignModal:**
```typescript
interface ReassignModalProps {
  taskId: string;
  currentAssignee: User;
  isOpen: boolean;
  onClose: () => void;
  onReassign: (newAssigneeId: string, reason: string) => void;
  loading?: boolean;
}
```

**QuickReassignDropdown:**
```typescript
interface QuickReassignDropdownProps {
  taskId: string;
  currentAssigneeId: string;
  onReassign: (newAssigneeId: string) => void;
}
```

---

## 🎨 UI Layout

```
Task Detail Page:
┌─────────────────────────────────────────┐
│ Task Title: "Fix login bug"             │
│ Status: [in_progress]  [Reassign ▼]    │ ← Button to open modal
│                                         │
│ Current Assignee: John Doe              │
│ Reassignment History:                   │
│  - Jane → John (2026-02-18 14:30)       │
│    Reason: "Jane on vacation"           │
│  - Created by John (2026-02-18 10:00)   │
└─────────────────────────────────────────┘

Reassign Modal:
┌─────────────────────────────────────┐
│ Reassign Task                       │
│ ─────────────────────────────────── │
│ Current Assignee: John Doe          │
│                                     │
│ New Assignee: [Dropdown ▼]          │
│              (select from list)     │
│                                     │
│ Reason (optional):                  │
│ [________text area________]         │
│                                     │
│ [Reassign] [Cancel]                 │
└─────────────────────────────────────┘

Task List Row:
│ ☐ Task │ Status │ Assignee     │ Actions ▼ │
│   [x] │ in_pr  │ John [▼]     │ [Menu]    │
│       │        │              │ Reassign  │
│       │        │              │ Details   │
```

---

## ✅ Definition of Done

- [x] API endpoint implemented and tested
- [x] ReassignModal component created and working
- [x] Task detail page updated
- [x] Task list quick reassign working
- [x] Bulk reassign implemented
- [x] Reassignment history displayed
- [x] Email notifications sent
- [x] Audit logging complete
- [x] All tests passing (smoke + unit)
- [x] Lint and build passing
- [x] Deployed to staging
- [x] Deployed to production
