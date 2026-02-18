# STORY 3.4 - USER MANAGEMENT UI

**Status:** Ready for Development
**Duration:** 4-6 hours
**Priority:** High - System Management Feature
**Assigned to:** @dev (Dex)
**Created:** 2026-02-18

---

## 📋 Story Overview

As an admin, I need to manage system users (view, create, edit, delete) and assign roles so I can control team access and permissions.

---

## ✅ Acceptance Criteria

```
AC-3.4.1: User Management Page displays list of all users
  ✓ Page accessible only to admin role (403 forbidden for others)
  ✓ Displays all users with columns: name, email, role, status, created_at
  ✓ Supports sorting by: name, email, role, created_at
  ✓ Supports filtering by: role (executor, head, admin, qa), status (active, inactive)
  ✓ Pagination: 10-50 items per page (configurable)
  ✓ Shows total user count
  ✓ Load states and error handling

AC-3.4.2: User Detail/Edit Modal or Page
  ✓ Can click user row to open detail view
  ✓ Displays user information: id, name, email, role, status, created_at, updated_at
  ✓ Edit mode allows changing: name, email, role, status
  ✓ Validates email format on change
  ✓ Role dropdown with options: executor, head, admin, qa
  ✓ Status toggle: active/inactive
  ✓ Save button updates user via API
  ✓ Cancel button closes without saving
  ✓ Optimistic UI update on success
  ✓ Error messages display on failure

AC-3.4.3: Create New User functionality
  ✓ "Add User" button on user list page
  ✓ Opens form with fields: name, email, role, send_welcome_email checkbox
  ✓ Name: required, 2-100 characters
  ✓ Email: required, valid email format, unique check
  ✓ Role: required, dropdown selection
  ✓ Form validates on submit
  ✓ POST /api/users creates new user
  ✓ Default password generated and sent via email if checkbox enabled
  ✓ New user added to list immediately
  ✓ Success toast notification

AC-3.4.4: Delete User functionality
  ✓ Delete button on user detail view
  ✓ Confirmation dialog before deletion
  ✓ Shows warning if user has pending tasks
  ✓ DELETE /api/users/{id} removes user
  ✓ User removed from list on success
  ✓ Cannot delete own account
  ✓ Cannot delete last admin user
  ✓ Success/error toast notification

AC-3.4.5: Role-based Access Control in UI
  ✓ Admin role: full user management access
  ✓ Head role: read-only view of team users
  ✓ Executor/QA role: cannot access user management
  ✓ Buttons disabled appropriately based on role
  ✓ Page redirects to dashboard if no permission

AC-3.4.6: User Status indicators
  ✓ Active users show green status badge
  ✓ Inactive users show gray status badge
  ✓ Last login timestamp visible (if tracked)
  ✓ Email verified status indicator
```

---

## 🛠️ Tasks

### Phase 1: User Management Page & List

- [ ] **T-3.4.1: Create User Management page**
  - Subtasks:
    - [ ] Create `/app/(dashboard)/settings/users/page.tsx`
    - [ ] Add authorization check (admin only)
    - [ ] Fetch all users from `/api/users`
    - [ ] Implement user list table with columns: name, email, role, status, created_at
    - [ ] Add sorting by: name, email, role, created_at
    - [ ] Add filtering by: role, status
    - [ ] Implement pagination (10-50 per page)
    - [ ] Add search/filter bar
    - [ ] Add loading and error states
    - [ ] Add "Add User" button (opens create form)
    - [ ] Make rows clickable to view detail

- [ ] **T-3.4.2: Create User Detail/Edit Modal**
  - Subtasks:
    - [ ] Create Modal component for user detail
    - [ ] Display user info: name, email, role, status, timestamps
    - [ ] Add edit form with fields: name, email, role, status
    - [ ] Implement form validation
    - [ ] Add Save and Cancel buttons
    - [ ] Add Delete button (with confirmation)
    - [ ] Handle API response and errors
    - [ ] Show success/error toasts

### Phase 2: User CRUD API Endpoints

- [ ] **T-3.4.3: Create /api/users GET endpoint**
  - Subtasks:
    - [ ] Create `/app/api/users/route.ts`
    - [ ] Validate authentication (401 if not logged in)
    - [ ] Validate admin role (403 forbidden for non-admin)
    - [ ] Support query params: page, limit, sort_by, filter_role, filter_status
    - [ ] Fetch users from database
    - [ ] Return paginated results with metadata
    - [ ] Add error handling

