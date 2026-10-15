import { EventEmitter } from 'node:events';
import {
  claimNextTicketForAgent,
  createTicket,
  getOfficeState,
  getTicket,
  incrementTicketSteps,
  isKillSwitchActive,
  logActivity,
  TicketRecord,
  updateAgentState,
  updateTicketStatus,
} from './db';

// ============================================================================
// IN-PROCESS EVENT EMITTER SINGLETON (SURVIVES HOT RELOAD)
// ============================================================================
declare global {
  // eslint-disable-next-line no-var
  var __officeEmitter: EventEmitter | undefined;
  // eslint-disable-next-line no-var
  var __agentRunnerStarted: boolean | undefined;
}

export function getOfficeEmitter(): EventEmitter {
  if (!globalThis.__officeEmitter) {
    const emitter = new EventEmitter();
    emitter.setMaxListeners(100);
    globalThis.__officeEmitter = emitter;
  }
  return globalThis.__officeEmitter;
}

export const officeEmitter = getOfficeEmitter();

// Desk & Meeting Seat Coordinates (in TILE GRID units, 32px scale)
export const OFFICE_TILES = {
  DESKS: {
    ray: { x: 18, y: 5 },
    maya: { x: 22, y: 5 },
    alex: { x: 26, y: 5 },
    wendy: { x: 20, y: 8 },
    zane: { x: 24, y: 8 },
  },
  MEETING_SEATS: {
    ray: { x: 12, y: 14 },
    maya: { x: 14, y: 14 },
    alex: { x: 16, y: 14 },
    wendy: { x: 13, y: 16 },
    zane: { x: 15, y: 16 },
  },
};

// ============================================================================
// AGENT RUNNER BACKGROUND LOOP
// ============================================================================
const runningAgents = new Set<string>();

export function startAgentRunner() {
  if (globalThis.__agentRunnerStarted) {
    console.log('[Runner] Background agent runner already active on globalThis.');
    return;
  }

  globalThis.__agentRunnerStarted = true;
  console.log('[Runner] Starting background agent loop in Next.js process...');

  setInterval(async () => {
    try {
      await runnerTick();
    } catch (err: any) {
      console.error('[Runner] Tick error:', err.message);
    }
  }, 3000);
}

async function runnerTick() {
  if (isKillSwitchActive()) {
    return;
  }

  const agents = ['alex', 'maya', 'wendy', 'ray', 'zane'];

  for (const agentId of agents) {
    if (runningAgents.has(agentId)) {
      continue;
    }

    const pendingTicket = claimNextTicketForAgent(agentId);
    if (pendingTicket) {
      // Process one agent step at a time asynchronously
      executeAgentTicket(agentId, pendingTicket);
    }
  }
}

