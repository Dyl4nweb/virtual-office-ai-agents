import { NextRequest } from 'next/server';
import { getOfficeState } from '@/lib/db';
import { officeEmitter } from '@/lib/runner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial state snapshot on connection
      try {
        const initialState = getOfficeState();
        controller.enqueue(
          encoder.encode(`event: office:state\ndata: ${JSON.stringify(initialState)}\n\n`)
        );
      } catch (err) {
        console.error('[SSE] Failed to load initial state:', err);
      }

      // 2. Generic helper to pipe emitter events to SSE
      const forwardEvent = (eventName: string) => (data: any) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // Stream might be closed
        }
      };

      const onAgentMove = forwardEvent('agent:move');
      const onAgentStatus = forwardEvent('agent:status');
      const onTicketCreated = forwardEvent('ticket:created');
      const onTicketUpdated = forwardEvent('ticket:updated');
      const onApprovalRequested = forwardEvent('approval:requested');
      const onApprovalResolved = forwardEvent('approval:resolved');
      const onActivityLog = forwardEvent('activity:log');
      const onKillswitchState = forwardEvent('killswitch:state');

      officeEmitter.on('agent:move', onAgentMove);
      officeEmitter.on('agent:status', onAgentStatus);
      officeEmitter.on('ticket:created', onTicketCreated);
      officeEmitter.on('ticket:updated', onTicketUpdated);
      officeEmitter.on('approval:requested', onApprovalRequested);
      officeEmitter.on('approval:resolved', onApprovalResolved);
      officeEmitter.on('activity:log', onActivityLog);
      officeEmitter.on('killswitch:state', onKillswitchState);

      // 3. Heartbeat every 15 seconds to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 15000);

      // 4. Clean up listeners on request abort
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        officeEmitter.off('agent:move', onAgentMove);
        officeEmitter.off('agent:status', onAgentStatus);
        officeEmitter.off('ticket:created', onTicketCreated);
        officeEmitter.off('ticket:updated', onTicketUpdated);
        officeEmitter.off('approval:requested', onApprovalRequested);
        officeEmitter.off('approval:resolved', onApprovalResolved);
        officeEmitter.off('activity:log', onActivityLog);
        officeEmitter.off('killswitch:state', onKillswitchState);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
