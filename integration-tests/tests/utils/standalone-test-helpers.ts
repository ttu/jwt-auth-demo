import { Page, expect } from '@playwright/test';
import axios from 'axios';

export class StandaloneTestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for services needed by frontend-standalone to be ready
   * Note: Only needs OAuth server, not the main backend
   */
  static async waitForServices(): Promise<void> {
    const services = [
      { name: 'OAuth Server', url: 'http://localhost:3002/health' },
      { name: 'Frontend Standalone', url: 'http://localhost:3003' },
    ];

    console.log('Waiting for frontend-standalone services to be ready...');

    for (const service of services) {
      let retries = 30;
      while (retries > 0) {
        try {
          await axios.get(service.url, { timeout: 2000 });
          console.log(`✓ ${service.name} is ready`);
          break;
        } catch (_error) {
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
   * Navigate to the frontend-standalone app
   */
  async navigateToApp(): Promise<void> {
    await this.page.goto('http://localhost:3003');

    // Wait for the app to load
    await expect(this.page.locator('h1')).toBeVisible();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Take a screenshot for debugging
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `test-results/standalone-${name}.png`,
      fullPage: true,
    });
  }

  /**
   * Verify the app is in unauthenticated state
   */
  async verifyNotAuthenticated(): Promise<void> {
    // Should see the provider buttons, not user info
    await expect(this.page.locator('.provider-buttons')).toBeVisible();
    await expect(
      this.page
        .locator('button')
        .filter({ hasText: /sign in with/i })
        .first()
    ).toBeVisible();

    // Should not see welcome message
    await expect(this.page.locator('h1').filter({ hasText: /welcome/i })).not.toBeVisible();
  }

  /**
   * Verify the app is in authenticated state
   */
  async verifyAuthenticated(): Promise<void> {
    // Should see welcome message and user info
    await expect(this.page.locator('h1').filter({ hasText: /welcome/i })).toBeVisible();
    await expect(this.page.locator('.info')).toBeVisible();

    // Should not see provider buttons
    await expect(this.page.locator('.provider-buttons')).not.toBeVisible();
  }

  /**
   * Click on a specific OAuth provider button
   */
  async clickOAuthProvider(provider: 'google' | 'microsoft' | 'strava' | 'company'): Promise<void> {
    const providerMap = {
      google: /sign in with google/i,
      microsoft: /sign in with microsoft/i,
      strava: /sign in with strava/i,
      company: /sign in with company/i,
    };

    const button = this.page.locator('button').filter({ hasText: providerMap[provider] });
    await expect(button).toBeVisible();
    await button.click();
  }

  /**
   * Verify PKCE parameters are present in the authorization request
   */
  async verifyPKCEAuthorizationRequest(): Promise<void> {
    // Wait for redirect to OAuth server with PKCE parameters
    await this.page.waitForURL('**/oauth/authorize**');

    const currentUrl = this.page.url();
    const url = new URL(currentUrl);

    // Verify required OAuth parameters
    expect(url.searchParams.get('response_type')).toBe('code');
    // Client ID varies by provider (e.g., fake-google-client-id, fake-microsoft-client-id, etc.)
    expect(url.searchParams.get('client_id')).toBeTruthy();
    expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:3003/callback');

    // Verify PKCE parameters
    expect(url.searchParams.get('code_challenge')).toBeTruthy();
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');

    // Verify CSRF protection
    expect(url.searchParams.get('state')).toBeTruthy();

    // Verify scope
    expect(url.searchParams.get('scope')).toBe('openid profile email');

    console.log('✓ PKCE authorization request verified:', {
      code_challenge: url.searchParams.get('code_challenge')?.substring(0, 20) + '...',
      code_challenge_method: url.searchParams.get('code_challenge_method'),
      state: url.searchParams.get('state')?.substring(0, 10) + '...',
    });
  }

  /**
   * Approve OAuth authorization on the consent screen
   */
  async approveOAuthAuthorization(): Promise<void> {
    // Wait for the OAuth consent page to load
    await expect(this.page.locator('h2')).toContainText('Authorize Access');

    // Click the approve button
    const approveButton = this.page.locator('button').filter({ hasText: /approve|authorize|allow/i });
    await expect(approveButton).toBeVisible();
    await approveButton.click();
  }

  /**
   * Wait for PKCE callback to complete and return to the app
   */
  async waitForPKCECallback(): Promise<void> {
    // Wait for redirect back to the app with authorization code
    await this.page.waitForURL('**/callback**');

    // Wait for the PKCE token exchange to complete
    // The app should process the callback and show the authenticated state
    await this.page.waitForURL('http://localhost:3003/', { timeout: 10000 });

    // Wait for the UI to update
    await this.page.waitForLoadState('networkidle');

    console.log('✓ PKCE callback processing completed');
  }

  /**
   * Verify user information is displayed correctly
   */
  async verifyUserInfo(provider: string): Promise<void> {
    // Check that user info is displayed
    await expect(this.page.locator('.info-row').filter({ hasText: /name/i })).toBeVisible();
    await expect(this.page.locator('.info-row').filter({ hasText: /email/i })).toBeVisible();
    await expect(this.page.locator('.info-row').filter({ hasText: /provider/i })).toBeVisible();
    await expect(this.page.locator('.info-row').filter({ hasText: /login time/i })).toBeVisible();

    // Verify the provider is correct
    const providerInfo = this.page.locator('.info-value').filter({ hasText: provider });
    await expect(providerInfo).toBeVisible();

    console.log(`✓ User info verified for ${provider} provider`);
  }

  /**
   * Logout from the application
   */
  async logout(): Promise<void> {
    const logoutButton = this.page.locator('button').filter({ hasText: /sign out/i });
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    // Wait for logout to complete
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Monitor network requests for debugging
   */
  async monitorNetworkRequests(): Promise<void> {
    this.page.on('request', request => {
      if (request.url().includes('oauth') || request.url().includes('token')) {
        console.log('→', request.method(), request.url());
      }
    });

    this.page.on('response', response => {
      if (response.url().includes('oauth') || response.url().includes('token')) {
        console.log('←', response.status(), response.url());
      }
    });
  }

  /**
   * Verify PKCE security: check that state parameter is validated
   */
  async verifyStateParameterValidation(): Promise<void> {
    // This would test CSRF protection by manipulating the state parameter
    // For now, we'll just verify the state is present in the flow
    const currentUrl = this.page.url();
    if (currentUrl.includes('oauth/authorize')) {
      const url = new URL(currentUrl);
      const state = url.searchParams.get('state');
      expect(state).toBeTruthy();
      expect(state?.length).toBeGreaterThan(20); // Should be sufficiently random
    }
  }

  /**
   * Test PKCE code verifier/challenge relationship
   */
  async testPKCEImplementation(): Promise<void> {
    // Execute PKCE test in browser context
    const result = await this.page.evaluate(async () => {
      try {
        // This assumes the PKCE utilities are available in the browser
        // Note: This import path is relative to the frontend-standalone app's src directory
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Dynamic import in browser context, module not available at compile time
        const { generateCodeVerifier, generateCodeChallenge, validateCodeVerifier } = await import(
          '/src/utils/pkce.js'
        );

        const verifier = generateCodeVerifier(64);
        const challenge = await generateCodeChallenge(verifier);
        const isValid = validateCodeVerifier(verifier);

        return {
          success: true,
          verifierLength: verifier.length,
          challengeLength: challenge.length,
          isValidFormat: isValid,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.verifierLength).toBe(64);
      expect(result.challengeLength).toBeGreaterThan(40);
      expect(result.isValidFormat).toBe(true);
    }
  }

  /**
   * Verify console logs for PKCE flow debugging
   */
  async verifyPKCEConsoleOutput(): Promise<void> {
    const consoleLogs: string[] = [];

    this.page.on('console', msg => {
      if (msg.text().includes('PKCE') || msg.text().includes('🔐') || msg.text().includes('🔑')) {
        consoleLogs.push(msg.text());
      }
    });

    // After OAuth flow, check that PKCE logs are present
    expect(consoleLogs.length).toBeGreaterThan(0);
    expect(consoleLogs.some(log => log.includes('PKCE Flow'))).toBe(true);
  }
}
