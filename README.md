# 🏢 Pixel Art & 3D Voxel AI Agents Virtual Office

A next-generation, high-definition dual-engine virtual office platform for autonomous AI agent pair-programming and real-time headquarters management. Built with **Next.js 15 (App Router)**, **React 19**, **Three.js**, and an **HTML5 2D Pixel Canvas Engine**.

---

## ✨ Features & Highlights

### 🎮 Dual-Engine Architecture
* **2D Retro Pixel View**: Hand-crafted 60 FPS HTML5 canvas engine featuring custom pixel characters, dynamic shadow projection, smooth A* waypoint navigation, collision matrices, and tactile retro animations.
* **3D Voxel HQ View**: Immersive Three.js isometric voxel studio featuring soft directional shadows, PBR ambient lighting, procedural limb articulation, real-time camera orbit/pan/zoom, and one-click toggle between **Crisp 3D HD** and **Retro Pixel 3D**.

### 🤖 Autonomous Agent Team
* **Dylan Ramos** (`#ffbe0b`) — *Founder & CEO* (CEO Command Station, executive decisions & team oversight).
* **Ray** (`#38bdf8`) — *Lead AI Researcher* (LLM benchmark exploration, deep learning & paper analysis).
* **Maya** (`#ec4899`) — *UI/UX & Product Designer* (Design systems, Figma wireframing & aesthetic direction).
* **Alex** (`#f97316`) — *Lead Fullstack Developer* (API architecture, system integration & rapid debugging).
* **Wendy** (`#34d399`) — *Marketing Strategist & Copywriter* (Growth campaigns, launch copy & viral hooks).
* **Zane** (`#22c55e`) — *Cybersecurity Specialist* (Zero-trust telemetry, vulnerability audits & threat modeling).

### 🏢 Headquarters Zones
1. **CEO Executive Suite (Zone 1)**: Executive desk facing sliding glass door, bookshelf with trophy, private leather lounge sofa, and custom Ficus palm plant.
2. **Team Open Bullpen (Zone 2)**: 2x3 specialized workstation grid, dual monitors, customized RGB tower lighting, and dedicated work tools.
3. **Executive Boardroom (Zone 3)**: Center conference suite with 85" Ultra-HD presentation TV, 4K AI video bar, mahogany conference table, automated bi-parting French sliding glass doors with motion sensors, and 6 executive conference seats.
4. **Team Relaxation & Coffee Lounge (Zone 4)**: Emerald velvet sectional sofa, glass coffee table, oak & cognac leather laptop work bench, retro arcade cabinet with glowing CRT marquee, Italian espresso machine, and ambient lounge lighting.
5. **Gourmet Kitchen Suite & Pantry (Zone 5A)**: Stainless steel smart refrigerator with ice dispenser, quartz counter with sink and faucet, microwave, commercial ruby espresso machine, floating oak glassware shelves, waterfall quartz island bar, cognac leather barstools, cappuccino mugs, and croissant snacks.
6. **Outdoor Zen Garden & Patio Terrace (Zone 5B)**: Teak outdoor dining & laptop table, woven wicker armchairs with weather-resistant cushions, cantilever canvas parasol umbrella, cedar pergola with hanging bistro Edison string lights, stacked slate zen water fountain with ripples, tropical planter boxes, potted palms, and panoramic penthouse glass balustrade.

### 💻 Dynamic Portable Laptop System
* Agents fold their role-colored laptops shut and carry them smoothly under their arm while walking between desks, the boardroom, the lounge, the kitchen, and the outdoor garden.
* When sitting down, the laptop seamlessly glides onto the desk/table, unfolds open to ~105°, and characters begin actively typing with unique screen glow colors.

### 💬 Real-Time Communication & Banter
* **Crisp Retina-Sharp HTML Speech Bubbles**: Zero blur, perfectly crisp vector speech cards pinned to agent coordinates in 3D and 2D.
* **Sequenced Boardroom All-Hands Discussions**: Full multi-turn agenda discussions with real-time speaker rotation.
* **Spontaneous Office Banter**: Autonomous cross-desk syncs, coffee runs, and water cooler hydration breaks.

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** 18.18+ or 20+
* **npm**, **pnpm**, or **yarn**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Dyl4nweb/virtual-office-ai-agents.git
   cd virtual-office-ai-agents
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Add your OpenRouter or Gemini API keys to `.env.local` if you wish to enable live LLM agent tasks.

4. **Run the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎮 Controls

* **WASD / Arrow Keys**: Walk Dylan Ramos (CEO) in real-time around the office.
* **Click Floor**: Click-to-move pathfinding with automatic doorway navigation.
* **Click Agent**: Inspect agent telemetry, task backlog, and current status in the side panel.
* **HUD Actions**:
  * `🤸 WORKERS STAND`: Stretch break for the bullpen.
  * `🛋️ LAPTOP LOUNGE`: Transition team to work from the lounge sofa and oak bench.
  * `☕🌿 KITCHEN & GARDEN`: Send team with laptops to work at the kitchen island and outdoor patio.
  * `📢 ALL-HANDS MEETING`: Gather all specialists in the boardroom for conference discussion.
  * `✨ CRISP 3D HD / 👾 RETRO PIXEL`: Toggle between high-definition voxel rendering and retro post-processing.
  * `🔊 SOUND`: Toggle Web Audio API synthesized procedural SFX.

---

## 🛠️ Tech Stack

* **Framework**: Next.js 15 (App Router, Server-Sent Events)
* **Frontend**: React 19, TypeScript
* **3D Graphics**: Three.js (Orthographic Isometric Camera, PCFSoftShadowMap)
* **2D Graphics**: HTML5 Canvas with custom A* pathfinding and pixel rendering
* **Database**: SQLite (via better-sqlite3) for persistent office events & agent memory
* **Audio**: Web Audio API Procedural Synthesizer

---

## 📄 License

MIT License. Created by Dylan Ramos.
