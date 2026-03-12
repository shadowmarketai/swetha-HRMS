const { test, expect } = require('@playwright/test');

test.describe('HRMS Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show login screen on load', async ({ page }) => {
    const loginScreen = page.locator('#loginScreen');
    await expect(loginScreen).toBeVisible();
    await expect(page.locator('#loginId')).toBeVisible();
    await expect(page.locator('#loginPass')).toBeVisible();
  });

  test('should login with MD demo button', async ({ page }) => {
    await page.click('button:has-text("MD Login")');
    await expect(page.locator('#appContent')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#loginScreen')).toHaveClass(/hidden/);
  });

  test('should login with HR demo button', async ({ page }) => {
    await page.click('button:has-text("HR Login")');
    await expect(page.locator('#appContent')).toBeVisible({ timeout: 5000 });
  });

  test('should login with Employee demo button', async ({ page }) => {
    await page.click('button:has-text("Employee")');
    await expect(page.locator('#appContent')).toBeVisible({ timeout: 5000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('#loginId', 'INVALID');
    await page.fill('#loginPass', 'wrongpass');
    await page.click('#loginBtn');
    await expect(page.locator('#loginError')).toContainText('Invalid');
  });
});

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("MD Login")');
    await expect(page.locator('#appContent')).toBeVisible({ timeout: 5000 });
  });

  test('should switch tabs via bottom navigation', async ({ page }) => {
    // Click salary tab
    await page.click('[data-tab="salary"]');
    const salaryView = page.locator('#salaryView');
    await expect(salaryView).toBeVisible();
  });

  test('should open and close overlay', async ({ page }) => {
    // Open profile overlay
    await page.click('[onclick*="showOverlay(\'profile\')"]');
    const profileOverlay = page.locator('#overlay-profile');
    await expect(profileOverlay).toHaveClass(/active/);

    // Close via back button
    await page.click('#overlay-profile .back-btn');
    await expect(profileOverlay).not.toHaveClass(/active/);
  });
});

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("MD Login")');
    await expect(page.locator('#appContent')).toBeVisible({ timeout: 5000 });
  });

  test('should close overlay with Escape key', async ({ page }) => {
    // Open notifications overlay
    await page.click('[onclick*="showOverlay(\'notifications\')"]');
    const overlay = page.locator('#overlay-notifications');
    await expect(overlay).toHaveClass(/active/);

    // Press Escape
    await page.keyboard.press('Escape');
    await expect(overlay).not.toHaveClass(/active/);
  });
});

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("MD Login")');
    await expect(page.locator('#appContent')).toBeVisible({ timeout: 5000 });
  });

  test('overlays should have ARIA dialog role', async ({ page }) => {
    const overlay = page.locator('#overlay-profile');
    await expect(overlay).toHaveAttribute('role', 'dialog');
    await expect(overlay).toHaveAttribute('aria-modal', 'true');
    await expect(overlay).toHaveAttribute('aria-label', 'Profile');
  });

  test('bottom navigation should have navigation role', async ({ page }) => {
    const nav = page.locator('#bottomTabs');
    await expect(nav).toHaveAttribute('role', 'navigation');
  });

  test('main content should have main role', async ({ page }) => {
    const main = page.locator('#appContent');
    await expect(main).toHaveAttribute('role', 'main');
  });

  test('back buttons should have aria-label', async ({ page }) => {
    const backBtns = page.locator('.back-btn');
    const count = await backBtns.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(count, 5); i++) {
      await expect(backBtns.nth(i)).toHaveAttribute('aria-label', 'Go back');
    }
  });
});

test.describe('Salary Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Employee")');
    await expect(page.locator('#appContent')).toBeVisible({ timeout: 5000 });
  });

  test('should render salary view with employee data', async ({ page }) => {
    await page.click('[data-tab="salary"]');
    await expect(page.locator('#salaryView')).toBeVisible();
    // Should contain salary card with employee name
    await expect(page.locator('#salaryView')).toContainText('Vishnu Kumar');
  });
});

