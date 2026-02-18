# STORY 2.6 - MONITOR TEAM PROGRESS (Admin)

**Status:** Draft - Ready for Development
**Duration:** 1.5 days
**Priority:** High - Admin Oversight Feature
**Assigned to:** @dev (Dex)
**Created:** 2026-02-20

---

## 📋 Story Overview

As admin/head, I need to see team progress on tasks so I can manage workload, identify blockers, and adjust task assignments.

---

## ✅ Acceptance Criteria

```
AC-2.6.1: Team dashboard shows all tasks (not just mine)
  ✓ Dashboard accessible at /team
  ✓ Shows all tasks (not filtered by assigned_to)
  ✓ Visible only to admin or head role
  ✓ Shows task list with: title, assignee, priority, due date, status
  ✓ Pagination support (20-100 items)
  ✓ Sortable by: due date, status, priority, assignee
  ✓ Filterable by: status, assignee, priority

AC-2.6.2: Status breakdown visible
  ✓ Summary cards showing counts:
    - Pending (count + %)
    - In Progress (count + %)
    - Submitted (count + %)
    - QA Review (count + %)
    - Approved (count + %)
    - Rejected (count + %)
  ✓ Total tasks shown
  ✓ Color-coded cards matching status colors

AC-2.6.3: Time tracking per task and per person
  ✓ Time tracking stats visible:
    - Total hours logged per task
    - Hours logged per person
    - Average time per task
  ✓ Accessible from task detail or team dashboard
  ✓ Can filter by date range
  ✓ Shows person name with hours logged

AC-2.6.4: Burndown chart (tasks completed over time)
  ✓ Chart showing task completion trend
  ✓ X-axis: date (rolling 30 days)
  ✓ Y-axis: number of tasks completed
  ✓ Line chart showing completion velocity
  ✓ Hover tooltip shows exact count and date
  ✓ Used to forecast project completion

AC-2.6.5: Can reassign tasks
  ✓ Task detail page shows "Reassign" option
  ✓ Dropdown list of team members with executor role
  ✓ POST /api/tasks/{id}/reassign endpoint
  ✓ Validates user has admin/head role
  ✓ Updates task.assigned_to field
  ✓ Fires audit log and notification to new assignee
  ✓ Shows success message

AC-2.6.6: Can extend due dates
  ✓ Task detail shows current due date with edit button
  ✓ Click edit → date picker opens
  ✓ Can select new due date (must be future date)
  ✓ PUT /api/tasks/{id} updates due_date
  ✓ Validates user has admin/head role
  ✓ Fires audit log and notification to assignee
  ✓ Shows success message

AC-2.6.7: Can see QA review queue
  ✓ Shows pending QA reviews (tasks with status = submitted)
  ✓ Separate dashboard or section showing:
    - Task count pending review
    - Task titles pending review
    - Days since submission
    - Quick access link to /qa-reviews
  ✓ Shows count of pending reviews in header/nav
```

---

## 🛠️ Tasks

### Phase 1: Team Dashboard

- [ ] **T-2.6.1: Create team dashboard page**
  - Subtasks:
    - [ ] Create /app/(dashboard)/team/page.tsx
    - [ ] Require role = 'admin' OR 'head' (401 if not)
    - [ ] Fetch all tasks via GET /api/tasks (no filter)
    - [ ] Display task list with columns:
      - Task title (clickable to detail)
      - Assignee name
      - Priority (color badge)
      - Due date (formatted)
      - Status (color badge)
    - [ ] Add pagination (20-100 items)
    - [ ] Add sorting options (due date, status, priority, assignee)
    - [ ] Add filtering (status dropdown, assignee dropdown, priority)
    - [ ] Add loading and error states

- [ ] **T-2.6.2: Create status summary cards**
  - Subtasks:
    - [ ] Create /app/components/team/StatusSummary.tsx
    - [ ] Display 6 cards (one per status):
      - pending, in_progress, submitted, qa_review, approved, rejected
    - [ ] Each card shows:
      - Status name
      - Task count
      - Percentage of total
      - Color background matching status
    - [ ] Calculate percentages dynamically
    - [ ] Update when task data changes

### Phase 2: Analytics & Reporting

- [ ] **T-2.6.3: Create time tracking summary**
  - Subtasks:
    - [ ] Create /app/(dashboard)/team/time-logs/page.tsx
    - [ ] Fetch time logs via GET /api/time-logs
    - [ ] Group by task and by person
    - [ ] Display table with columns:
      - Task name
      - Person name
      - Total hours logged
      - Date range (from...to)
    - [ ] Add summary row showing total hours
    - [ ] Add date range filter
    - [ ] Add person filter
    - [ ] Add sorting and pagination

