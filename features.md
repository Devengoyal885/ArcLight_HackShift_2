# 🌟 CapAble Platform — Complete Features & Capabilities Catalog

CapAble is an AI-augmented, telemetry-driven **Campus Placement Intelligence & Talent Operating System** developed for the **HACK SHIFT**. It shifts recruitment from unverified, self-claimed PDF resumes to **verifiable capability fingerprints, live telemetry, and autonomous intelligence**.

Below is the exhaustive documentation of all features built across the entire ecosystem.

---

## 📑 Table of Contents

1. [🎓 Candidate (Student) Ecosystem](#1--candidate-student-ecosystem)
2. [🏢 Employer & Industry Recruiter Portal](#2--employer--industry-recruiter-portal)
3. [🏛️ Institution & University TPO Operations](#3--institution--university-tpo-operations)
4. [👨‍🏫 Faculty & Academician Portal](#4--faculty--academician-portal)
5. [⚡ ArcLight Data Science & SAS Predictive Engine](#5--arclight-data-science--sas-predictive-engine)
6. [🤖 AI, Voice & NLP Microservices](#6--ai-voice--nlp-microservices)
7. [🛡️ Proctoring & Integrity Verification](#7--proctoring--integrity-verification)
8. [🎨 Design System, 3D Shaders & Motion Physics](#8--design-system-3d-shaders--motion-physics)
9. [🔐 Security, Gateway & Production Infrastructure](#9--security-gateway--production-infrastructure)

---

## 1. 🎓 Candidate (Student) Ecosystem

### 1.1 Candidate Dashboard (`/candidate`)
- **Real-Time Greeting & Identity**: Time-aware optical greeting with candidate's first name and status badge.
- **3D Interactive Holographic Identity Card (`IdentityCard3D`)**:
  - Real-time spring-tilt physics reacting to mouse movement (`rotateX`, `rotateY` via Framer Motion springs).
  - Dynamic specular glare shader overlay following viewing angle.
  - Circular SVG Capability Confidence ring derived from verified Firestore records.
  - Global Hackathon telemetry score and verification watermark.
- **Top Capabilities Matrix**: Visualizes verified skill proficiencies (0-100%) with top-capability badges and animated progress rails.
- **Career Readiness Score**: Dynamic composite metric calculated across skill breadth, confidence ratings, GitHub repositories, and profile completeness.
- **Peer Benchmarking**: Institutional percentile benchmarking displaying College Rank (e.g., Top 15%) and Department/Branch Rank (e.g., Top 8%).
- **Skill Gap → Learning → Opportunity Loop**: Automatically isolates the student's two weakest skills and provides 1-click action triggers:
  - *Learn*: Deep-links to AI-generated learning paths.
  - *Assess*: Deep-links to interactive skill assessments.
  - *Roles*: Filters live jobs requiring that technology.
- **Asymmetric Bento Grid Job Feed**:
  - Live aggregated opportunities filtered by **Placements** vs **Internships**.
  - Verified skill chips highlighting skills already mastered (`✓`).
  - Match percentage badges (`READY NOW`, `NEAR MATCH`, `SKILL-BUILDING`).
  - **✨ 1-Click Tailored Resume**: Deep-links directly to Resume Studio, automatically priming Gemini AI with the selected job description.

### 1.2 Preparation Hub (`/candidate/preparation`)
- **Interactive Coding IDE & Problem Solving (`/candidate/practice/solve/:titleSlug`)**:
  - Powered by Monaco Editor (the core engine of VS Code).
  - Syntax highlighting, code auto-completion, and multi-language support (C++, Python, Java, JavaScript, TypeScript).
  - Real-time test-case runner with execution time, memory usage, and input/output validation via Piston / Judge0.
  - Curated LeetCode problem catalog with company tags (FAANG, Tier 1).
- **AI Conversational Voice Interviewer (`AIInterviewSimulator`)**:
  - Interactive speech-to-speech mock interviews powered by Vapi.ai and Google Gemini.
  - Contextual behavioral and technical questioning based on selected target role.
  - Post-interview comprehensive analytics: communication clarity, technical depth, pauses, and speech confidence.
- **Aptitude & Logical Reasoning Studio (`AptitudeTestPage` & `AptitudeHistoryPage`)**:
  - Timed diagnostic assessments across Quantitative Aptitude, Logical Reasoning, and Verbal Ability.
  - Category-wise analytics, historical trends, percentile calculation, and question-by-question review.
- **Case Study & GD Topic Arena (`/candidate/preparation?tab=case-study`, `gd-topics`)**:
  - Comprehensive consulting and product case interview simulations.
  - Curated Group Discussion topic pool with structured argumentation frameworks, statistics, and counter-points.

### 1.3 Career Hub (`/candidate/career`)
- **Dynamic Learning Pathways (`LearningPage.tsx`)**:
  - Generates bespoke, milestone-based learning curriculums via Gemini AI (`learningService.ts`) tailored to candidate skill deficits.
  - Correlates milestones with curated documentation, YouTube lectures, and GitHub sample repos.
- **Resume Studio & AI Tailoring (`ResumeAIPage.tsx` & `ResumeBuilderPage.tsx`)**:
  - Real-time ATS compliance scoring with instant improvement suggestions.
  - **No-Fabrication Engine**: Restricts AI resume generation to verifiable Firestore projects and capabilities — strictly prohibiting hallucinated experiences.
  - Clean PDF and high-resolution HTML export formats.
- **Career Roadmap & Pathing (`CareerPage.tsx`)**:
  - Role transition simulations (e.g., Backend Developer → Full-Stack ML Engineer).
  - Target role readiness score with exact missing requirements and milestone roadmaps.
- **Digital Portfolio & Ecosystem Vitality (`PortfolioPage.tsx` & `CodolioProfilePage.tsx`)**:
  - Holographic showcase of candidate projects, live demos, and verified badges.
  - Automated GitHub telemetry ingestion (commits, stars, languages, repository count).
  - Public shareable portfolio profile link (`/u/:username` and `/profile/:uid`).

### 1.4 Jobs Hub (`/candidate/jobs`)
- **Multi-Source Job Aggregation Engine (`opportunityService.ts`)**:
  - Simultaneous real-time retrieval from **Serper (Google Jobs Search)**, **Remotive API (Remote Tech Roles)**, **Adzuna API**, and **CapAble Employer Postings**.
  - Client-side deduplication using Levenshtein distance and company-role fingerprinting (`jobDedup.ts`).
  - Skill extraction and work-type classification (`skillExtractor.ts`).
- **Campus Placement Drives (`PlacementDrivesPage.tsx`)**:
  - On-campus drive schedule, eligibility verification (CGPA, active backlogs), and 1-click registration.
  - Real-time drive stages tracker (Aptitude → Technical Round 1 → HR Round → Offer).
- **Off-Campus Aggregator (`OffCampusPage.tsx`)**:
  - Dedicated feed for mass hiring and off-campus opportunities across India and global remote.
- **Application Status Tracker (`ApplicationsPage.tsx`)**:
  - Kanban / List view tracking application progress (`Applied`, `Shortlisted`, `Interviewing`, `Offered`, `Rejected`).

### 1.5 MailIQ — Autonomous Recruiter Outreach (`/candidate/mailiq`)
- AI-driven cold email generator crafting hyper-personalized messages based on recruiter profile, company engineering stack, and candidate projects.
- Subject line optimization to maximize open rates.
- Integrated outreach tracker.

### 1.6 Online Assessment (OA) Platform (`/candidate/oa/:appId`)
- Fullscreen examination environment for campus drives.
- Integrated coding problems, MCQs, and automated scoring.
- Real-time submission validation and anti-cheat telemetry.

### 1.7 🚀 Entrepreneurship, Ventures & Incubation Ecosystem (SIH 2026 PS-2)
- **Startup Ventures & Co-Founder Board (`/candidate/opportunities?tab=ventures`)**:
  - Discover student-founded ventures across Idea, Prototype, MVP, and Seed-Funded stages.
  - Complementary skill discovery: Filter ventures seeking technical co-founders, UI/UX designers, AI researchers, or growth marketers.
  - **1-Click Co-Founder Pitch Modal**: Submit direct collaboration proposals detailing relevant capabilities, GitHub projects, and weekly time commitment.
  - **Venture Pitch Publisher**: Students can post early-stage venture ideas with intellectual property protection disclosures, stage markers, and required co-founder roles.
- **Institutional Incubation Hub (`/candidate/opportunities?tab=incubation`)**:
  - Direct access to premier campus TBIs and state accelerators (IIT Delhi TBI, IIM Bangalore NSRCEL, T-Hub Hyderabad, etc.).
  - Seed grant discovery (e.g., ₹25 Lakhs NIDHI-PRAYAS / DST prototyping grants).
  - Facility perks transparency: Prototyping FabLabs, GPU compute clusters, legal incorporation credits, and investor demo day access.
  - **One-Click Executive Pitch Submission**: Formal incubation application with problem statement, target market, prototype URL, and funding request.
- **Unified 4-Track Application Matrix (`/candidate/applications`)**:
  - Consolidated status board tracking:
    1. *Job Applications* (Campus & Off-Campus drives)
    2. *Co-Founder & Venture Applications* (Collaborator interest requests)
    3. *Incubation Pitches* (Institutional cohort submissions with stage badges)
    4. *Saved Bookmarks & Saved Opportunities*
- **Founders & Angel Mentor Network (`/candidate/community?tab=mentors`)**:
  - Connect with verified alumni founders, angel investors, seed advisors, and E-Cell mentors.
  - Filter by "Founders & Advisors" to unlock early-stage venture guidance and pitch feedback.
- **Dynamic Startup Feed on Candidate Dashboard (`/candidate/dashboard`)**:
  - Dedicated "Startups & Ventures" feed tab in the opportunity matrix.
  - Quick-launch venture capsule in the personal identity rail.

---

## 2. 🏢 Employer & Industry Recruiter Portal

### 2.1 Employer Dashboard (`/employer`)
- **Hiring Pipeline Metrics**: Real-time count of active job openings, total applicants, shortlisted candidates, and interviews scheduled.
- **Diversity & Inclusivity Telemetry**: Automated tracking of candidate cohort diversity metrics.
- **Instant Drive Status**: Live updates on ongoing campus recruitment drives.

### 2.2 Talent Radar & Discovery (`TalentPage.tsx`)
- **Capability-Based Search**: Filter candidates by exact verified skills, minimum capability score (e.g., React >= 85%), CGPA, and college code.
- **Anti-Resume Keyword Inflation**: Sort candidates by real telemetry (GitHub code activity, assessment scores) rather than resume buzzwords.
- **Candidate Comparison Modal (`CandidateComparisonModal.tsx`)**: Side-by-side radar-chart comparison of multiple candidates' core competencies.

### 2.3 Roles Management (`RolesPage.tsx`)
- Post new on-campus and off-campus roles with customizable skill requirements, CTC packages, locations, and deadlines.
- Automatically calculates match matrices for all enrolled campus students against posted requirements.

### 2.4 Candidate Pipeline & ATS (`PipelinePage.tsx`)
- Drag-and-drop Kanban pipeline: `Applied` ➔ `Shortlisted` ➔ `Round 1` ➔ `Technical` ➔ `Offer Extended` ➔ `Hired`.
- Bulk candidate actions (Batch shortlisting, automated email dispatch).

### 2.5 Interview Scheduler (`InterviewSchedulerPage.tsx`)
- Calendar-based slot coordination with candidates and interview panels.
- Automated calendar invite generation and status tracking.

### 2.6 Employer Branding & University Partnerships (`EmployerBrandingPage.tsx` & `PartnersPage.tsx`)
- Customize university-facing company profile, campus drive presentations, and perks.
- Manage institutional partnerships and Memorandum of Understanding (MoU) records.

### 2.7 🚀 Startup & Venture Roles Track (`RolesPage.tsx` & `employerService.ts`)
- **Early-Stage Founder Posting**: Dedicated toggle to classify postings as "Startup & Early-Stage Venture Track".
- **Venture Stage & Equity Attributes**: Configure startup stage (`Idea`, `Prototype`, `MVP`, `Seed Funded`, `Series A`) and equity ranges (e.g. `1.0% - 3.5% equity`).
- **Startup Badges & Signals**: Renders dedicated `Startup • MVP` and equity badges on role cards and candidate opportunity feeds.

---

## 3. 🏛️ Institution & University TPO Operations

### 3.1 Institution Dashboard (`/institution`)
- **Executive Cohort Overview**: Total students enrolled, placed count, placement percentage, average CTC, and highest package.
- **Live Drive Telemetry**: Tracking currently visiting campus recruiters and stage clearances.

### 3.2 Student Placement Management (`StudentsPage.tsx`)
- Comprehensive cohort database with batch, branch, CGPA, backlogs, and placement status filtering.
- Verification controls: Verify student academic credentials and freeze profiles if placed.

### 3.3 Placement Drives Admin (`DrivesAdminPage.tsx`)
- Schedule, approve, and orchestrate on-campus recruitment drives.
- Set strict eligibility criteria (minimum CGPA, allowed branches, maximum active backlogs).
- Track student attendance, round drop-offs, and final select lists.

### 3.4 NAAC Criterion 5 Accreditation Reporting (`NAACReportPage.tsx`)
- **Automated NAAC Criterion 5.2.1 Compliance**: Generates accredited reporting tables for higher education quality assessment.
- One-click print/PDF export formatted to official statutory specifications.
- Breakdown of placement records, higher education progression, and competitive exam qualifiers.

### 3.5 Institutional Analytics (`AnalyticsPage.tsx`)
- Year-over-year placement trends, department-wise placement heatmaps, and salary distribution histograms.
- Skill demand vs. curriculum gap analytics informing syllabus improvements.

### 3.6 Automated Multi-Channel Communications (`CommunicationsPage.tsx`)
- Broadcast urgent placement notices, drive changes, and interview alerts to students.
- Multi-channel delivery support via In-App Alerts, Push Notifications (VAPID), Email, and WhatsApp/SMS.

### 3.7 🏛️ E-Cell & Institutional Incubation Workspace (`/institution/incubation`)
- **Student Pitch Review Pipeline**: Centralized institutional dashboard for reviewing early-stage student venture and prototype pitches.
- **5-Stage Review Lifecycle**: Progress pitches through `Pending Review` ➔ `In Review` ➔ `Shortlisted for Pitch Day` ➔ `Accepted into Cohort` ➔ `Rejected`.
- **Reviewer Feedback & Notes**: Attach institutional reviewer comments, internal scoring, and seed grant recommendations.
- **Cohort Deployment**: Launch new incubation cohorts (e.g., Summer Pre-Incubation 2026, DeepTech Accelerator) with application deadlines and grant budgets.

---

## 4. 👨‍🏫 Faculty & Academician Portal

### 4.1 Faculty Dashboard (`/faculty` & `/academician`)
- Real-time student progress monitoring for assigned department cohorts.
- Student skill endorsements: Faculty can endorse student capabilities with official institutional credentialing.

### 4.2 Research & Consultancy (`ResearchPage.tsx` & `ConsultancyPage.tsx`)
- Showcase ongoing faculty research projects, peer-reviewed publications, and patents.
- Industry consultancy engagement tracker and revenue ledger.

### 4.3 Faculty Development & Workshops (`FDPPage.tsx` & `WorkshopsPage.tsx`)
- Register for and track national Faculty Development Programs (FDPs).
- Schedule departmental technical bootcamps, workshops, and guest lectures.

### 4.4 Mentorship Management (`MentorshipPage.tsx`)
- Assign and oversee student mentorship cohorts.
- Track 1-on-1 counseling sessions, guidance notes, and career progress.

---

## 5. ⚡ ArcLight Data Science & SAS Predictive Engine

ArcLight is CapAble's proprietary Python FastAPI data science microservice (`arclight-api`), re-implementing statistical enterprise SAS models (`.sas7bdat`) using modern `scikit-learn` over **12,000+ real hiring records**.

### 5.1 SAS Model Modernization Pipeline
- **Logistic Regression with Balanced Class Weights**: Mirrors SAS `PROC LOGISTIC`, handling class imbalance natively.
- **In-Memory LRU Dataset Caching**: Pandas DataFrames loaded into memory once and served with sub-millisecond latency.
- **StandardScaler Normalization**: Re-implements SAS feature normalization routines.

### 5.2 Market Intelligence Endpoints (`GET /api/market/*`)
- `GET /api/market/top-roles`: Frequency distributions of high-demand job titles across the Indian and global tech ecosystem.
- `GET /api/market/salary-distribution`: Normalized distribution across entry, mid-tier, and senior salary tiers.
- `GET /api/market/skill-demand`: Live frequency rankings for in-demand technologies (Python, SQL, React, Cloud, ML).
- `GET /api/market/top-locations`: Geographic aggregation of active tech hiring hubs.

### 5.3 Predictive Machine Learning Models (`POST /api/predict/*`)
1. **High-Salary Prediction Model** (Mirrors `analytics_high_salary_model.sas7bdat`):
   - Computes probability of securing a **>= 15 LPA offer** based on experience, core stack, and location.
   - Provides concrete skill boost levers (e.g., *"Adding Cloud (+12%) elevates offer probability into the 88th percentile"*).
2. **Salary Hike Predictor** (Mirrors `jds_salary_hike_model.sas7bdat`):
   - Forecasts appraisal and role-switch percentage increments.
3. **Senior Success Potential** (Mirrors `sds_success_model.sas7bdat`):
   - Evaluates leadership readiness and complex project execution capability.

### 5.4 Candidate Career Hub Integration (`/candidate/career?tab=insights`)
- ArcLight SAS predictive models are integrated directly into the candidate's canonical Career & Learning Hub.
- Accessible via the "Market Insights & ArcLight ML" tab alongside Career Goals, Learning Paths, and Digital Portfolio without disjointed navigation.

---

## 6. 🤖 AI, Voice & NLP Microservices

### 6.1 Multi-Key Gemini AI Proxy (`server/index.ts`)
- **Key Rotation Architecture**: Server-side proxy managing an active pool of **50+ Groq and Gemini API keys**.
- **Zero Client Exposure**: Keys are strictly quarantined on the backend; the frontend never exposes raw AI credentials.
- **Automated Fallbacks**: Seamless failover to alternate keys or Groq models upon encountering rate limits (HTTP 429).

### 6.2 Python NLP Resume Parser (`scripts/nlp_parser.py`)
- Extracts plain text from uploaded PDF/Word resumes.
- Regex and entity extraction for contact details, educational degrees, CGPA, GitHub profiles, and tech skill taxonomies.

### 6.3 Voice AI Engine (Vapi.ai)
- Low-latency conversational audio streaming for mock interviews with emotional sentiment and confidence telemetry.

---

## 7. 🛡️ Proctoring & Integrity Verification

### 7.1 Face Tracking & Gaze Estimation (`@vladmandic/face-api`)
- In-browser TensorFlow.js neural network execution:
  - Multi-face detection (flags if unauthorized persons enter the camera frame).
  - Continuous face presence verification.
  - Gaze direction tracking (flags repeated looking away from the screen).

### 7.2 Lockdown Telemetry
- Fullscreen enforcement during online assessments.
- Window blur and tab-switching violation counters with automated exam termination upon reaching threshold violations.

---

## 8. 🎨 Design System, 3D Shaders & Motion Physics

- **Typography**: Dual display pairing `Albert Sans` (Headings) with `Inter` (UI) and `JetBrains Mono` (Code/Data).
- **Material Depth ("Doppelrand")**: Double-bezel rounded pill framing for maximum visual elegance.
- **Apple Spring Physics**: Fluid springs (`cubic-bezier(0.16, 1, 0.3, 1)`) with instant down-scale clicks (`scale(0.97)` at 100ms).
- **Specular 3D Shaders**: Gyroscopic card rendering powered by `@paper-design/shaders-react` and Framer Motion springs.
- **Subtle Film Grain**: Procedural SVG noise texture overlay eliminating sterile flat vector aesthetics.
- **Dark & Light Mode**: Seamless theme switching between OLED Deep Black (`#050505`) and Warm Editorial Paper (`#FDFBF7`).

---

## 9. 🔐 Security, Gateway & Production Infrastructure

- **Firebase v12 Security Rules**: Strict Firestore and Storage rules restricting student data mutations to authenticated owners.
- **Express Security Middleware**:
  - `express-rate-limit`: 100 requests per 15-minute window on all `/api/*` routes.
  - Granular CORS configuration.
- **Scheduled Background Job Queues**: Automated `node-cron` fetching external jobs every 12 hours off the request path.
- **PWA Ready**: Offline fallback service workers and installable Progressive Web App manifest.
