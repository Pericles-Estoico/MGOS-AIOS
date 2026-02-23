# 🧪 Testing Guide - MGOS-AIOS

## Overview

This guide covers:
- **Unit Tests** - Individual API endpoints and functions
- **Integration Tests** - Complete workflows (analysis → approval → tasks)
- **Fixtures** - Reusable test data
- **Seed Data** - Production-like test database

---

## 📁 Test Structure

```
MGOS-AIOS/
├── app/api/__tests__/
│   ├── tasks.test.ts                 # Task CRUD operations
│   ├── marketplace-analysis.test.ts  # Marketplace analysis flow
│   ├── qa-reviews.test.ts            # QA review workflow
│   └── fixtures/
│       ├── tasks.fixtures.ts
│       ├── analysis.fixtures.ts
│       └── users.fixtures.ts
│
├── __tests__/
│   ├── e2e/
│   │   ├── task-creation.test.ts
│   │   ├── analysis-approval.test.ts
│   │   └── qa-gate.test.ts
│   │
│   ├── integration/
│   │   ├── supabase.test.ts
│   │   ├── auth.test.ts
│   │   └── realtime.test.ts
│   │
│   └── utils/
│       ├── test-setup.ts
│       ├── db-helpers.ts
│       └── mock-data.ts
│
├── supabase/
│   ├── seed.sql                      # Test data for database
│   └── reset.sql                     # Reset database for tests
│
├── vitest.config.ts                  # Vitest configuration
└── package.json                      # Test scripts
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom
```

### 2. Add Test Scripts to package.json

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "vitest run __tests__/e2e",
    "test:integration": "vitest run __tests__/integration",
    "db:seed": "supabase db push && supabase db seed",
    "db:reset": "psql -d postgres -c 'DROP DATABASE IF EXISTS mgos;' && npx supabase local start"
  }
}
```

### 3. Run Tests

```bash
# Run all tests once
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# UI dashboard
npm run test:ui

# E2E tests only
npm run test:e2e

# Seed test database
npm run db:seed
```

---

## 🗄️ Database Setup for Tests

### Option 1: Use Local Supabase

```bash
# Start local Supabase stack
npx supabase local start

# In another terminal, run migrations + seed
npx supabase db push
npm run db:seed
```

### Option 2: Use Staging Environment

```bash
# Connect to staging database
export SUPABASE_URL=https://staging.supabase.co
export SUPABASE_ANON_KEY=your_staging_key
npm run db:seed
```

### Option 3: Reset Between Test Runs

```bash
# Use reset.sql to clean database
psql -d staging_db -f supabase/reset.sql
npm run db:seed
npm test
```

---

## 📝 Seed Data Overview

### Seed File: `supabase/seed.sql`

Provides **production-like** test data:

#### Users (11 total)
- 1 Admin
- 2 Heads (leadership)
- 5 Executors (workers)
- 2 QA reviewers

#### Tasks (5 examples)
- 1 Pending (`a_fazer`)
- 1 In Progress (`fazendo`)
- 1 Awaiting QA (`enviado_qa`)
- 1 Approved (`aprovado`)
- 1 Completed (`concluido`)

#### Marketplace Plans (2 examples)
- 1 Pending approval
- 1 Approved (with Phase 1 tasks created)

#### Other Data
- Evidence files
- Time logs
- QA reviews
- Audit logs
- Marketplace channels (6)
- Agent messages
- Saved filters
- Notification preferences

### Load Seed Data

```bash
# Automatic (part of db push)
npx supabase db push

# Manual
psql -d local_db -f supabase/seed.sql

# Via Supabase CLI
supabase db seed
```

---

## 🧬 Test Fixtures

### What Are Fixtures?

Reusable test data objects that maintain consistency across tests.

### Example: Task Fixtures

```typescript
// app/api/__tests__/tasks.test.ts

import { mockTaskPayload, mockTaskResponse } from './tasks.test.ts';

describe('POST /api/tasks', () => {
  it('should create task', async () => {
    // Use fixture instead of hardcoding
    const response = await createTask(mockTaskPayload);

    expect(response).toEqual(expect.objectContaining(mockTaskResponse));
  });
});
```

### Fixture Files

```typescript
// fixtures/users.fixtures.ts
export const mockAdmin = {
  id: '10000000-0000-0000-0000-000000000001',
  email: 'admin@empresa.com',
  role: 'admin'
};

// fixtures/tasks.fixtures.ts
export const mockTaskPayload = {
  title: 'Otimizar título Amazon',
  frente: 'Marketplace',
  priority: 'high'
};

