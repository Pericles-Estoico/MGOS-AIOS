# STORY 2.4 - VIEW TASK STATUS

**Status:** Draft - Ready for Development
**Duration:** 1 day
**Priority:** High - User Visibility Feature
**Assigned to:** @dev (Dex)
**Created:** 2026-02-20

---

## 📋 Story Overview

As an executor, I need to see the current status of my task so I know where it stands in the workflow and what actions are required next.

---

## ✅ Acceptance Criteria

```
AC-2.4.1: Task detail shows status badge
  ✓ Badge displayed prominently at top of task detail
  ✓ Shows current status: pending | in_progress | submitted | qa_review | approved | rejected
  ✓ Color-coded badge:
    - pending: gray (bg-gray-100, text-gray-700)
    - in_progress: blue (bg-blue-100, text-blue-700)
    - submitted: yellow/orange (bg-yellow-100, text-yellow-700)
    - qa_review: purple (bg-purple-100, text-purple-700)
    - approved: green (bg-green-100, text-green-700)
    - rejected: red (bg-red-100, text-red-700)
  ✓ Text is clear and readable

AC-2.4.2: Status updates in real-time
  ✓ Page auto-refreshes when status changes (polling or optimistic)
  ✓ Refresh interval: every 5 seconds or on user action
  ✓ Shows updated status without page reload
  ✓ Updates UI after submit, QA review, admin action

AC-2.4.3: Can see history of status changes
  ✓ Status timeline component shows all transitions
  ✓ Displays: old_status → new_status + timestamp + actor
  ✓ Timeline ordered chronologically (newest first)
  ✓ Shows who changed status (system, QA reviewer, admin)
  ✓ Format: "2026-02-20 14:30 - Changed by [Name] - pending → in_progress"

AC-2.4.4: Can see QA feedback if rejected
  ✓ If status = rejected, show feedback section
  ✓ Display QA reviewer name/email
  ✓ Display feedback text (from qa_reviews.feedback)
  ✓ Display rejection timestamp
  ✓ Show action: "Resubmit evidence with corrections"
  ✓ Highlight feedback section for visibility
```

---

## 🛠️ Tasks

### Phase 1: Status Display Enhancement

- [ ] **T-2.4.1: Enhance task detail status display**
  - Subtasks:
    - [ ] Update status colors/styling in /app/(dashboard)/tasks/[id]/page.tsx
    - [ ] Verify all 6 statuses have appropriate colors
    - [ ] Make badge prominent (larger, bold, positioned top)
    - [ ] Add priority badge alongside status badge
    - [ ] Verify accessibility (good contrast, readable)

- [ ] **T-2.4.2: Create status timeline component**
  - Subtasks:
    - [ ] Create /app/components/tasks/TaskStatusTimeline.tsx
    - [ ] Display list of status changes from audit logs
    - [ ] Show: timestamp, old_status, new_status, actor
    - [ ] Order chronologically (newest first)
    - [ ] Format dates in pt-BR locale
    - [ ] Add visual timeline indicator (vertical line)
    - [ ] Show empty state if no history

### Phase 2: Real-Time Updates

- [ ] **T-2.4.3: Implement status polling**
  - Subtasks:
    - [ ] Add useEffect hook to task detail page
    - [ ] Poll /api/tasks/{id} every 5 seconds
    - [ ] Compare current status with previous
    - [ ] Update UI if status changed
    - [ ] Show subtle notification on change
    - [ ] Clear polling on page unmount

- [ ] **T-2.4.4: Add optimistic updates**
  - Subtasks:
    - [ ] On form submit (evidence, QA review), update UI optimistically
    - [ ] Don't wait for server response to show new status
    - [ ] Still fetch from server for confirmation
    - [ ] Revert if server returns error
    - [ ] Show "Updating..." loading state

### Phase 3: Status History Integration

- [ ] **T-2.4.5: Fetch status history from audit logs**
  - Subtasks:
    - [ ] Query audit_logs table for task_id
    - [ ] Filter for operations: start_task, submit_task, qa_review, approve_task, reject_task
    - [ ] Join with users table to get reviewer names
    - [ ] Order by created_at DESC (newest first)
    - [ ] Pass history to TaskStatusTimeline component

- [ ] **T-2.4.6: Create API endpoint for status history**
  - Subtasks:
    - [ ] Create /app/api/tasks/{id}/status-history/route.ts (optional)
    - [ ] Or fetch from existing /api/tasks/{id} endpoint
    - [ ] Include audit log data with task details
    - [ ] Return status_history array in response

### Phase 4: QA Feedback Display

- [ ] **T-2.4.7: Display QA feedback section**
  - Subtasks:
    - [ ] Update task detail page QA Reviews section
    - [ ] If any review has status = 'rejected', show feedback
    - [ ] Display reviewer name/email
    - [ ] Display feedback text
    - [ ] Display rejection timestamp
    - [ ] Highlight with red/warning styling
    - [ ] Show action instructions (resubmit with corrections)

- [ ] **T-2.4.8: Handle multiple QA reviews**
  - Subtasks:
    - [ ] Support multiple QA reviews on same task
    - [ ] Show most recent review prominently
    - [ ] Show review history below
    - [ ] For rejection: show all feedback to executor
    - [ ] Allow executor to respond/resubmit

