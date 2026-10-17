import { NextResponse } from 'next/server';
import { verifyClearanceToken } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token } = body || {};

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    const isValid = verifyClearanceToken(token);

    if (!isValid) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    return NextResponse.json({
      valid: true,
      user: 'Dylan Ramos',
    });
  } catch (err: any) {
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