- [ ] **T-2.6.4: Create burndown chart**
  - Subtasks:
    - [ ] Create /app/components/team/BurndownChart.tsx
    - [ ] Use chart library (Recharts recommended)
    - [ ] X-axis: dates (rolling 30 days)
    - [ ] Y-axis: number of completed tasks
    - [ ] Calculate completions per day from audit logs
    - [ ] Query approved tasks by created date
    - [ ] Display as line chart
    - [ ] Add hover tooltip showing exact counts
    - [ ] Calculate trend line for forecast

- [ ] **T-2.6.5: Create QA review queue widget**
  - Subtasks:
    - [ ] Create /app/components/team/QAReviewQueue.tsx
    - [ ] Show count of tasks with status = 'submitted'
    - [ ] List task titles (max 5, show more link)
    - [ ] Show days since submission for each
    - [ ] Add "View all" link to /qa-reviews
    - [ ] Display as dashboard widget or card
    - [ ] Auto-update every minute

### Phase 3: Task Management Actions

- [ ] **T-2.6.6: Implement task reassignment**
  - Subtasks:
    - [ ] Add "Reassign" button to task detail page
    - [ ] Create reassignment dropdown (modal or inline)
    - [ ] List team members with executor role
    - [ ] POST to /api/tasks/{id}/reassign
    - [ ] Endpoint validates admin/head role
    - [ ] Updates task.assigned_to
    - [ ] Creates audit log entry
    - [ ] Sends notification to new assignee
    - [ ] Show success message
    - [ ] Refresh task detail

- [ ] **T-2.6.7: Implement due date extension**
  - Subtasks:
    - [ ] Add due date edit button to task detail
    - [ ] Click opens date picker modal
    - [ ] Validate new date is future date
    - [ ] PUT /api/tasks/{id} with new due_date
    - [ ] Endpoint validates admin/head role
    - [ ] Updates task.due_date
    - [ ] Creates audit log entry
    - [ ] Sends notification to assignee
    - [ ] Show success message
    - [ ] Update task detail display

### Phase 4: API Enhancements

- [ ] **T-2.6.8: Create reassignment endpoint**
  - Subtasks:
    - [ ] Create /app/api/tasks/{id}/reassign/route.ts
    - [ ] POST endpoint validates:
      - user has admin/head role
      - task exists
      - new_assigned_to user exists
    - [ ] Updates task.assigned_to
    - [ ] Updates task.updated_at
    - [ ] Creates audit log entry
    - [ ] Returns updated task (201)
    - [ ] Error handling (400, 403, 404)

- [ ] **T-2.6.9: Enhance PUT /api/tasks/{id} endpoint**
  - Subtasks:
    - [ ] Verify PUT endpoint can update due_date
    - [ ] Validate new due_date is future (if provided)
    - [ ] Allow admin/head to update
    - [ ] Create audit log on date change
    - [ ] Return updated task
    - [ ] Error handling (400, 403, 404)

- [ ] **T-2.6.10: Create time log aggregation API**
  - Subtasks:
    - [ ] Create /app/api/analytics/time-logs/route.ts
    - [ ] GET with optional filters:
      - ?task_id={id}
      - ?user_id={id}
      - ?date_from={date}
      - ?date_to={date}
    - [ ] Return aggregated data:
      - Total hours by task
      - Total hours by person
      - Daily breakdown
    - [ ] Return pagination metadata

### Phase 5: Dashboard Integration

- [ ] **T-2.6.11: Add team dashboard to sidebar**
  - Subtasks:
    - [ ] Update /app/components/layout/Sidebar.tsx
    - [ ] Add "/team" link visible to admin/head only
    - [ ] Add "/team/time-logs" link visible to admin only
    - [ ] Highlight active route
    - [ ] Order in navigation menu

- [ ] **T-2.6.12: Add stats to top of dashboard**
  - Subtasks:
    - [ ] Update /app/(dashboard)/dashboard/page.tsx
    - [ ] Show admin view (if admin/head role)
    - [ ] Display:
      - Total tasks count
      - Tasks in progress count
      - Pending QA reviews count
      - Overdue tasks count
    - [ ] Quick links to team dashboard

### Phase 6: Testing & Validation

- [ ] **T-2.6.13: Test team dashboard**
  - Subtasks:
    - [ ] Test: Only admin/head can access /team (401)
    - [ ] Test: Dashboard shows all tasks (not filtered)
    - [ ] Test: Sorting works (by due date, status, etc)
    - [ ] Test: Filtering works (by status, assignee, etc)
    - [ ] Test: Status counts are accurate
    - [ ] Test: Pagination works

- [ ] **T-2.6.14: Test reassignment and due date features**
  - Subtasks:
    - [ ] Test: Can reassign task to another person
    - [ ] Test: New assignee notified of reassignment
    - [ ] Test: Audit log created for reassignment
    - [ ] Test: Can extend due date
    - [ ] Test: Assignee notified of extension
    - [ ] Test: Cannot extend to past date (error)
    - [ ] Test: Only admin/head can reassign/extend

