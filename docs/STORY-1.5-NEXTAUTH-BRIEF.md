# Story 1.5: NextAuth.js + Supabase Auth Integration

**Status:** READY FOR HANDOFF
**Target:** @dev (DEX)
**Epic:** Epic 1 - Foundation
**Date:** 2026-02-18
**Priority:** CRITICAL (blocks all auth-dependent features)
**Dependencies:** Story 1.1 (Database) ✅, Story 1.2 (Architecture) ✅

---

## 📋 Story Summary

Implement NextAuth.js integration with Supabase Auth to handle user login/logout, JWT token management, and role-based access control. This establishes authentication foundation for all subsequent stories.

---

## ✅ Acceptance Criteria

### NextAuth.js Setup
- [ ] Install NextAuth.js v5 + dependencies
- [ ] Create `/app/api/auth/[...nextauth]/route.ts`
- [ ] Configure CredentialsProvider (email + password)
- [ ] Implement JWT callbacks (encode/decode tokens)
- [ ] Implement Session callbacks (add user data to session)
- [ ] Configure session strategy: JWT (not database sessions)
- [ ] Set NEXTAUTH_SECRET in .env.local
- [ ] Configure auth pages (login, error, redirect)

### Supabase Auth Integration
- [ ] Create Supabase client for auth operations
- [ ] Implement `signInWithPassword()` in credentials provider
- [ ] Implement `refreshSession()` for token refresh
- [ ] Implement `signOut()` for logout
- [ ] Fetch user profile (role, name) from users table after auth
- [ ] Add role to JWT token (critical for RLS!)

### JWT Token Management
- [ ] Configure 24-hour token expiration
- [ ] Implement automatic token refresh
- [ ] Store tokens in HTTPOnly cookies (NextAuth default)
- [ ] Verify JWT signature against Supabase key
- [ ] Extract role from JWT for RLS policies

### Frontend Integration
- [ ] Create useAuth() hook for auth context
- [ ] Implement ProtectedRoute component (redirect if not authenticated)
- [ ] Implement RoleGuard component (check user role)
- [ ] Create Login page (/login) with form
- [ ] Create Login layout (no sidebar, centered)
- [ ] Redirect authenticated users from /login to /dashboard

### API Routes Protection
- [ ] Create getServerSession() wrapper for API routes
- [ ] Verify authentication on all protected routes
- [ ] Return 401 Unauthorized if not authenticated
- [ ] Extract user ID from session for database queries
- [ ] Verify role before allowing operations (e.g., admin-only)

### Security Implementation
- [ ] HTTPOnly cookie configuration (secure + samesite)
- [ ] CSRF protection via tokens
- [ ] Password validation (required, min 8 chars)
- [ ] Error messages don't leak user existence
- [ ] Rate limiting on login attempts (placeholder, implement in Story 1.6)

### Testing & Validation
- [ ] Test login with valid credentials → JWT created
- [ ] Test login with invalid password → 401
- [ ] Test login with non-existent user → 401
- [ ] Test logout → session cleared
- [ ] Test token refresh → new token issued
- [ ] Test protected API route without token → 401
- [ ] Test protected API route with expired token → 401
- [ ] Test JWT contains role claim
- [ ] Verify RLS policies work with real JWT (coordinate with @data-engineer)

### Documentation
- [ ] Update .env.example with NextAuth vars
- [ ] Document login flow (diagram + steps)
- [ ] Document JWT structure
- [ ] Document role claim usage
- [ ] Add troubleshooting section

---

## 📐 Technical Requirements

### Environment Variables Needed

