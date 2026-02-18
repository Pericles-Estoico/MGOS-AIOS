# STORY 3.3 - QA REVIEW SYSTEM

**Status:** Ready for Development
**Duration:** 1.5-2 hours
**Priority:** HIGH - Core Workflow
**Assigned to:** @dev (Dex)
**Created:** 2026-02-18

---

## 📋 Story Overview

As a QA member, I need to review submitted tasks, provide feedback, and approve/reject them so I can maintain quality standards and help the team improve their work.

---

## ✅ Acceptance Criteria

```
AC-3.3.1: QA Review Page
  ✓ List tasks with status = "submitted"
  ✓ Show: title, executor, submission date, priority
  ✓ Filter by status, priority, executor
  ✓ Search by title
  ✓ Pagination (10 per page)
  ✓ Only QA role can access

AC-3.3.2: Review Modal
  ✓ Click task → open review modal
  ✓ Display task details (full description)
  ✓ Show evidence (attached files/links)
  ✓ Display previous feedback (if any)
  ✓ Action buttons: Approve | Request Changes | Reject

AC-3.3.3: Approve Task
  ✓ Click "Approve"
  ✓ Task status → "approved"
  ✓ Task no longer appears in QA review list
  ✓ Executor receives email notification
  ✓ Log audit entry
  ✓ Update task.updated_at

AC-3.3.4: Request Changes
  ✓ Click "Request Changes"
  ✓ Modal appears for feedback
  ✓ QA writes detailed feedback
  ✓ Task status → "in_progress" (back to executor)
  ✓ Executor receives email with feedback
  ✓ Feedback appears in task history
  ✓ Log audit entry

AC-3.3.5: Reject Task
  ✓ Click "Reject"
  ✓ Modal for reason
  ✓ Task status → "rejected"
  ✓ Executor receives email
  ✓ Appears in rejected tasks list
  ✓ Executor can resubmit later
  ✓ Log audit entry

AC-3.3.6: Review History
  ✓ Display all QA reviews for a task
  ✓ Show: date, QA member, action, feedback
  ✓ Chronological order (newest first)
  ✓ Expandable feedback details

AC-3.3.7: Notifications
  ✓ Email sent to executor on approve
  ✓ Email sent to executor on request changes
  ✓ Email sent to executor on reject
  ✓ Emails include feedback if applicable
  ✓ Honor notification preferences
```

---

## 🛠️ Tasks

### Phase 1: API Endpoints

- [ ] **T-3.3.1: Create QA review endpoints**
  - [ ] GET /api/qa-reviews → List submitted tasks
  - [ ] POST /api/qa-reviews → Create review (approve/request changes/reject)
  - [ ] GET /api/qa-reviews/[task-id] → Get review history

### Phase 2: QA Review Page

- [ ] **T-3.3.2: Create QA reviews page**
  - [ ] Route: /qa-reviews
  - [ ] List tasks with status = "submitted"
  - [ ] Filter, search, pagination
  - [ ] Click task → open review modal

### Phase 3: Review Modal & Actions

- [ ] **T-3.3.3: Create review modal component**
  - [ ] Display task details
  - [ ] Show evidence
  - [ ] Three action buttons: Approve / Request Changes / Reject

- [ ] **T-3.3.4: Implement approve logic**
  - [ ] Update task status → approved
  - [ ] Send notification email
  - [ ] Log audit entry

- [ ] **T-3.3.5: Implement request changes**
  - [ ] Open feedback modal
  - [ ] Update task status → in_progress
  - [ ] Send email with feedback
  - [ ] Store feedback in task history

- [ ] **T-3.3.6: Implement reject logic**
  - [ ] Open reason modal
  - [ ] Update task status → rejected
  - [ ] Send rejection email
  - [ ] Store in audit log

### Phase 4: Review History

- [ ] **T-3.3.7: Display review history**
  - [ ] Show all reviews for a task
  - [ ] Chronological order
  - [ ] Expandable feedback

---

## ✅ Definition of Done

- [ ] API endpoints implemented and tested
- [ ] QA reviews page built
- [ ] Review modal with all actions working
- [ ] Email notifications sent
- [ ] Audit logging complete
- [ ] All tests passing
- [ ] Lint and build passing
- [ ] Deployed to staging
- [ ] Deployed to production

---

## 📊 Dev Agent Record (To be filled)

**Status:** Ready for @dev to implement
**Effort:** 1.5-2 hours
**Complexity:** MEDIUM
