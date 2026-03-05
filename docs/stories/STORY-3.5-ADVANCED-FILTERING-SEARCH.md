# STORY 3.5 - ADVANCED FILTERING & SEARCH

**Status:** Done
**Duration:** 1-1.5 hours
**Priority:** HIGH - Core Workflow
**Assigned to:** @dev (Dex)
**Created:** 2026-02-18

---

## 📋 Story Overview

As a user, I need advanced filtering and full-text search across all task lists so I can quickly find relevant tasks by various criteria (status, priority, executor, tags, due date range).

---

## ✅ Acceptance Criteria

```
AC-3.5.1: Task Search
  ✓ Full-text search on task title and description
  ✓ Search results update in real-time (debounced)
  ✓ Search works across all pages
  ✓ Keyboard shortcut: Cmd+K or Ctrl+K to focus search
  ✓ Search history (last 5 searches)
  ✓ Clear search button

AC-3.5.2: Advanced Filters
  ✓ Filter by status (all, assigned, in_progress, submitted, approved, rejected)
  ✓ Filter by priority (low, medium, high, critical)
  ✓ Filter by executor (assigned user)
  ✓ Filter by due date range (past due, due this week, due this month, not set)
  ✓ Filter by tags (multi-select)
  ✓ Filter by sprint (if applicable)

AC-3.5.3: Filter Persistence
  ✓ Save filter state in URL query params
  ✓ Save filter state in localStorage for user preference
  ✓ Restore filters on page load
  ✓ Share filters via URL (copy filter URL)

AC-3.5.4: Filter UI
  ✓ Collapsible filter sidebar
  ✓ Filter badges showing active filters
  ✓ "Clear all filters" button
  ✓ Filter count indicator
  ✓ Mobile-responsive filters (dropdown instead of sidebar)

AC-3.5.5: Search Analytics
  ✓ Track popular searches
  ✓ Display search suggestions based on user history
  ✓ No personal data in search analytics
  ✓ Analytics available only to admins

AC-3.5.6: Performance
  ✓ Search results load < 500ms
  ✓ Filters apply < 200ms
  ✓ Database queries optimized with indexes
  ✓ Pagination on large result sets (max 100 per page)
```

---

## 🛠️ Tasks

### Phase 1: Search Infrastructure

- [x] **T-3.5.1: Add full-text search index to PostgreSQL**
  - [x] Create GIN index on task title and description
  - [x] Add search_vector column with tsvector
  - [x] Create trigger for automatic search_vector update

### Phase 2: Filter API

- [x] **T-3.5.2: Create advanced filters API endpoint**
  - [x] GET /api/tasks/search → Execute search with filters
  - [x] Support query params: q (search), status, priority, executor, due_date_from, due_date_to, tags, sprint
  - [x] Return paginated results with total count

### Phase 3: Frontend UI

- [x] **T-3.5.3: Create search bar component**
  - [x] Global search component with Cmd+K shortcut
  - [x] Search history dropdown
  - [x] Real-time search results with debounce

- [x] **T-3.5.4: Create advanced filters sidebar**
  - [x] Collapsible filter panel
  - [x] Multi-select filters with checkboxes
  - [x] Date range picker for due dates
  - [x] Filter badges showing active filters

- [x] **T-3.5.5: Integrate filters into task lists**
  - [x] Update Dashboard to use new search/filters
  - [x] Update My Tasks page with filters
  - [x] Update Sprint page with filters
  - [x] Update QA Reviews page with filters

### Phase 4: Filter Persistence & Analytics

- [x] **T-3.5.6: Implement filter persistence**
  - [x] Save to URL query params
  - [x] Save to localStorage
  - [x] Generate shareable filter URLs

- [x] **T-3.5.7: Add search analytics**
  - [x] Track popular searches
  - [x] Generate search suggestions
  - [x] Admin analytics dashboard

---

## ✅ Definition of Done

- [x] Full-text search index created and working
- [x] Advanced filters API implemented and tested
- [x] Search bar component with Cmd+K shortcut working
- [x] Filter sidebar with all filter types
- [x] Task lists integrated with new search/filters
- [x] Filter persistence in URL and localStorage
- [x] Search analytics tracking
- [x] All tests passing (target: 140+ total tests)
- [x] Performance: search < 500ms, filters < 200ms
- [x] Lint and build passing
- [x] Deployed to production

---

## 📊 Dev Agent Record (To be filled)

**Status:** Done
**Effort:** 1-1.5 hours
**Complexity:** MEDIUM

