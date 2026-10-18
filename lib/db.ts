import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';


// ============================================================================
// TYPES
// ============================================================================
export type AgentRole =
  | 'ceo'
  | 'manager'
  | 'researcher'
  | 'writer'
  | 'support'
  | 'designer'
  | 'developer'
  | 'data_analyst'
  | 'cloud_engineer'
  | 'cyber_sec';
export type AgentStatus = 'idle' | 'walking' | 'working' | 'talking';

export type TicketStatus =
  | 'pending'
  | 'in_progress'
  | 'awaiting_approval'
  | 'review'
  | 'completed'
  | 'failed';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface AgentAiTrio {
  tier1: string; // Primary AI
  tier2: string; // Secondary AI (Fast fallback)
  tier3: string; // Tertiary AI (Heavy/Safety fallback)
}

export interface AgentRecord {
  id: string;
  name: string;
  role: AgentRole;
  model: string;
  ai_trio?: AgentAiTrio | null;
  status: AgentStatus;
  x: number;
  y: number;
  desk_x: number;
  desk_y: number;
  bubble_text: string;
  current_ticket_id: string | null;
  updated_at: string;
}

export interface TicketRecord {
  id: string;
  from_agent: string;
  to_agent: string;
  workflow_id?: string;
  task: string;
  status: TicketStatus;
  priority: TicketPriority;
  payload: Record<string, any>;
  result: Record<string, any>;
  steps_taken: number;
  error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApprovalRecord {
  id: string;
  ticket_id: string;
  agent: string;
  action_type: 'spend_money' | 'send_message' | 'delete_data';
  description: string;
  payload: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  resolved_at?: string | null;
}

export interface ActivityLogRecord {
  id: number;
  timestamp: string;
  agent: string;
  type: 'info' | 'handoff' | 'mistake' | 'error' | 'approval' | 'warning';
  message: string;
}

export interface AgentMemoryRecord {
  id: number;
  agent: string;
  key: string;
  value: string;
  memory_type: 'short_term' | 'long_term';
  expires_at?: string | null;
  created_at: string;
}

export interface StoreCatalogItem {
  id: string;
  type: 'product' | 'policy';
  name: string;
  details: Record<string, any>;
}

// ============================================================================
// DATABASE SINGLETON & INITIALIZATION
// ============================================================================
declare global {
  // eslint-disable-next-line no-var
  var __officeDb: Database.Database | undefined;
}

function initDatabase(): Database.Database {
  if (globalThis.__officeDb) {
    return globalThis.__officeDb;
  }

  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  let dataDir = path.join(process.cwd(), 'data');

  if (isServerless) {
    dataDir = path.join(os.tmpdir(), 'virtual-office-data');
  }

  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  } catch (err) {
    console.warn('[DB] Failed to create data dir at ' + dataDir + ', falling back to os.tmpdir():', err);
    dataDir = os.tmpdir();
  }

  const dbPath = path.join(dataDir, 'office.db');
  let db: Database.Database;

  try {
    db = new Database(dbPath);
  } catch (err) {
    console.warn('[DB] Failed to open database at ' + dbPath + ', attempting fallback:', err);
    try {
      db = new Database(path.join(os.tmpdir(), 'office.db'));
    } catch {
      db = new Database(':memory:');
    }
  }

  // Enable WAL mode & foreign keys for high-performance concurrency
  try {
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  } catch (e) {
    console.warn('[DB] SQLite pragma warning:', e);
  }

  // Run schema initialization and seed
  try {
    runMigrations(db);
  } catch (err) {
    console.error('[DB] Migration error:', err);
  }

  globalThis.__officeDb = db;
  return db;
}

export const db = initDatabase();

export function getDb(): Database.Database {
  return db;
}

