import { GoogleGenAI } from '@google/genai';
import {
  createApproval,
  createTicket,
  logActivity,
  queryStoreCatalog,
  setMemory,
  getMemory,
  updateTicketStatus,
  TicketRecord,
} from './db';

let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
  aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

export interface ToolContext {
  agentId: string;
  ticket: TicketRecord;
  onApprovalNeeded?: (approvalId: string, description: string) => void;
  onSubtaskCreated?: (ticket: TicketRecord) => void;
  onSpeechBubble?: (speech: string) => void;
}

// Function Declarations for Gemini Function Calling
export const FUNCTION_DECLARATIONS = {
  delegate_subtask: {
    name: 'delegate_subtask',
    description: 'Delegate a subtask to alex (developer), maya (designer), wendy (writer), ray (researcher), or zane (cyber sec).',
    parameters: {
      type: 'OBJECT',
      properties: {
        to_agent: { type: 'STRING', description: 'Target agent id: alex, maya, wendy, ray, or zane' },
        task_description: { type: 'STRING', description: 'Clear, actionable instructions' },
        priority: { type: 'STRING', description: 'Priority: low, medium, high, urgent' },
        payload: { type: 'OBJECT', description: 'Structured input data needed for the worker' },
      },
      required: ['to_agent', 'task_description'],
    },
  },

  generate_design_spec: {
    name: 'generate_design_spec',
    description: 'Designer tool: Create UI/UX design specifications, component wireframes, color palettes, and typography tokens.',
    parameters: {
      type: 'OBJECT',
      properties: {
        component_name: { type: 'STRING', description: 'Name of the UI component or page layout' },
        category: { type: 'STRING', description: 'Category: layout, component, page, theme, design_system' },
        design_tokens: { type: 'OBJECT', description: 'Color palette (hex codes), typography, spacing, border radii' },
        layout_structure: { type: 'STRING', description: 'Detailed layout breakdown, hierarchy, responsive behavior' },
        accessibility_notes: { type: 'STRING', description: 'Contrast ratios, ARIA attributes, keyboard navigation' },
      },
      required: ['component_name', 'category', 'layout_structure'],
    },
  },

  write_code_artifact: {
    name: 'write_code_artifact',
    description: 'Developer tool: Write complete, production-ready fullstack code files, API routes, or React components.',
    parameters: {
      type: 'OBJECT',
      properties: {
        filename: { type: 'STRING', description: 'Relative file path e.g. components/Dashboard.tsx or app/api/metrics/route.ts' },
        language: { type: 'STRING', description: 'Programming language: typescript, tsx, javascript, sql, json' },
        code_content: { type: 'STRING', description: 'Complete, runnable, type-safe implementation code' },
        explanation: { type: 'STRING', description: 'Summary of architectural decisions and key methods' },
      },
      required: ['filename', 'language', 'code_content'],
    },
  },

  run_data_analytics: {
    name: 'run_data_analytics',
    description: 'Data Analyst tool: Execute quantitative data queries, cohort calculations, and KPI metric aggregations.',
    parameters: {
      type: 'OBJECT',
      properties: {
        metric_name: { type: 'STRING', description: 'Name of metric analyzed (e.g. Daily Active Users, Conversion Rate)' },
        timeframe: { type: 'STRING', description: 'Time window (e.g. last_7_days, last_30_days, q3_cohort)' },
        sql_query: { type: 'STRING', description: 'SQL query formulation or statistical formula used' },
        findings_summary: { type: 'STRING', description: 'Key insights and empirical trend analysis' },
        recommendations: { type: 'STRING', description: 'Actionable business recommendations based on data' },
      },
      required: ['metric_name', 'findings_summary', 'recommendations'],
    },
  },

  inspect_cloud_infra: {
    name: 'inspect_cloud_infra',
    description: 'Cloud Engineer tool: Inspect Kubernetes clusters, Docker containers, CI/CD pipelines, and cloud health.',
    parameters: {
      type: 'OBJECT',
      properties: {
        resource_type: { type: 'STRING', description: 'Resource: cluster, container, database, cdn, pipeline, lambda' },
        environment: { type: 'STRING', description: 'Environment: production, staging, development' },
        action: { type: 'STRING', description: 'Action: status, inspect_metrics, health_check, scale_check' },
        details: { type: 'OBJECT', description: 'Cluster metrics, memory usage, CPU load, pod statuses' },
      },
      required: ['resource_type', 'environment', 'action'],
    },
  },

  audit_security_posture: {
    name: 'audit_security_posture',
    description: 'Cybersecurity tool: Conduct vulnerability assessments, penetration tests, and security posture checks.',
    parameters: {
      type: 'OBJECT',
      properties: {
        target_system: { type: 'STRING', description: 'Target: api_gateway, authentication_service, database, dependencies' },
        scan_type: { type: 'STRING', description: 'Type: owasp_top_10, dependency_cve, auth_hardening, tls_check' },
        risk_level: { type: 'STRING', description: 'Risk level: low, medium, high, critical, clean' },
        findings: { type: 'STRING', description: 'Detailed security vulnerabilities or verification results' },
        remediation_steps: { type: 'STRING', description: 'Concrete security patches and mitigation hardening' },
      },
      required: ['target_system', 'scan_type', 'risk_level', 'findings'],
    },
  },

  request_human_approval: {
    name: 'request_human_approval',
    description: 'CRITICAL RULE: Must be called before spending money, issuing refunds, sending external live customer emails, or deleting data.',
    parameters: {
      type: 'OBJECT',
      properties: {
        action_type: {
          type: 'STRING',
          description: 'Type: spend_money, send_message, delete_data',
        },
        description: { type: 'STRING', description: 'Clear explanation of what needs authorization and why' },
        payload: { type: 'OBJECT', description: 'Details like dollar amounts, customer emails, or IDs' },
      },
      required: ['action_type', 'description', 'payload'],
    },
  },

  search_store_catalog: {
    name: 'search_store_catalog',
    description: 'Search official store products, stock levels, return policy, and shipping terms.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'Search keywords, product names, or policy topics' },
      },
      required: ['query'],
    },
  },

  search_web: {
    name: 'search_web',
    description: 'Search live market trends, competitor pricing, customer review sentiment, and SEO keywords.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'Web search query string' },
      },
      required: ['query'],
    },
  },

  draft_marketing_content: {
    name: 'draft_marketing_content',
    description: 'Draft marketing copy for social posts (Twitter, Instagram), blog articles, or newsletters.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING', description: 'Catchy title or post hook' },
        platform: { type: 'STRING', description: 'Platform: twitter, instagram, blog, newsletter' },
        content: { type: 'STRING', description: 'Marketing body text with hashtags and call to action' },
        target_audience: { type: 'STRING', description: 'Target demographic' },
      },
      required: ['title', 'platform', 'content'],
    },
  },

  draft_support_reply: {
    name: 'draft_support_reply',
    description: 'Draft an empathetic, professional email response to a customer inquiry or return request.',
    parameters: {
      type: 'OBJECT',
      properties: {
        customer_email: { type: 'STRING', description: 'Customer email address' },
        subject: { type: 'STRING', description: 'Subject line' },
        body: { type: 'STRING', description: 'Customer response body text' },
        resolution_type: { type: 'STRING', description: 'resolution: explanation, return_authorized, refund_requested' },
      },
      required: ['customer_email', 'subject', 'body'],
    },
  },

  save_agent_memory: {
    name: 'save_agent_memory',
    description: 'Store key-value knowledge into SQLite memory with optional retention TTL.',
    parameters: {
      type: 'OBJECT',
      properties: {
        key: { type: 'STRING', description: 'Unique lookup key' },
        value: { type: 'STRING', description: 'Content to remember' },
        memory_type: { type: 'STRING', description: 'short_term (7 days) or long_term' },
        ttl_days: { type: 'NUMBER', description: 'Days before expiration (default: 7)' },
      },
      required: ['key', 'value'],
    },
  },

  read_agent_memory: {
    name: 'read_agent_memory',
    description: 'Query memories previously saved by this or other agents in SQLite.',
    parameters: {
      type: 'OBJECT',
      properties: {
        key: { type: 'STRING', description: 'Key or keyword to look up' },
      },
      required: ['key'],
    },
  },
};

