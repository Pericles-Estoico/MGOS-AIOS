# STORY 2.1 - EXECUTE ASSIGNED TASK

**Status:** Draft - Ready for Development
**Duration:** 1 day
**Priority:** Critical - Core Feature
**Assigned to:** @dev (Dex)
**Created:** 2026-02-20

---

## 📋 Story Overview

As an executor, I need to see my assigned tasks and start execution so I can begin work and track time on assigned work items.

---

## ✅ Acceptance Criteria

```
AC-2.1.1: Dashboard shows "My Tasks" list
  ✓ Page shows only tasks where assigned_to = current_user
  ✓ List displays: task title, priority badge, status, due date
  ✓ Tasks ordered by due date (nearest first)
  ✓ Pagination support (20-100 items per request)
  ✓ No errors for users with no tasks

AC-2.1.2: Can click task to view detail page
  ✓ Clicking task navigates to /tasks/{task_id}
  ✓ Detail page loads task data from /api/tasks/{id}
  ✓ Page shows full task information

AC-2.1.3: Detail page shows task metadata
  ✓ Title and description visible
  ✓ Priority displayed with color badge
  ✓ Status shown (pending, in_progress, submitted, qa_review, approved, rejected)
  ✓ Due date displayed in locale format (pt-BR)
  ✓ Created date and last update timestamp visible

AC-2.1.4: Can start timer to begin work
  ✓ Start button visible on task detail page
  ✓ Clicking Start shows Timer component
  ✓ Timer displays MM:SS format (00:00 to 99:59)
  ✓ Timer has Start/Pause/Stop/Reset buttons
  ✓ All buttons disabled during submission

AC-2.1.5: Task status changes to "in_progress" when timer starts
  ✓ POST /api/tasks/{id}/start endpoint exists
  ✓ Endpoint updates task.status = 'in_progress'
  ✓ Returns updated task with new status
  ✓ Fires audit log entry for status change
  ✓ Status reflected immediately in UI (optimistic update)
```

---

## 🛠️ Tasks

### Phase 1: Task List & Detail Pages (Enhancing Story 1.4)

- [ ] **T-2.1.1: Create "My Tasks" filtered view**
  - Subtasks:
    - [ ] Create /app/(dashboard)/tasks/my-tasks/page.tsx
    - [ ] Fetch tasks with filter: assigned_to = session.user.id
    - [ ] Implement pagination (use existing /api/tasks endpoint with params)
    - [ ] Display list with title, priority, status, due date
    - [ ] Add loading and error states
    - [ ] Add empty state message

- [ ] **T-2.1.2: Enhance task detail page**
  - Subtasks:
    - [ ] Update /app/(dashboard)/tasks/[id]/page.tsx layout
    - [ ] Add task start button (visible for pending status)
    - [ ] Add task metadata display (created, updated timestamps)
    - [ ] Add "Start Work" CTA button
    - [ ] Enhance styling consistency

### Phase 2: Start Task API & Status Workflow

- [ ] **T-2.1.3: Create /api/tasks/{id}/start endpoint**
  - Subtasks:
    - [ ] Create /app/api/tasks/[id]/start/route.ts
    - [ ] Validate authentication (401 if not logged in)
    - [ ] Validate task exists and user is assigned_to (403 if not)
    - [ ] Validate task.status = 'pending' (400 if already started)
    - [ ] Update task.status = 'in_progress'
    - [ ] Update task.updated_at to current time
    - [ ] Fire audit log entry (operation: 'start_task')
    - [ ] Return updated task as JSON
    - [ ] Add error handling for all edge cases

- [ ] **T-2.1.4: Integrate start workflow into UI**
  - Subtasks:
    - [ ] Add "Start Work" button to task detail page
    - [ ] Button visible only for executors assigned to task
    - [ ] Button visible only when status = 'pending'
    - [ ] On click: POST /api/tasks/{id}/start
    - [ ] On success: update local task state, show timer
    - [ ] On error: display error message
    - [ ] Disable button during request (show loading state)

### Phase 3: Testing & Validation

- [ ] **T-2.1.5: Test task execution flow**
  - Subtasks:
    - [ ] Test: Executor sees only assigned tasks in list
    - [ ] Test: Non-assigned executor cannot see task (verify RLS)
    - [ ] Test: Admin sees all tasks in team dashboard
    - [ ] Test: Clicking task navigates and loads correctly
    - [ ] Test: Task detail shows all metadata
    - [ ] Test: Start button only visible for pending tasks
    - [ ] Test: Clicking start updates status to in_progress
    - [ ] Test: Timer appears after start
    - [ ] Test: Multiple starts are prevented (task becomes in_progress)

