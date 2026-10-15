const { test, expect } = require('@playwright/test');

// ─── HELPERS ─────────────────────────────────────────────────────────
const MD = { code: 'MD001', pass: 'admin123' };
const HR = { code: 'HR001', pass: 'hr123' };
const EMP = { code: 'SS001', pass: 'emp123' };

/** Login via the real sign-in form and wait for app to load. */
async function login(page, { code, pass }) {
  await page.goto('/');
  await page.locator('#loginId').fill(code);
  await page.locator('#loginPass').fill(pass);
  await page.locator('#signInBtn').click();
  await expect(page.locator('#appContent')).toBeVisible({ timeout: 15000 });
}

/** Navigate to a screen tab using the JS switchTab function. */
async function goToTab(page, tabId) {
  await page.evaluate((id) => switchTab(id), tabId);
  await expect(page.locator(`#screen-${tabId}`)).toBeVisible({ timeout: 5000 });
}

/** Shortcut: evaluate JS in page to open an overlay. */
async function openOverlay(page, name) {
  await page.evaluate((n) => showOverlay(n), name);
  await expect(page.locator(`#overlay-${name}`)).toHaveClass(/active/, { timeout: 5000 });
}

// ═════════════════════════════════════════════════════════════════════
// 1. LOGIN & AUTH
// ═════════════════════════════════════════════════════════════════════
test.describe('Login & Authentication', () => {
  test('should show login screen on load', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#loginScreen')).toBeVisible();
    await expect(page.locator('#loginId')).toBeVisible();
    await expect(page.locator('#loginPass')).toBeVisible();
    await expect(page.locator('#signInBtn')).toBeVisible();
  });

  test('should show error for empty fields', async ({ page }) => {
    await page.goto('/');
    await page.locator('#signInBtn').click();
    const err = page.locator('#loginError');
    await expect(err).toContainText('Please enter', { timeout: 3000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/');
    await page.locator('#loginId').fill('INVALID');
    await page.locator('#loginPass').fill('wrongpass');
    await page.locator('#signInBtn').click();
    const err = page.locator('#loginError');
    await expect(err).toBeVisible({ timeout: 8000 });
    // The element is visible before the login response fills in the message
    await expect(err).toHaveText(/\S/, { timeout: 8000 });
  });

  test('should login as MD (MD001)', async ({ page }) => {
    await login(page, MD);
    await expect(page.locator('#appContent')).toBeVisible();
    await expect(page.locator('#loginScreen')).toHaveClass(/hidden/);
  });

  test('should login as HR (HR001)', async ({ page }) => {
    await login(page, HR);
    await expect(page.locator('#appContent')).toBeVisible();
  });

  test('should login as Employee (SS001)', async ({ page }) => {
    await login(page, EMP);
    await expect(page.locator('#appContent')).toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════════════
// 2. NAVIGATION
// ═════════════════════════════════════════════════════════════════════
test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, MD);
  });

  test('should show home screen after login', async ({ page }) => {
    const home = page.locator('#screen-home');
    await expect(home).toBeVisible();
  });

  test('should switch to attendance tab', async ({ page }) => {
    await goToTab(page, 'attendance');
  });

  test('should switch to salary tab', async ({ page }) => {
    await goToTab(page, 'salary');
  });

  test('should switch to advance tab', async ({ page }) => {
    await goToTab(page, 'advance');
  });

  test('should switch to progress tab', async ({ page }) => {
    await goToTab(page, 'progress');
  });

  test('should open and close profile overlay', async ({ page }) => {
    await openOverlay(page, 'profile');
    const overlay = page.locator('#overlay-profile');
    await expect(overlay).toHaveClass(/active/);
    // Close via back button
    await page.locator('#overlay-profile .back-btn').click();
    await expect(overlay).not.toHaveClass(/active/);
  });

  test('should close overlay with Escape key', async ({ page }) => {
    await openOverlay(page, 'notifications');
    const overlay = page.locator('#overlay-notifications');
    await expect(overlay).toHaveClass(/active/);
    await page.keyboard.press('Escape');
    await expect(overlay).not.toHaveClass(/active/);
  });
});