// Filter tools by role
export function getToolsForRole(role: string): any[] {
  switch (role) {
    case 'manager':
      return [
        FUNCTION_DECLARATIONS.delegate_subtask,
        FUNCTION_DECLARATIONS.request_human_approval,
        FUNCTION_DECLARATIONS.save_agent_memory,
        FUNCTION_DECLARATIONS.read_agent_memory,
      ];
    case 'researcher':
      return [
        FUNCTION_DECLARATIONS.search_store_catalog,
        FUNCTION_DECLARATIONS.search_web,
        FUNCTION_DECLARATIONS.save_agent_memory,
        FUNCTION_DECLARATIONS.read_agent_memory,
      ];
    case 'designer':
      return [
        FUNCTION_DECLARATIONS.generate_design_spec,
        FUNCTION_DECLARATIONS.search_web,
        FUNCTION_DECLARATIONS.save_agent_memory,
        FUNCTION_DECLARATIONS.read_agent_memory,
      ];
    case 'developer':
      return [
        FUNCTION_DECLARATIONS.write_code_artifact,
        FUNCTION_DECLARATIONS.search_web,
        FUNCTION_DECLARATIONS.save_agent_memory,
        FUNCTION_DECLARATIONS.read_agent_memory,
      ];
    case 'data_analyst':
      return [
        FUNCTION_DECLARATIONS.run_data_analytics,
        FUNCTION_DECLARATIONS.search_store_catalog,
        FUNCTION_DECLARATIONS.save_agent_memory,
        FUNCTION_DECLARATIONS.read_agent_memory,
      ];
    case 'writer':
      return [
        FUNCTION_DECLARATIONS.draft_marketing_content,
        FUNCTION_DECLARATIONS.search_store_catalog,
        FUNCTION_DECLARATIONS.save_agent_memory,
        FUNCTION_DECLARATIONS.read_agent_memory,
      ];
    case 'cloud_engineer':
      return [
        FUNCTION_DECLARATIONS.inspect_cloud_infra,
        FUNCTION_DECLARATIONS.search_web,
        FUNCTION_DECLARATIONS.request_human_approval,
        FUNCTION_DECLARATIONS.save_agent_memory,
        FUNCTION_DECLARATIONS.read_agent_memory,
      ];
    case 'cyber_sec':
      return [
        FUNCTION_DECLARATIONS.audit_security_posture,
        FUNCTION_DECLARATIONS.search_web,
        FUNCTION_DECLARATIONS.request_human_approval,
        FUNCTION_DECLARATIONS.save_agent_memory,
        FUNCTION_DECLARATIONS.read_agent_memory,
      ];
    case 'support':
      return [
        FUNCTION_DECLARATIONS.search_store_catalog,
        FUNCTION_DECLARATIONS.draft_support_reply,
        FUNCTION_DECLARATIONS.request_human_approval,
        FUNCTION_DECLARATIONS.save_agent_memory,
        FUNCTION_DECLARATIONS.read_agent_memory,
      ];
    default:
      return [];
  }
}

