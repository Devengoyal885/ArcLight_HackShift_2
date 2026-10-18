# CapAble — SIH 2026 Problem Statement 2 Transformation Walkthrough
## Unified Talent, Entrepreneurship, Employment, Mentorship & Incubation Ecosystem

CapAble has been systematically audited, re-architected, and extended to directly address **Smart India Hackathon (SIH 2026) Problem Statement 2: Entrepreneurship & Employment — Connecting Talent, Ideas, and Opportunities**.

Every enhancement was built strictly upon CapAble's existing infrastructure, preserving all 39 Firestore services, authentications, role guards, and backward-compatible routing without breaking any existing student, employer, faculty, or institutional features.

---

## 🗺️ 1. Canonical Candidate Navigation Structure

To eliminate fragmented navigation, the Candidate portal now strictly features **6 canonical navigation items** in [`FloatingNavbar.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/Capable/Capable/src/components/navigation/FloatingNavbar.tsx):

| Canonical Nav Item | Canonical Route | Hub Contents / Deep Links | Backward-Compatible Redirects |
|---|---|---|---|
| **Dashboard** | `/candidate/dashboard` | 3D Holographic ID, Top Capabilities, Skill Gap Loop, Matched Jobs & Startups feed | `/candidate` |
| **Opportunities** | `/candidate/opportunities` | All Jobs, Startups & Co-Founders, Incubation & E-Cells, Campus Drives, Off-Campus, Applications | `/candidate/jobs`, `/candidate/drives`, `/candidate/off-campus` |
| **Preparation** | `/candidate/preparation` | Monaco Coding IDE, AI Voice Interviewer, Aptitude Tests, Case Studies, GD Arena | `/candidate/practice`, `/candidate/interview`, `/candidate/aptitude` |
| **Career & Learning** | `/candidate/career` | Career Goals, Dynamic AI Learning Paths, Digital Portfolio, ArcLight SAS Predictive ML (`?tab=insights`) | `/candidate/learning`, `/candidate/portfolio`, `/candidate/arclight` |
| **Community & Mentors** | `/candidate/community` | Student Community Forum, Hackathons & Tech Events, Founders & Angel Mentors (`?tab=mentors`) | `/candidate/forum`, `/candidate/events`, `/candidate/alumni` |
| **My Applications** | `/candidate/applications` | 4-Track Matrix: Job Applications, Co-Founder Pitches, Incubation Pitches, Saved Bookmarks | Supported directly in Opportunities Hub & top nav |

---

## 🚀 2. Entrepreneurship & Venture Ecosystem (SIH PS-2)

### 2.1 Startup Ventures & Co-Founder Board
- **Location**: [`src/components/opportunities/StartupVenturesView.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/Capable/Capable/src/components/opportunities/StartupVenturesView.tsx)
- **Accessible At**: `/candidate/opportunities?tab=ventures` or via Candidate Dashboard Quick Capsule
- **Capabilities**:
  - Discover student-led startups filtered by stage: `Idea`, `Prototype`, `MVP`, `Seed Funded`.
  - Filter by required co-founder roles (`CTO`, `AI/ML Engineer`, `Full-Stack Dev`, `UI/UX Designer`, `Growth Lead`).
  - View problem statements, tech stacks, current traction, and intellectual property disclaimers.
  - **1-Click Co-Founder Pitch**: Submit proposals detailing target contribution, relevant skills, GitHub links, and committed weekly hours.
  - **Publish Venture**: Founders can publish early-stage ventures with IP privacy controls.

### 2.2 Institutional Incubation Hub & Seed Acceleration
- **Location**: [`src/components/opportunities/IncubationHubView.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/Capable/Capable/src/components/opportunities/IncubationHubView.tsx)
- **Accessible At**: `/candidate/opportunities?tab=incubation`
- **Capabilities**:
  - Direct integration with premier institutional TBIs (IIT Delhi TBI, NSRCEL IIM Bangalore, T-Hub Hyderabad, etc.).
  - Discover financial grants (up to ₹25 Lakhs NIDHI-PRAYAS / DST seed grants) and equity terms.
  - Transparency into incubator perks: Prototyping FabLabs, GPU compute clusters, legal incorporation credits, and investor demo day access.
  - **1-Click Executive Pitch Submission**: Formal incubation application capturing venture overview, target market, prototype demo links, team size, and funding requirements.

### 2.3 Unified 4-Track Application Matrix
- **Location**: [`src/pages/candidate/ApplicationsPage.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/Capable/Capable/src/pages/candidate/ApplicationsPage.tsx)
- **Accessible At**: `/candidate/applications`
- **Tabs**:
  1. **Job Applications**: Campus and off-campus recruitment drive applications with recruitment stages (`Applied`, `Shortlisted`, `Interviewing`, `Offered`).
  2. **Co-Founder & Ventures**: Applications sent to student ventures with proposal notes and role statuses.
  3. **Incubation Pitches**: Formal accelerator pitches with institutional review stages (`Pending Review`, `In Review`, `Shortlisted for Pitch Day`, `Accepted into Cohort`).
  4. **Saved Opportunities**: Bookmarked jobs and ventures.

