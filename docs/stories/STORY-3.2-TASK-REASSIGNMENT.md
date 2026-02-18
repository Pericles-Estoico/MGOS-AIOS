# STORY 3.2 - TASK REASSIGNMENT WORKFLOW

**Status:** Ready for Development
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

- [ ] **T-3.2.1: Create reassign endpoint**
  - [ ] POST /api/tasks/[id]/reassign (already exists from email integration!)
  - [ ] Validate: user is admin/head
  - [ ] Validate: task exists and not completed
  - [ ] Validate: new_assignee_id is valid user
  - [ ] Update task.assigned_to
  - [ ] Create reassignment_history entry
  - [ ] Create audit log
  - [ ] Trigger email notification
  - [ ] Return updated task

### Phase 2: Task Detail Page Enhancement

- [ ] **T-3.2.2: Add reassign modal to task detail**
  - [ ] Import ReassignModal component
  - [ ] Show "Reassign" button in task header
  - [ ] Modal: dropdown for assignee selection
  - [ ] Modal: optional reason textarea
  - [ ] Modal: confirm/cancel buttons
  - [ ] Call POST /api/tasks/[id]/reassign
  - [ ] Handle success/error responses
  - [ ] Show toast message

### Phase 3: Task List Enhancement

- [ ] **T-3.2.3: Add quick reassign to task list**
  - [ ] Add dropdown button in task row
  - [ ] Show assignee options when clicked
  - [ ] Click to reassign instantly
  - [ ] Show toast: "Reassigned to [User]"
  - [ ] Update UI without refresh

- [ ] **T-3.2.4: Implement bulk reassign**
  - [ ] Add checkbox to each task row
  - [ ] Show "Bulk actions" bar when rows selected
  - [ ] "Reassign All" button
  - [ ] Modal: select new assignee
  - [ ] Submit: reassign all selected
  - [ ] Handle batch operation

### Phase 4: History & Audit

- [ ] **T-3.2.5: Show reassignment history in task detail**
  - [ ] Fetch reassignment_history for task
  - [ ] Display timeline of reassignments
  - [ ] Show: old assignee → new assignee
  - [ ] Show: timestamp, reason, performed by
  - [ ] Optional: expandable comments

- [ ] **T-3.2.6: Create reassignment_history table**
  - [ ] Columns: id, task_id, old_assignee_id, new_assignee_id, reason, reassigned_by, created_at
  - [ ] Index on task_id for fast lookup
  - [ ] RLS policy for access control

### Phase 5: Testing

- [ ] **T-3.2.7: Create test suite**
  - [ ] API endpoint tests (success, validation errors)
  - [ ] Permission tests (admin vs executor)
  - [ ] Smoke tests for UI components
  - [ ] Email notification trigger tests

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

- [ ] API endpoint implemented and tested
- [ ] ReassignModal component created and working
- [ ] Task detail page updated
- [ ] Task list quick reassign working
- [ ] Bulk reassign implemented
- [ ] Reassignment history displayed
- [ ] Email notifications sent
- [ ] Audit logging complete
- [ ] All tests passing (smoke + unit)
- [ ] Lint and build passing
- [ ] Deployed to staging
- [ ] Deployed to production
