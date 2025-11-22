import { createHash } from 'crypto';

/**
 * Base64URL encode (without padding)
 * Used for PKCE code_challenge encoding
 */
export const base64UrlEncode = (buffer: Buffer): string => {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

/**
 * Compute SHA-256 hash of a string and return as base64url encoded string
 * Used for PKCE code_challenge verification
 */
export const sha256Base64Url = (input: string): string => {
  const hash = createHash('sha256').update(input).digest();
  return base64UrlEncode(hash);
};

/**
 * Verify PKCE code_verifier against code_challenge
 * @param codeVerifier - The code_verifier from the token request
 * @param codeChallenge - The code_challenge from the authorization request
 * @param method - The hashing method ('S256' or 'plain')
 * @returns true if verification succeeds
 */
export const verifyPKCE = (codeVerifier: string, codeChallenge: string, method: 'S256' | 'plain' = 'S256'): boolean => {
  // debugger; // PKCE: Verifying code_verifier - Computing hash and comparing with code_challenge
  let computedChallenge: string;

  if (method === 'S256') {
    computedChallenge = sha256Base64Url(codeVerifier);
  } else {
    // plain method (not recommended, but allowed in spec)
    computedChallenge = codeVerifier;
  }

  return computedChallenge === codeChallenge;
};
