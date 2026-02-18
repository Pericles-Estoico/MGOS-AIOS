# EPIC 2 - TASK EXECUTION & TIMER WORKFLOWS
## Product Requirements Document

**Status:** Draft - Ready for Kickoff
**Date:** 2026-02-20
**Duration Estimate:** 3-5 days
**Kickoff:** Thursday, 2026-02-20 09:00 UTC

---

## 🎯 Executive Summary

Epic 2 builds on the foundation (Database + Auth + Components) to implement the core task execution workflow. Users can execute assigned tasks, track work time with a timer, submit evidence, and manage task status transitions. Administrators monitor team progress and validate task completion.

**Foundation Ready:**
- ✅ Database with task schema (Story 1.1)
- ✅ Authentication & authorization (Story 1.5)
- ✅ Dashboard & API routes (Story 1.4)
- ✅ Component library (Story 1.4)

**New Capabilities:**
- 🆕 Task execution workflows
- 🆕 Timer integration
- 🆕 Evidence collection & verification
- 🆕 Task status management
- 🆕 Admin oversight
- 🆕 Real-time notifications

---

## 📊 Business Objectives

| Objective | Success Metric |
|-----------|---|
| Users can execute assigned tasks | 100% task completion rate |
| Work time is accurately tracked | Timer ±1 second accuracy |
| Evidence is collected systematically | 100% task evidence submission |
| Task status visibility | Real-time status updates |
| Administrators have oversight | Admin dashboard with metrics |
| Team collaboration | Notifications for task changes |

---

## 👥 User Stories (Acceptance Criteria)

### User Role: Executor (Task Doer)

**US 2.1: Execute Assigned Task**
```
As an executor
I want to see my assigned tasks and start execution
So I can begin work and track time

AC:
  ✓ Dashboard shows "My Tasks" list (filtered by assigned_to = current_user)
  ✓ Can click task to open detail page
  ✓ Detail page shows: title, description, due date, priority
  ✓ Can start timer to begin work tracking
  ✓ Task status changes to "in_progress" when timer starts
```

**US 2.2: Track Work Time**
```
As an executor
I want a timer to track how long I work on each task
So I can log accurate time entries

AC:
  ✓ Timer component visible on task detail page
  ✓ Timer shows MM:SS format (00:00 to 99:59)
  ✓ Start button begins counting
  ✓ Pause button pauses (doesn't reset)
  ✓ Stop button ends session and opens time log form
  ✓ Reset button clears timer to 00:00
  ✓ Time logged in minutes (rounded up)
```

**US 2.3: Submit Evidence**
```
As an executor
I want to submit evidence that I've completed the task
So the QA team can review my work

AC:
  ✓ Evidence form visible on task detail page
  ✓ Can upload file (URL or file input)
  ✓ Can add description (optional)
  ✓ Submit creates evidence record
  ✓ Evidence linked to task ID
  ✓ Evidence timestamp recorded
  ✓ Executor can see submitted evidence
```

**US 2.4: View Task Status**
```
As an executor
I want to see the current status of my task
So I know where it stands in the workflow

AC:
  ✓ Task detail shows status badge: pending → in_progress → submitted → qa_review → approved/rejected
  ✓ Status updates real-time
  ✓ Can see history of status changes
  ✓ Can see QA feedback if rejected
```

### User Role: QA Reviewer

**US 2.5: Review Evidence**
```
As a QA reviewer
I want to review submitted evidence
So I can approve or request changes

AC:
  ✓ QA dashboard shows tasks needing review
  ✓ Can view evidence (file URL)
  ✓ Can see executor's description
  ✓ Can submit review: approved / rejected / changes_requested
  ✓ Can add detailed feedback
  ✓ Review linked to task ID
  ✓ Executor notified of review result
```

### User Role: Admin/Head

**US 2.6: Monitor Team Progress**
```
As admin/head
I want to see team progress on tasks
So I can manage workload and identify blockers

AC:
  ✓ Team dashboard shows all tasks (not just mine)
  ✓ Status breakdown: pending, in_progress, submitted, qa_review, approved, rejected
  ✓ Time tracking per task and per person
  ✓ Burndown chart (tasks completed over time)
  ✓ Can reassign tasks
  ✓ Can extend due dates
  ✓ Can see QA review queue
```

**US 2.7: Receive Notifications**
```
As any user
I want to receive notifications on task changes
So I know when action is needed

AC:
  ✓ Task assigned → Executor notified
  ✓ Task status changes → Related users notified
  ✓ QA review complete → Executor notified
  ✓ Comment added → Watchers notified
  ✓ Notifications in-app (toast + notification center)
  ✓ Can subscribe/unsubscribe to notifications
```

---

## 🏗️ Technical Architecture

### Database Schema Extensions

**No new tables** (all covered in Story 1.1):
- tasks (title, description, status, priority, assigned_to, due_date, created_by)
- time_logs (task_id, user_id, duration_minutes, logged_date)
- evidence (task_id, file_url, description, created_by)
- qa_reviews (task_id, status, feedback, reviewed_by)