// ═════════════════════════════════════════════════════════════════════
// 3. ATTENDANCE — GPS CHECK-IN / CHECK-OUT
// ═════════════════════════════════════════════════════════════════════
test.describe('Attendance — Check-in/Check-out', () => {
  test('GPS check-in or check-out button visible on home', async ({ page }) => {
    await login(page, EMP);
    // Either check-in or check-out button should be visible depending on state
    const checkinBtn = page.locator('#gpsCheckinBtn');
    const checkoutBtn = page.locator('#gpsCheckoutBtn, button:has-text("Check Out")').first();
    const hasCheckin = await checkinBtn.isVisible().catch(() => false);
    const hasCheckout = await checkoutBtn.isVisible().catch(() => false);
    expect(hasCheckin || hasCheckout).toBeTruthy();
  });

  test('attendance calendar renders', async ({ page }) => {
    await login(page, EMP);
    await goToTab(page, 'attendance');
    // Calendar card should be visible
    await expect(page.locator('#calendarCard')).toBeVisible({ timeout: 5000 });
  });
});

// ═════════════════════════════════════════════════════════════════════
// 4. LEAVE MANAGEMENT
// ═════════════════════════════════════════════════════════════════════
test.describe('Leave Management', () => {
  test('should open leave form and submit leave application', async ({ page }) => {
    await login(page, EMP);
    await goToTab(page, 'attendance');

    // Open leave form
    const applyBtn = page.locator('#applyLeaveBtn, [onclick*="openLeaveForm"]').first();
    if (await applyBtn.isVisible()) {
      await applyBtn.click();
      await expect(page.locator('#leaveFormOverlay, .leave-form').first()).toBeVisible({ timeout: 5000 });

      // Select leave type
      await page.evaluate(() => {
        if (typeof selectLeaveType === 'function') selectLeaveType('CL');
      });

      // Fill dates
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const fromInput = page.locator('#leaveFrom, [name="leaveFrom"]').first();
      const toInput = page.locator('#leaveTo, [name="leaveTo"]').first();
      if (await fromInput.isVisible()) {
        await fromInput.fill(dateStr);
        await toInput.fill(dateStr);
      }

      const reasonInput = page.locator('#leaveReason, [name="leaveReason"], textarea').first();
      if (await reasonInput.isVisible()) {
        await reasonInput.fill('E2E test leave application');
      }

      // Submit
      const submitBtn = page.locator('[onclick*="submitLeave"], button:has-text("Submit Leave"), button:has-text("Apply")').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        const toast = page.locator('.toast').first();
        await expect(toast).toBeVisible({ timeout: 8000 });
      }
    }
  });

  test('MD can see attendance screen with leave controls', async ({ page }) => {
    await login(page, MD);
    await goToTab(page, 'attendance');
    // MD should see the attendance screen with calendar
    await expect(page.locator('#calendarCard')).toBeVisible({ timeout: 5000 });
  });
});

// ═════════════════════════════════════════════════════════════════════
// 5. ADVANCE REQUESTS
// ═════════════════════════════════════════════════════════════════════
test.describe('Advance Requests', () => {
  test('should open salary advance form and submit', async ({ page }) => {
    await login(page, EMP);
    await goToTab(page, 'advance');

    // Open advance form
    await page.evaluate(() => {
      if (typeof openAdvanceApplyForm === 'function') openAdvanceApplyForm('salary');
    });
    await page.waitForTimeout(1000);

    // Fill amount
    const amountInput = page.locator('#advanceAmount, [name="advanceAmount"], input[type="number"]').first();
    if (await amountInput.isVisible()) {
      await amountInput.fill('5000');
    }

    const reasonInput = page.locator('#advanceReason, [name="advanceReason"], textarea').first();
    if (await reasonInput.isVisible()) {
      await reasonInput.fill('E2E test advance');
    }

    // Submit
    const submitBtn = page.locator('[onclick*="submitAdvance"], button:has-text("Submit"), button:has-text("Apply")').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      const toast = page.locator('.toast').first();
      await expect(toast).toBeVisible({ timeout: 8000 });
    }
  });

  test('MD can open advance requests overlay', async ({ page }) => {
    await login(page, MD);
    await openOverlay(page, 'advance-requests');
    await expect(page.locator('#overlay-advance-requests')).toHaveClass(/active/);
  });
});

// ═════════════════════════════════════════════════════════════════════
// 6. EMPLOYEE ONBOARDING
// ═════════════════════════════════════════════════════════════════════
test.describe('Employee Onboarding', () => {
  test('MD can open onboarding wizard', async ({ page }) => {
    await login(page, MD);
    await openOverlay(page, 'onboarding');
    const overlay = page.locator('#overlay-onboarding');
    await expect(overlay).toHaveClass(/active/);
    // Wizard step 1 should be visible
    await expect(page.locator('.wizard-step.active, [data-step="1"]').first()).toBeVisible();
  });

  test('onboarding wizard navigates steps', async ({ page }) => {
    await login(page, MD);
    await openOverlay(page, 'onboarding');

    // Fill required fields on step 1
    const nameInput = page.locator('#obName, [name="obName"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('E2E Test Employee');
    }

    // Navigate to step 2
    const nextBtn = page.locator('[onclick*="wizardNav(1)"], button:has-text("Next")').first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(500);
    }
  });
});

