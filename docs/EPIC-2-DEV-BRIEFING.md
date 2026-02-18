# EPIC 2 - DEVELOPER BRIEFING

**Prepared for:** @dev (Dex)
**Date:** 2026-02-20
**Status:** Ready for Development Kickoff (2026-02-20 09:00 UTC)
**Duration:** 4 days (Feb 20-23, target complete Feb 24)

---

## 🎯 Epic Summary

Epic 2 implements the **Task Execution & Timer Workflows** layer on top of Epic 1's foundation. Users execute assigned tasks, track time, submit evidence, and managers oversee progress.

**Foundation Available (Epic 1):**
- ✅ Database schema (users, tasks, evidence, qa_reviews, time_logs, audit_logs)
- ✅ Authentication (NextAuth.js v5 + Supabase Auth)
- ✅ Components & API routes (dashboard, forms, timer)
- ✅ RLS policies (29 policies, role-based access)

---

## 📊 Execution Roadmap

### Day 1 (Feb 20 - Thursday)

```
09:00 - Epic 2 Kickoff
├─ 10:00 - Story 2.1 (Task Execution) starts
│  └─ My Tasks list + Start button + task status = in_progress
├─ 12:00 - Story 2.2 (Timer) starts (parallel)
│  └─ Timer MM:SS + Start/Pause/Stop/Reset + Time logging API
└─ 17:00 - Daily sync
```

### Day 2 (Feb 21 - Friday)

```
09:00 - Stories 2.3, 2.4 start (parallel)
│       Story 2.3: Submit Evidence (URL + description)
│       Story 2.4: View Task Status (timeline + QA feedback)
├─ 13:00 - Stories 2.1, 2.2 review & integration
└─ 17:00 - Daily sync
```

### Day 3 (Feb 22 - Saturday)

```
09:00 - Stories 2.5, 2.6 (Admin features)
│       Story 2.5: QA Review Dashboard + Evidence Review
│       Story 2.6: Team Dashboard + Reassign + Due Date Extension
├─ 13:00 - All stories integration testing
├─ 15:00 - CodeRabbit validation
└─ 18:00 - Full QA review begins
```

### Day 4 (Feb 23 - Sunday)

```
10:00 - Bug fixes & refinements
├─ 14:00 - Final testing (all stories)
├─ 16:00 - Ready for Merge
└─ 18:00 - Final push to main
```

**Target:** Epic 2 COMPLETE by Feb 24 → Ready for Epic 3

---

## 📋 Story Sequence & Dependencies

```
     2.1 Task Execution
     (start task → status=in_progress)
          ↓
    2.2 Timer Tracking (parallel with 2.3)
    (MM:SS timer → log time)
          ↓
    2.3 Submit Evidence (parallel with 2.2, 2.4)
    (URL + description → create evidence)
          ↓
    2.4 View Task Status (parallel with 2.3)
    (status badge + timeline + feedback)
          ↓
    2.5 Review Evidence (depends on 2.3)
    (QA dashboard → approve/reject)
          ↓
    2.6 Monitor Team Progress (depends on 2.1-2.5)
    (admin dashboard → reassign, metrics)

Optimal Parallelization:
- Day 1: 2.1 + 2.2 parallel (3h each)
- Day 2: 2.3 + 2.4 parallel (4h each) while 2.1/2.2 integration
- Day 3: 2.5 + 2.6 parallel (6h each) - final stories
```

---

## 🔧 Technical Context

### From Epic 1 (Already Implemented)

**Database Layer:**
- 6 tables: users, tasks, evidence, qa_reviews, time_logs, audit_logs
- 29 RLS policies with role-based access (admin, head, executor, qa)
- Triggers for audit trail on all mutations
- Indexes optimized for common queries

**API Layer (10 routes):**
```
GET  /api/tasks                  (list, paginated)
POST /api/tasks                  (create)
GET  /api/tasks/{id}             (detail + evidence + reviews)
PUT  /api/tasks/{id}             (update)
DELETE /api/tasks/{id}           (soft delete)
GET  /api/evidence?task_id=      (list by task)
POST /api/evidence               (submit)
GET  /api/qa-reviews?task_id=    (list by task)
POST /api/qa-reviews             (QA submit)
GET  /api/time-logs?task_id=     (list by task)
POST /api/time-logs              (log time)
```

**Frontend Components:**
- Timer.tsx - MM:SS stopwatch (Start/Pause/Stop/Reset)
- EvidenceForm.tsx - File URL + description submission
- QAReviewForm.tsx - Review status + feedback
- TimeLogForm.tsx - Duration + date + description
- Sidebar.tsx - Role-based navigation
- Protected routes via middleware + getServerSession()

