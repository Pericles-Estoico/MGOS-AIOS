# STORY 3.6 - ANALYTICS DASHBOARD

**Status:** Done
**Duration:** 2-3 hours
**Priority:** Medium - Monitoring & Insights
**Assigned to:** @dev (Dex)
**Created:** 2026-02-18

---

## 📋 Story Overview

As a team lead, I need to see analytics and insights about team performance so I can monitor progress, identify bottlenecks, and optimize team efficiency.

---

## ✅ Acceptance Criteria

```
AC-3.6.1: Dashboard displays key metrics
  ✓ Total tasks count
  ✓ Tasks by status: pending, in_progress, submitted, qa_review, approved, rejected
  ✓ Average task completion time
  ✓ Tasks completed this sprint
  ✓ Team members count and active users
  ✓ Burndown chart (progress vs ideal)
  ✓ Task completion rate (% of tasks completed)

AC-3.6.2: Team Performance Section
  ✓ Team member list with stats: tasks assigned, completed, in progress
  ✓ Average time per task
  ✓ On-time completion rate
  ✓ Filter by team member
  ✓ Sparkline showing trend over last 7 days

AC-3.6.3: Task Distribution
  ✓ Tasks by status pie chart
  ✓ Tasks by priority pie chart
  ✓ Tasks by executor bar chart
  ✓ Overdue tasks count and list
  ✓ High-risk tasks (near deadline)

AC-3.6.4: Page Access Control
  ✓ Accessible to admin and head roles
  ✓ 403 forbidden for other roles
  ✓ Responsive layout (mobile, tablet, desktop)

AC-3.6.5: Performance Metrics
  ✓ Load time < 2 seconds
  ✓ Charts render smoothly
  ✓ Data updates without page refresh
```

---

## 🛠️ Tasks

### Phase 1: Analytics API Endpoints

- [x] **T-3.6.1: Create analytics data aggregation endpoint**
  - Subtasks:
    - [x] Create `/app/api/analytics/summary` endpoint
    - [x] Fetch metrics: task counts by status, team size, completion stats
    - [x] Calculate burndown: current progress vs ideal
    - [x] Return formatted JSON with all metrics
    - [x] Admin/head role check

- [x] **T-3.6.2: Create team performance endpoint**
  - Subtasks:
    - [x] Create `/app/api/analytics/team` endpoint
    - [x] Fetch per-team-member stats
    - [x] Calculate completion rate, avg time per task
    - [x] Support filtering by team member
    - [x] Return ranked by performance

### Phase 2: Dashboard UI Components

- [x] **T-3.6.3: Create Analytics Dashboard page**
  - Subtasks:
    - [x] Create `/app/(dashboard)/analytics/page.tsx`
    - [x] Add admin/head role check
    - [x] Display metrics summary (cards with numbers)
    - [x] Add loading and error states
    - [x] Responsive grid layout

- [x] **T-3.6.4: Create metrics cards component**
  - Subtasks:
    - [x] Component for metric cards (title, value, trend)
    - [x] Display: total tasks, completed, in progress, pending
    - [x] Color coding by status
    - [x] Icon for each metric type

### Phase 3: Charts & Visualizations

- [x] **T-3.6.5: Implement burndown chart**
  - Subtasks:
    - [x] Use simple SVG or library for chart
    - [x] Show actual progress vs ideal line
    - [x] X-axis: days in sprint
    - [x] Y-axis: tasks remaining
    - [x] Tooltip on hover

- [x] **T-3.6.6: Create task status distribution**
  - Subtasks:
    - [x] Pie/donut chart for task statuses
    - [x] Show count and percentage
    - [x] Color-coded by status
    - [x] Legend with status names

### Phase 4: Team Performance

- [x] **T-3.6.7: Team member performance table**
  - Subtasks:
    - [x] List all team members with stats
    - [x] Columns: name, tasks assigned, completed, in progress
    - [x] Calculate completion % and avg time per task
    - [x] Sort by completion rate
    - [x] Highlight top performers

---

## 📊 Dev Agent Record

### API Endpoints

**GET /api/analytics/summary**
```json
{
  "summary": {
    "total_tasks": 45,
    "tasks_by_status": {
      "pending": 5,
      "in_progress": 8,
      "submitted": 3,
      "qa_review": 2,
      "approved": 25,
      "rejected": 2
    },
    "team_size": 8,
    "active_users": 7,
    "tasks_completed_today": 3,
    "avg_completion_time_hours": 4.5,
    "completion_rate_percent": 61,
    "burndown": {
      "current_progress": 61,
      "expected_progress": 70,
      "days_remaining": 3
    }
  }
}
```

**GET /api/analytics/team**
```json
{
  "data": [
    {
      "user_id": "uuid",
      "name": "John Doe",
      "tasks_assigned": 5,
      "tasks_completed": 4,
      "tasks_in_progress": 1,
      "completion_rate": 80,
      "avg_time_per_task_hours": 3.2,
      "trend_7days": [1, 1, 0, 2, 1, 1, 1]
    }
  ]
}
```

---

## 🎨 MVP Layout

```
┌─ Analytics Dashboard ──────────────────┐
│                                        │
│  Metrics Row:                         │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│  │Tasks│ │Done │ │In P │ │Pending│  │
│  │ 45  │ │ 27  │ │  8  │ │  5  │   │
│  └─────┘ └─────┘ └─────┘ └─────┘   │
│                                        │
│  Charts Row:                          │
│  ┌────────────────┐ ┌──────────────┐ │
│  │ Burndown Chart │ │Task Status   │ │
│  │                │ │ (Pie Chart)  │ │
│  └────────────────┘ └──────────────┘ │
│                                        │
│  Team Performance Table:              │
│  ┌─────────────────────────────────┐ │
│  │ Name    │ Tasks │ Completed │ %│ │
│  │─────────┼───────┼───────────┼─│ │
│  │ John    │   5   │     4     │80│ │
│  │ Jane    │   4   │     4     │100│ │
│  └─────────────────────────────────┘ │
│                                        │
└────────────────────────────────────────┘
```

---

## 📝 Notes

- MVP focuses on essential metrics, charts can be simple SVG or HTML tables
- Use existing data from tasks table (no new schema needed)
- Charts can be added incrementally
- Real-time updates optional (page refresh is acceptable MVP)
- Team performance can use aggregation queries on tasks table

---

## ✅ Definition of Done

- [x] All metrics displaying correctly
- [x] API endpoints returning valid JSON
- [x] UI responsive and accessible
- [x] Admin/head role enforcement
- [x] Load time < 2 seconds
- [x] Lint and build passing
- [x] Basic smoke tests
- [x] Deployed to staging
- [x] Deployed to production