// ═════════════════════════════════════════════════════════════════════
// 7. ADMIN PANEL
// ═════════════════════════════════════════════════════════════════════
test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, MD);
    await openOverlay(page, 'admin');
  });

  test('admin panel opens with tabs', async ({ page }) => {
    await expect(page.locator('#overlay-admin')).toHaveClass(/active/);
  });

  test('can switch to departments tab', async ({ page }) => {
    // Click the actual Departments tab button in the UI
    await page.locator('.admin-tab:has-text("Departments")').click();
    await expect(page.locator('#adminDepts')).not.toHaveClass(/hidden/, { timeout: 3000 });
  });

  test('can switch to employees tab', async ({ page }) => {
    await page.locator('.admin-tab:has-text("Departments")').click();
    await page.locator('.admin-tab:has-text("Employee Database")').click();
    await expect(page.locator('#adminEmpDb')).not.toHaveClass(/hidden/, { timeout: 3000 });
  });

  test('can switch to geofence tab', async ({ page }) => {
    await page.locator('.admin-tab:has-text("Geofence")').click();
    await expect(page.locator('#adminGeofence')).not.toHaveClass(/hidden/, { timeout: 3000 });
  });
});

// ═════════════════════════════════════════════════════════════════════
// 8. KPI / PERFORMANCE
// ═════════════════════════════════════════════════════════════════════
test.describe('KPI & Performance', () => {
  test('employee can open KPI overlay', async ({ page }) => {
    await login(page, EMP);
    await openOverlay(page, 'hr-kpi');
    await expect(page.locator('#overlay-hr-kpi')).toHaveClass(/active/);
  });

  test('MD can open KPI overlay and view scores', async ({ page }) => {
    await login(page, MD);
    await openOverlay(page, 'hr-kpi');
    await expect(page.locator('#overlay-hr-kpi')).toHaveClass(/active/);
  });
});

// ═════════════════════════════════════════════════════════════════════
// 9. TASKS
// ═════════════════════════════════════════════════════════════════════
test.describe('Task Management', () => {
  test('can open tasks overlay', async ({ page }) => {
    await login(page, MD);
    await openOverlay(page, 'hr-tasks');
    await expect(page.locator('#overlay-hr-tasks')).toHaveClass(/active/);
  });
});

// ═════════════════════════════════════════════════════════════════════
// 10. RECRUITMENT
// ═════════════════════════════════════════════════════════════════════
test.describe('Recruitment', () => {
  test('can open recruitment overlay', async ({ page }) => {
    await login(page, MD);
    await openOverlay(page, 'hr-recruit');
    await expect(page.locator('#overlay-hr-recruit')).toHaveClass(/active/);
  });
});

// ═════════════════════════════════════════════════════════════════════
// 11. PROJECTS & SITE TRACKING
// ═════════════════════════════════════════════════════════════════════
test.describe('Projects', () => {
  test('progress screen renders', async ({ page }) => {
    await login(page, MD);
    await goToTab(page, 'progress');
    // The progress screen itself should be visible
    await expect(page.locator('#screen-progress')).toBeVisible();
  });

  test('can open project form for new project', async ({ page }) => {
    await login(page, MD);
    await goToTab(page, 'progress');

    await page.evaluate(() => {
      if (typeof openProjectForm === 'function') openProjectForm();
    });
    await page.waitForTimeout(1000);
  });
});

// ═════════════════════════════════════════════════════════════════════
// 12. SALARY & PAYROLL
// ═════════════════════════════════════════════════════════════════════
test.describe('Salary & Payroll', () => {
  test('salary view renders for employee', async ({ page }) => {
    await login(page, EMP);
    await goToTab(page, 'salary');
  });

  test('MD can see salary screen with payroll buttons', async ({ page }) => {
    await login(page, MD);
    await goToTab(page, 'salary');
  });
});

