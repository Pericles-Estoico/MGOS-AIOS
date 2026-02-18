# STORY 2.2 - TRACK WORK TIME

**Status:** Draft - Ready for Development
**Duration:** 1 day
**Priority:** Critical - Core Feature
**Assigned to:** @dev (Dex)
**Created:** 2026-02-20

---

## 📋 Story Overview

As an executor, I need a timer to track how long I work on each task so I can log accurate time entries and maintain visibility of time spent.

---

## ✅ Acceptance Criteria

```
AC-2.2.1: Timer component visible on task detail page
  ✓ Timer appears after task is in "in_progress" status
  ✓ Only visible to executor assigned to task
  ✓ Positioned in dedicated "Time Tracking" section
  ✓ Always accessible when task is in_progress

AC-2.2.2: Timer displays MM:SS format (00:00 to 99:59)
  ✓ Shows minutes and seconds with zero-padding
  ✓ Supports up to 99:59 (5999 seconds)
  ✓ Updates in real-time (every second)
  ✓ Uses monospace font for clarity
  ✓ Large display (readable from distance)

AC-2.2.3: Start button begins counting
  ✓ Start button visible before timer begins
  ✓ Clicking Start starts countdown from 00:00
  ✓ Button changes to Pause after start
  ✓ Timer increments every 1 second
  ✓ Accuracy within ±1 second acceptable

AC-2.2.4: Pause button pauses without reset
  ✓ Pause button visible when timer running
  ✓ Clicking Pause stops timer
  ✓ Time preserved when paused
  ✓ Button changes back to Start after pause
  ✓ Can resume from paused time

AC-2.2.5: Stop button ends session and opens time log form
  ✓ Stop button visible in Start/Pause/Stop modes
  ✓ Clicking Stop: pauses timer + opens TimeLogForm
  ✓ TimeLogForm receives duration in minutes (rounded up)
  ✓ TimeLogForm pre-populated with duration
  ✓ User can add description and date
  ✓ On form submit: time log created, timer hidden

AC-2.2.6: Reset button clears timer to 00:00
  ✓ Reset button visible when timer stopped
  ✓ Clicking Reset: timer returns to 00:00
  ✓ Resets internal state for new session
  ✓ Ready to start new count

AC-2.2.7: Time logged in minutes (rounded up)
  ✓ Convert seconds to minutes: Math.ceil(seconds / 60)
  ✓ 30 seconds = 1 minute
  ✓ 61 seconds = 2 minutes
  ✓ 0 seconds = 0 minutes (minimum)
  ✓ Validation: duration must be > 0 to submit
```

---

## 🛠️ Tasks

### Phase 1: Timer Component Enhancement

- [ ] **T-2.2.1: Enhance Timer component**
  - Subtasks:
    - [ ] Review existing /app/components/tasks/Timer.tsx from Story 1.4
    - [ ] Verify MM:SS format display (00:00 to 99:59)
    - [ ] Verify Start/Pause/Stop/Reset buttons work
    - [ ] Verify real-time updates (1 second interval)
    - [ ] Add large display styling (text-6xl or larger)
    - [ ] Add accessible labels to buttons
    - [ ] Add ARIA labels for screen readers

### Phase 2: Integration with Task Detail Page

- [ ] **T-2.2.2: Integrate timer into task detail**
  - Subtasks:
    - [ ] Update /app/(dashboard)/tasks/[id]/page.tsx
    - [ ] Add "Time Tracking" section
    - [ ] Show timer only when task.status = 'in_progress'
    - [ ] Show timer only to assigned executor
    - [ ] Hide timer initially, show button to start
    - [ ] Pass onStop callback to Timer component
    - [ ] On stop: show TimeLogForm with duration

- [ ] **T-2.2.3: Implement time duration handling**
  - Subtasks:
    - [ ] Create utility function: secondsToMinutes(seconds)
    - [ ] Implement rounding up logic: Math.ceil(seconds / 60)
    - [ ] Pass rounded minutes to TimeLogForm
    - [ ] Store original seconds for accuracy reference
    - [ ] Validate duration > 0 before allowing submit

### Phase 3: Form Integration

- [ ] **T-2.2.4: Enhance TimeLogForm component**
  - Subtasks:
    - [ ] Update /app/components/forms/TimeLogForm.tsx
    - [ ] Add durationMinutes prop (pre-populated)
    - [ ] Show duration as read-only display (not input field)
    - [ ] Allow optional description
    - [ ] Allow optional date override (default today)
    - [ ] Validate duration > 0 (1440 max)
    - [ ] Show success message on submit
    - [ ] Hide timer after successful log

