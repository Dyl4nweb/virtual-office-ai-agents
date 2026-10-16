import { NextRequest } from 'next/server';
import { createTicket, getTicket, updateAgentState, updateTicketStatus, logActivity } from '@/lib/db';
import { officeEmitter } from '@/lib/runner';
import { callAgent, SYSTEM_PROMPTS } from '@/lib/agents';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId = 'alex', task, priority = 'high', payload = {}, withMeeting = true } = body;

    if (!task || typeof task !== 'string') {
      return new Response(JSON.stringify({ error: 'Directive task text is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Create SQLite Ticket Record
    const ticket = createTicket({
      from_agent: 'user',
      to_agent: agentId,
      task,
      priority,
      workflow_id: `wf_${Date.now()}`,
      payload: payload || {},
    });

    logActivity('user', 'info', `[Realtime Stream] Assigned to ${agentId.toUpperCase()}: "${task.slice(0, 48)}"`);
    officeEmitter.emit('ticket:created', ticket);

    // Initial agent visual state in 3D/2D office
    const initialBubble = withMeeting
      ? `🤝 Team Sprint Meeting: "${task.slice(0, 24)}..."`
      : `Starting: "${task.slice(0, 30)}..."`;

    updateAgentState(agentId, {
      status: 'working',
      current_ticket_id: ticket.id,
      bubble_text: initialBubble,
    });
    officeEmitter.emit('agent:status', { agentId, status: 'working', bubble_text: initialBubble });
    updateTicketStatus(ticket.id, 'in_progress');

    // 2. Set up SSE ReadableStream
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          try {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          } catch {}
        };

        // Emit initial start event
        sendEvent('start', {
          ticketId: ticket.id,
          agentId,
          task,
          priority,
          timestamp: new Date().toISOString(),
        });

        // 🤝 Astig Team Meeting Sequence in Boardroom!
        if (withMeeting !== false) {
          sendEvent('meeting', {
            phase: 'start',
            leadAgent: agentId,
            topic: task,
            message: '🤝 Team assembled in Executive Boardroom for sprint alignment...',
          });

          officeEmitter.emit('office:meeting:start', {
            topic: task,
            leadAgent: agentId,
            durationMs: 3600,
          });

          // Wait 3.6s for visual boardroom walk-in & team alignment
          await new Promise((resolve) => setTimeout(resolve, 3600));

          officeEmitter.emit('office:meeting:end', {
            leadAgent: agentId,
          });

          sendEvent('meeting', {
            phase: 'end',
            leadAgent: agentId,
            message: '🚀 Sprint aligned! Dispersing to stations to execute deliverable...',
          });
        }

        try {
          const systemPrompt = SYSTEM_PROMPTS[agentId] || SYSTEM_PROMPTS.alex;

          // Execute agent with live callbacks
          const result = await callAgent({
            agentId,
            systemPrompt,
            userPrompt: `EXECUTIVE DIRECTIVE FROM FOUNDER DYLAN RAMOS\nPriority: ${priority}\nDirective: ${task}\nContext Payload: ${JSON.stringify(payload)}`,
            ticket,
            preferFastGemini: true,
            onSpeechBubble: (speech) => {
              updateAgentState(agentId, { bubble_text: speech });
              officeEmitter.emit('agent:status', { agentId, status: 'working', bubble_text: speech });
              sendEvent('speech', { speech });
            },
            onProgressChunk: (chunk) => {
              sendEvent('chunk', { delta: chunk });
            },
            onApprovalNeeded: (approvalId, description) => {
              officeEmitter.emit('approval:requested', {
                id: approvalId,
                ticket_id: ticket.id,
                agent: agentId,
                description,
              });
              sendEvent('approval', { approvalId, description });
            },
            onSubtaskCreated: (subtask) => {
              officeEmitter.emit('ticket:created', subtask);
              sendEvent('subtask', { subtask });
            },
          });

          // Check if awaiting approval
          const currentTicket = getTicket(ticket.id);
          if (currentTicket?.status === 'awaiting_approval') {
            const pausedMsg = 'Paused: Awaiting Human Approval.';
            updateAgentState(agentId, { status: 'idle', bubble_text: pausedMsg });
            officeEmitter.emit('agent:status', { agentId, status: 'idle', bubble_text: pausedMsg });
            sendEvent('paused', { reason: 'awaiting_approval' });
            controller.close();
            return;
          }

          // Complete Ticket
          const resultSummary = result.text.slice(0, 160);
          updateTicketStatus(ticket.id, 'completed', {
            summary: resultSummary,
            full_text: result.text,
            structured: result.structuredOutput,
            tools_used: result.toolCallsMade.map((t) => t.name),
            tool_calls: result.toolCallsMade,
            completed_at: new Date().toISOString(),
          });

          const freshTicket = getTicket(ticket.id)!;
          officeEmitter.emit('ticket:updated', freshTicket);
          logActivity(agentId, 'info', `[Realtime Stream] Completed: "${task.slice(0, 48)}"`);

          const doneSpeech = 'Task finished! ✨';
          updateAgentState(agentId, { status: 'idle', current_ticket_id: null, bubble_text: doneSpeech });
          officeEmitter.emit('agent:status', { agentId, status: 'idle', bubble_text: doneSpeech });

          sendEvent('done', {
            ticket: freshTicket,
            text: result.text,
            structured: result.structuredOutput,
            toolCalls: result.toolCallsMade,
            model: result.model,
            stepsTaken: result.stepsTaken,
          });

          controller.close();
        } catch (err: any) {
          console.error(`[AgentStream] Execution error for ${agentId}:`, err.message);
          updateTicketStatus(ticket.id, 'failed', undefined, err.message);
          const freshTicket = getTicket(ticket.id);
          if (freshTicket) officeEmitter.emit('ticket:updated', freshTicket);

          const errMsg = `Error: ${err.message.slice(0, 24)}`;
          updateAgentState(agentId, { status: 'idle', current_ticket_id: null, bubble_text: errMsg });
          officeEmitter.emit('agent:status', { agentId, status: 'idle', bubble_text: errMsg });

          sendEvent('error', { error: err.message, ticketId: ticket.id });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