// ============================================================================
// SCHEMA MIGRATIONS & SEED DATA
// ============================================================================
function runMigrations(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      model TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'idle',
      x REAL NOT NULL DEFAULT 0,
      y REAL NOT NULL DEFAULT 0,
      desk_x REAL NOT NULL,
      desk_y REAL NOT NULL,
      bubble_text TEXT NOT NULL DEFAULT '',
      current_ticket_id TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      from_agent TEXT NOT NULL,
      to_agent TEXT NOT NULL,
      workflow_id TEXT,
      task TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      priority TEXT NOT NULL DEFAULT 'medium',
      payload TEXT DEFAULT '{}',
      result TEXT DEFAULT '{}',
      steps_taken INTEGER NOT NULL DEFAULT 0,
      error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_tickets_to_agent ON tickets(to_agent, status);
    CREATE INDEX IF NOT EXISTS idx_tickets_updated ON tickets(updated_at DESC);

    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      agent TEXT NOT NULL,
      action_type TEXT NOT NULL,
      description TEXT NOT NULL,
      payload TEXT DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME
    );

    CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      agent TEXT NOT NULL,
      type TEXT NOT NULL,
      message TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_logs_time ON activity_logs(timestamp DESC);

    CREATE TABLE IF NOT EXISTS agent_memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      memory_type TEXT NOT NULL DEFAULT 'short_term',
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_memory_agent_key ON agent_memory(agent, key);

    CREATE TABLE IF NOT EXISTS api_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_api_usage_time ON api_usage(agent, timestamp DESC);

    CREATE TABLE IF NOT EXISTS system_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id TEXT NOT NULL,
      from_agent TEXT NOT NULL,
      to_agent TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_messages_ticket ON messages(ticket_id);

    CREATE TABLE IF NOT EXISTS store_catalog (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      details TEXT NOT NULL
    );
  `);

  // Seed Kill Switch
  const ks = database.prepare('SELECT value FROM system_state WHERE key = ?').get('kill_switch');
  if (!ks) {
    database.prepare('INSERT INTO system_state (key, value) VALUES (?, ?)').run('kill_switch', 'false');
  }

  // Purge deprecated agents if present in database
  database.prepare("DELETE FROM agents WHERE id IN ('victoria', 'chris', 'sam', 'nora')").run();

  // Seed 6 Team Members: Dylan Ramos (CEO & Founder) + 5 Autonomous AI Specialists
  const INITIAL_AGENTS = [
    {
      id: 'dylan',
      name: 'Dylan Ramos',
      role: 'ceo' as AgentRole,
      model: 'Human Executive',
      desk_x: 2,
      desk_y: 2,
      bubble: 'Building the future with autonomous AI agents.',
    },
    {
      id: 'eah',
      name: 'Eah',
      role: 'support' as AgentRole,
      model: "Dylan's Partner & Companion",
      desk_x: 2,
      desk_y: 3,
      bubble: 'Chilling on my iPad in the CEO suite 💕',
    },
    {
      id: 'ray',
      name: 'Ray (Researcher)',
      role: 'researcher' as AgentRole,
      model: process.env.WORKER_MODEL || 'openrouter/free',
      desk_x: 6,
      desk_y: 2,
      bubble: 'Analyzing competitor pricing, AI models & market trends.',
    },
    {
      id: 'maya',
      name: 'Maya (Designer)',
      role: 'designer' as AgentRole,
      model: process.env.WORKER_MODEL || 'openrouter/free',
      desk_x: 8,
      desk_y: 2,
      bubble: 'Crafting pixel-perfect design systems & UI/UX wireframes.',
    },
    {
      id: 'alex',
      name: 'Alex (Fullstack Dev)',
      role: 'developer' as AgentRole,
      model: process.env.WORKER_MODEL || 'openrouter/free',
      desk_x: 10,
      desk_y: 2,
      bubble: 'Building high-performance Next.js fullstack features.',
    },
    {
      id: 'wendy',
      name: 'Wendy (Marketing)',
      role: 'writer' as AgentRole,
      model: process.env.WORKER_MODEL || 'openrouter/free',
      desk_x: 8,
      desk_y: 4,
      bubble: 'Drafting high-conversion viral marketing campaigns.',
    },
    {
      id: 'zane',
      name: 'Zane (Cyber Sec)',
      role: 'cyber_sec' as AgentRole,
      model: process.env.WORKER_MODEL || 'openrouter/free',
      desk_x: 10,
      desk_y: 4,
      bubble: 'Hardening firewall policies & vulnerability audit scans.',
    },
  ];

  const getAgent = database.prepare('SELECT id FROM agents WHERE id = ?');
  const insertAgent = database.prepare(`
    INSERT INTO agents (id, name, role, model, status, x, y, desk_x, desk_y, bubble_text, current_ticket_id)
    VALUES (?, ?, ?, ?, 'working', ?, ?, ?, ?, ?, NULL)
  `);

  for (const a of INITIAL_AGENTS) {
    const existing = getAgent.get(a.id);
    if (!existing) {
      insertAgent.run(a.id, a.name, a.role, a.model, a.desk_x, a.desk_y, a.desk_x, a.desk_y, a.bubble);
    } else {
      database.prepare('UPDATE agents SET name = ?, role = ?, desk_x = ?, desk_y = ? WHERE id = ?').run(
        a.name,
        a.role,
        a.desk_x,
        a.desk_y,
        a.id
      );
    }
  }

  // Seed Store Catalog
  const catCount = (database.prepare('SELECT COUNT(*) as count FROM store_catalog').get() as { count: number }).count;
  if (catCount === 0) {
    const insertCat = database.prepare('INSERT INTO store_catalog (id, type, name, details) VALUES (?, ?, ?, ?)');
    const CATALOG_ITEMS = [
      {
        id: 'PROD-101',
        type: 'product',
        name: 'Retro Pixel Mechanical Keyboard',
        details: JSON.stringify({
          price: 89.99,
          stock: 45,
          category: 'Hardware',
          specs: 'Custom clicky switches, tactile feel, RGB backlighting, USB-C',
        }),
      },
      {
        id: 'PROD-102',
        type: 'product',
        name: 'RGB CyberDesk Mat 900x400mm',
        details: JSON.stringify({
          price: 29.99,
          stock: 120,
          category: 'Accessories',
          specs: 'Micro-weave cloth, anti-slip rubber base, waterproof coating',
        }),
      },
      {
        id: 'PROD-103',
        type: 'product',
        name: 'Ergonomic Pixel Office Chair',
        details: JSON.stringify({
          price: 249.0,
          stock: 8,
          category: 'Furniture',
          specs: 'Lumbar support, adjustable armrests, breathable mesh',
        }),
      },
      {
        id: 'POLICY-RETURN',
        type: 'policy',
        name: '30-Day Return Policy',
        details: JSON.stringify({
          window_days: 30,
          condition: 'Original packaging required',
          refund_type: 'Full refund to original payment method',
          notes: 'Customer pays return shipping unless product is defective',
        }),
      },
      {
        id: 'POLICY-SHIPPING',
        type: 'policy',
        name: 'Shipping Rates & Timelines',
        details: JSON.stringify({
          standard: '3-5 business days ($4.99, or FREE on orders over $50)',
          express: '1-2 business days ($14.99)',
          carriers: ['FedEx', 'USPS', 'DHL Express'],
        }),
      },
    ];

    for (const item of CATALOG_ITEMS) {
      insertCat.run(item.id, item.type, item.name, item.details);
    }
  }

  // Guardrail: Recover any tickets stuck in 'in_progress' after server restart
  database.prepare(`
    UPDATE tickets 
    SET status = 'pending', updated_at = datetime('now')
    WHERE status = 'in_progress'
  `).run();

  database.prepare(`
    UPDATE agents 
    SET status = 'idle', bubble_text = 'Ready for work.'
    WHERE id NOT IN ('dylan', 'eah') AND status != 'idle'
  `).run();

  database.prepare(`
    UPDATE agents
    SET status = 'working', bubble_text = 'Leading team operations & product strategy.'
    WHERE id = 'dylan'
  `).run();

  database.prepare(`
    UPDATE agents
    SET status = 'working', bubble_text = 'Keeping Dylan company in the CEO office 💕'
    WHERE id = 'eah'
  `).run();

  // Guardrail: Clean expired memory & old api_usage rows (> 24 hours)
  database.exec(`
    DELETE FROM agent_memory WHERE expires_at IS NOT NULL AND expires_at <= datetime('now');
    DELETE FROM api_usage WHERE timestamp < datetime('now', '-24 hours');
  `);
}

function getDbEnv(key: string, fallback = ''): string {
  if (process.env[key] && process.env[key]!.trim() !== '') {
    return process.env[key]!.trim();
  }
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [k, ...vParts] = trimmed.split('=');
          if (k.trim() === key) {
            return vParts.join('=').trim().replace(/^['"]|['"]$/g, '');
          }
        }
      }
    }
  } catch {}
  return fallback;
}

export function getAgentAiTrio(agentId: string): AgentAiTrio {
  const universalBackup = getDbEnv('BACKUP_AI_MODEL', 'google/gemini-3.8-flash');

  switch (agentId) {
    case 'alex':
      return {
        tier1: getDbEnv('ALEX_AI_1', 'nvidia/nemotron-3-super-120b-a12b:free'),
        tier2: getDbEnv('ALEX_AI_2', universalBackup),
        tier3: getDbEnv('ALEX_AI_3', 'google/gemma-4-31b-it:free'),
      };
    case 'maya':
      return {
        tier1: getDbEnv('MAYA_AI_1', 'google/gemma-4-31b-it:free'),
        tier2: getDbEnv('MAYA_AI_2', universalBackup),
        tier3: getDbEnv('MAYA_AI_3', 'liquid/lfm-2.5-2.6b:free'),
      };
    case 'wendy':
      return {
        tier1: getDbEnv('WENDY_AI_1', 'dots-studio/dots-3-note-preview:free'),
        tier2: getDbEnv('WENDY_AI_2', universalBackup),
        tier3: getDbEnv('WENDY_AI_3', 'liquid/lfm-2.5-2.6b:free'),
      };
    case 'ray':
      return {
        tier1: getDbEnv('RAY_AI_1', 'google/gemma-4-31b-it:free'),
        tier2: getDbEnv('RAY_AI_2', universalBackup),
        tier3: getDbEnv('RAY_AI_3', 'nvidia/nemotron-3.5-lightning:free'),
      };
    case 'zane':
      return {
        tier1: getDbEnv('ZANE_AI_1', 'nvidia/nemotron-3-super-120b-a12b:free'),
        tier2: getDbEnv('ZANE_AI_2', universalBackup),
        tier3: getDbEnv('ZANE_AI_3', 'google/gemma-4-31b-it:free'),
      };
    default:
      return {
        tier1: 'openrouter/free',
        tier2: universalBackup,
        tier3: 'liquid/lfm-2.5-2.6b:free',
      };
  }
}

// ============================================================================
// QUERY HELPERS
// ============================================================================
export function getOfficeState() {
  // Purge retired agents if present
  db.prepare("DELETE FROM agents WHERE id IN ('victoria', 'chris', 'sam', 'nora')").run();

  // Ensure all 6 team members exist in database (Dylan CEO + 5 AI Specialists)
  const getAgent = db.prepare('SELECT id FROM agents WHERE id = ?');
  const insertAgent = db.prepare(`
    INSERT INTO agents (id, name, role, model, status, x, y, desk_x, desk_y, bubble_text, current_ticket_id)
    VALUES (?, ?, ?, ?, 'working', ?, ?, ?, ?, ?, NULL)
  `);

  const ALL_AGENTS_SEED: Array<{ id: string; name: string; role: AgentRole; model: string; desk_x: number; desk_y: number; bubble: string }> = [
    { id: 'dylan', name: 'Dylan Ramos', role: 'ceo', model: 'Human Executive', desk_x: 2, desk_y: 2, bubble: 'Building the future with autonomous AI agents.' },
    { id: 'eah', name: 'Eah', role: 'support', model: "Dylan's Partner & Companion", desk_x: 2, desk_y: 3, bubble: 'Chilling on my iPad in the CEO suite 💕' },
    { id: 'ray', name: 'Ray (Researcher)', role: 'researcher', model: 'openrouter/free', desk_x: 6, desk_y: 2, bubble: 'Analyzing competitor pricing, AI models & market trends.' },
    { id: 'maya', name: 'Maya (Designer)', role: 'designer', model: 'openrouter/free', desk_x: 8, desk_y: 2, bubble: 'Crafting pixel-perfect design systems & UI/UX wireframes.' },
    { id: 'alex', name: 'Alex (Fullstack Dev)', role: 'developer', model: 'openrouter/free', desk_x: 32, desk_y: 7, bubble: 'Building high-performance Next.js fullstack features.' },
    { id: 'wendy', name: 'Wendy (Marketing)', role: 'writer', model: 'openrouter/free', desk_x: 18, desk_y: 8, bubble: 'Drafting high-conversion viral marketing campaigns.' },
    { id: 'zane', name: 'Zane (Cyber Sec)', role: 'cyber_sec', model: 'openrouter/free', desk_x: 36, desk_y: 7, bubble: 'Hardening firewall policies & vulnerability audit scans.' },
  ];

  for (const a of ALL_AGENTS_SEED) {
    const existing = getAgent.get(a.id);
    if (!existing) {
      insertAgent.run(a.id, a.name, a.role, a.model, a.desk_x, a.desk_y, a.desk_x, a.desk_y, a.bubble);
    }
  }

  const agents = db.prepare('SELECT * FROM agents').all() as unknown as AgentRecord[];
  const tickets = db.prepare('SELECT * FROM tickets ORDER BY updated_at DESC LIMIT 50').all() as any[];
  const approvals = db.prepare("SELECT * FROM approvals WHERE status = 'pending' ORDER BY created_at ASC").all() as any[];
  const logs = db.prepare('SELECT * FROM activity_logs ORDER BY id DESC LIMIT 50').all() as unknown as ActivityLogRecord[];
  const ks = db.prepare("SELECT value FROM system_state WHERE key = 'kill_switch'").get() as { value: string } | undefined;

  return {
    agents: agents.map((a) => {
      const trio = (a.id === 'dylan' || a.id === 'eah') ? null : getAgentAiTrio(a.id);
      return {
        ...a,
        model:
          a.id === 'dylan'
            ? 'Human Executive'
            : a.id === 'eah'
            ? "Dylan's Partner & Companion"
            : `3-AI Ensemble: ${trio?.tier1} | ${trio?.tier2} | ${trio?.tier3}`,
        ai_trio: trio,
        x: Number(a.x),
        y: Number(a.y),
        desk_x: Number(a.desk_x),
        desk_y: Number(a.desk_y),
      };
    }),
    tickets: tickets.map((t) => ({
      ...t,
      payload: JSON.parse(t.payload || '{}'),
      result: JSON.parse(t.result || '{}'),
    })),
    approvals: approvals.map((appr) => ({
      ...appr,
      payload: JSON.parse(appr.payload || '{}'),
    })),
    logs,
    killSwitch: ks?.value === 'true',
  };
}

export function createTicket(ticket: {
  id?: string;
  from_agent: string;
  to_agent: string;
  task: string;
  priority?: TicketPriority;
  workflow_id?: string;
  payload?: Record<string, any>;
}): TicketRecord {
  const id = ticket.id || `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const priority = ticket.priority || 'medium';
  const now = new Date().toISOString();
  const payloadStr = JSON.stringify(ticket.payload || {});

  db.prepare(`
    INSERT INTO tickets (id, from_agent, to_agent, workflow_id, task, status, priority, payload, result, steps_taken, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, '{}', 0, ?, ?)
  `).run(
    id,
    ticket.from_agent,
    ticket.to_agent,
    ticket.workflow_id || null,
    ticket.task,
    priority,
    payloadStr,
    now,
    now
  );

  return getTicket(id)!;
}