// fixtures/analysis.fixtures.ts
export const mockAnalysisPlanResponse = {
  status: 'pending',
  opportunities: [...]
};
```

---

## 📊 Test Categories

### 1. Unit Tests (Fast ⚡)

**What:** Test individual functions/endpoints in isolation

**Where:** `app/api/__tests__/*.test.ts`

**Example:**
```typescript
describe('POST /api/tasks', () => {
  it('should create task', async () => {
    const response = await POST(request);
    expect(response.status).toBe(201);
  });
});
```

**Run:**
```bash
npm test -- app/api/__tests__
```

---

### 2. Integration Tests (Medium ⚙️)

**What:** Test multiple components working together

**Where:** `__tests__/integration/`

**Example:**
```typescript
describe('Task Creation & QA Workflow', () => {
  it('should create, submit, and approve task', async () => {
    // 1. Create task
    const task = await createTask(payload);

    // 2. Submit evidence
    await submitEvidence(task.id, evidence);

    // 3. Submit to QA
    await updateTask(task.id, { status: 'enviado_qa' });

    // 4. QA approves
    const review = await approveQA(task.id);
    expect(review.status).toBe('aprovado');
  });
});
```

**Run:**
```bash
npm run test:integration
```

---

### 3. E2E Tests (Slower 🐢)

**What:** Test complete user workflows through UI

**Where:** `__tests__/e2e/`

**Example:**
```typescript
describe('Executor: Create and Complete Task', () => {
  it('should complete full task workflow', async () => {
    // Login as executor
    await login('joao@empresa.com');

    // Open task
    await goto('/tasks/50000000...');

    // Start timer
    await click('[data-test="start-timer"]');
    await wait(45 * 60 * 1000); // Simulate 45 min work

    // Upload evidence
    await uploadFile('screenshot.png');

    // Submit to QA
    await click('[data-test="submit-qa"]');

    // Verify status changed
    await expect('[data-status]').toHaveText('enviado_qa');
  });
});
```

**Run:**
```bash
npm run test:e2e
```

---

## ✅ Test Coverage

### Current Coverage

| File | Status | Coverage |
|------|--------|----------|
| Tasks API | ✅ In Progress | 60% |
| Marketplace Analysis | ✅ In Progress | 70% |
| QA Reviews | ✅ In Progress | 65% |
| Auth | ⏳ TODO | 0% |
| Time Tracking | ⏳ TODO | 0% |
| Notifications | ⏳ TODO | 0% |

### Generate Coverage Report

```bash
npm run test:coverage

# Open HTML report
open coverage/index.html
```

### Coverage Goals

- **Lines:** 80%+
- **Branches:** 75%+
- **Functions:** 80%+
- **Critical paths:** 100% (auth, QA, analysis)

---

## 🔍 Debugging Tests

### 1. Run Single Test File

```bash
npm test -- tasks.test.ts
```

### 2. Run Specific Test Suite

```bash
npm test -- --grep "POST /api/tasks"
```

### 3. Debug Mode

```bash
# Run with Node debugger
node --inspect-brk ./node_modules/vitest/vitest.mjs run tasks.test.ts

# Or use VS Code debugger (see .vscode/launch.json)
```

### 4. View Test Results UI

```bash
npm run test:ui

# Opens: http://localhost:51204/__vitest__/
```

---

## 🛠️ Common Issues & Solutions

### Issue: Tests fail with "Cannot find module '@/lib/supabase'"

**Solution:**
```bash
# Ensure vitest.config.ts has correct alias
# vitest.config.ts:
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    alias: {
      '@': '/home/finaa/repos/MGOS-AIOS'
    }
  }
});
```

### Issue: "No mock data loaded"

**Solution:**
```bash
# Ensure seed.sql was executed
npm run db:seed

# Verify data exists
psql -d local_db -c "SELECT COUNT(*) FROM users;"
```

### Issue: Tests timeout (> 30s)

**Solution:**
```typescript
// Increase timeout for integration tests
describe('Slow test', () => {
  it('should complete', async () => {
    // ...
  }, 60000); // 60 second timeout
});
```

---

## 📚 Writing New Tests

### Template: API Test

```typescript
// app/api/__tests__/new-endpoint.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('POST /api/new-endpoint', () => {
  beforeEach(() => {
    // Setup before each test
    vi.clearAllMocks();
  });

  it('should [what it does]', async () => {
    // Arrange: Set up data
    const payload = { /* ... */ };

    // Act: Call endpoint
    const response = await POST(request);

    // Assert: Verify results
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('data');
  });

  it('should handle errors', async () => {
    // Error case
  });
});
```

### Template: Integration Test

```typescript
// __tests__/integration/workflow.test.ts

describe('Complete Workflow', () => {
  it('should execute full flow', async () => {
    // Step 1
    const step1 = await action1();
    expect(step1.success).toBe(true);

    // Step 2 (depends on step 1)
    const step2 = await action2(step1.id);
    expect(step2.status).toBe('completed');

    // Step 3 (depends on step 2)
    const step3 = await action3(step2.id);
    expect(step3.verified).toBe(true);
  });
});
```

---

## 🚨 Pre-commit Checks

```bash
# Run before committing
npm test -- --run
npm run lint
npm run typecheck

# Git hook (auto-run on commit)
# Add to .git/hooks/pre-commit:
#!/bin/bash
npm test -- --run
npm run lint
```

---

## 📈 CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: supabase/postgres:latest
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm ci
      - run: npm run db:seed
      - run: npm test -- --run
      - run: npm run test:coverage
```

---

## 📞 Support

**Questions?**
- Check test files for examples
- Review fixture files in `__tests__/fixtures/`
- Run `npm run test:ui` for visual debugging
- Check Vitest docs: https://vitest.dev

---

**Last Updated:** 2026-02-23
**Status:** 🚧 In Progress (70% complete)