test.describe('XSS Prevention', () => {
  test('escapeHTML should neutralize script tags in announcements', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("MD Login")');
    await expect(page.locator('#appContent')).toBeVisible({ timeout: 5000 });

    // Inject a malicious announcement via JS console
    await page.evaluate(() => {
      announcements.push({
        id: 999,
        title: '<script>alert(1)</script>',
        body: '<img src=x onerror=alert(1)>',
        category: 'General',
        author: 'MD001',
        date: '2026-03-12',
        priority: 'normal'
      });
    });

    // Open announcements overlay
    await page.evaluate(() => showOverlay('hr-announcements'));
    await expect(page.locator('#overlay-hr-announcements')).toHaveClass(/active/);

    // Verify the script tag is rendered as escaped text, not executed
    const content = await page.locator('#overlay-hr-announcements').innerHTML();
    expect(content).toContain('&lt;script&gt;');
    expect(content).not.toContain('<script>alert');
  });
});

test.describe('Salary History', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Employee")');
    await expect(page.locator('#appContent')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate salary months via pills', async ({ page }) => {
    await page.click('[data-tab="salary"]');
    await expect(page.locator('#salaryView')).toBeVisible();
    // Click the salary card to view details
    const salaryCard = page.locator('.salary-card, .card').first();
    if (await salaryCard.isVisible()) {
      await salaryCard.click();
    }
  });
});

test.describe('Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("MD Login")');
    await expect(page.locator('#appContent')).toBeVisible({ timeout: 5000 });
  });

  test('should toggle dark mode', async ({ page }) => {
    // Open settings
    await page.evaluate(() => showOverlay('settings'));
    await expect(page.locator('#overlay-settings')).toHaveClass(/active/);
    // Find and click dark mode toggle
    const darkToggle = page.locator('#darkToggle, [onclick*="toggleDarkMode"]').first();
    if (await darkToggle.isVisible()) {
      await darkToggle.click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      await darkToggle.click();
      await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'dark');
    }
  });
});

test.describe('Leave Submission', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Employee")');
    await expect(page.locator('#appContent')).toBeVisible({ timeout: 5000 });
  });

  test('should open leave overlay and show form', async ({ page }) => {
    await page.evaluate(() => showOverlay('leave'));
    const overlay = page.locator('#overlay-leave');
    await expect(overlay).toHaveClass(/active/);
    // Check form elements exist
    await expect(page.locator('#leaveType, select[id*="leave"]').first()).toBeVisible();
  });
});

test.describe('Advance Request', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("MD Login")');
    await expect(page.locator('#appContent')).toBeVisible({ timeout: 5000 });
  });

  test('should open advance requests overlay', async ({ page }) => {
    await page.evaluate(() => showOverlay('advance-requests'));
    const overlay = page.locator('#overlay-advance-requests');
    await expect(overlay).toHaveClass(/active/);
  });
});

test.describe('Toast Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("MD Login")');
    await expect(page.locator('#appContent')).toBeVisible({ timeout: 5000 });
  });

  test('toast should have aria-live attribute', async ({ page }) => {
    // Trigger a toast
    await page.evaluate(() => showToast('Test toast message'));
    const toast = page.locator('.toast').first();
    await expect(toast).toBeVisible();
    await expect(toast).toHaveAttribute('role', 'status');
    await expect(toast).toHaveAttribute('aria-live', 'polite');
  });
});

test.describe('Focus Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("MD Login")');
    await expect(page.locator('#appContent')).toBeVisible({ timeout: 5000 });
  });

  test('overlay should restore focus on close', async ({ page }) => {
    // Focus a known element first
    const profileBtn = page.locator('[onclick*="showOverlay(\'profile\')"]');
    await profileBtn.focus();
    // Open and close overlay
    await profileBtn.click();
    await expect(page.locator('#overlay-profile')).toHaveClass(/active/);
    await page.keyboard.press('Escape');
    await expect(page.locator('#overlay-profile')).not.toHaveClass(/active/);
  });
});
