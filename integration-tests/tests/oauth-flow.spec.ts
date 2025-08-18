import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';

test.describe('OAuth Authentication Flow', () => {
  test.beforeAll(async () => {
    // Wait for all services to be ready before running tests
    await TestHelpers.waitForServices();
  });

  test('complete Google OAuth flow: login → users → sessions → logout', async ({ page }) => {
    const helpers = new TestHelpers(page);

    // Step 1: Navigate to login page
    await test.step('Navigate to login page', async () => {
      await helpers.navigateToLogin();
      await helpers.takeScreenshot('01-login-page');
    });

    // Step 2: Verify not authenticated initially
    await test.step('Verify initial unauthenticated state', async () => {
      await helpers.verifyNotAuthenticated();
    });

    // Step 3: Click Google OAuth button
    await test.step('Click Google OAuth button', async () => {
      await helpers.navigateToLogin(); // Go back to login page
      await helpers.clickGoogleOAuth();
      await helpers.takeScreenshot('02-oauth-redirect');
    });

    // Step 4: Approve OAuth authorization
    await test.step('Approve OAuth authorization', async () => {
      await helpers.approveOAuthAuthorization();
      await helpers.takeScreenshot('03-oauth-approved');
    });

    // Step 5: Wait for OAuth callback to complete
    await test.step('Wait for OAuth callback completion', async () => {
      await helpers.waitForOAuthCallback();
      await helpers.takeScreenshot('04-oauth-callback-complete');
    });

    // Step 6: Verify authentication successful
    await test.step('Verify authentication successful', async () => {
      await helpers.verifyAuthenticated();
    });

    // Step 7: Navigate to users page
    await test.step('Navigate to users page', async () => {
      await helpers.navigateToUsers();
      await helpers.takeScreenshot('05-users-page');
    });

    // Step 8: Navigate to sessions page
    await test.step('Navigate to sessions page', async () => {
      await helpers.navigateToSessions();
      await helpers.takeScreenshot('06-sessions-page');
    });

    // Step 9: Logout
    await test.step('Logout from application', async () => {
      await helpers.logout();
      await helpers.takeScreenshot('07-logged-out');
    });

    // Step 10: Verify logout successful
    await test.step('Verify logout successful', async () => {
      await helpers.verifyNotAuthenticated();
    });
  });

  test('OAuth flow handles authorization denial', async ({ page }) => {
    const helpers = new TestHelpers(page);

    await test.step('Navigate to login and start OAuth', async () => {
      await helpers.navigateToLogin();
      await helpers.clickGoogleOAuth();
    });

    await test.step('Deny OAuth authorization', async () => {
      // Wait for redirect to OAuth server
      await page.waitForURL('**/oauth/authorize**');

      // Look for deny/cancel button and click it
      const denyButton = page.locator('button').filter({ hasText: /deny|cancel|reject/i });
      if (await denyButton.isVisible()) {
        await denyButton.click();
      } else {
        // If there's no deny button, we'll simulate by going back
        await page.goBack();
      }
    });

    await test.step('Verify user remains unauthenticated', async () => {
      // Should be back at login or get an error
      await expect(page).toHaveURL(/\/(login|auth\/callback)/);
      await helpers.verifyNotAuthenticated();
    });
  });
});