export function getTicket(id: string): TicketRecord | null {
  const row = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id) as any;
  if (!row) return null;
  return {
    ...row,
    payload: JSON.parse(row.payload || '{}'),
    result: JSON.parse(row.result || '{}'),
  };
}

export function updateTicketStatus(
  id: string,
  status: TicketStatus,
  result?: Record<string, any>,
  error?: string,
  payload?: Record<string, any>
) {
  const now = new Date().toISOString();
  let sql = 'UPDATE tickets SET status = ?, updated_at = ?';
  const params: any[] = [status, now];

  if (result !== undefined) {
    sql += ', result = ?';
    params.push(JSON.stringify(result));
  }
  if (error !== undefined) {
    sql += ', error = ?';
    params.push(error);
  }
  if (payload !== undefined) {
    sql += ', payload = ?';
    params.push(JSON.stringify(payload));
  }

  sql += ' WHERE id = ?';
  params.push(id);

  db.prepare(sql).run(...params);
}

export function incrementTicketSteps(id: string): number {
  db.prepare("UPDATE tickets SET steps_taken = steps_taken + 1, updated_at = datetime('now') WHERE id = ?").run(id);
  const row = db.prepare('SELECT steps_taken FROM tickets WHERE id = ?').get(id) as any;
  return row?.steps_taken || 0;
}

