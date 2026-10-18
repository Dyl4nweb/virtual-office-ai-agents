import crypto from 'crypto';

/**
 * Returns the configured master passcode for Dylan Ramos.
 * Priority: OFFICE_ACCESS_CODE in .env.local -> ADMIN_PASSCODE -> secure fallback
 * Automatically strips accidental quotes added in hosting dashboards.
 */
export function getMasterPasscode(): string {
  const envVal =
    process.env.OFFICE_ACCESS_CODE ||
    process.env.ADMIN_PASSCODE ||
    process.env.OFFICE_PASSWORD ||
    process.env.ADMIN_PASSWORD ||
    process.env.ACCESS_CODE;

  if (envVal) {
    const cleaned = envVal.trim().replace(/^["']|["']$/g, '').trim();
    if (cleaned) return cleaned;
  }

  return 'dylan2026!';
}

/**
 * Secret key used to sign clearance tokens
 */
export function getAuthSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET?.trim().replace(/^["']|["']$/g, '');
  return secret || 'avero_hq_dylan_master_session_secret_key_2026_xyz';
}

/**
 * Validates a user-supplied passcode against the master executive passcode.
 * Uses timingSafeEqual to protect against side-channel timing attacks.
 * Includes forgiving checks for quotes, casing, and common mobile auto-capitalization.
 */
export function validatePasscode(inputPasscode: string): boolean {
  if (!inputPasscode || typeof inputPasscode !== 'string') return false;
  const master = getMasterPasscode();
  const cleanInput = inputPasscode.trim().replace(/^["']|["']$/g, '').trim();

  // 1. Exact match (secure timingSafeEqual)
  const masterHash = crypto.createHash('sha256').update(master).digest();
  const inputHash = crypto.createHash('sha256').update(cleanInput).digest();
  if (crypto.timingSafeEqual(masterHash, inputHash)) {
    return true;
  }

  // 2. Case-insensitive match (handles Dylan2026! vs dylan2026!)
  const masterLowerHash = crypto.createHash('sha256').update(master.toLowerCase()).digest();
  const inputLowerHash = crypto.createHash('sha256').update(cleanInput.toLowerCase()).digest();
  if (crypto.timingSafeEqual(masterLowerHash, inputLowerHash)) {
    return true;
  }

  // 3. For the default passcode "dylan2026!", also allow without exclamation mark
  if (master.toLowerCase() === 'dylan2026!') {
    const inputWithoutBang = cleanInput.toLowerCase().replace(/!+$/, '');
    if (inputWithoutBang === 'dylan2026') {
      return true;
    }
  }

  return false;
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
