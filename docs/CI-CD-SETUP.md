# Epic 2 - CI/CD Setup Guide

**Version:** 2.0.0
**Status:** Complete
**Last Updated:** 2026-02-20

Complete guide for setting up CI/CD pipelines and development workflows.

---

## 🚀 Overview

Epic 2 includes automated testing, building, and deployment pipelines to ensure code quality and reliability.

### What's Included

- ✅ GitHub Actions CI/CD pipeline
- ✅ Pre-commit hooks (local validation)
- ✅ Code coverage tracking (Codecov integration)
- ✅ Automated test reporting
- ✅ Build verification

---

## 🔧 GitHub Actions (CI/CD Pipeline)

### Location
```
.github/workflows/ci-cd.yml
```

### Pipeline Stages

#### 1. Quality Checks (Lint + TypeScript)
```
✓ ESLint - Code style validation
✓ TypeScript - Type checking
```

**When runs:**
- On every push to `main` or `develop`
- On every pull request
- Blocks PR merge if fails

**What it checks:**
- Code follows style guidelines
- No unused imports
- All types are correct
- No TypeScript errors

**Failing example:**
```bash
$ npm run lint
✗ app/components/Timer.tsx - Unused variable 'count'
```

**Fix:**
- Remove unused code
- Follow ESLint rules
- Check `.eslintrc.json` for rules

---

#### 2. Unit Tests
```
✓ Run Vitest suite (63 tests)
✓ Report coverage
✓ Upload to Codecov
```

**When runs:**
- After quality checks pass
- On every push/PR
- Blocks PR merge if fails

**What it checks:**
- All 63 unit tests pass
- No test regressions
- Coverage meets threshold

**Test results:**
```
Test Files  6 passed (6)
Tests      63 passed (63)
Coverage   85% statements
```

**Failing example:**
```
✗ tests/utils/time-utils.test.ts
  Test: "secondsToMinutes rounds up"
  Expected: 1
  Received: 0
```

**Fix:**
- Check failing test
- Fix implementation
- Re-run locally: `npm test`
- Push again

---

#### 3. Build
```
✓ npm run build
✓ Compile TypeScript
✓ Generate Next.js output
```

**When runs:**
- After quality checks pass
- On every push/PR
- Blocks PR merge if fails

**What it checks:**
- All code compiles to JavaScript
- All imports resolve
- All routes are valid
- Bundle size reasonable

**Build output:**
```
✓ Compiled successfully
Routes (22):
  - ƒ /api/tasks (dynamic)
  - ○ /login (static)
  - ✓ /dashboard (optimized)
```

**Failing example:**
```
./app/components/Timer.tsx
TypeError: Cannot find module '@/utils/timer'
```

**Fix:**
- Check import path
- Verify file exists
- Use correct alias (@/)
- Run locally: `npm run build`

---

### Pipeline Status

#### Success ✅
All 3 stages passed:
1. Quality checks
2. Tests
3. Build

**Result:** PR can be merged to main

#### Failure ❌
Any stage failed:

**Example failure:**
```
❌ Test Stage Failed: 2 tests failing

tests/utils/validation.test.ts
  ✗ isValidUrl validates HTTPS URLs

Expected: true
Received: false
```

**Resolution steps:**
1. Click "Details" in GitHub PR
2. Scroll to failed job
3. Read error message
4. Fix code locally
5. Push fix
6. Rerun pipeline automatically

---

## 🪝 Pre-Commit Hooks

### Purpose

Catch issues **before** pushing to GitHub, saving CI/CD time and keeping history clean.

### Setup Instructions

#### Step 1: Install Husky
```bash
npm install husky --save-dev
npx husky install
```

#### Step 2: Create Pre-Commit Hook
```bash
npx husky add .husky/pre-commit "npm run lint && npm run typecheck && npm test -- --run"
```

#### Step 3: Verify Installation
```bash
cat .husky/pre-commit
# Should show: npm run lint && npm run typecheck && npm test -- --run
```

### What Pre-Commit Hook Does

**Before every commit:**

1. **Lint Check** (5-10 seconds)
   ```bash
   npm run lint
   ```
   - Validates code style
   - Fixes auto-fixable issues
   - Reports errors if any

2. **TypeScript Check** (5-10 seconds)
   ```bash
   npm run typecheck
   ```
   - Checks all types
   - Reports type errors
   - Blocks commit if errors

3. **Unit Tests** (10-20 seconds)
   ```bash
   npm test -- --run
   ```
   - Runs all 63 tests
   - Reports failures
   - Blocks commit if tests fail

### Usage Example

**Good Workflow:**
```bash
# Make changes
$ vim app/components/Timer.tsx

# Try to commit
$ git commit -m "fix: improve timer accuracy"

# Pre-commit runs:
# ✓ Lint passed
# ✓ TypeScript passed
# ✓ 63 tests passed
# ✓ Commit succeeds!

[main abc123] fix: improve timer accuracy
 1 file changed
```

**Bad Workflow:**
```bash
# Make changes with mistake
$ vim app/components/Timer.tsx
# (forgot to import something)

# Try to commit
$ git commit -m "fix: improve timer"

# Pre-commit runs:
# ✗ TypeScript error: Cannot find 'useState'
# ✓ Commit blocked!

# Fix the issue
$ vim app/components/Timer.tsx
# Add: import { useState } from 'react'

# Try again
$ git commit -m "fix: improve timer"
# ✓ Now passes!
```

### Bypassing Pre-Commit (Advanced)

**Not Recommended**, but if absolutely needed:

```bash
# Skip pre-commit hook
git commit --no-verify -m "message"

# But then CI/CD will catch issues!
# GitHub Actions still runs all checks
```