**Authentication Pattern:**
- NextAuth.js v5 CredentialsProvider
- JWT with role claim stored in HTTPOnly cookie
- JWT token passed to Supabase for RLS enforcement
- Auto-logout on token expiry

---

## 📝 Story Details (Condensed)

### Story 2.1: Task Execution (1 day)
**AC:** My Tasks list | Start button | Status → in_progress
**API:** POST /api/tasks/{id}/start
**Components:** My Tasks page + Start button integration
**Tests:** Task list filtering, start flow, RLS enforcement

### Story 2.2: Timer Tracking (1 day)
**AC:** MM:SS timer | Start/Pause/Stop/Reset | Time → minutes (rounded up)
**API:** POST /api/time-logs (duration_minutes 1-1440)
**Components:** Timer + TimeLogForm integration
**Tests:** Timer accuracy, rounding (30s→1m, 61s→2m), form validation

### Story 2.3: Submit Evidence (1 day)
**AC:** Evidence form | URL input | Description (optional) | Linked to task
**API:** POST /api/evidence (task_id, file_url, description)
**Components:** EvidenceForm + Evidence list display
**Tests:** Form validation, RLS (only assigned executor), evidence display

### Story 2.4: View Task Status (1 day)
**AC:** Status badge (6 colors) | Timeline of changes | QA feedback on rejection
**API:** Audit logs query (status transitions)
**Components:** TaskStatusTimeline + Polling for real-time updates
**Tests:** Status display, timeline accuracy, polling refresh

### Story 2.5: Review Evidence (1.5 days)
**AC:** QA dashboard | Review form (approved/rejected/changes_requested) | Feedback required
**API:** POST /api/qa-reviews (status + feedback), task status update → approved/rejected
**Components:** QA Dashboard + Review detail page
**Tests:** QA-only access, evidence display, status updates, notifications

### Story 2.6: Monitor Team Progress (1.5 days)
**AC:** Team dashboard (all tasks) | Status breakdown | Time tracking | Burndown chart | Reassign | Extend due date
**API:** Team analytics, reassign endpoint, due date update
**Components:** Team dashboard + StatusSummary + BurndownChart + QAReviewQueue
**Tests:** Admin-only access, reassignment, due date extension, metrics accuracy

---

## 🛠️ Implementation Patterns (Reference)

### API Route Pattern (from Story 1.4)
```typescript
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({error: 'Unauthorized'}, {status: 401});

  if (!['admin', 'head'].includes(session.user.role)) {
    return Response.json({error: 'Forbidden'}, {status: 403});
  }

  const body = await request.json();
  const { task_id, duration_minutes } = body;

  if (!task_id || !duration_minutes || duration_minutes < 1 || duration_minutes > 1440) {
    return Response.json({error: 'Bad Request'}, {status: 400});
  }

  const supabase = createSupabaseServerClient(session.accessToken);
  const { data, error } = await supabase
    .from('time_logs')
    .insert({
      task_id,
      user_id: session.user.id,
      duration_minutes,
      logged_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return Response.json({error: 'Failed to log time'}, {status: 500});
  return Response.json(data, {status: 201});
}
```

### Component State Pattern (Task Detail)
```typescript
const [task, setTask] = useState<Task | null>(null);
const [showEvidenceForm, setShowEvidenceForm] = useState(false);
const [showTimer, setShowTimer] = useState(false);

useEffect(() => {
  // Poll every 5 seconds for status updates
  const interval = setInterval(async () => {
    const res = await fetch(`/api/tasks/${taskId}`);
    const newTask = await res.json();
    if (newTask.status !== task?.status) {
      setTask(newTask);
    }
  }, 5000);
  return () => clearInterval(interval);
}, [taskId]);

// Optimistic update on form submit
const handleEvidenceSubmit = async () => {
  setTask({...task, status: 'submitted'});
  const res = await fetch('/api/evidence', {method: 'POST', body});
  if (!res.ok) setTask(originalTask); // Revert on error
};
```

### Role-Based Visibility
```typescript
{session?.user?.role === 'executor' && (
  <>
    <button onClick={() => setShowEvidenceForm(!showEvidenceForm)}>
      Submit Evidence
    </button>
    {showEvidenceForm && <EvidenceForm taskId={taskId} onSubmit={...} />}
  </>
)}

{session?.user?.role === 'qa' && (
  <button onClick={() => setShowQAForm(!showQAForm)}>
    Submit Review
  </button>
)}

{['admin', 'head'].includes(session?.user?.role) && (
  <Link href="/team">Team Dashboard</Link>
)}
```