export function claimNextTicketForAgent(agentId: string): TicketRecord | null {
  const row = db.prepare(`
    SELECT * FROM tickets
    WHERE to_agent = ? AND status = 'pending'
    ORDER BY 
      CASE priority 
        WHEN 'urgent' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        ELSE 4 
      END ASC,
      created_at ASC
    LIMIT 1
  `).get(agentId) as any;

  if (!row) return null;
  return getTicket(row.id);
}

export function updateAgentState(
  agentId: string,
  updates: Partial<{
    status: AgentStatus;
    x: number;
    y: number;
    bubble_text: string;
    current_ticket_id: string | null;
  }>
) {
  const fields: string[] = [];
  const params: any[] = [];

  if (updates.status !== undefined) {
    fields.push('status = ?');
    params.push(updates.status);
  }
  if (updates.x !== undefined) {
    fields.push('x = ?');
    params.push(updates.x);
  }
  if (updates.y !== undefined) {
    fields.push('y = ?');
    params.push(updates.y);
  }
  if (updates.bubble_text !== undefined) {
    fields.push('bubble_text = ?');
    params.push(updates.bubble_text);
  }
  if (updates.current_ticket_id !== undefined) {
    fields.push('current_ticket_id = ?');
    params.push(updates.current_ticket_id);
  }

  if (fields.length === 0) return;
  fields.push("updated_at = datetime('now')");
  params.push(agentId);

  db.prepare(`UPDATE agents SET ${fields.join(', ')} WHERE id = ?`).run(...params);
}