---

## 📊 Code Coverage

### Tracking Coverage

Coverage is automatically uploaded to **Codecov** on every push:

```
https://codecov.io/gh/your-org/MGOS-AIOS
```

### Current Coverage (Epic 2)

| Metric | Target | Status |
|--------|--------|--------|
| Statements | 80% | ✅ 85% |
| Branches | 75% | ✅ 82% |
| Functions | 80% | ✅ 86% |
| Lines | 80% | ✅ 85% |

### Viewing Coverage Locally

```bash
# Generate coverage report
npm test -- --coverage

# View HTML report
open coverage/index.html
```

### Coverage by File

```
tests/api/
  tasks.test.ts ..................... 100%

tests/utils/
  time-utils.test.ts ................ 95%
  validation.test.ts ................ 92%
  burndown-calculator.ts ............ 88%
  ...

Overall: 85% statements covered
```

---

## 🔄 Workflow Integration

### Developer Workflow

```
1. Create feature branch
   git checkout -b feature/my-feature

2. Make changes
   vim app/...

3. Pre-commit hooks run automatically
   ✓ Lint
   ✓ TypeScript
   ✓ Tests

4. Commit if all pass
   git commit -m "feat: ..."

5. Push to GitHub
   git push origin feature/my-feature

6. GitHub Actions pipeline runs
   ✓ Quality checks
   ✓ Tests
   ✓ Build

7. Create Pull Request
   PR shows CI status

8. Merge when all checks pass
```

### CI Status in Pull Requests

GitHub shows CI status directly in PR:

```
✅ ci/cd-pipeline — All checks passed
  └─ Quality checks (2 min)
  └─ Unit tests (3 min) — 63 passed
  └─ Build (2 min)

This branch has no conflicts with the base branch.

[Merge pull request]
```

---

## 🛠️ Troubleshooting

### "Pre-commit hook failed but I want to commit"

**Solution 1: Fix the issue (recommended)**
```bash
# Read error
npm run lint
# Fix errors
git add .
git commit -m "fix: lint errors"
```

**Solution 2: Bypass (only in emergency)**
```bash
git commit --no-verify -m "urgent fix"
# But GitHub Actions will still check!
```

### "Tests pass locally but fail in GitHub Actions"

**Possible causes:**
- Different Node version
- Different OS (Linux vs Mac)
- Missing environment variables
- Race conditions in tests

**Solution:**
```bash
# Match GitHub environment
node --version  # Should be 18.x

# Run tests exactly as GitHub does
npm ci  # Clean install
npm run lint
npm run typecheck
npm test -- --run
npm run build
```

### "GitHub Actions stuck/slow"

**Common causes:**
- npm install taking long (happens sometimes)
- Too many tests (but we have only 63, should be fast)
- Large file in repo

**Solution:**
- Wait for it to finish
- Check `.github/workflows/ci-cd.yml` for issues
- Contact admin if consistently slow

### "Can't push - pre-commit hook won't install"

**Solution:**
```bash
# Husky not initialized
npx husky install

# Verify
ls -la .husky/pre-commit

# If still fails
npm install husky --save-dev
npx husky install
npx husky add .husky/pre-commit "npm run lint && npm run typecheck && npm test -- --run"
```

---

## ✅ Checklist Before Submitting PR

Use this checklist before pushing code:

- [ ] Code follows style guide (`npm run lint` passes)
- [ ] All TypeScript types are correct (`npm run typecheck` passes)
- [ ] All tests pass locally (`npm test -- --run` passes)
- [ ] Build compiles without errors (`npm run build` passes)
- [ ] No console.log() debug statements left
- [ ] Documentation updated if needed
- [ ] Commit message is clear and descriptive
- [ ] Feature branch is up to date with main

**Pre-push check:**
```bash
npm run lint && npm run typecheck && npm test -- --run && npm run build
```

If all pass, you're ready to push! 🚀

---

## 📚 Resources

### Configuration Files
- `.github/workflows/ci-cd.yml` - GitHub Actions pipeline
- `.eslintrc.json` - Linting rules
- `tsconfig.json` - TypeScript configuration
- `vitest.config.ts` - Test runner configuration
- `.husky/pre-commit` - Pre-commit hook (auto-generated)

### Commands Reference
```bash
npm run lint           # Check code style
npm run lint:fix       # Auto-fix style issues
npm run typecheck      # Check TypeScript
npm test              # Run tests in watch mode
npm test -- --run     # Run tests once (CI mode)
npm test:coverage     # Generate coverage report
npm run build          # Build for production
```

### Related Documentation
- [API Documentation](./API-DOCUMENTATION.md)
- [User Guides](./USER-GUIDES.md)
- [Epic 2 Checkpoint](./EPIC-2-PHASE-3-CHECKPOINT.md)

---

## 🎯 Best Practices

✅ **Do:**
- Run `npm test` before committing
- Fix all lint warnings
- Keep tests passing
- Use meaningful commit messages
- Keep PRs focused and small
- Document your changes

❌ **Don't:**
- Force push to main
- Disable CI checks
- Ignore failing tests
- Leave debug code
- Skip type checking
- Make huge PRs with many changes

---

## 🚀 Next Steps

1. **Setup locally** (first time)
   ```bash
   npm install
   npx husky install
   npm test -- --run
   ```

2. **Before each commit**
   ```bash
   npm run lint
   npm run typecheck
   npm test -- --run
   ```

3. **On GitHub**
   - Pipeline auto-runs
   - Review results
   - Merge when all pass ✅

---

**Questions?** Check the troubleshooting section or contact your admin.

**Last Updated:** 2026-02-20
**Maintained By:** Development Team
**Status:** ✅ Ready for Production