### 2.4 Founders, Angel Investors & Mentors Network
- **Location**: [`src/pages/candidate/AlumniNetworkPage.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/Capable/Capable/src/pages/candidate/AlumniNetworkPage.tsx)
- **Accessible At**: `/candidate/community?tab=mentors`
- **Capabilities**:
  - Seeded network of alumni founders (Fintech, HealthTech, EdTech), angel investors, venture partners, and E-Cell advisors.
  - Quick filter for "Founders & Advisors" to instantly surface entrepreneurial mentorship.
  - Solves the previous empty-state dead-end when students' colleges had no registered alumni.

---

## 🏢 3. Employer & Startup Founder Experience

### Startup & Venture Role Creation Track
- **Location**: [`src/pages/employer/RolesPage.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/Capable/Capable/src/pages/employer/RolesPage.tsx) & [`src/services/employerService.ts`](file:///c:/Users/ASUS/OneDrive/Desktop/Capable/Capable/src/services/employerService.ts)
- **Accessible At**: `/employer/roles`
- **Features**:
  - **Startup Track Card**: Toggle to classify any opening as a "Startup & Early-Stage Venture Track".
  - **Stage & Equity Configuration**: Specify stage (`Idea`, `Prototype`, `MVP`, `Seed Funded`, `Series A`) and equity ranges (e.g., `1.5% - 4.0% equity`).
  - **Badge Rendering**: Automatically badges listings with `Startup • MVP` and equity tags in the talent radar and candidate feeds.

---

## 🏛️ 4. Institution E-Cell & Incubation Center Operations

### Institutional Incubation Center Workspace
- **Location**: [`src/pages/institution/InstitutionIncubationPage.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/Capable/Capable/src/pages/institution/InstitutionIncubationPage.tsx)
- **Accessible At**: `/institution/incubation`
- **Features**:
  - **Overview Telemetry**: Active Cohorts, Total Pitches Received, Shortlisted for Pitch Day, Seed Grants Allocated (₹).
  - **Pitch Review Kanban & Table**: Filter pitches by cohort, examine executive summary, prototype URL, requested grant amount, and student credentials.
  - **5-Stage Review Transitions**: Move pitches between `Pending Review` ➔ `In Review` ➔ `Shortlisted for Pitch Day` ➔ `Accepted into Cohort` ➔ `Rejected`.
  - **Cohort Deployment**: Launch new incubation cohorts with grant budgets, deadlines, and cohort descriptions.
  - **Dashboard Integration**: Quick-access module card added to [`InstitutionDashboard.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/Capable/Capable/src/pages/institution/InstitutionDashboard.tsx).

---

## ⚡ 5. ArcLight Predictive Engine & Market Intelligence Integration

- **Embedded Seamlessly**: Integrated directly into [`CareerHubPage.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/Capable/Capable/src/pages/candidate/CareerHubPage.tsx) under the `Market Insights & ArcLight ML` tab.
- **Microservice Status**: Running on port `8000` via FastAPI (`arclight-api`), executing SAS-reimplemented machine learning models:
  - High-Salary Probability Prediction (`POST /api/predict/high-salary`)
  - Salary Hike Forecast (`POST /api/predict/salary-hike`)
  - Big-5 Senior Success Potential (`POST /api/predict/senior-success`)
- **Telemetry Sync**: Reads from and feeds into candidate skill gap loops and learning path recommendations.

---

## 🛡️ 6. Architectural Integrity & Verification

1. **Firestore Collections & Security**:
   - Extended [`firestore.rules`](file:///c:/Users/ASUS/OneDrive/Desktop/Capable/Capable/firestore.rules) and [`firestore.indexes.json`](file:///c:/Users/ASUS/OneDrive/Desktop/Capable/Capable/firestore.indexes.json) to secure:
     - `ventures/{id}`
     - `collaborationRequests/{id}`
     - `incubationPrograms/{id}`
     - `incubationApplications/{id}`
2. **AI Model Resilience**:
   - Sanitized deprecated Gemini models (e.g. `gemini-2.0-flash` ➔ `gemini-2.5-flash`) across [`server/index.ts`](file:///c:/Users/ASUS/OneDrive/Desktop/Capable/Capable/server/index.ts) and [`geminiProxyService.ts`](file:///c:/Users/ASUS/OneDrive/Desktop/Capable/Capable/src/services/geminiProxyService.ts) with Groq fallback.
3. **Build & Typecheck**:
   - Strict TypeScript check (`npx tsc --noEmit`) passes with **0 errors**.
4. **Browser Verification**:
   - Visual verification across Candidate, Employer, and Institution portals confirmed all components render smoothly with Apple-inspired spring physics, responsive layouts, and OLED dark/light theme fidelity.
