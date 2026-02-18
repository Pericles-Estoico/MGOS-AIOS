# E2E Testing Guide

## Overview

This project uses Playwright for end-to-end testing of search and filter workflows.

## Prerequisites

1. Node.js 18+
2. App running on `http://localhost:3000`
3. Test user account: `test@example.com` / `password`

## Installation

```bash
# Install Playwright (if not already installed)
npm install -D @playwright/test
```

## Running E2E Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run E2E tests with UI
```bash
npm run test:e2e:ui
```

### Run specific test file
```bash
npx playwright test e2e/search-filter.e2e.ts
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run tests in debug mode
```bash
npx playwright test --debug
```

## Test Coverage

### Search and Filter Workflows
- **Global Search with Cmd+K**: Opens search dialog with keyboard shortcut
- **Search by Title**: Searches tasks by title text
- **Filter by Status**: Filters tasks by status (assigned, in_progress, etc)
- **Filter by Priority**: Filters tasks by priority level
- **Save Filter Template**: Creates and saves custom filter configurations
- **Apply Saved Filter**: Loads and applies previously saved filters
- **Arrow Key Navigation**: Navigates search results with keyboard
- **Search Analytics (Admin)**: Views search statistics and performance metrics
- **Clear All Filters**: Resets all active filters
- **Search History**: Persists and recalls previous searches

## Writing New Tests

### Template
```typescript
test('should do something', async ({ page }) => {
  // 1. Navigate to page
  await page.goto('http://localhost:3000/path');

  // 2. Perform action
  await page.click('button:has-text("Click me")');

  // 3. Assert result
  const element = await page.$('text=Expected result');
  expect(element).toBeTruthy();
});
```

### Common Selectors
```typescript
// By text
await page.$('button:has-text("Click me")');

// By placeholder
await page.$('input[placeholder*="Search"]');

// By class
await page.$$('[class*="bg-white"]');

// By data attribute
await page.$('[data-testid="my-element"]');
```

### Waiting for Elements
```typescript
// Wait for element to appear
await page.waitForSelector('text=Loaded');

// Wait for timeout
await page.waitForTimeout(500);

// Wait for navigation
await page.waitForNavigation();

// With timeout
await page.waitForSelector('text=Result', { timeout: 5000 });
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run E2E tests
  run: npm run test:e2e
```

## Debugging

### Screenshots on failure
```typescript
await page.screenshot({ path: 'screenshot.png' });
```

### Print to console
```typescript
console.log(await page.textContent('body'));
```

### Inspect element
```typescript
const element = await page.$('selector');
console.log(await element?.textContent());
```

## Best Practices

1. **Use data-testid**: Add `data-testid` attributes to elements for reliable selectors
2. **Wait properly**: Avoid hard-coded timeouts, use proper wait methods
3. **Clean up**: Login before each test, verify clean state
4. **Error handling**: Use `.catch()` for optional elements
5. **Performance**: Run tests in parallel when possible
6. **Isolation**: Each test should be independent

## Troubleshooting

### Port 3000 already in use
```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>
```

### Test timeouts
- Increase timeout in playwright.config.ts
- Check if element selector is correct
- Verify app is running

### Login failures
- Check test credentials are correct
- Verify login form selectors haven't changed
- Check session storage isn't blocking login

## Performance Targets

- ✅ Global search: < 500ms
- ✅ Filter apply: < 200ms
- ✅ Page load: < 2000ms
- ✅ Test suite: < 5 minutes total

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Locators Guide](https://playwright.dev/docs/locators)
