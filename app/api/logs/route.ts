import { NextRequest, NextResponse } from 'next/server';
import { deleteLog, deleteAllLogs, getOfficeState } from '@/lib/db';
import { officeEmitter } from '@/lib/runner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const scope = searchParams.get('scope') || (id ? 'single' : undefined);

    let deletedCount = 0;
    let message = '';

    if (scope === 'all') {
      deletedCount = deleteAllLogs();
      message = `Cleared all ${deletedCount} activity logs.`;
    } else if (id) {
      const ok = deleteLog(Number(id));
      deletedCount = ok ? 1 : 0;
      message = ok ? `Deleted log entry #${id}.` : `Log entry #${id} not found.`;
    } else {
      try {
        const body = await request.json();
        if (body.scope === 'all') {
          deletedCount = deleteAllLogs();
          message = `Cleared all ${deletedCount} activity logs.`;
        } else if (body.id !== undefined) {
          const ok = deleteLog(Number(body.id));
          deletedCount = ok ? 1 : 0;
          message = ok ? `Deleted log entry #${body.id}.` : `Log entry #${body.id} not found.`;
        }
      } catch {}
    }

    // Broadcast updated state to all SSE clients immediately
    const state = getOfficeState();
    officeEmitter.emit('office:state', state);

    return NextResponse.json({
      success: true,
      deletedCount,
      message,
      logs: state.logs,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
