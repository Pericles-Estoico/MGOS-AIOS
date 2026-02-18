# STORY 2.5 - REVIEW EVIDENCE (QA)

**Status:** Draft - Ready for Development
**Duration:** 1.5 days
**Priority:** Critical - Core QA Workflow
**Assigned to:** @dev (Dex)
**Created:** 2026-02-20

---

## 📋 Story Overview

As a QA reviewer, I need to review submitted evidence so I can approve or request changes to task completion.

---

## ✅ Acceptance Criteria

```
AC-2.5.1: QA dashboard shows tasks needing review
  ✓ Dashboard page accessible at /qa-reviews
  ✓ Shows only tasks with status = 'submitted'
  ✓ Shows only to users with role = 'qa'
  ✓ List shows: task title, executor name, submission date, priority
  ✓ Pagination support (20-100 items)
  ✓ "No tasks pending review" message if empty

AC-2.5.2: Can view evidence (file URL)
  ✓ Clicking task opens review detail page
  ✓ Shows task information at top
  ✓ Evidence section displays:
    - File URL (clickable link)
    - Description (if provided)
    - Submission timestamp
  ✓ Can open evidence in new tab
  ✓ Can preview if possible (PDF, image, etc)

AC-2.5.3: Can see executor's description
  ✓ Shows description provided during evidence submission
  ✓ Displayed alongside file URL
  ✓ Formatted clearly (italics, lighter color)
  ✓ "No description provided" if empty

AC-2.5.4: Can submit review (approved/rejected/changes_requested)
  ✓ Review form visible on review detail page
  ✓ Radio buttons or dropdown for status:
    - approved (task is done correctly)
    - rejected (task not done, start over)
    - changes_requested (task mostly done, minor fixes)
  ✓ Feedback text area (required, 10-1000 chars)
  ✓ Submit button creates QA review record
  ✓ Success message on submit

AC-2.5.5: Can add detailed feedback
  ✓ Feedback textarea required (QA must comment)
  ✓ Min 10 characters, max 1000 characters
  ✓ Character counter visible
  ✓ Saved to qa_reviews.feedback field
  ✓ Visible to executor

AC-2.5.6: Review linked to task ID
  ✓ qa_reviews.task_id matches task
  ✓ qa_reviews.reviewed_by matches session user
  ✓ Each task can have multiple reviews
  ✓ Most recent review is primary
  ✓ Review history shows all reviews

AC-2.5.7: Executor notified of review result
  ✓ After QA submits review, notification sent
  ✓ Notification appears in executor's app
  ✓ Email notification (optional, Phase 5)
  ✓ Notification includes feedback text
```

---

## 🛠️ Tasks

### Phase 1: QA Dashboard

- [ ] **T-2.5.1: Create QA dashboard page**
  - Subtasks:
    - [ ] Create /app/(dashboard)/qa-reviews/page.tsx
    - [ ] Require role = 'qa' (401 if not)
    - [ ] Fetch tasks with status = 'submitted'
    - [ ] Use GET /api/tasks?status=submitted (need to add filter)
    - [ ] Display task list with columns:
      - Task title (clickable)
      - Executor name
      - Submission date
      - Priority badge
    - [ ] Add pagination (20-100 items)
    - [ ] Add empty state message
    - [ ] Add loading state

- [ ] **T-2.5.2: Create review detail page**
  - Subtasks:
    - [ ] Create /app/(dashboard)/qa-reviews/[taskId]/page.tsx
    - [ ] Load task details from /api/tasks/{taskId}
    - [ ] Load evidence from /api/evidence?task_id={taskId}
    - [ ] Display task info at top
    - [ ] Display evidence items
    - [ ] Show executor name and info
    - [ ] Add review form section

### Phase 2: Evidence Display

- [ ] **T-2.5.3: Display evidence for review**
  - Subtasks:
    - [ ] Show file URL as clickable link
    - [ ] Open in new tab (target="_blank")
    - [ ] Show evidence description if provided
    - [ ] Format submission timestamp (pt-BR)
    - [ ] Show "No description" if empty
    - [ ] Add file icon or indicator
    - [ ] Support preview for common types (images, PDFs)

### Phase 3: QA Review Form

- [ ] **T-2.5.4: Create QAReviewForm enhancement**
  - Subtasks:
    - [ ] Review /app/components/forms/QAReviewForm.tsx from Story 1.4
    - [ ] Add three review status options:
      - approved: ✓ Task is done correctly
      - rejected: ✗ Needs to start over
      - changes_requested: ⚠ Minor fixes needed
    - [ ] Add feedback textarea (required, 10-1000 chars)
    - [ ] Add character counter
    - [ ] Verify form validation
    - [ ] Add error/success messages

- [ ] **T-2.5.5: Integrate review form into detail page**
  - Subtasks:
    - [ ] Add review form to /app/(dashboard)/qa-reviews/[taskId]/page.tsx
    - [ ] Form visible only to QA users
    - [ ] Show form below evidence section
    - [ ] Post to /api/qa-reviews endpoint
    - [ ] On success: redirect to dashboard or show next task
    - [ ] On error: show error message

### Phase 4: API Enhancements

- [ ] **T-2.5.6: Create/verify QA review endpoints**
  - Subtasks:
    - [ ] Verify GET /api/tasks?status=submitted filter (may need update)
    - [ ] Verify GET /api/qa-reviews endpoint
    - [ ] Verify POST /api/qa-reviews endpoint
    - [ ] Ensure POST validates:
      - task_id exists
      - status in [approved, rejected, changes_requested]
      - feedback length 10-1000 chars
      - user has role = 'qa'
    - [ ] POST returns 201 with created review
    - [ ] POST updates task.status → qa_review
    - [ ] Add error handling (400, 403, 404)