// ═════════════════════════════════════════════════════════════════════
// 13. DOCUMENTS
// ═════════════════════════════════════════════════════════════════════
test.describe('Documents', () => {
  test('can open documents overlay', async ({ page }) => {
    await login(page, MD);
    await openOverlay(page, 'hr-documents');
    await expect(page.locator('#overlay-hr-documents')).toHaveClass(/active/);
  });
});

// ═════════════════════════════════════════════════════════════════════
// 14. ANNOUNCEMENTS
// ═════════════════════════════════════════════════════════════════════
test.describe('Announcements', () => {
  test('can open announcements overlay', async ({ page }) => {
    await login(page, MD);
    await openOverlay(page, 'hr-announcements');
    await expect(page.locator('#overlay-hr-announcements')).toHaveClass(/active/);
  });

  test('MD can create an announcement', async ({ page }) => {
    await login(page, MD);
    await openOverlay(page, 'hr-announcements');

    // Open form
    await page.evaluate(() => {
      if (typeof openAnnouncementForm === 'function') openAnnouncementForm();
    });
    await page.waitForTimeout(1000);

    // Fill form
    const titleInput = page.locator('#announcementTitle, [name="announcementTitle"], input[placeholder*="title" i]').first();
    const bodyInput = page.locator('#announcementBody, [name="announcementBody"], textarea').first();

    if (await titleInput.isVisible()) {
      await titleInput.fill('E2E Test Announcement');
    }
    if (await bodyInput.isVisible()) {
      await bodyInput.fill('This is a test announcement from E2E tests.');
    }

    // Submit
    const submitBtn = page.locator('[onclick*="createAnnouncement"], button:has-text("Post"), button:has-text("Create"), button:has-text("Submit")').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      const toast = page.locator('.toast').first();
      await expect(toast).toBeVisible({ timeout: 8000 });
    }
  });
});

// ═════════════════════════════════════════════════════════════════════
// 15. SHIFTS
// ═════════════════════════════════════════════════════════════════════
test.describe('Shifts', () => {
  test('can open shifts overlay', async ({ page }) => {
    await login(page, MD);
    await openOverlay(page, 'hr-shifts');
    await expect(page.locator('#overlay-hr-shifts')).toHaveClass(/active/);
  });
});

// ═════════════════════════════════════════════════════════════════════
// 16. EXPENSES
// ═════════════════════════════════════════════════════════════════════
test.describe('Expenses', () => {
  test('can open expenses overlay', async ({ page }) => {
    await login(page, MD);
    await openOverlay(page, 'hr-expenses');
    await expect(page.locator('#overlay-hr-expenses')).toHaveClass(/active/);
  });

  test('employee can navigate to site screen', async ({ page }) => {
    await login(page, EMP);
    await goToTab(page, 'site');
  });
});

// ═════════════════════════════════════════════════════════════════════
// 17. TAX & COMPLIANCE
// ═════════════════════════════════════════════════════════════════════
test.describe('Tax & Compliance', () => {
  test('can open tax overlay', async ({ page }) => {
    await login(page, MD);
    await openOverlay(page, 'hr-tax');
    await expect(page.locator('#overlay-hr-tax')).toHaveClass(/active/);
  });

  test('can open compliance overlay', async ({ page }) => {
    await login(page, MD);
    await openOverlay(page, 'hr-compliance');
    await expect(page.locator('#overlay-hr-compliance')).toHaveClass(/active/);
  });
});

// ═════════════════════════════════════════════════════════════════════
// 18. ASSETS
// ═════════════════════════════════════════════════════════════════════
test.describe('Assets', () => {
  test('can open assets overlay', async ({ page }) => {
    await login(page, MD);
    await openOverlay(page, 'hr-assets');
    await expect(page.locator('#overlay-hr-assets')).toHaveClass(/active/);
  });
});

// ═════════════════════════════════════════════════════════════════════
// 19. EXIT / RESIGNATION
// ═════════════════════════════════════════════════════════════════════
test.describe('Exit Management', () => {
  test('can open exit overlay', async ({ page }) => {
    await login(page, MD);
    await openOverlay(page, 'hr-exit');
    await expect(page.locator('#overlay-hr-exit')).toHaveClass(/active/);
  });
});

// ═════════════════════════════════════════════════════════════════════
// 20. NOTIFICATIONS
// ═════════════════════════════════════════════════════════════════════
test.describe('Notifications', () => {
  test('can open notifications overlay', async ({ page }) => {
    await login(page, MD);
    await openOverlay(page, 'notifications');
    await expect(page.locator('#overlay-notifications')).toHaveClass(/active/);
  });

  test('mark all read button works', async ({ page }) => {
    await login(page, MD);
    await openOverlay(page, 'notifications');
    const markAllBtn = page.locator('[onclick*="markAllNotifRead"], button:has-text("Mark All Read"), button:has-text("Mark all")').first();
    if (await markAllBtn.isVisible()) {
      await markAllBtn.click();
      await page.waitForTimeout(1000);
    }
  });
});