async function executeAgentTicket(agentId: string, ticket: TicketRecord) {
  runningAgents.add(agentId);
  const desk = OFFICE_TILES.DESKS[agentId as keyof typeof OFFICE_TILES.DESKS];

  try {
    updateTicketStatus(ticket.id, 'in_progress');
    incrementTicketSteps(ticket.id);

    const freshTicket = getTicket(ticket.id)!;
    officeEmitter.emit('ticket:updated', freshTicket);

    const initialSpeech = `Starting: "${ticket.task.slice(0, 32)}..."`;
    updateAgentState(agentId, {
      status: 'working',
      current_ticket_id: ticket.id,
      bubble_text: initialSpeech,
    });
    officeEmitter.emit('agent:status', { agentId, status: 'working', bubble_text: initialSpeech });

    // Physical handoff: If ticket is a multi-agent workflow, walk to meeting room table
    const isMeetingHandoff =
      ticket.workflow_id &&
      (ticket.task.toLowerCase().includes('review') ||
        ticket.from_agent !== 'user');

    if (isMeetingHandoff) {
      const seat =
        OFFICE_TILES.MEETING_SEATS[agentId as keyof typeof OFFICE_TILES.MEETING_SEATS] || { x: 12, y: 15 };

      updateAgentState(agentId, { x: seat.x, y: seat.y, status: 'walking' });
      officeEmitter.emit('agent:move', { agentId, x: seat.x, y: seat.y, duration: 1400 });
      await new Promise((res) => setTimeout(res, 1500));

      const meetingSpeech = 'Handoff discussion at conference table.';
      updateAgentState(agentId, { status: 'talking', bubble_text: meetingSpeech });
      officeEmitter.emit('agent:status', { agentId, status: 'talking', bubble_text: meetingSpeech });
    }

    const { callAgent, SYSTEM_PROMPTS } = await import('@/lib/agents');
    const systemPrompt = SYSTEM_PROMPTS[agentId] || '';

    // Execute via unified callAgent()
    const result = await callAgent({
      agentId,
      systemPrompt,
      userPrompt: `TICKET #${freshTicket.id}\nFrom: ${freshTicket.from_agent}\nPriority: ${freshTicket.priority}\nDirective: ${freshTicket.task}\nPayload: ${JSON.stringify(freshTicket.payload || {})}`,
      ticket: freshTicket,
      onSpeechBubble: (speech) => {
        updateAgentState(agentId, { bubble_text: speech });
        officeEmitter.emit('agent:status', { agentId, status: 'working', bubble_text: speech });
      },
      onApprovalNeeded: (approvalId, description) => {
        officeEmitter.emit('approval:requested', {
          id: approvalId,
          ticket_id: ticket.id,
          agent: agentId,
          description,
        });
      },
      onSubtaskCreated: (subtask) => {
        officeEmitter.emit('ticket:created', subtask);
      },
    });

    // Check if task paused for human approval
    const currentTicket = getTicket(ticket.id);
    if (currentTicket?.status === 'awaiting_approval') {
      const pausedMsg = 'Paused: Awaiting Human Approval in side panel.';
      updateAgentState(agentId, { status: 'idle', bubble_text: pausedMsg });
      officeEmitter.emit('agent:status', { agentId, status: 'idle', bubble_text: pausedMsg });
      return;
    }

    // Direct Ticket Completion
    updateTicketStatus(ticket.id, 'completed', {
      summary: result.text.slice(0, 160),
      full_text: result.text,
      structured: result.structuredOutput,
      tools_used: result.toolCallsMade.map((t) => t.name),
      completed_at: new Date().toISOString(),
    });
    officeEmitter.emit('ticket:updated', getTicket(ticket.id)!);
    logActivity(agentId, 'info', `Completed ticket #${ticket.id.slice(-6)}: "${ticket.task.slice(0, 48)}"`);

    // Return to desk if walked to boardroom
    if (isMeetingHandoff && desk) {
      updateAgentState(agentId, { x: desk.x, y: desk.y, status: 'walking' });
      officeEmitter.emit('agent:move', { agentId, x: desk.x, y: desk.y, duration: 1200 });
      await new Promise((res) => setTimeout(res, 1300));
    }

    const doneMsg = 'Task finished.';
    updateAgentState(agentId, { status: 'idle', current_ticket_id: null, bubble_text: doneMsg });
    officeEmitter.emit('agent:status', { agentId, status: 'idle', bubble_text: doneMsg });
  } catch (err: any) {
    console.error(`[Runner] Error in agent ${agentId}:`, err.message);
    logActivity(agentId, 'error', `Task failed: ${err.message}`);
    updateTicketStatus(ticket.id, 'failed', undefined, err.message);
    officeEmitter.emit('ticket:updated', getTicket(ticket.id)!);

    const errMsg = `Error: ${err.message.slice(0, 24)}`;
    updateAgentState(agentId, { status: 'idle', current_ticket_id: null, bubble_text: errMsg });
    officeEmitter.emit('agent:status', { agentId, status: 'idle', bubble_text: errMsg });
  } finally {
    // Return sprite to assigned desk
    if (desk) {
      updateAgentState(agentId, { x: desk.x, y: desk.y });
      officeEmitter.emit('agent:move', { agentId, x: desk.x, y: desk.y, duration: 1400 });
    }
    runningAgents.delete(agentId);
  }
}