// ============================================================================
// TASK / TICKET DELETION & MANAGEMENT
// ============================================================================
export function deleteTicket(id: string): boolean {
  try {
    // 1. Delete dependent approvals and messages
    db.prepare('DELETE FROM approvals WHERE ticket_id = ?').run(id);
    db.prepare('DELETE FROM messages WHERE ticket_id = ?').run(id);

    // 2. Unassign any agent working on this ticket
    db.prepare(`
      UPDATE agents 
      SET current_ticket_id = NULL,
          status = CASE WHEN status = 'working' THEN 'idle' ELSE status END,
          bubble_text = CASE WHEN current_ticket_id = ? THEN 'Task cleared.' ELSE bubble_text END,
          updated_at = datetime('now')
      WHERE current_ticket_id = ?
    `).run(id, id);

    // 3. Delete the ticket itself
    const res = db.prepare('DELETE FROM tickets WHERE id = ?').run(id);
    return res.changes > 0;
  } catch (err: any) {
    console.error(`[DB] Failed to delete ticket ${id}:`, err.message);
    return false;
  }
}

export function deleteCompletedTickets(): number {
  try {
    const rows = db.prepare("SELECT id FROM tickets WHERE status IN ('completed', 'failed')").all() as { id: string }[];
    if (rows.length === 0) return 0;

    const ids = rows.map((r) => r.id);
    const placeholders = ids.map(() => '?').join(',');

    db.prepare(`DELETE FROM approvals WHERE ticket_id IN (${placeholders})`).run(...ids);
    db.prepare(`DELETE FROM messages WHERE ticket_id IN (${placeholders})`).run(...ids);
    const res = db.prepare(`DELETE FROM tickets WHERE id IN (${placeholders})`).run(...ids);
    return res.changes;
  } catch (err: any) {
    console.error('[DB] Failed to delete completed tickets:', err.message);
    return 0;
  }
}