---

## 📝 Dev Notes

### Database Setup Already Complete (Story 1.1)
The following are already available:
- `tasks` table with status field
- `audit_logs` table for tracking changes
- RLS policies for task access control

### API Route Pattern to Follow
See `/api/tasks/route.ts` and `/api/tasks/[id]/route.ts` for:
- getServerSession() usage
- Supabase client creation with JWT
- Error handling patterns (401/403/500)
- Request validation

### Pagination Details
- Use query params: `?offset=0&limit=20`
- Max limit: 100 items
- Default limit: 20 items
- Return pagination metadata: `{total, offset, limit}`

### Role-Based Access
From Story 1.4 - use `session?.user?.role` to check permissions:
- `admin`: Full access
- `head`: Can create/assign/view all
- `executor`: Can see own assigned tasks + created tasks
- `qa`: Can see all tasks for review

### Status Transitions
```
pending → in_progress (via /api/tasks/{id}/start)
in_progress → submitted (via evidence form - Story 2.3)
submitted → qa_review (automatic - Story 2.5)
qa_review → approved | rejected (via QA review - Story 2.5)
rejected → in_progress (executor resubmit)
```

### Component Reuse from Story 1.4
- TaskList pagination logic already implemented
- Task detail page structure exists
- Can reuse form components (EvidenceForm, etc.)

### Known Limitations
- File upload not implemented (URL only - Story 2.3)
- Task editing not available yet (Phase 5)
- No task reassignment in this story (handled in Story 2.6)

---

## 🧪 Testing Strategy

### Unit Tests
```bash
# API route tests
npm test -- tasks.start.test.ts

# Test cases:
- Valid start request → status changes to in_progress
- Unauthenticated request → 401
- Task not assigned to user → 403
- Task not pending → 400
- Task not found → 404
```

### Integration Tests
```bash
# Full flow: List → Detail → Start
npm test -- task-execution.integration.test.ts

# Test cases:
- Executor sees only assigned tasks
- Clicking task navigates correctly
- Start button appears and works
- Status updates reflect in real-time
```

### Manual Testing Checklist
- [ ] Login as executor with assigned tasks
- [ ] Verify "My Tasks" list shows only assigned
- [ ] Click task → verify detail page loads
- [ ] Verify all metadata displays
- [ ] Click "Start Work" → verify status changes
- [ ] Verify timer appears after start
- [ ] Verify second start is prevented
- [ ] Test as different users (admin sees team view)

---

## 📁 File List

### New Files to Create
```
app/(dashboard)/tasks/my-tasks/page.tsx
app/api/tasks/[id]/start/route.ts
tests/api/tasks.start.test.ts
tests/integration/task-execution.integration.test.ts
```

### Files to Modify
```
app/(dashboard)/tasks/[id]/page.tsx (enhance detail layout)
app/components/layout/Sidebar.tsx (add "My Tasks" link)
```

### Reuse from Story 1.4
```
app/(dashboard)/layout.tsx (already protected)
app/api/tasks/route.ts (pagination works)
app/api/tasks/[id]/route.ts (detail endpoint works)
app/components/forms/TimeLogForm.tsx (will use in 2.2)
app/components/tasks/Timer.tsx (will use in 2.2)
```

---

## 🔍 Dev Agent Record

### Checkboxes Status
- [ ] Code implementation complete
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Manual testing done
- [ ] CodeRabbit pre-commit review passed (0 CRITICAL)
- [ ] TypeScript strict mode verified
- [ ] ESLint passing
- [ ] Story ready for QA review

### Debug Log
- Started: [timestamp will be filled by @dev]
- Implementation approach: [will be filled by @dev]
- Issues encountered: [will be filled by @dev]
- Resolution notes: [will be filled by @dev]

### Completion Notes
- [Will be filled when story completes]

### Change Log
- [Will track commits as @dev works]

---

## 📞 Dependencies

**Blocking:**
- None - All dependencies from Story 1.4 ready

**Required Context:**
- Story 1.4 (Components & API Routes) ✅ Complete
- Story 1.1 (Database Schema) ✅ Complete
- Story 1.5 (Authentication) ✅ Complete

**Delegates to:**
- None - Self-contained story

---

**Prepared by:** @aios-master (Orion)
**Date:** 2026-02-20
**Status:** Ready for @dev to implement