```bash
# .env.local
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-32-chars-min

# From Supabase
NEXT_PUBLIC_SUPABASE_URL=https://project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Dependencies to Install

```bash
pnpm add next-auth @supabase/supabase-js next-auth/react
pnpm add -D @types/next-auth
```

### File Structure to Create

```
app/
├── api/
│   └── auth/
│       └── [...nextauth]/
│           └── route.ts              # NextAuth handler
│
├── (auth)/
│   ├── login/
│   │   └── page.tsx                  # Login page
│   ├── signup/
│   │   └── page.tsx                  # Signup page (optional for MVP)
│   ├── reset-password/
│   │   └── page.tsx                  # Password reset (Phase 2)
│   └── layout.tsx                    # Auth layout (no sidebar)
│
├── (dashboard)/
│   ├── dashboard/
│   │   └── page.tsx                  # Protected dashboard
│   └── layout.tsx                    # Protected layout (with sidebar)
│
├── middleware.ts                     # Route protection
└── lib/
    ├── auth.ts                       # NextAuth config
    ├── supabase.ts                   # Supabase clients
    └── types.ts                      # TypeScript types
```

### Key Code Patterns

#### 1. NextAuth Configuration (/lib/auth.ts)

```typescript
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabaseAdmin } from './supabase';

export const authOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        // 1. Authenticate with Supabase
        const { data, error } = await supabaseAdmin.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (error || !data.user) {
          throw new Error('Invalid credentials');
        }

        // 2. Fetch user profile with role
        const { data: profile } = await supabaseAdmin
          .from('users')
          .select('id, email, role, name, avatar_url')
          .eq('id', data.user.id)
          .single();

        return {
          id: data.user.id,
          email: data.user.email,
          role: profile?.role || 'executor',
          name: profile?.name,
          image: profile?.avatar_url,
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.accessToken = user.accessToken;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },

  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
```

#### 2. Login Page (app/(auth)/login/page.tsx)

```typescript
'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.ok) {
      router.push('/dashboard');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Login</h1>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          className="w-full px-4 py-2 border rounded mb-4"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          className="w-full px-4 py-2 border rounded mb-6"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
```

#### 3. Protected API Route (app/api/tasks/route.ts)

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Get session (includes user role)
  const session = await getServerSession(authOptions);

  // Check authentication
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Create Supabase client (will use JWT from session)
  const supabase = createSupabaseServerClient(session.accessToken);

  // Query tasks (RLS policies automatically applied based on user role)
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .order('due_date');

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }

  return NextResponse.json({ tasks });
}
```

#### 4. Middleware for Route Protection (middleware.ts)

```typescript
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

const protectedPaths = ['/dashboard', '/team', '/settings'];

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });

  // Redirect unauthenticated to login
  if (protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check role-based access
    if (request.nextUrl.pathname.startsWith('/team')) {
      if (!['admin', 'head'].includes(token.role as string)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/team/:path*', '/settings/:path*'],
};
```

---

## 🔗 Dependencies & Prerequisites

### From Previous Stories
- ✅ Database schema (Story 1.1) - users table with role
- ✅ Architecture document (Story 1.2) - auth flow diagram
- ✅ Supabase project configured (Story 1.1) - with users table + RLS

### Required Knowledge
- NextAuth.js JWT strategy
- Supabase Auth API
- TypeScript + React hooks
- HTTP-only cookies for security

### Tools
- Supabase Dashboard (test auth)
- Postman/Thunder Client (test API routes)
- Browser dev tools (test cookies)

---

## 🎯 Integration Points

### With Story 1.1 (Database)
- Query `users` table after Supabase Auth login
- Fetch role from users table → add to JWT
- RLS policies check `auth.jwt()->>'role'` ← depends on this story!

### With Story 1.4 (Next.js Setup)
- API routes use JWT from NextAuth
- Frontend components use useAuth() hook
- Protected routes use middleware

### With Story 1.3 (UI/UX)
- Login form design from Lovable
- Button styles from design system
- Layout structure for auth pages

---

## 🧪 Testing Strategy

### Manual Tests

1. **Login Flow**
   ```bash
   # Test login with valid credentials
   POST /api/auth/callback/credentials
   Body: { email: "test@example.com", password: "password" }
   Expected: 200 + JWT cookie set
   ```