export function deleteAllTickets(): number {
  try {
    db.prepare('DELETE FROM approvals').run();
    db.prepare('DELETE FROM messages').run();
    db.prepare(`
      UPDATE agents 
      SET current_ticket_id = NULL,
          status = CASE WHEN status = 'working' THEN 'idle' ELSE status END,
          bubble_text = 'All tasks cleared.',
          updated_at = datetime('now')
    `).run();
    const res = db.prepare('DELETE FROM tickets').run();
    return res.changes;
  } catch (err: any) {
    console.error('[DB] Failed to delete all tickets:', err.message);
    return 0;
  }
}

// ============================================================================
// LOG DELETION & AUTO-PRUNING
// ============================================================================
export function deleteLog(id: number): boolean {
  try {
    const res = db.prepare('DELETE FROM activity_logs WHERE id = ?').run(id);
    return res.changes > 0;
  } catch (err: any) {
    console.error(`[DB] Failed to delete log ${id}:`, err.message);
    return false;
  }
}

export function deleteAllLogs(): number {
  try {
    const res = db.prepare('DELETE FROM activity_logs').run();
    return res.changes;
  } catch (err: any) {
    console.error('[DB] Failed to delete all logs:', err.message);
    return 0;
  }
}

export function logActivity(
  agent: string,
  type: 'info' | 'handoff' | 'mistake' | 'error' | 'approval' | 'warning',
  message: string
) {
  db.prepare(`
    INSERT INTO activity_logs (agent, type, message, timestamp)
    VALUES (?, ?, ?, datetime('now'))
  `).run(agent, type, message);

  // Auto-prune logs to keep max 200 entries so database never fills up
  try {
    db.prepare(`
      DELETE FROM activity_logs 
      WHERE id NOT IN (
        SELECT id FROM activity_logs ORDER BY id DESC LIMIT 200
      )
    `).run();
  } catch {}
}

