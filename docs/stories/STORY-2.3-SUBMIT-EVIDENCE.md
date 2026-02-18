# STORY 2.3 - SUBMIT EVIDENCE

**Status:** Draft - Ready for Development
**Duration:** 1 day
**Priority:** Critical - Core Feature
**Assigned to:** @dev (Dex)
**Created:** 2026-02-20

---

## 📋 Story Overview

As an executor, I need to submit evidence that I've completed the task so the QA team can review and validate my work.

---

## ✅ Acceptance Criteria

```
AC-2.3.1: Evidence form visible on task detail page
  ✓ Form appears in dedicated "Evidence" section
  ✓ Only visible to executor assigned to task
  ✓ Visible when task status is in_progress or submitted
  ✓ Toggle button to show/hide form

AC-2.3.2: Can upload file (URL or file input)
  ✓ Evidence currently accepts URL (file upload deferred to Phase 5)
  ✓ Input field for file URL (required)
  ✓ URL validation (must be valid URL format)
  ✓ Placeholder text guides user (https://example.com/artifact)
  ✓ Error message if URL invalid

AC-2.3.3: Can add description (optional)
  ✓ Description field optional
  ✓ Rich text editor OR plain text textarea (textarea is fine)
  ✓ Max 1000 characters
  ✓ Character counter visible
  ✓ Placeholder guides user

AC-2.3.4: Submit creates evidence record
  ✓ POST /api/evidence endpoint receives:
    - task_id
    - file_url
    - description (optional)
  ✓ Evidence record created in database
  ✓ Returns 201 Created on success
  ✓ Error handling (400 if missing required fields)
  ✓ Error handling (403 if not assigned to task)

AC-2.3.5: Evidence linked to task ID
  ✓ Evidence.task_id matches task being worked on
  ✓ Evidence.created_by matches current user
  ✓ Evidence retrieval via GET /api/evidence?task_id={id}
  ✓ Shows evidence associated with specific task only

AC-2.3.6: Evidence timestamp recorded
  ✓ created_at timestamp set by database
  ✓ Displayed in task detail page (pt-BR format)
  ✓ Supports audit trail

AC-2.3.7: Executor can see submitted evidence
  ✓ Evidence list displayed on task detail page
  ✓ Shows file URL with clickable link
  ✓ Shows description if provided
  ✓ Shows submission timestamp
  ✓ Multiple evidence items stacked vertically
```

---

## 🛠️ Tasks

### Phase 1: Evidence Form Enhancement

- [ ] **T-2.3.1: Review and enhance EvidenceForm component**
  - Subtasks:
    - [ ] Review /app/components/forms/EvidenceForm.tsx from Story 1.4
    - [ ] Verify file_url input (URL validation)
    - [ ] Verify description textarea (optional, max 1000 chars)
    - [ ] Add character counter to description
    - [ ] Verify form validation messages
    - [ ] Enhance error/success feedback
    - [ ] Add loading state during submission

- [ ] **T-2.3.2: Integrate form into task detail page**
  - Subtasks:
    - [ ] Update /app/(dashboard)/tasks/[id]/page.tsx
    - [ ] Add "Evidence" section (already partially done in 1.4)
    - [ ] Show existing evidence list
    - [ ] Show "Submit Evidence" button (toggle form visibility)
    - [ ] Show form only for assigned executor
    - [ ] Show form only when status in [in_progress, submitted]
    - [ ] On submit: refresh evidence list
    - [ ] Handle submission errors gracefully

### Phase 2: Evidence Display

- [ ] **T-2.3.3: Display evidence list on task detail**
  - Subtasks:
    - [ ] Show existing evidence items (if any)
    - [ ] Display file URL as clickable link
    - [ ] Display description (if provided)
    - [ ] Display submission date/time (pt-BR format)
    - [ ] Show "No evidence submitted yet" if empty
    - [ ] Show file icon or indicator
    - [ ] Click URL opens in new tab (target="_blank")

### Phase 3: API Verification

- [ ] **T-2.3.4: Verify /api/evidence endpoint**
  - Subtasks:
    - [ ] Verify GET /api/evidence works from Story 1.4
    - [ ] Supports filter by task_id: ?task_id={id}
    - [ ] Returns evidence array with all fields
    - [ ] Pagination optional but welcome
    - [ ] Verify POST /api/evidence works from Story 1.4
    - [ ] Validates required fields (task_id, file_url)
    - [ ] Validates user is assigned to task
    - [ ] Creates evidence.created_by from session.user.id
    - [ ] Returns 201 with created evidence record

