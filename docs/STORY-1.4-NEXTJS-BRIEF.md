# STORY 1.4 - Next.js Component Setup & API Routes

**Prepared for:** @dev (DEX)
**Date:** 2026-02-18 14:00 UTC
**Status:** Ready to Start
**Duration Estimate:** 8 hours

---

## 📋 Overview

Story 1.4 completes the foundation by building the Next.js component layer and API routes that integrate with the fully functional authentication (Story 1.5) and database (Story 1.1).

**Foundation Status:**
- ✅ Database: 6 tables, 29 RLS policies, 9 triggers (Story 1.1)
- ✅ Authentication: NextAuth.js + Supabase Auth with JWT role claims (Story 1.5)
- ✅ Architecture: Complete system design (Story 1.2)
- ⏳ UI Components: Lovable design system (Story 1.3 - in progress, exports available)
- ⏳ CI/CD: GitHub Actions pipeline (Story 1.6 - in progress)

**Your Task:** Build the application layer that connects these pieces together.

---

## 🎯 Acceptance Criteria

### Required Deliverables

1. **Component Structure**
   - [ ] Dashboard layout with protected routes
   - [ ] Task list component (paginated)
   - [ ] Task detail component with timeline
   - [ ] Task edit/create form
   - [ ] Timer component (minutes/seconds)
   - [ ] Evidence submission form
   - [ ] Admin team dashboard
   - [ ] Settings page (user profile)

2. **API Routes**
   - [ ] GET /api/tasks - List user's tasks (RLS applied automatically)
   - [ ] GET /api/tasks/[id] - Task detail with evidence
   - [ ] POST /api/tasks - Create task (admin/head only)
   - [ ] PUT /api/tasks/[id] - Update task
   - [ ] DELETE /api/tasks/[id] - Soft delete task
   - [ ] POST /api/evidence - Submit evidence
   - [ ] GET /api/evidence/[taskId] - Task evidence
   - [ ] POST /api/qa-reviews - Submit QA review
   - [ ] GET /api/time-logs - Time tracking
   - [ ] POST /api/time-logs - Log time entry

3. **Integration**
   - [ ] All API routes use `getServerSession()` for auth
   - [ ] Supabase client initialized with JWT token from NextAuth
   - [ ] RLS policies enforced automatically at database level
   - [ ] Error handling for 401 (unauthenticated) and 403 (forbidden)
   - [ ] Proper loading states and error boundaries in UI

4. **Testing**
   - [ ] Manual API testing with different roles (admin, head, executor, qa)
   - [ ] Verify RLS prevents unauthorized access
   - [ ] Test pagination on task list
   - [ ] Test timer countdown accuracy
   - [ ] All TypeScript types verified

---

## 🏗️ Component Architecture

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx              ✅ DONE (Story 1.5)
│   └── layout.tsx
│
├── (dashboard)/                  ← NEW: Protected routes layout
│   ├── layout.tsx                - Sidebar, navigation
│   ├── dashboard/
│   │   └── page.tsx              - Overview dashboard
│   ├── tasks/
│   │   ├── page.tsx              - Task list (paginated)
│   │   ├── [id]/
│   │   │   └── page.tsx          - Task detail + timeline
│   │   └── new/
│   │       └── page.tsx          - Create task form
│   ├── team/                      - Admin only
│   │   ├── page.tsx              - Team dashboard
│   │   └── time-logs/
│   │       └── page.tsx          - Time logs report
│   ├── settings/
│   │   └── page.tsx              - User settings
│   └── best-practices/
│       └── page.tsx              - Info hub
│
├── api/
│   ├── auth/[...nextauth]/
│   │   └── route.ts              ✅ DONE (Story 1.5)
│   ├── auth/
│   │   └── session/
│   │       └── route.ts          ✅ DONE (Story 1.5)
│   │
│   ├── tasks/                    ← NEW
│   │   ├── route.ts              - GET (list), POST (create)
│   │   └── [id]/
│   │       ├── route.ts          - GET (detail), PUT (update), DELETE
│   │       └── evidence/
│   │           └── route.ts      - GET task evidence
│   │
│   ├── evidence/                 ← NEW
│   │   └── route.ts              - POST (submit)
│   │
│   ├── qa-reviews/               ← NEW
│   │   └── route.ts              - POST (submit review)
│   │
│   └── time-logs/                ← NEW
│       └── route.ts              - GET (list), POST (create)
│
├── lib/
│   ├── auth.ts                   ✅ DONE (Story 1.5)
│   ├── supabase.ts               ✅ DONE (Story 1.5)
│   ├── types.ts                  ✅ DONE (Story 1.5)
│   │
│   ├── api-client.ts             ← NEW: Fetch wrapper with auth
│   ├── hooks.ts                  ← NEW: useSession, useTask, etc.
│   └── utils.ts                  ← NEW: Formatters, helpers
│
└── components/                   ← Lovable exports integration
    ├── layout/
    │   ├── Sidebar.tsx
    │   ├── Header.tsx
    │   └── Navigation.tsx
    ├── tasks/
    │   ├── TaskList.tsx
    │   ├── TaskDetail.tsx
    │   ├── TaskForm.tsx
    │   └── Timer.tsx
    ├── evidence/
    │   └── EvidenceForm.tsx
    ├── qa/
    │   └── ReviewForm.tsx
    ├── admin/
    │   ├── TeamDashboard.tsx
    │   └── TimeLogs.tsx
    ├── ui/
    │   └── [design system components]
    └── loading.tsx               - Skeleton screens
