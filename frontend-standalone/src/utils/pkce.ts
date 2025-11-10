/**
 * PKCE (Proof Key for Code Exchange) Utilities
 *
 * This module provides cryptographically secure PKCE implementation
 * following RFC 7636 specifications for OAuth 2.0 public clients.
 *
 * PKCE Flow:
 * 1. Generate random code_verifier (43-128 characters)
 * 2. Create code_challenge = SHA256(code_verifier) + Base64URL encoding
 * 3. Send code_challenge to authorization server
 * 4. Exchange code + code_verifier for tokens
 * 5. Server verifies: SHA256(code_verifier) === stored code_challenge
 */

/**
 * Generate a cryptographically random string for PKCE code_verifier
 *
 * RFC 7636 Requirements:
 * - Length: 43-128 characters
 * - Character set: [A-Z] [a-z] [0-9] - . _ ~ (unreserved characters)
 * - Must be cryptographically random (not Math.random())
 *
 * @param length - Length of the random string (43-128, default 128 for max entropy)
 * @returns Cryptographically random string suitable for PKCE code_verifier
 */
export function generateCodeVerifier(length: number = 128): string {
  // Validate length according to RFC 7636
  if (length < 43 || length > 128) {
    throw new Error(
      'PKCE code_verifier length must be between 43 and 128 characters (RFC 7636)',
    );
  }

  // RFC 7636 unreserved characters: ALPHA / DIGIT / "-" / "." / "_" / "~"
  const charset =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

  // Use Web Crypto API for cryptographically secure random generation
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  return Array.from(randomValues)
    .map((v) => charset[v % charset.length])
    .join('');
}

/**
 * Generate a cryptographically random state parameter for CSRF protection
 *
 * The state parameter prevents Cross-Site Request Forgery (CSRF) attacks
 * by ensuring the authorization response corresponds to the request.
 *
 * @param length - Length of the state parameter (default 32)
 * @returns Cryptographically random state string
 */
export function generateState(length: number = 32): string {
  // RFC 6749 doesn't specify length requirements for state parameter
  // We use the same character set as PKCE for consistency
  const charset =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

  // Use Web Crypto API for cryptographically secure random generation
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  return Array.from(randomValues)
    .map((v) => charset[v % charset.length])
    .join('');
}

/**
 * Create PKCE code_challenge from code_verifier using SHA-256 + Base64URL
 *
 * RFC 7636 S256 Method:
 * code_challenge = BASE64URL(SHA256(code_verifier))
 *
 * @param verifier - The code_verifier string
 * @returns Promise resolving to Base64URL encoded SHA-256 hash
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  // Encode the verifier as UTF-8 bytes
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);

  // Compute SHA-256 hash
  const hash = await crypto.subtle.digest('SHA-256', data);

  // Encode as Base64URL (no padding)
  return base64UrlEncode(hash);
}

/**
 * Base64URL encode (RFC 4648 Section 5) - URL-safe Base64 without padding
 *
 * Converts standard Base64 to Base64URL by:
 * - Replacing '+' with '-'
 * - Replacing '/' with '_'
 * - Removing padding '='
 *
 * @param buffer - ArrayBuffer to encode
 * @returns Base64URL encoded string
 */
export function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  // Convert bytes to binary string
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  // Convert to Base64 and make URL-safe
  return btoa(binary)
    .replace(/\+/g, '-') // Replace + with -
    .replace(/\//g, '_') // Replace / with _
    .replace(/=/g, ''); // Remove padding
}

/**
 * Generate complete PKCE parameters for OAuth authorization request
 *
 * @param verifierLength - Length of code_verifier (43-128, default 128)
 * @returns Promise resolving to PKCE parameters object
 */
export async function generatePKCEParameters(
  verifierLength: number = 128,
): Promise<{
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}> {
  const codeVerifier = generateCodeVerifier(verifierLength);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256' as const,
  };
}

/**
 * Validate PKCE code_verifier format according to RFC 7636
 *
 * @param verifier - Code verifier to validate
 * @returns True if verifier meets RFC 7636 requirements
 */
export function validateCodeVerifier(verifier: string): boolean {
  // Check length (43-128 characters)
  if (verifier.length < 43 || verifier.length > 128) {
    return false;
  }

  // Check character set (unreserved characters only)
  const allowedChars = /^[A-Za-z0-9\-._~]+$/;
  return allowedChars.test(verifier);
}

/**
 * PKCE Parameters type for TypeScript
 */
export interface PKCEParameters {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}

/**
 * OAuth State and PKCE parameters for authorization request
 */
export interface OAuthParameters extends PKCEParameters {
  state: string;
}

/**
 * Generate complete OAuth parameters (state + PKCE) for authorization request
 *
 * @param options - Configuration options
 * @returns Promise resolving to complete OAuth parameters
 */
export async function generateOAuthParameters(
  options: {
    stateLength?: number;
    verifierLength?: number;
  } = {},
): Promise<OAuthParameters> {
  const { stateLength = 32, verifierLength = 128 } = options;

  const state = generateState(stateLength);
  const pkceParams = await generatePKCEParameters(verifierLength);

  return {
    state,
    ...pkceParams,
  };
}
