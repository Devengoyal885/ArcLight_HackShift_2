# AccessHire — Adaptive Capability Twin

> **See Capability. Prove Potential. Enable Transition.**  
> An AI-Powered Career & Workforce Operating System grounded in self-trained ML and generative agents.

[![Next.js](https://img.shields.io/badge/Next.js-16.3.1-black?logo=nextdotjs)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-13-FF0055?logo=framer)](https://www.framer.com/motion)
[![ML Backend](https://img.shields.io/badge/FastAPI-MPNet_Inference-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![SAP Hackfest 2026](https://img.shields.io/badge/SAP_Hackfest-2026-0070F3)](https://github.com/Devengoyal885/Access-Hire)

---

## 🌟 What is AccessHire?

AccessHire is an **Adaptive Capability Twin & Career Orchestration Operating System**. It moves hiring and workforce mobility beyond static resumes, degree pedigrees, and career gap penalties by evaluating **verified capabilities**, **independently verifiable evidence**, and **practical work output**.

```
TRADITIONAL HIRING                  ACCESSHIRE CAPABILITY TWIN
──────────────────                  ──────────────────────────
Pedigree & Degrees       ───────►   Verifiable Capabilities (0–100%)
Static Text Resumes      ───────►   Living Adaptive Capability Twin
Career Gap Penalties     ───────►   Lived Experience & Patent Portfolios
Course Completion Traps  ───────►   4-Step Practical Work Verification
Unconscious Bias Filters ───────►   Bias Audit Trail & Equity Nudges
```

---

## 🚀 What's New in Latest Release

### 1. 🧠 Live Self-Trained ML Skills Discovery Model
- Capability Translator is powered by a **custom self-trained MPNet capability inference model** hosted on FastAPI.
- Real-time semantic embedding search against a **469-capability enterprise taxonomy**.
- Signal explainability breakdown: **Semantic Similarity**, **Keyword Overlap**, and **Evidence Weighting**.

### 2. 🏆 Flagship Profile: Deven Goyal
- **Profile Headline**: *Neural Nexus | AI Systems Architect & Technology Innovator*
- **4-Tile Headline Stat Strip**: `20+ PATENTS` · `2nd — VIBE CODING 2026` · `676 TEAMS COMPETED` · `1st — HACKATHON WINS`
- **21 Registered Patents**: Full Indian Patent Office disclosures with Application Numbers, status (FILED / PUBLISHED), and filing dates across Wearable AI, Smart Biosensors, and IoT.
- **Projects & Hackathons**: *MailIQ* (AI Email Platform), *Cogniflow AI* (Analytics Dashboard), *IIT Ropar 1st Prize*, *Stack Sprint 1.0 1st Prize*, *India Innovates Top 1000 / 25.5k*.
- **Education & Certifications**: B.E. CSE Full Stack Development (Chandigarh University, Kargil Batch distinction), Indus Public School, NVIDIA LLM Application Developer.

### 3. 📄 Dynamic Resume Studio & Client-Side PDF Export
- **Zero Cross-Contamination**: Master Profile, Resume Studio, Opportunity Radar, and Action Center dynamically resolve the authenticated user session (Deven Goyal, Priya Sharma, or Sunita Verma).
- **Client-Side PDF Export**: Generates clean, ATS-optimized print-styled resumes with dynamic filenames (`{FirstName}_{LastName}_Resume_{RoleAppliedFor}.pdf`).

### 4. ⚡ Synapse UI — Neuro-Inclusive Workspace (Phase 1 Shipped)
- Persistent header toggle button for **Synapse UI**.
- Instantly activates **OpenDyslexic** typography and high-contrast neuro-inclusive readability modes.

### 5. 🤖 Multi-Agent Telemetry System & 4-Step Practical Sandbox
- Provenance tags for generating agents across all recommendations:
  - `SD` — Skills Discovery Agent
  - `MI` — Market Intelligence Agent
  - `LP` — Learning Pathway Agent
  - `IM` — Inclusive Matching Agent
  - `BA` — Bias Audit Agent
  - `EN` — Equity Nudge Agent
  - `JF` — Job Fairness Agent
  - `AA` — Accessibility & Accommodation Agent
- **4-Step Practical Work Verification Sandbox**:
  1. Sandboxed micro-task generated
  2. System evaluates submitted output
  3. Skills Discovery Agent logs result as new evidence
  4. Capability score updates on Twin
- **Minimum Learning Path**: Reskilling framed as internal micro-projects with 10 authentic **SAP Learning Hub** preparation courses (DEV100, DEV260, CLD200, DAT100, SPA100, SEC100, DEV280, SAC010, BLD100, CLD900).

### 6. 🏢 Differentiated Employee & Employer Experiences
- **Candidate View**: Blue/Violet accents with top-bar `CANDIDATE OS` tag.
- **Enterprise View**: Deep Teal accents (`#0d9488`), header tint, and `ENTERPRISE CONSOLE` tag.

### 7. 🗺️ Platform Roadmap (`/roadmap`)
- **MODULE: Synapse**: Neuro-Inclusive Workspace Customiser (Dynamic Communication Rewriter, Sensory Workspace Management, Anxiety-Reducing Task Deconstructor).
- **MODULE: Bridge**: Cross-Cultural & Linguistic Inclusion Engine (Idiom & Nuance Decoder, Reverse Inclusion Upskilling).

---

## 🏗️ System Architecture

```
AccessHire Platform
├── Next.js 16.3.1 (Turbopack Frontend & Server-Side API Proxies)
├── Real ML Inference Service (FastAPI + all-mpnet-base-v2 + 469-Node Taxonomy)
└── Generative Agent Pipeline (Gemini 1.5 Flash for Bias Audit, Equity Nudge & Job Fairness)
```

### Directory Structure

```
app/
├── layout.tsx                  # Root layout & theme configuration
├── globals.css                 # Core design tokens, light/dark theme variables
├── page.tsx                    # Landing Page with working Demo Sign-In
│
├── (app)/                      # Authenticated Career & Workforce OS Shell
│   ├── dashboard/              # Command Center (Hero metrics, Momentum chart, Next Actions)
│   ├── capability/             # Adaptive Capability Twin & Real ML Translator
│   ├── opportunities/          # Opportunity Radar with match scoring
│   ├── resume/                 # Resume Studio (Dynamic persona & PDF export)
│   ├── actions/                # Action Center & Communication Intelligence
│   ├── workspace/              # AI Multi-Model Workspace & Context Capsule
│   ├── workforce/              # Enterprise Workforce Console (6 modules + Bias Audit)
│   ├── profile/                # Master Profile (21 Patents, Headline Stats, Projects)
│   └── roadmap/                # Synapse & Bridge Product Roadmap
│
├── api/agents/
│   ├── translate-capability/   # Server-side proxy to FastAPI MPNet Inference endpoint
│   ├── learning-pathway/       # Gemini-backed course justification agent
│   ├── opportunity-match/      # Multimodal capability match evaluator
│   └── bias-audit/             # Enterprise bias audit and explanation agent
│
components/
├── auth/                       # ClientProviders, AuthModal, AuthContext
├── layout/                     # Sidebar, Topbar (Synapse UI Toggle, Enterprise Tag), CommandPalette
└── ui/                         # ThemeSwitcher, ATSBar, VerificationIndicators

data/
├── mockData.ts                 # Multi-persona profiles (Deven, Priya, Sunita), patents, actions
└── sapLearningHubCourses.ts    # 10 authentic SAP Learning Hub / Student Edition courses

lib/
├── auth-context.tsx            # Multi-persona authentication & active view state
├── synapse-context.tsx         # Neuro-inclusive font & high-contrast mode provider
└── utils.ts                    # Formatting & utility helpers
```

---

## 👥 Demo Personas

| Persona | Role / Background | Key Highlights |
|---------|-------------------|----------------|
| **Deven Goyal** *(Flagship)* | Neural Nexus \| AI Systems Architect | 20+ Patents, Vibe Coding 2nd Place (676 Teams), NVIDIA LLM Certified |
| **Priya Sharma** | IT Support $\rightarrow$ AI Operations | 3-Year Career Gap, Hubli Festival Operations, Verified Practical Trial (83%) |
| **Sunita Verma** | Healthcare Logistics & Caregiver Returnee | 3-Year Elder Care Logistics, Python Data Automation, Lucknow Community Lead |

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 18.17+ or Node.js 20+
- npm or yarn

### Setup & Run Locally

```bash
# Clone the repository
git clone https://github.com/Devengoyal885/Access-Hire.git
cd Access-Hire

# Install dependencies
npm install

# Configure environment variables
# Create .env.local with your backend configuration:
# ACCESSHIRE_ML_API_URL=https://cosmetics-outdoors-underfoot.ngrok-free.dev
# GEMINI_API_KEY=your_gemini_api_key_here

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
```

---

## 🛡️ Responsible AI Principles

1. **Evidence-Grounded**: All capability scores link directly to verifiable code, patent filings, assessments, or lived experience.
2. **Explainable AI**: The Skills Discovery Agent provides full signal breakdowns (semantic similarity + keyword overlap).
3. **No Fabrication**: Resume Studio will never invent credentials, experiences, or skills not present in the Master Profile.
4. **Human-in-the-Loop**: "AI recommends. Humans decide." — Job description rewrites and equity nudges require human sign-off.
5. **Continuous Bias Auditing**: Automated detection and logging of credential, gap, and geographic bias in hiring decisions.

---

## 👥 Team

**Star Coders** — SAP Hackfest 2026  
*Theme: Inclusive Workforce & Adaptive Career Enablement*

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.
