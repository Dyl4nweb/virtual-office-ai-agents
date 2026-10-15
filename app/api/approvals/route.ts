import { NextRequest, NextResponse } from 'next/server';
import { getTicket, logActivity, resolveApproval, updateTicketStatus } from '@/lib/db';
import { officeEmitter } from '@/lib/runner';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { approval_id, action } = body; // action: 'approved' | 'rejected'

    if (!approval_id || (action !== 'approved' && action !== 'rejected')) {
      return NextResponse.json({ error: 'approval_id and valid action (approved/rejected) are required' }, { status: 400 });
    }

    const resolved = resolveApproval(approval_id, action);
    if (!resolved) {
      return NextResponse.json({ error: 'Approval not found' }, { status: 404 });
    }

    officeEmitter.emit('approval:resolved', resolved);

    // Update related ticket
    const ticket = getTicket(resolved.ticket_id);
    if (ticket) {
      if (action === 'approved') {
        const newPayload = { ...(ticket.payload || {}), human_approved: true, approval_id: resolved.id };
        updateTicketStatus(ticket.id, 'pending', undefined, undefined, newPayload);
        logActivity('user', 'approval', `Owner approved action: ${resolved.description}`);
      } else {
        updateTicketStatus(ticket.id, 'failed', undefined, 'Rejected by store owner.');
        logActivity('user', 'mistake', `Owner rejected action: ${resolved.description}`);
      }
      officeEmitter.emit('ticket:updated', getTicket(ticket.id)!);
    }

    return NextResponse.json({ success: true, approval: resolved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