- [ ] **T-3.4.4: Create /api/users POST endpoint (Create User)**
  - Subtasks:
    - [ ] Support POST in existing /api/users route
    - [ ] Validate authentication and admin role
    - [ ] Validate request body: name, email, role
    - [ ] Check email uniqueness
    - [ ] Generate temporary password (8 chars, mixed case)
    - [ ] Create user in database
    - [ ] Send welcome email with temp password (if flag set)
    - [ ] Return created user object
    - [ ] Handle duplicate email error

- [ ] **T-3.4.5: Create /api/users/{id} GET/PUT endpoints**
  - Subtasks:
    - [ ] Create `/app/api/users/[id]/route.ts`
    - [ ] GET: Fetch single user, validate auth/admin
    - [ ] PUT: Update user (name, email, role, status)
    - [ ] Validate email uniqueness on update
    - [ ] Prevent changing own admin status
    - [ ] Create audit log for update
    - [ ] Return updated user
    - [ ] Handle not found error

- [ ] **T-3.4.6: Create /api/users/{id} DELETE endpoint**
  - Subtasks:
    - [ ] DELETE: Remove user from system
    - [ ] Validate auth/admin role
    - [ ] Prevent self-deletion
    - [ ] Prevent deletion if last admin
    - [ ] Check for pending tasks (warning, not blocking)
    - [ ] Create audit log entry
    - [ ] Return success response
    - [ ] Handle edge cases

### Phase 3: Testing & Quality

- [ ] **T-3.4.7: Create comprehensive test suite**
  - Subtasks:
    - [ ] Test user list API: pagination, filtering, sorting
    - [ ] Test user creation: validation, duplicate email
    - [ ] Test user update: all fields, access control
    - [ ] Test user deletion: restrictions, audit log
    - [ ] Test UI components: form validation, error states
    - [ ] Test authorization: admin-only access
    - [ ] Aim for 100% test coverage

- [ ] **T-3.4.8: UI/UX polish**
  - Subtasks:
    - [ ] Responsive design (mobile, tablet, desktop)
    - [ ] Loading animations
    - [ ] Error state messaging
    - [ ] Success notifications (toast)
    - [ ] Confirm dialogs for destructive actions
    - [ ] Empty state message
    - [ ] Keyboard navigation (if applicable)
    - [ ] Accessibility audit (ARIA labels, alt text)

---

## 📊 Dev Agent Record

### Development Environment
- Framework: Next.js 16.1.6
- Database: Supabase (PostgreSQL)
- Authentication: NextAuth v4
- UI Library: React with shadcn components
- Testing: Vitest
- Package Manager: pnpm

### Required Data Models
- `users` table: id, name, email, password_hash, role, status, created_at, updated_at
- `audit_logs` table: for tracking user management changes
- Roles: executor, head, admin, qa

### API Contract

**GET /api/users**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "role": "executor|head|admin|qa",
      "status": "active|inactive",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

**POST /api/users**
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "role": "executor|head|admin|qa (required)",
  "send_welcome_email": "boolean (optional, default: true)"
}
```

**PUT /api/users/{id}**
```json
{
  "name": "string (optional)",
  "email": "string (optional)",
  "role": "executor|head|admin|qa (optional)",
  "status": "active|inactive (optional)"
}
```

---

## 🔗 Related Artifacts

- Story 2.1: Task Execution (user task assignment)
- Story 3.1: Email Notifications (welcome emails)
- Epic 2: Complete
- Epic 3: In Progress

---

## 📝 Notes

- User Management is a critical system feature
- Should follow same design patterns as Task Management
- Consider future features: 2FA, password reset, activity logs
- Email notifications should be integrated with Story 3.1
- Database schema must support audit logging

---

## ✅ Definition of Done

- [ ] All acceptance criteria met
- [ ] All tasks completed and tested
- [ ] 100% test coverage for new code
- [ ] Lint and build passing
- [ ] CodeRabbit review: 0 CRITICAL issues
- [ ] Deployed to staging
- [ ] Deployed to production
- [ ] Documentation updated