- [ ] **T-2.6.15: Test analytics and reporting**
  - Subtasks:
    - [ ] Test: Time log aggregation API works
    - [ ] Test: Burndown chart displays correctly
    - [ ] Test: Chart updates with new completed tasks
    - [ ] Test: QA review queue shows pending tasks
    - [ ] Test: Date filters work correctly

---

## 📝 Dev Notes

### Admin Dashboard vs Executor Dashboard
```
Executor (/dashboard):
- My Tasks (assigned_to = me)
- Can start, execute, submit evidence
- Can see own time logs
- Can see own task status

Admin/Head (/team):
- All Team Tasks
- Can reassign, extend due dates
- Can see all time logs
- Can see team progress metrics
```

### Team Role Requirements
```
- admin: Full access to all team management features
- head: Can reassign, extend dates, see team analytics
- executor: Can see own tasks only
- qa: Can access /qa-reviews for review tasks
```

### Status Breakdown Query
```typescript
const { data: statusCounts } = await supabase
  .from('tasks')
  .select('status')
  .then(({ data }) => {
    const counts = {};
    const statuses = ['pending', 'in_progress', 'submitted', 'qa_review', 'approved', 'rejected'];
    statuses.forEach(status => {
      counts[status] = data?.filter(t => t.status === status).length || 0;
    });
    return { data: counts };
  });
```

### Burndown Calculation
```typescript
// Get all approved tasks with their approval date
const { data: approvedTasks } = await supabase
  .from('tasks')
  .select('approved_at')  // or use audit_logs table
  .eq('status', 'approved')
  .order('approved_at', { ascending: true });

// Group by date and calculate cumulative
const burndown = approvedTasks.reduce((acc, task) => {
  const date = new Date(task.approved_at).toISOString().split('T')[0];
  acc[date] = (acc[date] || 0) + 1;
}, {});
```

### RLS Consideration
- Admin sees all tasks (via RLS policy for admin role)
- Head sees team tasks they manage
- Regular executor sees only own tasks
- Ensure RLS policies properly enforce visibility

---

## 🧪 Testing Strategy

### Unit Tests
```bash
npm test -- team-dashboard.test.ts
npm test -- status-summary.test.ts

# Test cases:
- Status counts calculated correctly
- Sorting works
- Filtering works
- Reassignment updates task
```

### Integration Tests
```bash
npm test -- team-management.integration.test.ts

# Test cases:
- Only admin/head can access /team
- All tasks visible (not filtered)
- Can reassign task
- Can extend due date
- Time logs aggregated correctly
- Burndown chart data correct
```

### Manual Testing
- [ ] Login as admin user
- [ ] Navigate to /team
- [ ] See all team tasks with status breakdown
- [ ] Sort by due date (nearest first)
- [ ] Filter by status (pending)
- [ ] Click task → see reassign button
- [ ] Reassign to another person
- [ ] See success message
- [ ] New assignee notified
- [ ] Extend due date
- [ ] Check time-logs dashboard
- [ ] Verify burndown chart displays

---

## 📁 File List

### New Files to Create
```
app/(dashboard)/team/page.tsx
app/(dashboard)/team/time-logs/page.tsx
app/components/team/StatusSummary.tsx
app/components/team/BurndownChart.tsx
app/components/team/QAReviewQueue.tsx
app/api/tasks/[id]/reassign/route.ts
app/api/analytics/time-logs/route.ts
tests/pages/team-dashboard.test.ts
tests/integration/team-management.integration.test.ts
```

### Files to Modify
```
app/(dashboard)/dashboard/page.tsx (add admin stats)
app/components/layout/Sidebar.tsx (add /team links)
app/(dashboard)/tasks/[id]/page.tsx (add reassign/extend)
app/api/tasks/[id]/route.ts (verify PUT support)
```

### Reuse from Story 1.4
```
Task list component patterns
API routing patterns
Authentication/authorization
```

---

## 🔍 Dev Agent Record

### Checkboxes Status
- [ ] Code implementation complete
- [ ] Team dashboard created
- [ ] Status summary component created
- [ ] Time tracking page created
- [ ] Burndown chart created
- [ ] QA review queue widget created
- [ ] Reassignment feature implemented
- [ ] Due date extension implemented
- [ ] API endpoints created/verified
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
- Story 2.1 (Task Execution) - For tasks to manage

**Required Context:**
- Story 1.4 (Dashboard foundation) ✅ Complete
- Story 1.1 (Database schema) ✅ Complete
- Story 1.5 (Authentication & roles) ✅ Complete

**Delegates to:**
- None - Self-contained

**Optional Dependencies:**
- Chart library (Recharts) for burndown chart

---

**Prepared by:** @aios-master (Orion)
**Date:** 2026-02-20
**Status:** Ready for @dev (after Story 2.1)