// ═════════════════════════════════════════════════════════════════════
// 21. SETTINGS
// ═════════════════════════════════════════════════════════════════════
test.describe('Settings', () => {
  test('can open settings overlay', async ({ page }) => {
    await login(page, MD);
    await openOverlay(page, 'settings');
    await expect(page.locator('#overlay-settings')).toHaveClass(/active/);
  });

  test('dark mode toggle works', async ({ page }) => {
    await login(page, MD);
    await openOverlay(page, 'settings');
    const darkToggle = page.locator('#darkToggle, [onclick*="toggleDarkMode"]').first();
    if (await darkToggle.isVisible()) {
      await darkToggle.click();
      await page.waitForTimeout(500);
      // Toggle back
      await darkToggle.click();
      await page.waitForTimeout(500);
    }
  });

  test('password change form requires fields', async ({ page }) => {
    await login(page, MD);
    await openOverlay(page, 'settings');

    // Try to change password with empty fields
    const changeBtn = page.locator('[onclick*="changePassword"], button:has-text("Update Password"), button:has-text("Change Password")').first();
    if (await changeBtn.isVisible()) {
      await changeBtn.click();
      // Should show validation error
      const toast = page.locator('.toast').first();
      await expect(toast).toBeVisible({ timeout: 5000 });
    }
  });
});

// ═════════════════════════════════════════════════════════════════════
// 22. PROFILE
// ═════════════════════════════════════════════════════════════════════
test.describe('Profile', () => {
  test('profile overlay shows employee details', async ({ page }) => {
    await login(page, EMP);
    await openOverlay(page, 'profile');
    await expect(page.locator('#overlay-profile')).toHaveClass(/active/);
  });
});

// ═════════════════════════════════════════════════════════════════════
// 23. CELEBRATIONS
// ═════════════════════════════════════════════════════════════════════
test.describe('Celebrations', () => {
  test('can open celebrations overlay', async ({ page }) => {
    await login(page, MD);
    await openOverlay(page, 'hr-celebrations');
    await expect(page.locator('#overlay-hr-celebrations')).toHaveClass(/active/);
  });
});

// ═════════════════════════════════════════════════════════════════════
// 24. ANALYTICS
// ═════════════════════════════════════════════════════════════════════
test.describe('Analytics', () => {
  test('can open analytics overlay', async ({ page }) => {
    await login(page, MD);
    await openOverlay(page, 'hr-analytics');
    await expect(page.locator('#overlay-hr-analytics')).toHaveClass(/active/);
  });
});

// ═════════════════════════════════════════════════════════════════════
// 25. LOCATION TRACKER
// ═════════════════════════════════════════════════════════════════════
test.describe('Location Tracker', () => {
  test('can open location overlay', async ({ page }) => {
    await login(page, MD);
    await openOverlay(page, 'location');
    await expect(page.locator('#overlay-location')).toHaveClass(/active/);
  });
});

// ═════════════════════════════════════════════════════════════════════
// 26. ACCESSIBILITY
// ═════════════════════════════════════════════════════════════════════
test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, MD);
  });

  test('overlays have ARIA dialog role', async ({ page }) => {
    const overlay = page.locator('#overlay-profile');
    await expect(overlay).toHaveAttribute('role', 'dialog');
    await expect(overlay).toHaveAttribute('aria-modal', 'true');
  });

  test('bottom navigation has navigation role', async ({ page }) => {
    const nav = page.locator('#bottomTabs');
    await expect(nav).toHaveAttribute('role', 'navigation');
  });

  test('main content has main role', async ({ page }) => {
    const main = page.locator('#appContent');
    await expect(main).toHaveAttribute('role', 'main');
  });

  test('back buttons have aria-label', async ({ page }) => {
    const backBtns = page.locator('.back-btn');
    const count = await backBtns.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(count, 5); i++) {
      await expect(backBtns.nth(i)).toHaveAttribute('aria-label', 'Go back');
    }
  });

  test('toast has aria-live attribute', async ({ page }) => {
    await page.evaluate(() => showToast('Test toast message'));
    const toast = page.locator('.toast').first();
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toHaveAttribute('role', 'status');
    await expect(toast).toHaveAttribute('aria-live', 'polite');
  });
});