- [ ] **T-2.2.5: Create time log API endpoint**
  - Subtasks:
    - [ ] Verify /app/api/time-logs/route.ts exists (from Story 1.4)
    - [ ] Verify POST endpoint validates:
      - task_id exists
      - duration_minutes in range (1-1440)
      - user_id matches session
      - task is assigned to user
    - [ ] POST creates time_logs entry with:
      - task_id
      - user_id (from session)
      - duration_minutes
      - description (optional)
      - logged_date
      - created_at (server time)
    - [ ] Returns created log as JSON
    - [ ] Fires audit log entry

### Phase 4: Testing & Validation

- [ ] **T-2.2.6: Test timer functionality**
  - Subtasks:
    - [ ] Test: Timer starts at 00:00
    - [ ] Test: Timer increments every 1 second
    - [ ] Test: Pause stops timer without losing time
    - [ ] Test: Resume continues from paused time
    - [ ] Test: Stop closes timer and opens form
    - [ ] Test: Reset clears to 00:00
    - [ ] Test: Rounding up works correctly (30s→1m, 61s→2m)
    - [ ] Test: Form shows rounded minutes

- [ ] **T-2.2.7: Test time logging flow**
  - Subtasks:
    - [ ] Test: Create time log with valid data
    - [ ] Test: Duration must be > 0
    - [ ] Test: Duration max is 1440 (24 hours)
    - [ ] Test: Time log saved to database
    - [ ] Test: Audit log entry created
    - [ ] Test: Only assigned executor can log time
    - [ ] Test: Unauthenticated user gets 401

---

## 📝 Dev Notes

### Component Reuse
The Timer component from Story 1.4 is already implemented:
- Location: `/app/components/tasks/Timer.tsx`
- Start/Pause/Stop/Reset buttons implemented
- onStop callback returns duration in seconds
- Already integrated in task detail page

### Changes Needed
1. Ensure Timer displays minutes:seconds (MM:SS) format
2. Enhance TimeLogForm to accept pre-populated duration
3. Add duration rounding utility: Math.ceil(seconds / 60)
4. Verify API endpoint handles time log creation

### Time Rounding
```javascript
function secondsToMinutes(seconds) {
  if (seconds === 0) return 0;
  return Math.ceil(seconds / 60);
}

// Examples:
secondsToMinutes(0)   // = 0
secondsToMinutes(30)  // = 1
secondsToMinutes(60)  // = 1
secondsToMinutes(61)  // = 2
secondsToMinutes(3599) // = 60
```

### Time Log Validation
```
1 minute minimum (can't log 0 seconds)
1440 minutes maximum (24 hours)
Duration must be integer
Description optional but encouraged
Logged date defaults to today but can be overridden
```

### API Integration Pattern
From Story 1.4:
```typescript
const res = await fetch('/api/time-logs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    task_id: taskId,
    duration_minutes: minutes,
    description: formData.get('description'),
    logged_date: formData.get('logged_date') || new Date().toISOString().split('T')[0],
  }),
});
```

---

## 🧪 Testing Strategy

### Unit Tests
```bash
npm test -- timer.test.ts
npm test -- time-log.test.ts

# Test cases:
- Timer starts, pauses, resumes, stops, resets
- Duration rounding (30s→1m, 61s→2m, etc)
- Form validation (duration 1-1440)
- API response on successful log
```

### Integration Tests
```bash
npm test -- timer-logging.integration.test.ts

# Test cases:
- Full timer → form → API flow
- Time log saved to database
- Audit log entry created
- RLS prevents unauthorized access
```

### Manual Testing
- [ ] Start timer and let it run 30 seconds
- [ ] Click pause and resume
- [ ] Click stop and verify form appears
- [ ] Verify duration shows rounded minutes
- [ ] Add description and submit
- [ ] Verify success message
- [ ] Verify timer hidden after submit
- [ ] Check database for created time_log entry

---

## 📁 File List

### New Files to Create
```
utils/time-utils.ts (secondsToMinutes utility)
tests/components/timer.test.ts
tests/integration/timer-logging.integration.test.ts
```

### Files to Modify
```
app/components/tasks/Timer.tsx (verify/enhance MM:SS display)
app/components/forms/TimeLogForm.tsx (pre-populated duration)
app/(dashboard)/tasks/[id]/page.tsx (timer integration)
```

### Reuse from Story 1.4
```
app/api/time-logs/route.ts (already implemented)
app/components/tasks/Timer.tsx (base implementation)
app/components/forms/TimeLogForm.tsx (base implementation)
```

---

## 🔍 Dev Agent Record

### Checkboxes Status
- [ ] Code implementation complete
- [ ] Timer component enhanced
- [ ] TimeLogForm enhanced
- [ ] API integration verified
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
- Story 2.1 (Task Execution) - Must complete first

**Required Context:**
- Story 1.4 (Timer component) ✅ Complete
- Story 1.1 (Database) ✅ Complete
- Story 1.5 (Authentication) ✅ Complete

**Delegates to:**
- None - Self-contained

---

**Prepared by:** @aios-master (Orion)
**Date:** 2026-02-20
**Status:** Ready for @dev to implement (after Story 2.1)
