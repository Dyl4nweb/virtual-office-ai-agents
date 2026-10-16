import { NextRequest, NextResponse } from 'next/server';
import { createTicket, logActivity } from '@/lib/db';
import { executeAgentTicketImmediately, officeEmitter } from '@/lib/runner';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, to_agent = 'alex', priority = 'high', payload } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text command is required' }, { status: 400 });
    }

    const ticket = createTicket({
      from_agent: 'user',
      to_agent,
      task: text,
      priority,
      workflow_id: `wf_${Date.now()}`,
      payload: payload || {},
    });

    logActivity('user', 'info', `Direct command assigned to ${to_agent}: "${text}"`);
    officeEmitter.emit('ticket:created', ticket);

    // Trigger immediate agent execution without waiting for 3s tick
    executeAgentTicketImmediately(ticket);

    return NextResponse.json({ success: true, ticket });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
