import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';

test.describe('Password Login with Token Invalidation', () => {
  test.beforeAll(async () => {
    // Wait for all services to be ready before running tests
    await TestHelpers.waitForServices();
  });

  test('password login → access users page → invalidate token → verify access denied', async ({ page }) => {
    const helpers = new TestHelpers(page);

    // Step 1: Verify initial unauthenticated state
    await test.step('Verify initial unauthenticated state', async () => {
      await helpers.verifyNotAuthenticated();
      await helpers.takeScreenshot('01-initial-unauthenticated');
    });

    // Step 2: Perform password login
    await test.step('Perform password login with demo credentials', async () => {
      await helpers.passwordLogin('demo', 'password123');
      await helpers.takeScreenshot('02-password-login-success');
    });

    // Step 3: Verify authentication successful
    await test.step('Verify authentication successful', async () => {
      await helpers.verifyAuthenticated();
      await helpers.takeScreenshot('03-authenticated-state');
    });

    // Step 4: Navigate to customers page and verify access
    await test.step('Navigate to customers page and verify access', async () => {
      await helpers.navigateToCustomers();

      // Verify we can see the customers page content
      await expect(page.locator('h1, h2')).toContainText(/customers/i);

      // Verify we're not redirected to login
      await expect(page).not.toHaveURL('/login');

      await helpers.takeScreenshot('04-customers-page-accessible');
    });

    // Step 5: Invalidate the token via backend API
    await test.step('Invalidate access token via backend', async () => {
      await helpers.invalidateToken();
      await helpers.takeScreenshot('05-token-invalidated');
    });

    // Step 6: Attempt to access customers page again - should be denied
    await test.step('Verify access to customers page is now denied', async () => {
      await helpers.verifyAccessDenied('/customers');
      await helpers.takeScreenshot('06-access-denied');

      // Additional verification: check that we can't see the customer list
      const customerListVisible = await page.locator('ul li').count();
      expect(customerListVisible).toBe(0); // Should not see any customers in the list
    });

    // Step 7: Verify that other protected routes are also denied
    await test.step('Verify access to sessions page is also denied', async () => {
      await helpers.verifyAccessDenied('/sessions');
      await helpers.takeScreenshot('07-sessions-access-denied');
    });
  });

  test('token invalidation persists across page refreshes', async ({ page }) => {
    const helpers = new TestHelpers(page);

    await test.step('Login and access customers page', async () => {
      await helpers.passwordLogin();
      await helpers.navigateToCustomers();
      await expect(page.locator('h1, h2')).toContainText(/customers/i);
    });

    await test.step('Invalidate token', async () => {
      await helpers.invalidateToken();
    });

    await test.step('Refresh page and verify access still denied', async () => {
      await page.reload();

      // Wait for page to load and API calls to complete
      await page.waitForTimeout(2000);

      // Should still be on customers page but showing error
      await expect(page).toHaveURL('/customers');

      // Should see "Failed to fetch customers" error message
      await expect(page.locator('body')).toContainText('Failed to fetch customers');

      // Should not see any customer data
      const customerListVisible = await page.locator('ul li').count();
      expect(customerListVisible).toBe(0);
    });
  });

  test('invalidated token cannot be used for API calls', async ({ page }) => {
    const helpers = new TestHelpers(page);

    await test.step('Login and verify API access works', async () => {
      await helpers.passwordLogin();
      await helpers.navigateToCustomers();

      // Verify customers page loads (which makes API calls)
      await expect(page.locator('h1, h2')).toContainText(/customers/i);
    });

    await test.step('Invalidate token', async () => {
      await helpers.invalidateToken();
    });

    await test.step('Verify API calls fail with invalidated token', async () => {
      // Navigate to sessions page which makes API calls
      await page.goto('/sessions');

      // Should see "Failed to fetch sessions" error message
      await expect(page.locator('body')).toContainText('Failed to fetch sessions');
    });
  });
});
