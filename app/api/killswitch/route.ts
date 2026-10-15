import { NextRequest, NextResponse } from 'next/server';
import { isKillSwitchActive, logActivity, setKillSwitch } from '@/lib/db';
import { officeEmitter } from '@/lib/runner';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { active } = body;

    const boolActive = Boolean(active);
    setKillSwitch(boolActive);

    logActivity('user', boolActive ? 'mistake' : 'info', `Kill switch ${boolActive ? 'ACTIVATED' : 'DEACTIVATED'}`);
    officeEmitter.emit('killswitch:state', { active: boolActive });

    return NextResponse.json({ success: true, killSwitch: isKillSwitchActive() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