2. **Protected Routes**
   ```bash
   # Test without auth
   GET /api/tasks
   Expected: 401 Unauthorized

   # Test with valid JWT
   GET /api/tasks (with auth cookie)
   Expected: 200 + tasks list
   ```

3. **RLS Validation** (coordinate with @data-engineer)
   ```typescript
   // Test that different roles see different data
   // Admin: sees all tasks
   // Head: sees created + assigned
   // Executor: sees assigned only
   ```

4. **Token Refresh**
   ```bash
   # Test token expiration
   1. Login → get token (exp: now + 24h)
   2. Wait 24h (or mock time)
   3. Next request → should auto-refresh
   4. Verify new token issued
   ```

### Automated Tests

```typescript
// Example test structure
describe('NextAuth Integration', () => {
  it('should login with valid credentials', async () => {
    // Test login flow
  });

  it('should reject invalid password', async () => {
    // Test invalid password
  });

  it('should add role to JWT', async () => {
    // Verify JWT contains role claim
  });

  it('should protect API routes', async () => {
    // Test 401 without auth
  });

  it('should work with RLS policies', async () => {
    // Coordinate with @data-engineer
  });
});
```

---

## ⚠️ Critical Security Notes

1. **NEXTAUTH_SECRET**
   - Must be 32+ characters
   - Use `openssl rand -base64 32` to generate
   - Keep secret (git-ignored)

2. **Token Security**
   - Never store in localStorage
   - HTTPOnly cookies only (NextAuth default)
   - Verify signature on every request

3. **Password Handling**
   - Never log passwords
   - Delegate to Supabase (uses bcrypt)
   - Validate min 8 chars client-side

4. **Role in JWT**
   - Critical: must be set from users.role
   - Used by RLS policies
   - Must be correct for security to work

5. **Error Messages**
   - Don't reveal if email exists
   - Use generic: "Invalid credentials"
   - Log actual errors server-side

---

## 📚 Deliverables Checklist

**Code:**
- [ ] `/app/api/auth/[...nextauth]/route.ts` - NextAuth handler
- [ ] `/lib/auth.ts` - NextAuth configuration
- [ ] `/lib/supabase.ts` - Supabase clients (anon + service role)
- [ ] `/app/(auth)/login/page.tsx` - Login page
- [ ] `/app/(auth)/layout.tsx` - Auth layout
- [ ] `/middleware.ts` - Route protection
- [ ] `/lib/types.ts` - TypeScript types (extend NextAuth)

**Tests:**
- [ ] Unit tests for auth callbacks
- [ ] Integration tests for login flow
- [ ] API route protection tests
- [ ] RLS policy validation tests

**Documentation:**
- [ ] Update .env.example
- [ ] Document login flow (diagram)
- [ ] Document JWT structure
- [ ] Create AUTHENTICATION.md guide

---

## 🔄 Timeline

- **Start:** Now (after Story 1.1 ✅)
- **Duration:** 3-4 hours (estimated)
- **Deliverable:** Full auth working with JWT + RLS
- **Blocker for:** Story 1.4 (Next.js API routes depend on this)
- **Parallel:** Story 1.3 (UI/UX) and Story 1.6 (CI/CD)

---

## 💬 Questions for @dev

1. **Password validation:** Server-side only or client + server?
2. **Signup page:** Include in MVP or defer to Phase 2?
3. **Remember me:** 30-day refresh token or always 24h?
4. **Error messages:** Show "email not found" or generic "invalid credentials"?
5. **Test users:** Create via Supabase Auth or via API?

---

## 📞 Escalation

- **Auth flow questions:** Ask @architect (Aria)
- **Database/RLS questions:** Ask @data-engineer (Dara)
- **UI/design questions:** Ask @ux-design-expert (Uma)

---

**Story Created By:** Dara (Data Engineer)
**Date:** 2026-02-18
**Ready for Implementation:** ✅ YES

Next Step: Coordinate with @dev for implementation start.
