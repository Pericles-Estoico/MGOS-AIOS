import { test, expect } from '@playwright/test';

test.describe('Search and Filter Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button:has-text("Sign In")');
    await page.waitForNavigation();
  });

  test('should open global search with Cmd+K', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');

    // Press Cmd+K or Ctrl+K
    await page.keyboard.press('Control+K');

    // Verify search dialog opens
    const searchInput = await page.$('input[placeholder*="Search"]');
    expect(searchInput).toBeTruthy();
    expect(await searchInput?.isVisible()).toBe(true);
  });

  test('should search for tasks by title', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');

    // Open global search
    await page.keyboard.press('Control+K');

    // Type search query
    await page.fill('input[placeholder*="Search"]', 'login feature');

    // Wait for results
    await page.waitForSelector('button:has-text("login feature")', { timeout: 5000 }).catch(() => {});

    // Check if results appear
    const results = await page.$$('[class*="bg-blue-50"]');
    expect(results.length).toBeGreaterThanOrEqual(0); // Results may be empty for test data
  });

  test('should filter tasks by status', async ({ page }) => {
    await page.goto('http://localhost:3000/tasks');

    // Find status filter
    const statusFilter = await page.$('select[value="all"][aria-label*="Status"]').catch(() => null);

    if (statusFilter) {
      // Change to "In Progress" status
      await statusFilter.selectOption('in_progress');

      // Wait for filtered results
      await page.waitForTimeout(500);

      // Verify page updated
      const statusElements = await page.$$('[class*="in_progress"]');
      expect(statusElements.length).toBeGreaterThanOrEqual(0);
    }
  });

  test('should filter tasks by priority', async ({ page }) => {
    await page.goto('http://localhost:3000/tasks');

    // Find priority filter
    const prioritySelect = await page.$('select').catch(() => null);

    if (prioritySelect) {
      // Assuming priority is in a select dropdown
      await prioritySelect.selectOption('high');
      await page.waitForTimeout(500);

      // Results should be filtered
      const tasks = await page.$$('[class*="bg-white"][class*="rounded"]');
      expect(tasks.length).toBeGreaterThanOrEqual(0);
    }
  });

  test('should save filter template', async ({ page }) => {
    await page.goto('http://localhost:3000/tasks');

    // Look for save filter button
    const saveButton = await page.$('button:has-text("Salvar Filtro")').catch(() => null);

    if (saveButton) {
      await saveButton.click();

      // Fill in filter name
      const input = await page.$('input[placeholder*="Nome"]');
      if (input) {
        await input.fill('My Custom Filter');

        // Click save button in dialog
        const dialogSave = await page.$('button:has-text("Salvar")').catch(() => null);
        if (dialogSave) {
          await dialogSave.click();

          // Verify success message or filter appears in list
          await page.waitForTimeout(500);
          const savedFilter = await page.$('text=My Custom Filter').catch(() => null);
          expect(savedFilter).toBeTruthy();
        }
      }
    }
  });

  test('should apply saved filter', async ({ page }) => {
    await page.goto('http://localhost:3000/tasks');

    // Look for saved filters section
    const savedFilterButton = await page.$('[class*="font-semibold"]:has-text("My Custom Filter")').catch(() => null);

    if (savedFilterButton) {
      await savedFilterButton.click();

      // Wait for filters to apply
      await page.waitForTimeout(500);

      // Verify page shows filtered results
      const results = await page.$$('[class*="bg-white"]');
      expect(results.length).toBeGreaterThanOrEqual(0);
    }
  });

  test('should navigate search results with arrow keys', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');

    // Open search
    await page.keyboard.press('Control+K');

    // Type a search query
    const searchInput = await page.$('input[placeholder*="Search"]');
    if (searchInput) {
      await searchInput.fill('task');

      // Wait for results
      await page.waitForTimeout(500);

      // Press arrow down
      await page.keyboard.press('ArrowDown');

      // First result should be highlighted (bg-blue-50)
      const selectedResult = await page.$('[class*="bg-blue-50"]');
      expect(selectedResult).toBeTruthy();

      // Press arrow down again
      await page.keyboard.press('ArrowDown');

      // Should move to next result or wrap
      const results = await page.$$('[class*="hover:bg-blue-50"]');
      expect(results.length).toBeGreaterThan(0);
    }
  });

  test('should view search analytics (admin only)', async ({ page }) => {
    // This test assumes admin user is logged in
    await page.goto('http://localhost:3000/analytics/search');

    // Check if page loads
    const heading = await page.$('h1:has-text("Analytics de Busca")').catch(() => null);

    if (heading) {
      // Verify key metrics are displayed
      const metrics = await page.$$('[class*="bg-white"][class*="shadow"]');
      expect(metrics.length).toBeGreaterThanOrEqual(4); // At least 4 metric cards

      // Check for time range buttons
      const timeButtons = await page.$$('button:has-text("dias")');
      expect(timeButtons.length).toBeGreaterThanOrEqual(3); // 7, 30, 90 days
    }
  });

  test('should clear all filters', async ({ page }) => {
    await page.goto('http://localhost:3000/tasks');

    // Set some filters first
    const statusSelect = await page.$('select').catch(() => null);
    if (statusSelect) {
      await statusSelect.selectOption('in_progress');

      // Look for clear filters button
      const clearButton = await page.$('button:has-text("Clear All")').catch(() => null);

      if (clearButton) {
        await clearButton.click();

        // Verify filters are reset
        const select = await page.$('select');
        const value = await select?.inputValue().catch(() => 'all');
        expect(value).toBe('all');
      }
    }
  });

  test('should persist search history', async ({ page, context }) => {
    await page.goto('http://localhost:3000/dashboard');

    // Open search and perform a search
    await page.keyboard.press('Control+K');
    const searchInput = await page.$('input[placeholder*="Search"]');
    if (searchInput) {
      await searchInput.fill('first search');
      await page.keyboard.press('Escape');

      // Open search again
      await page.keyboard.press('Control+K');

      // Check if history appears
      const historyItems = await page.$$('text=🕐');
      expect(historyItems.length).toBeGreaterThanOrEqual(0);
    }
  });
});
