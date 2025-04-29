import { v4 as uuidv4 } from 'uuid';

// Store for OAuth nonces
const nonces = new Map<string, { nonce: string; timestamp: number }>();

// Generate and store a new nonce
export const generateNonce = (): string => {
  const nonce = uuidv4();
  nonces.set(nonce, { nonce, timestamp: Date.now() });
  return nonce;
};

export const validateNonce = (nonce: string): boolean => {
  const storedNonce = nonces.get(nonce);
  if (!storedNonce) {
    return false;
  }

  // Check if nonce is expired (1 hour)
  const isValid = Date.now() - storedNonce.timestamp <= 3600000;

  // Remove the nonce after validation
  nonces.delete(nonce);

  return isValid;
};

export const cleanupNonces = () => {
  const oneHourAgo = Date.now() - 3600000;
  for (const [key, value] of nonces.entries()) {
    if (value.timestamp < oneHourAgo) {
      nonces.delete(key);
    }
  }
};
