# Authentication Guide - Digital TaskOps

**Status:** Story 1.5 Complete
**Date:** 2026-02-18
**Framework:** NextAuth.js + Supabase Auth

---

## Overview

Digital TaskOps uses **NextAuth.js** with **Supabase Auth** for secure user authentication. This guide covers:
- Login/Logout flow
- JWT token management
- Role-Based Access Control (RBAC)
- Protected routes
- Integration with RLS policies

---

## Architecture

```
Browser
  ↓
/login (Form)
  ↓
POST /api/auth/callback/credentials
  ↓
NextAuth (CredentialsProvider)
  ├─ Verify with Supabase Auth
  ├─ Fetch user profile + role
  └─ Create JWT with role claim
  ↓
HTTPOnly Cookie (stored automatically)
  ↓
Protected Routes
  ├─ Middleware checks token
  ├─ RBAC enforced at route level
  └─ RLS policies enforced at database level
```

---

## Setup

### 1. Environment Variables

Create `.env.local`:

```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase settings>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase settings>
```

### 2. Start Development Server

```bash
npm run dev
# Visit http://localhost:3000/login
```

### 3. Create Test User

In Supabase Dashboard:

1. Go to Authentication → Users
2. Click "Add user"
3. Email: `test@example.com`
4. Password: `TestPassword123`
5. Create user

In Supabase SQL Editor, create profile:

```sql
INSERT INTO public.users (id, email, role, name)
SELECT id, email, 'executor', 'Test User'
FROM auth.users
WHERE email = 'test@example.com';
```

---

## Login Flow

### Step-by-Step

1. **User visits /login**
   - See login form

2. **User submits credentials**
   ```
   Email: test@example.com
   Password: TestPassword123
   ```

3. **NextAuth processes request**
   - CredentialsProvider receives credentials
   - Validates: both required, password 8+ chars

4. **Supabase Auth verification**
   - `signInWithPassword(email, password)`
   - Supabase returns session with JWT

5. **User profile fetched**
   - Query `users` table for role
   - Default role: `executor` if missing

6. **JWT created with role**
   - JWT contains: `id`, `email`, `role`
   - Token expires in 24 hours

7. **HTTPOnly cookie set**
   - NextAuth stores token securely
   - Auto-sent with every request

8. **Redirect to dashboard**
   - User logged in successfully
   - Can access protected routes

---

## Logout Flow

### Via Frontend

```typescript
import { signOut } from 'next-auth/react';

// In your component
const handleLogout = async () => {
  await signOut({ redirect: true, callbackUrl: '/login' });
};
```

### What Happens

1. Session cleared on client
2. Token removed from cookies
3. User redirected to /login
4. Protected routes inaccessible

---

## Protected Routes

### Middleware Protection

Routes checked by middleware (`/middleware.ts`):
- `/dashboard` - authenticated users only
- `/team` - admin + head only
- `/settings` - admin only

### API Route Protection

Wrap with `getServerSession`:

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // User is authenticated
  const userId = session.user.id;
  const userRole = session.user.role;

  // Proceed with operation...
}
```

---

## Role-Based Access Control (RBAC)

### Roles

| Role | Permissions |
|------|-------------|
| **admin** | Full access to all features |
| **head** | Create/assign tasks, view team tasks |
| **executor** | Execute assigned tasks, submit evidence |
| **qa** | Review evidence, approve/reject tasks |

### Frontend RBAC

```typescript
import { useSession } from 'next-auth/react';