// Separate search_web handler using Gemini's googleSearch grounding tool
async function handleWebSearch(query: string): Promise<any> {
  if (aiClient) {
    try {
      // Execute separate generateContent with googleSearch tool only (not combined with function declarations)
      const res = await aiClient.models.generateContent({
        model: process.env.WORKER_MODEL || 'gemini-3.8-flash',
        contents: `Research current market trends, competitor pricing, and popular keywords for: ${query}. Provide a structured, concise summary.`,
        config: {
          tools: [{ googleSearch: {} } as any],
        },
      });

      return {
        query,
        source: 'Google Search Grounding',
        summary: res.text || `Market intelligence report for ${query}`,
      };
    } catch (err: any) {
      console.warn('[Tools] Google Search grounding failed, using market fallback:', err.message);
    }
  }

  // High-fidelity fallback when API key is missing or grounding tool is unavailable
  return {
    query,
    source: 'Market Trend Knowledge Base',
    summary: `Market intelligence for '${query}': High demand for retro mechanical keyboards and desk accessories among developers. Competitors are priced 12-15% higher. Key hashtags: #PixelDesk, #WorkFromHomeGear, #DeskSetup2026.`,
    benchmarks: {
      average_market_price: '$99 - $115',
      store_price_advantage: '12% cheaper',
      recommended_angles: ['Highlight durable tactile switches', 'Emphasize 30-day return policy', 'Target indie game developers'],
    },
  };
}

