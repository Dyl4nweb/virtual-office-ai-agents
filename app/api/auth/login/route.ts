import { NextResponse } from 'next/server';
import { validatePasscode, generateClearanceToken } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { passcode } = body || {};

    if (!passcode || typeof passcode !== 'string') {
      return NextResponse.json(
        { success: false, error: 'ACCESS DENIED: PASSCODE REQUIRED' },
        { status: 400 }
      );
    }

    const isValid = validatePasscode(passcode);

    if (!isValid) {
      // Artificial delay to prevent brute-force attacks
      await new Promise((res) => setTimeout(res, 350));
      return NextResponse.json(
        { success: false, error: 'ACCESS DENIED: INVALID EXECUTIVE PASSCODE' },
        { status: 401 }
      );
    }

    // Passcode confirmed for Dylan Ramos
    const token = generateClearanceToken();

    return NextResponse.json({
      success: true,
      token,
      user: 'Dylan Ramos',
      message: 'CLEARANCE GRANTED: WELCOME TO AVERO HQ',
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'AUTHENTICATION ERROR' },
      { status: 500 }
    );
  }
}
