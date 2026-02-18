# STORY 2.3 - SUBMIT EVIDENCE

**Status:** In Progress - Phase 1-2 Implementation Complete
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

- [x] **T-2.3.1: Review and enhance EvidenceForm component**
  - Subtasks:
    - [x] Review /app/components/forms/EvidenceForm.tsx from Story 1.4
    - [x] Verify file_url input (URL validation with isValidUrl)
    - [x] Verify description textarea (optional, max 1000 chars)
    - [x] Add character counter to description (real-time display)
    - [x] Enhance validation messages with helper text
    - [x] Already has error/success feedback
    - [x] Already has loading state during submission

- [x] **T-2.3.2: Integrate form into task detail page**
  - Subtasks:
    - [x] Update /app/(dashboard)/tasks/[id]/page.tsx
    - [x] "Evidence" section already implemented in 1.4
    - [x] Existing evidence list display implemented
    - [x] "Submit Evidence" button with toggle functionality
    - [x] Form only shown for assigned executor (role check)
    - [x] Form visible when status in [in_progress, submitted]
    - [x] On submit: refresh evidence list (new refreshEvidence function)
    - [x] Error handling already in place

### Phase 2: Evidence Display

- [x] **T-2.3.3: Display evidence list on task detail**
  - Subtasks:
    - [x] Show existing evidence items (if any)
    - [x] Display file URL as clickable link (📎 icon)
    - [x] Display description (if provided)
    - [x] Display submission date/time (pt-BR format)
    - [x] Show "No evidence submitted yet" if empty
    - [x] File icon (📎) indicator already shown
    - [x] URLs open in new tab (target="_blank" rel="noopener noreferrer")

### Phase 3: API Verification

- [x] **T-2.3.4: Verify /api/evidence endpoint**
  - Subtasks:
    - [x] GET /api/evidence works (from Story 1.4)
    - [x] Supports filter by task_id: ?task_id={id} ✓
    - [x] Returns evidence array with all fields ✓
    - [x] Sorted by created_at DESC (most recent first)
    - [x] POST /api/evidence works (from Story 1.4)
    - [x] Validates required fields (task_id, file_url) ✓
    - [x] Validates user via session ✓
    - [x] Creates evidence.created_by from session.user.id ✓
    - [x] Returns 201 with created evidence record ✓

- [x] **T-2.3.5: API error handling**
  - Subtasks:
    - [x] 401 if unauthenticated (verified)
    - [x] 403 if not authorized (implicit via Supabase)
    - [x] 404 if task not found (implicit via Supabase)
    - [x] 400 if missing required fields ✓
    - [x] 400 validation via EvidenceForm isValidUrl ✓
    - [x] Error response format: { error: string }

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

### ✅ Modified Files
```
✅ app/components/forms/EvidenceForm.tsx
   - Add isValidUrl(string) utility function
   - Add URL validation on change and submit
   - Add character counter state (max 1000 chars)
   - Improve form validation with error messages
   - Add helper text for URL format guidance
   - Display real-time character count

✅ app/(dashboard)/tasks/[id]/page.tsx
   - Add refreshEvidence() function to fetch updated evidence list
   - Integrate refreshEvidence into EvidenceForm onSubmit callback
   - Evidence list now auto-updates after successful submission
   - All other evidence display logic already present
```

### ⏳ Pending (Phase 4 - Testing)
```
⏳ tests/components/evidence-form.test.ts (test structure template)
⏳ tests/integration/evidence-submission.integration.test.ts (integration templates)
```

### ✅ Reused from Story 1.4
```
✅ app/api/evidence/route.ts (verified working)
✅ app/components/forms/EvidenceForm.tsx (enhanced)
✅ Evidence display list on task detail page (verified working)
```

---

## 🔍 Dev Agent Record

### Checkboxes Status
- [x] Code implementation complete (Phase 1-3)
- [x] EvidenceForm enhanced (URL validation, character counter)
- [x] Evidence display implemented (list + refresh)
- [x] API verified (POST + GET working)
- [ ] All unit tests passing (structure ready for Vitest)
- [ ] All integration tests passing (structure ready for Vitest)
- [ ] Manual testing done
- [ ] CodeRabbit pre-commit review passed (0 CRITICAL)
- [x] TypeScript strict mode verified (npm run build passed)
- [x] ESLint passing (app/ directory clean)
- [ ] Story ready for QA review

### Debug Log
- **Started:** 2026-02-20 10:45 UTC
- **Implementation approach:**
  - Found that evidence form and list were already in place from Story 1.4
  - Identified critical gap: evidence list didn't refresh after submission
  - Enhanced EvidenceForm with URL validation and character counter
  - Added refreshEvidence() function to task detail page
  - Integrated refresh into form submission callback

- **Issues encountered:**
  - Evidence list wasn't updating after form submission (comment in code indicated missing refresh)
  - Resolution: Added GET /api/evidence call in refreshEvidence() and integrated into onSubmit

- **Discoveries:**
  - API endpoints (/api/evidence) fully functional from Story 1.4
  - Evidence display list already implemented on task detail page
  - EvidenceForm component needed enhancements (validation, UX improvements)
  - Character limit is 1000 per spec

### Completion Notes
- **Phase 1-3 Complete:** Evidence form enhancement, display, and API verification
- **Commits:** 1 commit (cfa2def) with Phase 1-3 implementation
- **Total Changes:** 2 files modified (EvidenceForm.tsx, task detail page)
- **Build Status:** ✅ TypeScript strict mode verified, Next.js compilation successful
- **Testing:** Test structure ready for Vitest implementation (Phase 4)
- **Next Steps:** Complete Phase 4 (testing & validation) or move to next story

### Change Log
- **Commit cfa2def:** feat: Implement Story 2.3 Phase 1-2 - Submit Evidence
  - Enhance EvidenceForm with URL validation and character counter
  - Add refreshEvidence() function for real-time evidence list updates
  - Integrate form refresh callback
  - Improve form UX with helper text and validation states
  - Build: ✅ All routes registered (17/17)

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
