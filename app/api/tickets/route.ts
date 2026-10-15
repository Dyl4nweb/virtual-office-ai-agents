import { NextRequest, NextResponse } from 'next/server';
import { deleteTicket, deleteCompletedTickets, deleteAllTickets, getOfficeState } from '@/lib/db';
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

    // Check query params first
    if (scope === 'all') {
      deletedCount = deleteAllTickets();
      message = `Cleared all ${deletedCount} tasks.`;
    } else if (scope === 'completed') {
      deletedCount = deleteCompletedTickets();
      message = `Cleared ${deletedCount} completed/failed tasks.`;
    } else if (id) {
      const ok = deleteTicket(id);
      deletedCount = ok ? 1 : 0;
      message = ok ? `Deleted task ${id}.` : `Task ${id} not found.`;
    } else {
      // Check JSON body if query param was not specified
      try {
        const body = await request.json();
        if (body.scope === 'all') {
          deletedCount = deleteAllTickets();
          message = `Cleared all ${deletedCount} tasks.`;
        } else if (body.scope === 'completed') {
          deletedCount = deleteCompletedTickets();
          message = `Cleared ${deletedCount} completed/failed tasks.`;
        } else if (body.id) {
          const ok = deleteTicket(body.id);
          deletedCount = ok ? 1 : 0;
          message = ok ? `Deleted task ${body.id}.` : `Task ${body.id} not found.`;
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
      tickets: state.tickets,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