### Phase 5: Testing & Validation

- [ ] **T-2.4.9: Test status display and updates**
  - Subtasks:
    - [ ] Test: All 6 statuses display correct color
    - [ ] Test: Status updates on form submit
    - [ ] Test: Polling updates UI every 5 seconds
    - [ ] Test: Status history shows all transitions
    - [ ] Test: Rejection feedback visible with rejected status
    - [ ] Test: Multiple QA reviews handled correctly
    - [ ] Test: Timeline ordered correctly (newest first)

---

## 📝 Dev Notes

### Status Flow Diagram
```
pending → (executor starts) → in_progress
in_progress → (executor submits) → submitted
submitted → (automatic) → qa_review
qa_review → (QA approves) → approved
qa_review → (QA rejects) → rejected
rejected → (executor resubmits) → submitted
```

### Color Scheme
```javascript
const statusColors = {
  pending: 'bg-gray-100 text-gray-700',      // Not started
  in_progress: 'bg-blue-100 text-blue-700',  // Active work
  submitted: 'bg-yellow-100 text-yellow-700', // Waiting for QA
  qa_review: 'bg-purple-100 text-purple-700', // Under review
  approved: 'bg-green-100 text-green-700',   // Done ✓
  rejected: 'bg-red-100 text-red-700',       // Needs rework
};
```

### Audit Log Query Pattern
```typescript
const { data: auditLogs } = await supabase
  .from('audit_logs')
  .select('id, operation, old_value, new_value, created_by, created_at')
  .eq('table_name', 'tasks')
  .eq('record_id', taskId)
  .order('created_at', { ascending: false });
```

### Status Transition Tracking
Look for these audit operations:
- 'start_task' - pending → in_progress
- 'submit_task' - in_progress → submitted
- 'qa_review' - submitted → qa_review
- 'approve_task' - qa_review → approved
- 'reject_task' - qa_review → rejected
- 'resubmit_task' - rejected → submitted

### Polling Implementation
```typescript
useEffect(() => {
  if (!taskId) return;

  const pollInterval = setInterval(async () => {
    const res = await fetch(`/api/tasks/${taskId}`);
    const newTask = await res.json();

    if (newTask.status !== task.status) {
      setTask(newTask);
      showNotification(`Task status updated: ${newTask.status}`);
    }
  }, 5000); // 5 second interval

  return () => clearInterval(pollInterval);
}, [taskId, task.status]);
```

### RLS Consideration
- Users can only see status/history of their own tasks
- QA can see all tasks they review
- Admin sees all task statuses
- RLS policy on audit_logs enforces this

---

## 🧪 Testing Strategy

### Unit Tests
```bash
npm test -- task-status.test.ts

# Test cases:
- All 6 statuses render with correct colors
- Status timeline displays correctly
- Polling updates UI
- QA feedback displays when rejected
```

### Integration Tests
```bash
npm test -- task-status-flow.integration.test.ts

# Test cases:
- Full status flow: pending → in_progress → submitted → qa_review
- Rejection flow: qa_review → rejected → submitted
- User sees correct status and history
- Unauthorized users can't see status
```

### Manual Testing
- [ ] Login as executor with task
- [ ] See initial status (pending)
- [ ] Start task → status changes to in_progress
- [ ] Submit evidence → status changes to submitted
- [ ] Login as QA → approve task → status changes to approved
- [ ] See full timeline of changes
- [ ] Test rejection flow → see feedback
- [ ] Verify automatic polling updates

---

## 📁 File List

### New Files to Create
```
app/components/tasks/TaskStatusTimeline.tsx
tests/components/task-status-timeline.test.ts
tests/integration/task-status-flow.integration.test.ts
```

### Files to Modify
```
app/(dashboard)/tasks/[id]/page.tsx (enhance status display, add polling)
app/api/tasks/[id]/route.ts (verify returns status)
```

### Reuse from Story 1.4
```
Task detail page foundation
API task endpoint
```

---

## 🔍 Dev Agent Record

### Checkboxes Status
- [ ] Code implementation complete
- [ ] Status display enhanced
- [ ] Timeline component created
- [ ] Polling implemented
- [ ] Feedback display added
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Manual testing done
- [ ] CodeRabbit pre-commit review passed (0 CRITICAL)
- [ ] TypeScript strict mode verified
- [ ] ESLint passing
- [ ] Story ready for QA review

### Debug Log
- Started: [timestamp]
- Implementation approach: [notes]
- Issues encountered: [notes]
- Resolution notes: [notes]

### Completion Notes
- [Will be filled when complete]

### Change Log
- [Commits tracked here]

---

## 📞 Dependencies

**Blocking:**
- None - Can run in parallel with other stories

**Required Context:**
- Story 1.4 (Task detail page) ✅ Complete
- Story 1.1 (Audit logs) ✅ Complete
- Story 1.5 (Authentication) ✅ Complete

**Delegates to:**
- None - Self-contained

---

**Prepared by:** @aios-master (Orion)
**Date:** 2026-02-20
**Status:** Ready for @dev to implement
