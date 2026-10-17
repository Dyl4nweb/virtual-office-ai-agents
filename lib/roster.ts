// Client-safe agent metadata and presets (Zero Node.js/fs dependencies)

export interface AgentPreset {
  label: string;
  prompt: string;
  icon: string;
}

export interface AgentRosterMeta {
  name: string;
  role: string;
  title: string;
  color: string;
  avatar: string;
  specialty: string;
  presets: AgentPreset[];
}

export const AGENT_ROSTER_INFO: Record<string, AgentRosterMeta> = {
  alex: {
    name: 'Alex',
    role: 'developer',
    title: 'Senior Fullstack Dev & Architect',
    color: '#f97316',
    avatar: '👨‍💻',
    specialty: 'Next.js 15, TypeScript, React 19, API routes, database schemas, fullstack code generation & debugging.',
    presets: [
      { label: 'Next.js API Route', prompt: 'Alex, build a production-ready Next.js 15 API route with request validation, error boundaries, and rate limiting.', icon: '⚡' },
      { label: 'React Component', prompt: 'Alex, implement an interactive, type-safe React component with sleek state management and clean styling.', icon: '⚛️' },
      { label: 'Database Schema', prompt: 'Alex, design a normalized SQL database schema with indexing, foreign keys, and migration scripts.', icon: '🗄️' },
      { label: 'Performance Audit', prompt: 'Alex, analyze fullstack performance bottlenecks and optimize bundle size, rendering latency, and memory footprint.', icon: '🚀' },
    ],
  },
  maya: {
    name: 'Maya',
    role: 'designer',
    title: 'Principal UI/UX & Product Designer',
    color: '#ec4899',
    avatar: '🎨',
    specialty: 'Design systems, modern color palettes, wireframes, WCAG AA accessibility, micro-interactions, responsive layouts.',
    presets: [
      { label: 'Design Tokens', prompt: 'Maya, generate complete design system tokens (hex color palettes, typography scale, spacing units, border radii, shadows).', icon: '🎨' },
      { label: 'Hero Section Wireframe', prompt: 'Maya, design a high-converting, modern glassmorphic hero section layout with mobile-first responsive breakdown.', icon: '📱' },
      { label: 'WCAG Accessibility', prompt: 'Maya, conduct a WCAG AA accessibility audit on our color contrast ratios and keyboard navigation targets.', icon: '👁️' },
      { label: 'Dark Mode Palette', prompt: 'Maya, create an ultra-sleek cyberpunk dark mode color palette with vibrant neon accents and glow tokens.', icon: '✨' },
    ],
  },
  wendy: {
    name: 'Wendy',
    role: 'writer',
    title: 'Lead Content Marketing Strategist',
    color: '#c084fc',
    avatar: '📣',
    specialty: 'Viral Twitter/X threads, high-converting copy, product launch campaigns, email newsletters, brand voice.',
    presets: [
      { label: 'Viral X/Twitter Thread', prompt: 'Wendy, write a high-engagement viral Twitter/X launch thread highlighting our autonomous AI Virtual Office features.', icon: '🐦' },
      { label: 'Product Launch Pitch', prompt: 'Wendy, craft an irresistible product launch email and elevator pitch for tech founders and developers.', icon: '🚀' },
      { label: 'Tagline & Brand Voice', prompt: 'Wendy, brainstorm 10 punchy, memorable brand taglines and value propositions for our AI platform.', icon: '💡' },
      { label: 'Blog Post Intro', prompt: 'Wendy, write an insightful tech blog post outline and intro about the future of multi-agent AI workspaces in 2026.', icon: '📝' },
    ],
  },
  ray: {
    name: 'Ray',
    role: 'researcher',
    title: 'Senior AI & Market Researcher',
    color: '#38bdf8',
    avatar: '🔬',
    specialty: 'State-of-the-art AI model benchmarks, competitive intelligence, tech stack comparisons, deep market analysis.',
    presets: [
      { label: 'Multi-Agent LLMs Report', prompt: 'Ray, research and synthesize the state-of-the-art architectures in autonomous multi-agent LLM systems for 2026.', icon: '🤖' },
      { label: 'Competitor Analysis', prompt: 'Ray, conduct a competitive market analysis on virtual office and AI agent tools, identifying key differentiators.', icon: '📊' },
      { label: 'Inference Benchmarks', prompt: 'Ray, benchmark latency, cost per token, and context window sizes for leading fast inference models.', icon: '⚡' },
      { label: 'Tech Stack Trends', prompt: 'Ray, analyze current tech stack adoption trends for high-growth web and AI startups.', icon: '📈' },
    ],
  },
  zane: {
    name: 'Zane',
    role: 'cyber_sec',
    title: 'Lead Cybersecurity & SecOps Engineer',
    color: '#22c55e',
    avatar: '🛡️',
    specialty: 'Vulnerability assessment, OWASP Top 10, Zero-Trust architecture, JWT hardening, penetration testing, DDoS defense.',
    presets: [
      { label: 'OWASP Security Audit', prompt: 'Zane, perform an in-depth OWASP Top 10 security audit covering injection, broken auth, and sensitive data exposure.', icon: '🛡️' },
      { label: 'Auth & JWT Hardening', prompt: 'Zane, audit our session management, JWT signing, refresh token rotation, and cookie security flags.', icon: '🔑' },
      { label: 'Zero-Trust Policy', prompt: 'Zane, outline a Zero-Trust network security checklist for server endpoints, API gateways, and database access.', icon: '🔒' },
      { label: 'DDoS & Rate Limiting', prompt: 'Zane, formulate a multi-layered rate limiting and DDoS protection strategy for production API routes.', icon: '🚨' },
    ],
  },
  eah: {
    name: 'Eah',
    role: 'manager',
    title: 'Executive Partner & Operations Co-Founder',
    color: '#f43f5e',
    avatar: '✨',
    specialty: 'Executive coordination, daily briefings, priority alignment for Dylan Ramos HQ, morale & partner support.',
    presets: [
      { label: 'Daily Team Briefing', prompt: 'Eah, compile a daily executive briefing of all current agent activities, priority tasks, and team milestones.', icon: '📋' },
      { label: 'Project Triage', prompt: 'Eah, organize and triage incoming directives across Alex, Maya, Wendy, Ray, and Zane for maximum efficiency.', icon: '🎯' },
      { label: 'Executive Coffee & Pep Talk', prompt: 'Eah, give Dylan a motivational executive check-in and brew a cup of fresh virtual espresso! ☕💖', icon: '☕' },
      { label: 'Milestone Roadmap', prompt: 'Eah, draft a prioritized milestone roadmap for our next product release with Founder Dylan.', icon: '🗺️' },
      { label: 'Share Warm Snack with Dylan', prompt: 'Eah, share a warm gourmet snack and coffee with Dylan at the CEO suite! 🥞☕💖', icon: '🥞' },
    ],
  },
  dylan: {
    name: 'Dylan Ramos',
    role: 'ceo',
    title: 'Founder & CEO',
    color: '#ffbe0b',
    avatar: '👑',
    specialty: 'Founder vision, executive command, strategic leadership, product roadmap direction.',
    presets: [
      { label: 'Executive Directive', prompt: 'Broadcast strategic directive to all virtual office personnel to align sprint priorities.', icon: '📢' },
      { label: 'Give Flowers to Eah 💐', prompt: 'Surprise Eah with a fresh bouquet of roses to brighten her day in the office! 💐', icon: '💐' },
      { label: 'Cook Gourmet Meal for Eah 🍳', prompt: 'Step away from the CEO desk to cook a warm, delicious gourmet breakfast for Eah!', icon: '🍳' },
    ],
  },
};
