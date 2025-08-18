import { Page, expect } from '@playwright/test';
import axios from 'axios';

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for all services to be ready
   */
  static async waitForServices(): Promise<void> {
    const services = [
      { name: 'Frontend', url: 'http://localhost:3000' },
      { name: 'Backend', url: 'http://localhost:3001/api/health' },
      { name: 'OAuth Server', url: 'http://localhost:3002/health' },
    ];

    console.log('Waiting for services to be ready...');

    for (const service of services) {
      let retries = 30;
      while (retries > 0) {
        try {
          await axios.get(service.url, { timeout: 2000 });
          console.log(`✓ ${service.name} is ready`);
          break;
        } catch (error) {
          retries--;
          if (retries === 0) {
            throw new Error(`${service.name} failed to start on ${service.url}`);
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  }

  /**
   * Navigate to login page and wait for it to load
   */
  async navigateToLogin(): Promise<void> {
    await this.page.goto('/login');
    await expect(this.page.locator('h2')).toContainText('Sign in to your account');
  }

  /**
   * Click on Google OAuth button and handle the OAuth flow
   */
  async clickGoogleOAuth(): Promise<void> {
    // Wait for and click the Google OAuth button
    const googleButton = this.page.locator('button').filter({ hasText: /google/i });
    await expect(googleButton).toBeVisible();
    await googleButton.click();
  }

  /**
   * Handle the OAuth authorization page (fake OAuth server)
   */
  async approveOAuthAuthorization(): Promise<void> {
    // Wait for redirect to OAuth server
    await this.page.waitForURL('**/oauth/authorize**');

    // Wait for the authorization form to load
    await expect(this.page.locator('h2')).toContainText('Authorize Access');

    // Click the approve/authorize button
    const approveButton = this.page.locator('button[type="submit"]').filter({ hasText: /approve|authorize/i });
    await expect(approveButton).toBeVisible();
    await approveButton.click();
  }

  /**
   * Wait for OAuth callback to complete and redirect to authenticated state
   */
  async waitForOAuthCallback(): Promise<void> {
    // The OAuth flow involves multiple redirects:
    // 1. OAuth server -> Backend callback (/api/auth/callback/google)
    // 2. Backend -> Frontend callback (/auth/callback?success=true&token=...)
    // 3. Frontend processes callback and redirects to home/login

    // Wait for any of these possible outcomes after OAuth approval
    await Promise.race([
      // Direct redirect to frontend callback
      this.page.waitForURL('**/auth/callback**', { timeout: 10000 }),
      // Direct redirect to authenticated area
      this.page.waitForURL(url => url.pathname === '/users' || url.pathname === '/' || url.pathname === '/sessions', {
        timeout: 10000,
      }),
      // Redirect back to login with error
      this.page.waitForURL('**/login**', { timeout: 10000 }),
    ]);

    // If we're on the callback page, wait for the final redirect
    if (this.page.url().includes('/auth/callback')) {
      await this.page.waitForURL(
        url =>
          url.pathname === '/users' ||
          url.pathname === '/' ||
          url.pathname === '/sessions' ||
          url.pathname === '/login',
        { timeout: 5000 }
      );
    }
  }

  /**
   * Navigate to users page and verify access
   */
  async navigateToUsers(): Promise<void> {
    await this.page.goto('/users');
    await expect(this.page.locator('h1, h2')).toContainText(/users/i);
  }

  /**
   * Navigate to sessions page and verify access
   */
  async navigateToSessions(): Promise<void> {
    await this.page.goto('/sessions');
    await expect(this.page.locator('h1, h2')).toContainText(/sessions/i);
  }

  /**
   * Logout from the application
   */
  async logout(): Promise<void> {
    // Navigate to users page where the logout button is located
    await this.page.goto('/users');

    // Look for logout button on the users page
    const logoutButton = this.page.locator('button').filter({ hasText: /logout|sign out/i });
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    // Verify redirect to login page
    await expect(this.page).toHaveURL('/login');
    await expect(this.page.locator('h2')).toContainText('Sign in to your account');
  }

  /**
   * Verify that user is authenticated (can access protected routes)
   */
  async verifyAuthenticated(): Promise<void> {
    // Try to access a protected route
    await this.page.goto('/users');
    // Should not be redirected to login
    await expect(this.page).not.toHaveURL('/login');
  }

  /**
   * Verify that user is not authenticated (redirected to login for protected routes)
   */
  async verifyNotAuthenticated(): Promise<void> {
    // Try to access a protected route
    await this.page.goto('/users');
    // Should be redirected to login
    await expect(this.page).toHaveURL('/login');
  }

  /**
   * Take a screenshot for debugging
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/${name}.png`, fullPage: true });
  }
}
