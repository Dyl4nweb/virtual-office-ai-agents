import crypto from 'crypto';

/**
 * Returns the configured master passcode for Dylan Ramos.
 * Priority: OFFICE_ACCESS_CODE in .env.local -> ADMIN_PASSCODE -> secure fallback
 */
export function getMasterPasscode(): string {
  return (
    process.env.OFFICE_ACCESS_CODE?.trim() ||
    process.env.ADMIN_PASSCODE?.trim() ||
    'dylan2026!'
  );
}

/**
 * Secret key used to sign clearance tokens
 */
export function getAuthSecret(): string {
  return (
    process.env.AUTH_SESSION_SECRET?.trim() ||
    'avero_hq_dylan_master_session_secret_key_2026_xyz'
  );
}

/**
 * Validates a user-supplied passcode against the master executive passcode.
 * Uses timingSafeEqual to protect against side-channel timing attacks.
 */
export function validatePasscode(inputPasscode: string): boolean {
  if (!inputPasscode || typeof inputPasscode !== 'string') return false;
  const master = getMasterPasscode();
  const cleanInput = inputPasscode.trim();

  // We pad/hash both strings using SHA-256 so buffers are identical length for timingSafeEqual
  const masterHash = crypto.createHash('sha256').update(master).digest();
  const inputHash = crypto.createHash('sha256').update(cleanInput).digest();

  return crypto.timingSafeEqual(masterHash, inputHash);
}

/**
 * Generates an HMAC-signed clearance token for Dylan Ramos.
 */
export function generateClearanceToken(): string {
  const secret = getAuthSecret();
  const payload = {
    user: 'Dylan Ramos',
    role: 'founder',
    issuedAt: Date.now(),
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${signature}`;
}

/**
 * Validates an HMAC-signed clearance token.
 */
export function verifyClearanceToken(token: string): boolean {
  try {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const [data, signature] = parts;
    const secret = getAuthSecret();

    const expectedSignature = crypto.createHmac('sha256', secret).update(data).digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expectedBuf.length) return false;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

    // Verify token expiration (30 days validity)
    const jsonStr = Buffer.from(data, 'base64url').toString('utf8');
    const payload = JSON.parse(jsonStr);
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - payload.issuedAt > thirtyDaysMs) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