### Rounding Pattern (Timer)
```typescript
function secondsToMinutes(seconds: number): number {
  if (seconds === 0) return 0;
  return Math.ceil(seconds / 60);
}

// Tests:
// secondsToMinutes(0) = 0
// secondsToMinutes(30) = 1
// secondsToMinutes(60) = 1
// secondsToMinutes(61) = 2
// secondsToMinutes(3599) = 60
```

---

## ✅ Pre-Dev Checklist

Before starting Day 1 (Feb 20):

- [ ] **Code Review:**
  - [ ] Review Story 1.4 components (Timer, Forms)
  - [ ] Review API route patterns in /app/api/
  - [ ] Review RLS policies in database schema
  - [ ] Understand auth flow (JWT + Supabase)

- [ ] **Environment Setup:**
  - [ ] Development server running (`npm run dev`)
  - [ ] Database connected (Supabase CLI configured)
  - [ ] All dependencies installed
  - [ ] No TS errors in current codebase (`npm run typecheck`)

- [ ] **Story Preparation:**
  - [ ] Read all 6 story files completely
  - [ ] Understand AC for each story
  - [ ] Identify reusable components from 1.4
  - [ ] List new API endpoints needed

- [ ] **Testing Strategy:**
  - [ ] Understand test structure from 1.4
  - [ ] Know how to run tests (`npm test`)
  - [ ] Know CodeRabbit usage (pre-commit quality check)

---

## 🎯 Quality Gates for Completion

Each story must pass BEFORE marking complete:

```
✅ All acceptance criteria implemented
✅ API routes tested (manual curl or Postman)
✅ RLS policies verified (test as different users)
✅ Component tests passing (npm test)
✅ TypeScript strict mode passing (npm run typecheck)
✅ ESLint passing (npm run lint)
✅ Build passes (npm run build)
✅ CodeRabbit pre-commit: 0 CRITICAL issues
✅ Manual end-to-end testing done
✅ File List section updated in story
```

---

## 📞 Support & Questions

**If you're blocked:**
1. Check story "Dev Notes" section for patterns
2. Check Story 1.4 completion for similar examples
3. Review /docs/DATABASE.md for RLS details
4. Review /docs/AUTHENTICATION.md for auth patterns
5. Ask @aios-master for clarification

**Common Questions:**

Q: Where's the file upload feature?
A: Phase 5 - currently expecting URLs only

Q: How do I handle optimistic updates?
A: Update state before API call, revert on error

Q: How do real-time updates work?
A: Polling every 5 seconds (simple) or WebSocket (future)

Q: Can I change the database schema?
A: No - all schema designed in Epic 1, stable now

---

## 🚀 Success Criteria for Epic 2

```
✅ All 6 stories complete with AC met
✅ Code coverage > 80%
✅ Build passes with 0 errors
✅ CodeRabbit CRITICAL: 0
✅ Performance: API responses < 500ms
✅ Uptime: No downtime during testing
✅ User satisfaction: > 4/5 (internal feedback)
```

---

## 📅 Timeline Summary

```
Feb 20 (Thu): 2.1 + 2.2 (4h each)
Feb 21 (Fri): 2.3 + 2.4 (4h each) + 2.1/2.2 integration
Feb 22 (Sat): 2.5 + 2.6 (6h each) + full integration + QA review
Feb 23 (Sun): Bug fixes, final testing, ready to merge
Feb 24 (Mon): Epic 2 complete, Epic 3 ready to start
```

---

## 🎓 Learning Resources

If new to any technology:

- **NextAuth.js v5:** `/docs/AUTHENTICATION.md` (300+ lines)
- **Supabase RLS:** `/docs/DATABASE.md` (400+ lines)
- **System Architecture:** `/docs/architecture.md` (1000+ lines)
- **Component Patterns:** `/docs/stories/STORY-1.4-COMPLETION.md`
- **API Patterns:** Review `/app/api/tasks/route.ts` as reference

---

## 🎯 Next Steps

1. **You now have:** Complete story definitions + API specs + component requirements
2. **You should do:** Read all 6 stories carefully, ask questions if unclear
3. **Kickoff is:** 2026-02-20 09:00 UTC
4. **I will:** Monitor progress, help unblock, coordinate with other agents

---

**Prepared by:** @aios-master (Orion)
**Reviewer:** @architect (Aria) ✅ Verified
**Status:** READY FOR DEVELOPMENT KICKOFF

**Questions? Ask before 09:00 UTC on Feb 20! 🚀**