- [ ] **T-2.3.5: API error handling**
  - Subtasks:
    - [ ] 401 if unauthenticated
    - [ ] 403 if not assigned to task
    - [ ] 404 if task not found
    - [ ] 400 if missing required fields
    - [ ] 400 if invalid URL format
    - [ ] Consistent error response format

### Phase 4: Testing & Validation

- [ ] **T-2.3.6: Test evidence submission flow**
  - Subtasks:
    - [ ] Test: Form visible for assigned executor
    - [ ] Test: Form hidden for non-assigned users
    - [ ] Test: Submit with valid URL
    - [ ] Test: Submit with description
    - [ ] Test: Submit without description (optional)
    - [ ] Test: Invalid URL format shows error
    - [ ] Test: Missing task_id shows error
    - [ ] Test: Character counter works (0-1000)

- [ ] **T-2.3.7: Test evidence display**
  - Subtasks:
    - [ ] Test: Evidence appears in list after submit
    - [ ] Test: URL clickable (opens in new tab)
    - [ ] Test: Description displays if provided
    - [ ] Test: Timestamp shows in pt-BR format
    - [ ] Test: Multiple evidence items stack correctly
    - [ ] Test: Empty state message shows

---

## 📝 Dev Notes

### Component Reuse
EvidenceForm already implemented in Story 1.4:
- Location: `/app/components/forms/EvidenceForm.tsx`
- Handles file_url and description inputs
- API integration to /api/evidence already done
- Callback support for parent integration

### URL Validation Pattern
```javascript
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
```

### Evidence Display Pattern
```typescript
{task.evidence && task.evidence.length > 0 ? (
  <div className="space-y-3">
    {task.evidence.map((item) => (
      <div key={item.id} className="border rounded-lg p-3">
        <a href={item.file_url} target="_blank" rel="noopener noreferrer">
          📎 {item.file_url.split('/').pop()}
        </a>
        {item.description && <p className="text-sm mt-1">{item.description}</p>}
        <p className="text-xs text-gray-500 mt-2">
          {new Date(item.created_at).toLocaleDateString('pt-BR')}
        </p>
      </div>
    ))}
  </div>
) : (
  <p className="text-gray-500">No evidence submitted yet</p>
)}
```

### RLS Consideration
The /api/evidence endpoint should enforce:
- User can only see evidence for their own tasks
- User can only submit evidence for assigned tasks
- RLS policy handles this automatically via task.assigned_to check

### Task Status for Evidence
Evidence can be submitted when:
- Task status = in_progress
- Task status = submitted (resubmit if rejected)

---

## 🧪 Testing Strategy

### Unit Tests
```bash
npm test -- evidence-form.test.ts

# Test cases:
- URL validation (valid, invalid formats)
- Description length (0-1000 chars)
- Form submission
- Error handling
```

### Integration Tests
```bash
npm test -- evidence-submission.integration.test.ts

# Test cases:
- Submit evidence for task
- Evidence appears in list
- Only assigned executor can submit
- Unauthorized access denied
```

### Manual Testing
- [ ] Login as executor with assigned task
- [ ] Navigate to task detail page
- [ ] See "Evidence" section
- [ ] Click "Submit Evidence" button
- [ ] Enter URL and description
- [ ] Submit form
- [ ] Verify success message
- [ ] Verify evidence appears in list
- [ ] Click URL and verify it opens
- [ ] Check database for created entry

---

## 📁 File List

### New Files to Create
```
utils/validation-utils.ts (URL validation function)
tests/components/evidence-form.test.ts
tests/integration/evidence-submission.integration.test.ts
```

### Files to Modify
```
app/components/forms/EvidenceForm.tsx (verify/enhance from 1.4)
app/(dashboard)/tasks/[id]/page.tsx (integrate form)
```

### Reuse from Story 1.4
```
app/api/evidence/route.ts (already implemented)
app/components/forms/EvidenceForm.tsx (base implementation)
```

---

## 🔍 Dev Agent Record

### Checkboxes Status
- [ ] Code implementation complete
- [ ] EvidenceForm enhanced
- [ ] Evidence display implemented
- [ ] API verified
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
- Story 2.1 (Task Execution) - To have task in_progress

**Required Context:**
- Story 1.4 (EvidenceForm component) ✅ Complete
- Story 1.1 (Database schema) ✅ Complete
- Story 1.5 (Authentication) ✅ Complete

**Delegates to:**
- None - Self-contained

---

**Prepared by:** @aios-master (Orion)
**Date:** 2026-02-20
**Status:** Ready for @dev (after Story 2.1)