export function AdminPanel() {
  const { data: session } = useSession();

  if (session?.user.role !== 'admin') {
    return <div>Access denied</div>;
  }

  return <div>Admin content</div>;
}
```

### Backend RBAC

```typescript
// API route with role check
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !['admin', 'head'].includes(session.user.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Proceed with operation
}
```

### Database RLS

RLS policies check JWT role claim:

```sql
-- Example: Only admins and heads can create tasks
CREATE POLICY "Create task"
ON tasks
FOR INSERT
WITH CHECK (auth.jwt()->>'role' IN ('admin', 'head'));
```

---

## JWT Token Structure

### Token Payload

```json
{
  "sub": "uuid-of-user",
  "email": "user@example.com",
  "role": "executor",
  "iat": 1708255200,
  "exp": 1708341600
}
```

### Claims

| Claim | Type | Purpose |
|-------|------|---------|
| `sub` | string | User ID (from auth.users) |
| `email` | string | User email |
| `role` | string | User role (admin/head/executor/qa) |
| `iat` | number | Issued at timestamp |
| `exp` | number | Expiration timestamp |

### Expiration

- **Validity:** 24 hours from login
- **Refresh:** Automatic (NextAuth handles)
- **After logout:** Token invalidated

---

## Troubleshooting

### "Invalid credentials" on login

**Cause:** Email/password mismatch or user doesn't exist

**Fix:**
1. Verify user exists in Supabase Auth
2. Check password is correct
3. Ensure user profile exists in `users` table

### "Unauthorized" on protected route

**Cause:** No valid session/token

**Fix:**
1. Ensure you're logged in
2. Check `.env.local` has correct Supabase URL
3. Verify NEXTAUTH_SECRET is set

### "Forbidden" access denied

**Cause:** User role insufficient for operation

**Fix:**
1. Check `session.user.role` matches required role
2. Update user role in `users` table
3. Log out and log back in (refresh token)

### RLS policies blocking queries

**Cause:** JWT role not matching RLS policy

**Fix:**
1. Verify role claim in JWT (decode at jwt.io)
2. Check RLS policies match role values
3. Ensure user profile `role` field is correct

### Token expired error

**Cause:** 24-hour token validity exceeded

**Fix:**
- NextAuth auto-refreshes tokens
- If error persists, log out and log back in
- Check NEXTAUTH_SECRET hasn't changed

---

## Security Best Practices

### ✅ DO

- Store tokens in HTTPOnly cookies (NextAuth default)
- Validate password min 8 characters
- Use generic error messages ("Invalid credentials")
- Log out on sensitive operations
- Refresh tokens automatically
- Use HTTPS in production
- Rotate NEXTAUTH_SECRET regularly

### ❌ DON'T

- Store tokens in localStorage
- Log passwords or tokens
- Reveal if email exists
- Disable CSRF protection
- Send unencrypted credentials
- Hardcode secrets in code
- Use NEXTAUTH_SECRET in client code

---

## Integration with Database

### RLS Policies Require Role

RLS policies check `auth.jwt()->>'role'`:

```sql
-- Example: Executors only see assigned tasks
CREATE POLICY "Executor visibility"
ON tasks
FOR SELECT
USING (assigned_to = auth.uid());
```

### Ensure Role is Passed

In `/lib/auth.ts`, role is fetched and added to JWT:

```typescript
// 1. Fetch user profile with role
const { data: profile } = await supabaseAdmin
  .from('users')
  .select('id, email, role, name')
  .eq('id', data.user.id)
  .single();

// 2. Return with role
return {
  id: data.user.id,
  email: data.user.email,
  role: profile?.role || 'executor',
  // ...
};

// 3. Added to JWT in callback
async jwt({ token, user }) {
  if (user) {
    token.role = user.role; // ← Critical for RLS
  }
  return token;
}
```

---

## Testing Authentication

### Manual Testing

1. **Login with valid credentials**
   ```
   Email: test@example.com
   Password: TestPassword123
   Expected: Redirect to /dashboard
   ```

2. **Access /api/auth/session**
   ```
   GET /api/auth/session
   Expected: 200 + user data
   ```

3. **Access protected route without auth**
   ```
   GET /dashboard (no cookie)
   Expected: Redirect to /login
   ```

4. **Test different roles**
   - Admin: Access /settings
   - Head: Access /team
   - Executor: No access to /team (redirect)

### Automated Testing

```typescript
describe('Authentication', () => {
  it('should login with valid credentials', async () => {
    const result = await signIn('credentials', {
      email: 'test@example.com',
      password: 'TestPassword123',
      redirect: false,
    });
    expect(result?.ok).toBe(true);
  });

  it('should reject invalid credentials', async () => {
    const result = await signIn('credentials', {
      email: 'test@example.com',
      password: 'wrong',
      redirect: false,
    });
    expect(result?.error).toBeDefined();
  });
});
```

---

## Migration & Scaling

### Phase 2 Features

- [ ] OAuth social login (Google, GitHub)
- [ ] Two-factor authentication (2FA)
- [ ] Password reset flow
- [ ] Email verification
- [ ] Account deactivation

### Zero-Downtime Updates

Auth architecture supports upgrades without user impact:
- New OAuth providers: Add to authOptions
- 2FA: Add to user table, not breaking change
- Password reset: New routes, no existing changes

---

## References

- [NextAuth.js Docs](https://next-auth.js.org/)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [JWT.io](https://jwt.io/) - Decode tokens for debugging
- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)

---

**Last Updated:** 2026-02-18
**Story:** Story 1.5 - NextAuth.js + Supabase Auth Integration
**Status:** ✅ COMPLETE