```

---

## 🔌 API Route Pattern

All API routes follow this pattern for consistency:

### Template - GET Protected Route

```typescript
// app/api/tasks/route.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: Request) {
  // 1. Authenticate user
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Create Supabase client with user's JWT
    // RLS policies automatically filter data based on role
    const supabase = createSupabaseServerClient(session.accessToken);

    // 3. Query database (RLS applied automatically)
    const { data, error, count } = await supabase
      .from('tasks')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(0, 19);

    if (error) {
      console.error('Supabase error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // 4. Return paginated results
    return Response.json({
      data,
      pagination: {
        total: count,
        limit: 20,
        offset: 0,
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Key Points

1. **Always use `getServerSession()`** to verify authentication
2. **Return 401 if no session** - middleware prevents this but be defensive
3. **Create Supabase client with `session.accessToken`** - this passes JWT to RLS
4. **RLS policies automatically enforce access control** - no need for manual checks
5. **Trust the database layer** - if user shouldn't see data, RLS blocks it
6. **Error handling** - return appropriate HTTP status codes

---

## 🗄️ Database Integration

### How RLS Works with Your API Routes

```
User logs in
  ↓
NextAuth creates JWT with role claim
  ↓
JWT stored in HTTPOnly cookie + session
  ↓
API route calls getServerSession()
  ↓
Creates Supabase client: createSupabaseServerClient(session.accessToken)
  ↓
Query passed to Supabase with Authorization: Bearer {JWT}
  ↓
PostgreSQL executes query AND checks RLS policies
  ↓
RLS policy extracts role from auth.jwt()->>'role'
  ↓
Query returns ONLY data the user is allowed to access
```

### Example: Task Visibility by Role

```sql
-- From Story 1.1 - RLS Policy (already implemented)
CREATE POLICY "Executor visibility"
ON tasks
FOR SELECT
USING (
  auth.jwt()->>'role' = 'admin'
  OR auth.jwt()->>'role' = 'head'
  OR assigned_to = auth.uid()
  OR created_by = auth.uid()
);
```

**Result:**
- Admin: Sees all tasks
- Head: Sees all tasks they created + assigned tasks
- Executor: Sees only their assigned tasks
- QA: Sees all tasks (via RLS policy)

**In your API route:** You write `SELECT * FROM tasks` - the database automatically filters based on RLS!

---

## 🛣️ Protected Routes Pattern

### Dashboard Layout

```typescript
// app/(dashboard)/layout.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware handles initial redirect, but double-check server-side
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={session.user} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
```

### Admin-Only Routes

```typescript
// app/(dashboard)/team/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function TeamPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user.role || !['admin', 'head'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  // Only admin/head see this page
  return <TeamDashboard user={session.user} />;
}
```

---

## 🎨 Component Integration with Lovable

Story 1.3 (UMA - UX Design Expert) will provide:
- Complete design system (colors, typography, spacing)
- Component library exports (React components)
- Dark mode support (green + white theme)

**Your job:**
1. Import components from Story 1.3 output
2. Connect them to your API routes
3. Add state management (useState, useCallback)
4. Wire up form submissions and data loading

**Example Integration:**

```typescript
// app/(dashboard)/tasks/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { TaskList } from '@/components/tasks/TaskList'; // From Lovable
import { Skeleton } from '@/components/ui/Skeleton'; // From Lovable

export default function TasksPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      const res = await fetch('/api/tasks');
      const { data } = await res.json();
      setTasks(data);
      setLoading(false);
    }

    fetchTasks();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Meus Tarefas</h1>
      {loading ? <Skeleton /> : <TaskList tasks={tasks} />}
    </div>
  );
}
```

---

## 📊 API Route Error Responses

All routes should follow this error format:

```typescript
// 401 Unauthorized (unauthenticated)
return Response.json(
  { error: 'Unauthorized - please log in' },
  { status: 401 }
);

// 403 Forbidden (authenticated but no permission)
return Response.json(
  { error: 'Forbidden - you do not have access to this resource' },
  { status: 403 }
);

// 400 Bad Request (validation error)
return Response.json(
  { error: 'Bad Request - invalid input', details: validationError },
  { status: 400 }
);

// 500 Internal Server Error
return Response.json(
  { error: 'Internal server error', message: error.message },
  { status: 500 }
);

// 200 Success
return Response.json({ data: result }, { status: 200 });
```

---

## 🧪 Testing Checklist

### Manual Testing by Role

Create test users for each role (or modify your existing test user):

```bash
# In Supabase Dashboard or via seed data
Email: admin@example.com, Role: admin
Email: head@example.com, Role: head
Email: executor@example.com, Role: executor
Email: qa@example.com, Role: qa
Password: TestPassword123 (for all)
```

### Test Cases

```
[ ] Login with each role works
[ ] Dashboard loads and shows role-appropriate UI
[ ] Task list shows only tasks visible to that role
  [ ] Admin sees all tasks
  [ ] Head sees created + assigned tasks
  [ ] Executor sees only assigned tasks
  [ ] QA sees all tasks
[ ] Task detail page displays without error
[ ] Task creation only works for admin/head (returns 403 for executor)
[ ] Timer counts down correctly
[ ] Evidence submission works for executor role
[ ] QA review submission works for qa role
[ ] Settings page shows user info
[ ] Team dashboard only accessible to admin/head
[ ] Time logs visible to admin only
[ ] Logout clears session and redirects to login
[ ] Accessing /dashboard without session redirects to /login
[ ] Accessing /team as executor redirects to /dashboard
```

### TypeScript Verification

```bash
npm run typecheck
# Should pass with no errors
```

### Linting

```bash
npm run lint
# Should pass with no warnings
```

---

## 🚀 Implementation Order

1. **Setup phase** (1 hour)
   - Create `/app/(dashboard)` directory structure
   - Create protected layout and components
   - Wire up middleware verification

2. **API Routes - Queries** (2 hours)
   - GET /api/tasks (list with pagination)
   - GET /api/tasks/[id] (detail)
   - GET /api/evidence/[taskId]
   - GET /api/time-logs
   - GET /api/qa-reviews (admin only)

3. **API Routes - Mutations** (2 hours)
   - POST /api/tasks (create)
   - PUT /api/tasks/[id] (update)
   - DELETE /api/tasks/[id] (soft delete)
   - POST /api/evidence
   - POST /api/qa-reviews
   - POST /api/time-logs

4. **Components** (2 hours)
   - Task list component + pagination
   - Task detail component
   - Timer component
   - Evidence and QA review forms
   - Admin dashboard

5. **Integration & Testing** (1 hour)
   - Connect components to API routes
   - Test RLS enforcement
   - Run full test suite
   - Manual testing across all roles

---

## 📁 Key Files from Previous Stories

Reference these when building:

- `/docs/architecture.md` - Complete system design
- `/docs/AUTHENTICATION.md` - Auth flow and role definitions
- `/docs/DATABASE.md` - Database setup and RLS details
- `/app/lib/auth.ts` - NextAuth configuration
- `/app/lib/supabase.ts` - Supabase clients
- `/app/lib/types.ts` - TypeScript interfaces
- `/middleware.ts` - Route protection

---

## ⚠️ Common Pitfalls

❌ **Don't do this:**
```typescript
// ❌ Creating Supabase client without JWT token
const supabase = supabase; // Wrong - uses anon key, RLS blocks everything

// ❌ Querying all data and filtering in code
const { data } = await supabase.from('tasks').select('*');
const userTasks = data.filter(t => t.assigned_to === userId); // Wrong - slow and insecure

// ❌ Forgetting getServerSession
const res = await supabase.from('tasks').select('*'); // Wrong - no auth!

// ❌ Returning sensitive data
return Response.json({ user: { ...user, password: 'hidden' } }); // Password still visible!

// ❌ Generic "Something went wrong" errors
return Response.json({ error: 'Error' }, { status: 500 }); // Not helpful for debugging
```

✅ **Do this instead:**
```typescript
// ✅ Always use session's JWT token
const supabase = createSupabaseServerClient(session.accessToken);

// ✅ Let the database filter with RLS
const { data } = await supabase.from('tasks').select('*'); // RLS applied automatically

// ✅ Always verify session
const session = await getServerSession(authOptions);
if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

// ✅ Return only necessary fields
const { id, email, name, role } = user; // Exclude sensitive fields

// ✅ Provide helpful error messages
console.error('Database error:', error);
return Response.json({ error: error.message }, { status: 500 });
```

---

## 🎯 Definition of Done

Story 1.4 is complete when:

- [ ] All 10 API routes implemented and tested
- [ ] Dashboard layout created with sidebar navigation
- [ ] Task list, detail, and create components working
- [ ] Timer component counts down correctly
- [ ] Evidence and QA review forms submit data
- [ ] Admin team dashboard accessible to head/admin only
- [ ] Settings page displays user profile
- [ ] Best practices info page created
- [ ] RLS policies verified (test with different roles)
- [ ] TypeScript strict mode passes
- [ ] ESLint and prettier pass
- [ ] No console errors in browser dev tools
- [ ] Manual testing complete across all 4 roles
- [ ] File List updated in story
- [ ] All documentation updated
- [ ] Ready for Story 1.3 (UI polish) integration

---

## 📞 Integration Points

**When Story 1.3 (UMA) completes:**
- Import React components from Lovable export
- Replace placeholder components with Lovable designs
- Apply design system colors (green + white)
- Add dark mode support if included

**When Story 1.6 (GAGE) completes:**
- CI/CD pipeline validates all API routes
- Unit tests run automatically on commits
- Build verification includes API type checking

---

**Prepared by:** @architect (Aria)
**For:** @dev (DEX)
**Ready to start:** ✅ 2026-02-18 14:00 UTC