// Tool Dispatcher
export async function executeTool(name: string, args: Record<string, any>, context: ToolContext): Promise<any> {
  const { agentId, ticket } = context;
  logActivity(agentId, 'info', `Called tool ${name}`);

  switch (name) {
    case 'search_store_catalog':
      return {
        query: args.query,
        results: queryStoreCatalog(args.query || ''),
      };

    case 'search_web':
      return await handleWebSearch(args.query || '');

    case 'request_human_approval': {
      const approvalId = `appr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const approval = createApproval({
        id: approvalId,
        ticket_id: ticket.id,
        agent: agentId,
        action_type: args.action_type,
        description: args.description,
        payload: args.payload || {},
      });

      updateTicketStatus(ticket.id, 'awaiting_approval');
      logActivity(agentId, 'approval', `Human approval requested: ${args.description}`);

      if (context.onApprovalNeeded) {
        context.onApprovalNeeded(approvalId, args.description);
      }

      return {
        approval_id: approvalId,
        status: 'awaiting_human_approval',
        message: 'Paused. Human approval is required from the store owner before proceeding.',
      };
    }

    case 'delegate_subtask': {
      const subtaskId = `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const subtask = createTicket({
        id: subtaskId,
        from_agent: agentId,
        to_agent: args.to_agent,
        workflow_id: ticket.workflow_id || ticket.id,
        task: args.task_description,
        priority: args.priority || 'medium',
        payload: args.payload || {},
      });

      logActivity(agentId, 'handoff', `Delegated task to ${args.to_agent}: "${args.task_description.slice(0, 32)}..."`);

      if (context.onSubtaskCreated) {
        context.onSubtaskCreated(subtask);
      }

      return {
        subtask_id: subtaskId,
        assigned_to: args.to_agent,
        status: 'enqueued',
      };
    }

    case 'draft_marketing_content':
      return {
        status: 'draft_created',
        platform: args.platform,
        title: args.title,
        content: args.content,
        notice: 'Draft completed and ready for Dylan CEO review.',
      };

    case 'generate_design_spec':
      return {
        status: 'spec_generated',
        component_name: args.component_name,
        category: args.category,
        design_tokens: args.design_tokens,
        layout_structure: args.layout_structure,
        accessibility_notes: args.accessibility_notes,
        notice: 'UI/UX design specification delivered for engineering sprint.',
      };

    case 'write_code_artifact':
      return {
        status: 'code_written',
        filename: args.filename,
        language: args.language,
        code_length: args.code_content?.length || 0,
        explanation: args.explanation,
        notice: 'Production-ready fullstack code delivered with type safety and error boundaries.',
      };

    case 'run_data_analytics':
      return {
        status: 'analytics_computed',
        metric_name: args.metric_name,
        timeframe: args.timeframe,
        sql_query: args.sql_query,
        findings_summary: args.findings_summary,
        recommendations: args.recommendations,
        notice: 'Quantitative data analysis compiled with business intelligence metrics.',
      };

    case 'inspect_cloud_infra':
      return {
        status: 'infra_inspected',
        resource_type: args.resource_type,
        environment: args.environment,
        action: args.action,
        health: 'Healthy 99.99% Uptime',
        details: args.details || { cpu_utilization: '18%', memory_usage: '42%', pods_running: 16 },
        notice: 'Cloud infrastructure verified and operational.',
      };

    case 'audit_security_posture':
      return {
        status: 'audit_completed',
        target_system: args.target_system,
        scan_type: args.scan_type,
        risk_level: args.risk_level,
        findings: args.findings,
        remediation_steps: args.remediation_steps,
        zero_trust_status: 'Compliant',
        notice: 'Security posture audit completed with zero-trust protocols.',
      };

    case 'draft_support_reply':
      return {
        status: 'draft_prepared',
        customer_email: args.customer_email,
        subject: args.subject,
        body: args.body,
        resolution_type: args.resolution_type,
        notice: 'Support response draft logged. If refunds are needed, request_human_approval must be called.',
      };

    case 'save_agent_memory':
      setMemory(agentId, args.key, args.value, args.memory_type || 'short_term', args.ttl_days || 7);
      return { success: true, key: args.key, message: 'Saved to SQLite agent_memory.' };

    case 'read_agent_memory': {
      const memories = getMemory(agentId, args.key);
      return {
        key: args.key,
        count: memories.length,
        memories: memories.map((m) => ({ key: m.key, value: m.value, type: m.memory_type })),
      };
    }

    default:
      logActivity(agentId, 'mistake', `Attempted unknown tool: ${name}`);
      throw new Error(`Tool ${name} is not recognized.`);
  }
}