- [ ] **T-2.5.7: Create task status update endpoint**
  - Subtasks:
    - [ ] Create /app/api/tasks/{id}/status/route.ts (if not exist)
    - [ ] Or use PUT /app/api/tasks/{id}/route.ts
    - [ ] POST /api/qa-reviews should update task.status
    - [ ] On POST: task.status = 'qa_review'
    - [ ] If review status = 'approved': task.status = 'approved'
    - [ ] If review status = 'rejected': task.status = 'rejected'
    - [ ] Update task.updated_at
    - [ ] Fire audit log

### Phase 5: Notifications (Optional)

- [ ] **T-2.5.8: Create review notification**
  - Subtasks:
    - [ ] After QA submits review, create notification record
    - [ ] Send to executor assigned to task
    - [ ] Include: task title, review status, feedback text
    - [ ] Store in notifications table
    - [ ] Display in executor's notification center

### Phase 6: Testing & Validation

- [ ] **T-2.5.9: Test QA review flow**
  - Subtasks:
    - [ ] Test: QA user sees only submitted tasks
    - [ ] Test: Non-QA user cannot access /qa-reviews (401)
    - [ ] Test: Clicking task navigates to review detail
    - [ ] Test: Evidence displays correctly
    - [ ] Test: Can submit approval
    - [ ] Test: Can submit rejection with feedback
    - [ ] Test: Can submit changes_requested
    - [ ] Test: Feedback required (10-1000 chars)
    - [ ] Test: Review saved to database
    - [ ] Test: Task status updated appropriately
    - [ ] Test: Executor receives notification

---

## 📝 Dev Notes

### QA Review Status Workflow
```
Task submitted (status = 'submitted')
↓
QA views task and evidence
↓
QA submits review with status:
  - approved → task.status = 'approved' (done)
  - rejected → task.status = 'rejected' (executor resubmit)
  - changes_requested → task.status = 'qa_review' (pending rework)
```

### QAReviewForm Component
Already implemented in Story 1.4:
- Location: `/app/components/forms/QAReviewForm.tsx`
- Accepts taskId prop
- Has onSubmit callback
- Handles form validation and API integration

### API Filter Enhancement
Need to add status filter to GET /api/tasks:
```typescript
export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');

  let query = supabase.from('tasks').select(...);

  if (status) {
    query = query.eq('status', status);
  }

  // ... rest of implementation
}
```

### Notification Pattern
After creating qa_reviews record:
```typescript
await supabase.from('notifications').insert({
  user_id: task.assigned_to,
  title: `Review Complete: ${task.title}`,
  message: `Your task was ${review.status}. ${review.feedback}`,
  link: `/tasks/${task.id}`,
  read: false,
});
```

### RLS Consideration
- Only QA users can access /qa-reviews dashboard
- Only assigned executor can see reviews for their tasks
- Admin can see all reviews
- RLS enforces task visibility

---

## 🧪 Testing Strategy

### Unit Tests
```bash
npm test -- qa-review-form.test.ts

# Test cases:
- Form renders with 3 status options
- Feedback required and validated
- Character counter works
- Submit creates review record
```

### Integration Tests
```bash
npm test -- qa-review-flow.integration.test.ts

# Test cases:
- QA dashboard shows only submitted tasks
- Clicking task opens review detail
- Evidence displays correctly
- Review submission updates task status
- Executor gets notification
- Only QA role can access
```

### Manual Testing
- [ ] Login as QA user
- [ ] See /qa-reviews dashboard
- [ ] Dashboard shows only submitted tasks
- [ ] Click task to open review detail
- [ ] See evidence and executor description
- [ ] Click evidence URL → opens in new tab
- [ ] Submit review (approved)
- [ ] Verify task status changes
- [ ] Login as executor
- [ ] See notification of approval
- [ ] See review feedback

---

## 📁 File List

### New Files to Create
```
app/(dashboard)/qa-reviews/page.tsx
app/(dashboard)/qa-reviews/[taskId]/page.tsx
tests/components/qa-review-form.test.ts
tests/integration/qa-review-flow.integration.test.ts
```

### Files to Modify
```
app/components/forms/QAReviewForm.tsx (verify/enhance from 1.4)
app/api/tasks/route.ts (add status filter)
app/api/qa-reviews/route.ts (verify from 1.4)
```

### Reuse from Story 1.4
```
app/components/forms/QAReviewForm.tsx
app/api/qa-reviews/route.ts
app/(dashboard)/layout.tsx (protected base)
```

---

## 🔍 Dev Agent Record

### Checkboxes Status
- [ ] Code implementation complete
- [ ] QA dashboard created
- [ ] Review detail page created
- [ ] QAReviewForm enhanced
- [ ] API endpoints verified/created
- [ ] Status updates implemented
- [ ] Notifications implemented
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
- Story 2.3 (Submit Evidence) - For evidence to review

**Required Context:**
- Story 1.4 (QAReviewForm component) ✅ Complete
- Story 1.1 (Database schema) ✅ Complete
- Story 1.5 (Authentication) ✅ Complete

**Delegates to:**
- None - Self-contained

---

**Prepared by:** @aios-master (Orion)
**Date:** 2026-02-20
**Status:** Ready for @dev (after Story 2.3)