### API Routes (New in Epic 2)

```
TASK EXECUTION:
  POST /api/tasks/:id/start           Start task (status: in_progress)
  POST /api/tasks/:id/submit          Submit for review (status: submitted)
  POST /api/tasks/:id/reassign        Reassign to another user (admin)

TIME TRACKING:
  POST /api/time-logs                 Log time entry
  GET /api/time-logs?task_id=         View time logs for task
  PUT /api/time-logs/:id              Update time log

EVIDENCE:
  POST /api/evidence                  Submit evidence
  GET /api/evidence?task_id=          View evidence for task
  DELETE /api/evidence/:id            Delete evidence (executor only)

QA REVIEWS:
  POST /api/qa-reviews                Submit review (QA role)
  GET /api/qa-reviews?task_id=        View reviews for task
  GET /api/qa-reviews?status=pending  Get pending reviews (QA dashboard)

NOTIFICATIONS:
  POST /api/notifications             Create notification
  GET /api/notifications              Get user notifications
  PUT /api/notifications/:id/read     Mark as read
```

### Frontend Components

**New/Enhanced:**
- TaskExecutionView - Main task execution page
- TaskStatusTimeline - Status history & QA feedback
- TimerWidget - Stopwatch component (integrated from 1.4)
- EvidenceUpload - Evidence submission (integrated from 1.4)
- QAReviewForm - Review submission (integrated from 1.4)
- TeamDashboard - Workload visibility (enhanced from 1.4)
- NotificationCenter - Notifications UI

### RLS Policy Updates

```sql
-- Story 1.1 RLS covers task access
-- Epic 2 adds:
--   1. time_logs - users can see own logs, admin/head see all
--   2. qa_reviews - QA can create, all can read their own
--   3. evidence - creators can delete, others can read
```

---

## 🎯 Definition of Done

A story is complete when:

- [ ] All acceptance criteria met
- [ ] API routes tested (manual + automated)
- [ ] RLS policies verified
- [ ] Component tests passing
- [ ] TypeScript strict mode passing
- [ ] ESLint passing
- [ ] Build passes
- [ ] CodeRabbit 0 CRITICAL issues
- [ ] Documentation updated
- [ ] Ready for QA review

---

## 📅 Timeline

```
DAY 1 (Feb 20 - Thursday):
  ├─ 09:00 - Epic 2 Kickoff
  ├─ 10:00 - Story 2.1 (Task Execution) starts
  ├─ 12:00 - Story 2.2 (Timer) starts (parallel)
  └─ 17:00 - Daily sync

DAY 2 (Feb 21 - Friday):
  ├─ 09:00 - Stories 2.3, 2.4 start (parallel)
  ├─ 13:00 - Stories 2.1, 2.2 review + integration
  └─ 17:00 - Daily sync

DAY 3 (Feb 22 - Saturday):
  ├─ 09:00 - Stories 2.5, 2.6 (Admin features)
  ├─ 13:00 - All stories integration
  ├─ 15:00 - CodeRabbit validation
  └─ 18:00 - Full QA review

DAY 4 (Feb 23 - Sunday):
  ├─ 10:00 - Bug fixes & refinements
  ├─ 14:00 - Final testing
  ├─ 16:00 - Ready for Review
  └─ 18:00 - Final push to main

TARGET COMPLETION: Feb 24 (Ready for Epic 3)
```

---

## 🚫 Out of Scope (Epic 3+)

- [ ] Advanced analytics & reporting
- [ ] Task templates & cloning
- [ ] Recurring tasks
- [ ] Subtasks / nested tasks
- [ ] File upload (currently expecting URLs)
- [ ] Real-time collaboration
- [ ] Offline mode
- [ ] Mobile app

---

## ✅ Success Metrics

| Metric | Target |
|--------|--------|
| All 6 stories complete | 100% |
| Code coverage | >80% |
| Build passes | 100% |
| CodeRabbit CRITICAL issues | 0 |
| Performance (API response) | <500ms |
| Uptime | 99.9% |
| User satisfaction | >4/5 |

---

## 📞 Stakeholders & Contacts

| Role | Name | Contact |
|------|------|---------|
| Product Owner | @pm | Create stories, manage scope |
| Tech Lead | @architect | Architecture decisions |
| Backend Dev | @dev | Story implementation |
| Database | @data-engineer | Schema, indexing, RLS |
| QA | @qa | Testing, validation |
| DevOps | @github-devops | Push, CI/CD, releases |

---

## 📝 Notes

- Epic 2 builds directly on Epic 1 foundation - no new dependencies
- All RLS policies already in place (Story 1.1)
- Component library ready for reuse (Story 1.4)
- Timer integration (from Story 1.4) ready to use
- Evidence & QA forms (from Story 1.4) ready to integrate

---

**Status:** Ready for Epic Kickoff
**Approved by:** @aios-master (Orion)
**Date:** 2026-02-20