export function createApproval(approval: {
  id: string;
  ticket_id: string;
  agent: string;
  action_type: 'spend_money' | 'send_message' | 'delete_data';
  description: string;
  payload: Record<string, any>;
}): ApprovalRecord {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO approvals (id, ticket_id, agent, action_type, description, payload, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(
    approval.id,
    approval.ticket_id,
    approval.agent,
    approval.action_type,
    approval.description,
    JSON.stringify(approval.payload),
    now
  );

  return {
    ...approval,
    status: 'pending',
    created_at: now,
  };
}

export function resolveApproval(id: string, status: 'approved' | 'rejected'): ApprovalRecord | null {
  const now = new Date().toISOString();
  db.prepare('UPDATE approvals SET status = ?, resolved_at = ? WHERE id = ?').run(status, now, id);

  const row = db.prepare('SELECT * FROM approvals WHERE id = ?').get(id) as any;
  if (!row) return null;
  return {
    ...row,
    payload: JSON.parse(row.payload || '{}'),
  };
}

export function setMemory(
  agent: string,
  key: string,
  value: string,
  memory_type: 'short_term' | 'long_term' = 'short_term',
  ttl_days = 7
) {
  let expiresAt: string | null = null;
  if (memory_type === 'short_term') {
    const d = new Date();
    d.setDate(d.getDate() + ttl_days);
    expiresAt = d.toISOString();
  }

  db.prepare(`
    INSERT INTO agent_memory (agent, key, value, memory_type, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).run(agent, key, value, memory_type, expiresAt);
}

export function getMemory(agent: string, key?: string) {
  let sql = "SELECT * FROM agent_memory WHERE agent = ? AND (expires_at IS NULL OR expires_at > datetime('now'))";
  const params: any[] = [agent];
  if (key) {
    sql += ' AND key = ?';
    params.push(key);
  }
  sql += ' ORDER BY created_at DESC LIMIT 15';

  return db.prepare(sql).all(...params) as any[];
}

export function logApiUsage(agent: string) {
  try {
    db.prepare("DELETE FROM api_usage WHERE timestamp < datetime('now', '-1 hour')").run();
  } catch {}
  db.prepare("INSERT INTO api_usage (agent, timestamp) VALUES (?, datetime('now'))").run(agent);
}

export function resetApiUsage(agent?: string) {
  if (agent) {
    db.prepare('DELETE FROM api_usage WHERE agent = ?').run(agent);
  } else {
    db.prepare('DELETE FROM api_usage').run();
  }
}

export function getHourlyApiCallCount(agent?: string): number {
  let sql = "SELECT COUNT(*) as count FROM api_usage WHERE timestamp >= datetime('now', '-1 hour')";
  const params: any[] = [];
  if (agent) {
    sql += ' AND agent = ?';
    params.push(agent);
  }
  const row = db.prepare(sql).get(...params) as { count: number };
  return row?.count || 0;
}

export function isKillSwitchActive(): boolean {
  const ks = db.prepare("SELECT value FROM system_state WHERE key = 'kill_switch'").get() as { value: string } | undefined;
  return ks?.value === 'true';
}

export function setKillSwitch(active: boolean) {
  db.prepare("UPDATE system_state SET value = ?, updated_at = datetime('now') WHERE key = 'kill_switch'").run(
    active ? 'true' : 'false'
  );
}

export function queryStoreCatalog(query: string) {
  const rows = db.prepare('SELECT * FROM store_catalog').all() as any[];
  const q = query.toLowerCase();
  const matched = rows.filter(
    (r) => r.name.toLowerCase().includes(q) || r.details.toLowerCase().includes(q)
  );
  return (matched.length > 0 ? matched : rows).map((r) => ({
    id: r.id,
    type: r.type,
    name: r.name,
    details: JSON.parse(r.details),
  }));
}