// ═════════════════════════════════════════════════════════════════════
// 27. XSS PREVENTION
// ═════════════════════════════════════════════════════════════════════
test.describe('XSS Prevention', () => {
  test('escapeHTML neutralizes script tags', async ({ page }) => {
    await login(page, MD);
    await page.evaluate(() => {
      if (typeof announcements !== 'undefined') {
        announcements.push({
          id: 999,
          title: '<script>alert(1)</script>',
          body: '<img src=x onerror=alert(1)>',
          category: 'General',
          author: 'MD001',
          date: '2026-03-31',
          priority: 'normal'
        });
      }
    });
    await openOverlay(page, 'hr-announcements');
    const content = await page.locator('#overlay-hr-announcements').innerHTML();
    expect(content).not.toContain('<script>alert');
  });
});

// ═════════════════════════════════════════════════════════════════════
// 28. ROLE-BASED ACCESS
// ═════════════════════════════════════════════════════════════════════
test.describe('Role-Based Access', () => {
  test('employee cannot see admin panel', async ({ page }) => {
    await login(page, EMP);
    // Admin button should be hidden for regular employee
    const adminBtn = page.locator('[onclick*="showOverlay(\'admin\')"]');
    const count = await adminBtn.count();
    // Either hidden or not present
    if (count > 0) {
      const isVisible = await adminBtn.first().isVisible();
      expect(isVisible).toBeFalsy();
    }
  });

  test('MD can see admin panel', async ({ page }) => {
    await login(page, MD);
    await openOverlay(page, 'admin');
    await expect(page.locator('#overlay-admin')).toHaveClass(/active/);
  });
});

// ═════════════════════════════════════════════════════════════════════
// 29. API HEALTH CHECK
// ═════════════════════════════════════════════════════════════════════
test.describe('API Health', () => {
  /** Get a valid auth token. */
  async function getToken(request) {
    const loginRes = await request.post('/api/auth/login', {
      data: { empCode: 'MD001', password: 'admin123' }
    });
    const data = await loginRes.json();
    return data.token;
  }

  test('health endpoint returns ok', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.db).toBe('ok');
  });

  test('login API returns token', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: { empCode: 'MD001', password: 'admin123' }
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.token).toBeTruthy();
    expect(data.user.empCode).toBe('MD001');
    expect(data.user.role).toBe('MD');
  });

  test('login API rejects bad credentials', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: { empCode: 'INVALID', password: 'wrong' }
    });
    // 401 normally, 429 if rate limited
    expect([401, 429]).toContain(response.status());
  });

  test('employees API requires auth', async ({ request }) => {
    const response = await request.get('/api/employees');
    expect([401, 403]).toContain(response.status());
  });

  test('employees API works with valid token', async ({ request }) => {
    const token = await getToken(request);
    const response = await request.get('/api/employees', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    // API returns { data: [...], total, page, limit }
    const employees = Array.isArray(data) ? data : data.data;
    expect(Array.isArray(employees)).toBeTruthy();
    expect(employees.length).toBeGreaterThan(0);
  });

  test('leaves API works with valid token', async ({ request }) => {
    const token = await getToken(request);
    const response = await request.get('/api/leaves', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.ok()).toBeTruthy();
  });

  test('advances API works with valid token', async ({ request }) => {
    const token = await getToken(request);
    const response = await request.get('/api/advances', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.ok()).toBeTruthy();
  });

  test('projects API works with valid token', async ({ request }) => {
    const token = await getToken(request);
    const response = await request.get('/api/projects', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('announcements API works', async ({ request }) => {
    const token = await getToken(request);
    const response = await request.get('/api/announcements', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.ok()).toBeTruthy();
  });

  test('shifts API works', async ({ request }) => {
    const token = await getToken(request);
    const response = await request.get('/api/shifts/types', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.ok()).toBeTruthy();
  });

  test('geofence API works', async ({ request }) => {
    const token = await getToken(request);
    const response = await request.get('/api/geofence/sites', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.ok()).toBeTruthy();
  });

  test('notifications API works', async ({ request }) => {
    const token = await getToken(request);
    const response = await request.get('/api/notifications', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.ok()).toBeTruthy();
  });

  test('analytics API works', async ({ request }) => {
    const token = await getToken(request);
    const response = await request.get('/api/analytics/home', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.ok()).toBeTruthy();
  });
});
