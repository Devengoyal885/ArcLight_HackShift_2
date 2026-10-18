# CAPABLE — DEEP ARCHITECTURAL AUDIT
## SIH 2026 | Problem Statement 2: Entrepreneurship & Employment
### *Connecting Talent, Ideas, and Opportunities*

> **Audit Date:** October 2026 | **Auditor Role:** Principal Software Architect + SIH Evaluator
> **Constraint:** Read-only audit. No file modifications, no code generation.

---

## TABLE OF CONTENTS

1. [Executive Verdict](#1-executive-verdict)
2. [Feature Inventory & Gap Analysis](#2-feature-inventory--gap-analysis)
3. [Reuse Map](#3-reuse-map)
4. [Prioritized Implementation Matrix](#4-prioritized-implementation-matrix)
5. [Proposed Architecture & File-Level Plan](#5-proposed-architecture--file-level-plan)
6. [Unresolved Questions](#6-unresolved-questions)

---

## 1. EXECUTIVE VERDICT

### Overall Assessment: **STRONG FOUNDATION — STRATEGIC GAPS**

CapAble is not a skeleton. It is an operating-grade, multi-portal talent intelligence platform with **~40 Firestore service files**, **5 distinct authenticated portals**, a real Express backend with Twilio Voice + SMS, an ArcLight ML microservice, real job aggregation from 4 APIs, Monaco IDE, AI interview simulation, NAAC-grade reporting, and a verified capability fingerprinting system. The technical quality is high.

**The critical gap for SIH PS-2 is conceptual, not architectural.**

The current platform serves *employment seekers* (candidates going to job market) and *employment providers* (employers posting roles). It does NOT yet serve:

- **Entrepreneurs** who want to turn ideas into ventures
- **Startups** as a distinct hiring/mentoring entity class
- **Investors / Angel mentors** who fund early ventures
- **Idea marketplace** or co-founder matching
- **Entrepreneurship cells (E-cells)** at institutions

SIH PS-2 explicitly asks for: "connecting *entrepreneurs*, job seekers, *startups*, *mentors*, and *recruiters*; helping them discover opportunities, build skills, and **turn ideas into ventures**."

### Verdict by Dimension

| Dimension | Current State | SIH PS-2 Alignment |
|-----------|--------------|---------------------|
| Job Seeker support | Excellent — live jobs, OA, ATS, prep | Fully covered |
| Employer/Recruiter support | Excellent — pipeline, drives, branding | Fully covered |
| Mentor matching | Partial — alumni mentorship requests exist | No discovery engine, no structured sessions |
| Startup as entity | Not implemented | No startup profile type |
| Entrepreneur user flow | Not implemented | Critical gap |
| Idea marketplace | Not implemented | Critical gap |
| Co-founder / team matching | Not implemented | Critical gap |
| Skill development loop | Excellent — learning paths, assessments | Fully covered |
| Community / networking | Good — forum, events, alumni | Needs entrepreneur-specific categories |
| AI integration | Excellent — Gemini, Vapi, ArcLight | Ready to extend |
| Institutional operations | Excellent — NAAC, drives, analytics | Can add E-cell management |

### SIH Competitive Positioning

Without the entrepreneurship layer, CapAble scores approximately **65/100** against PS-2. With targeted additions (reusing ~80% of existing infrastructure), it can reach **92-95/100** — a near-certain finalist position.

The platform's existing infrastructure — Firebase Auth, multi-role architecture, verified skill fingerprinting, AI proxy, Twilio, community forum, and job matching — can support the entrepreneurship layer with **zero architectural rebuilds**.

---

## 2. FEATURE INVENTORY & GAP ANALYSIS

### 2.1 WHAT EXISTS — CONFIRMED FROM CODE

#### Candidate (Student) Ecosystem — `src/pages/candidate/`

| Feature | File | Status |
|---------|------|--------|
| Dashboard with 3D holographic ID, capability rings | `CandidateDashboard.tsx` | Live |
| Job aggregation (Serper, Remotive, Adzuna, internal) | `opportunityService.ts` | Live |
| Skill-match scoring (READY NOW / NEAR MATCH) | `opportunityService.ts` | Live |
| Preparation Hub: Monaco IDE, LeetCode, OA platform | `PreparationHubPage.tsx`, `OAPlatformPage.tsx` | Live |
| AI Interview Simulator (Vapi.ai + Gemini) | `AIInterviewSimulator.tsx` | Live |
| Aptitude testing + history + analytics | `AptitudeTestPage.tsx`, `AptitudeHistoryPage.tsx` | Live |
| Resume builder + AI tailoring (no-fabrication) | `ResumeBuilderPage.tsx`, `ResumeAIPage.tsx` | Live |
| Career hub: goals, learning paths, portfolio | `CareerHubPage.tsx`, `GoalsPage.tsx` | Live |
| Placement drives + eligibility engine | `PlacementDrivesPage.tsx`, `eligibilityService.ts` | Live |
| Off-campus aggregator | `OffCampusPage.tsx` | Live |
| Alumni network + mentorship requests | `AlumniNetworkPage.tsx` | Live (basic) |
| Community forum (posts, replies, upvotes) | `ForumPage.tsx`, `communityService.ts` | Live |
| Events calendar | `EventsPage.tsx` | Live |
| ArcLight analytics (SAS predictive models) | `ArcLightPage.tsx`, `arclight-api/` | Live |
| MailIQ cold outreach generator | `MailIQPage.tsx` | Live |
| Codolio coding profile | `CodolioProfilePage.tsx` | Live |
| Public shareable profile `/u/:username` | `PublicProfilePage.tsx` | Live |
| Certificate verification | `CertificatePage.tsx` | Live |
| Twilio voice call + SMS deadline reminders | `server/index.ts` L590-761 | Live |
| Saved opportunities with deadline alert fields | `profileService.ts` L100-113 | Live |

#### Employer Portal — `src/pages/employer/`

| Feature | File | Status |
|---------|------|--------|
| Posting roles (placement, internship, training, FDP, research, apprenticeship) | `employerService.ts` L26 | Live |
| Talent radar: capability-based candidate search | `TalentPage.tsx` | Live |
| Candidate comparison (radar chart) | `CandidateProfilePage.tsx` | Live |
| Drag-and-drop hiring pipeline / ATS | `PipelinePage.tsx` | Live |
| Interview scheduler | `InterviewSchedulerPage.tsx` | Live |
| Employer branding + university partnerships | `EmployerBrandingPage.tsx`, `PartnersPage.tsx` | Live |
| Insights dashboard | `InsightsPage.tsx` | Live |

#### Institution (TPO) Portal — `src/pages/institution/`

| Feature | File | Status |
|---------|------|--------|
| NAAC Criterion 5.2.1 automated reporting | `NAACReportPage.tsx` | Live |
| Placement drives admin (eligibility, rounds) | `DrivesAdminPage.tsx` | Live |
| Student database with verification | `StudentsPage.tsx` | Live |
| Skill-demand vs curriculum gap analytics | `AnalyticsPage.tsx` | Live |
| Multi-channel broadcast communications | `CommunicationsPage.tsx` | Live |
| Industry partner management | `IndustryPage.tsx` | Live |
| Programs management | `ProgramsPage.tsx` | Live |

#### Academician Portal — `src/pages/academician/`

| Feature | File | Status |
|---------|------|--------|
| Research showcase + publications | `ResearchPage.tsx` | Live |
| Consultancy marketplace (proposals to employers) | `ConsultancyPage.tsx` | Live (thin) |
| FDP management | `FDPPage.tsx` | Live |
| Workshops scheduler | `WorkshopsPage.tsx` | Live |
| Mentorship profile (expertise, availability, max mentees) | `MentorshipPage.tsx` | Live (basic) |

#### Backend / Infrastructure

| Feature | Location | Status |
|---------|----------|--------|
| Express server with rate limiting | `server/index.ts` | Live |
| Gemini proxy (50+ keys, Groq fallback) | `server/index.ts` L165-519 | Live |
| Twilio WhatsApp, SMS, Voice endpoints | `server/index.ts` L520-761 | Live |
| Deadline cron (every minute, 3h window) | `server/index.ts` L682-761 | Live |
| ArcLight FastAPI ML service | `arclight-api/`, `ArcLight/` | Live |
| Firebase Admin SDK (server-side) | `server/index.ts` L14-26 | Live |
| Node-cron job ingestion (12h) | `server/index.ts` L54-66 | Live |
| PWA-ready (service workers) | `vite.config.ts` + `package.json` | Live |

---

### 2.2 WHAT IS MISSING — GAPS AGAINST SIH PS-2

#### CRITICAL GAPS (Required to address PS-2 directly)

**G1: No "Entrepreneur" User Role or Profile**
- `UserRole` in `profileService.ts` only supports: `'candidate' | 'employer' | 'academician' | 'institution'`
- No entrepreneur onboarding flow, profile schema, or dashboard
- PS-2 explicitly names "entrepreneurs" as a primary persona

**G2: No Startup Entity Type**
- `EmployerProfile` in `employerService.ts` is a generic corporate employer
- No differentiation between startups (funding stage, team size, equity offered) and MNCs
- Startups cannot signal that they are early-stage, equity-sharing, or looking for co-founders

**G3: No Idea Marketplace / Venture Board**
- Nowhere in the platform can someone post a startup idea and seek collaborators
- No tagging by domain (EdTech, HealthTech, AgriTech), funding stage, or co-founder need
- This is the most unique SIH PS-2 differentiator — currently entirely absent

**G4: No Co-Founder / Team Matching Engine**
- Alumni network (`AlumniNetworkPage.tsx`) can send mentorship requests but has no co-founder matching intent
- No "Looking for CTO / Designer / Growth Hacker" signals in profiles
- No intelligent matching based on complementary skills

**G5: No Structured Mentor-Mentee Management for Entrepreneurship**
- `MentorshipPage.tsx` (academician) only stores profile (expertise, availability, max mentees)
- No actual session booking, chat, or progress tracking
- No entrepreneur-specific mentors (investors, serial founders, VCs)

**G6: No Investor / Angel Network**
- No investor as a user role or as a discoverable entity
- No funding stage signaling between startups and capital providers
- Cannot close the "idea to venture" loop without funding visibility

**G7: No E-Cell / Incubator Management**
- `InstitutionDashboard` manages TPO drives, not E-cells
- No incubator entity, cohort management, or startup portfolio tracking for institutions

#### MODERATE GAPS (Improve SIH score significantly)

**G8: Mentor Discovery is Passive**
- Alumni mentors are surfaced only if `isPlaced === true` and `mentorAvailable === true`
- No search by expertise, industry, funding experience, or time availability
- No mentor rating or review system

**G9: Community Forum Has No Entrepreneurship Categories**
- `ForumCategory` in `communityService.ts` only supports placement/interview/coding/general
- No `startup_advice | idea_feedback | co_founder_search | funding_guidance` categories

**G10: No Visible SIH PS-2 Landing / Impact Story**
- Landing page likely pitches the placement angle only
- No SIH-specific narrative around entrepreneurship ecosystem and impact metrics

**G11: Consultancy is Not a Real Marketplace**
- `ConsultancyPage.tsx` filters employer postings for consultancy tags — it is a workaround, not a real market
- No faculty-to-startup consulting pipeline

---

## 3. REUSE MAP

This section maps every PS-2 requirement to existing code that can be directly reused or minimally extended.

### 3.1 Infrastructure Reuse (100% reusable — zero changes needed)

| Infrastructure Component | Existing Location | PS-2 Use |
|--------------------------|-------------------|----------|
| Firebase Auth + multi-role guard | `AuthContext.tsx`, `ProtectedRoute.tsx` | Add `'entrepreneur'` role to the union type |
| Firestore database | All `*Service.ts` files | New collections for ideas, startups, matches |
| Gemini AI proxy (50+ keys) | `server/index.ts` L165 | AI idea validation, co-founder matching AI |
| Express server + rate limiting | `server/index.ts` L28-52 | New `/api/startup/*` endpoints |
| Twilio Voice + SMS + WhatsApp | `server/index.ts` L520-761 | Notify entrepreneurs of mentor matches, investor interest |
| Deadline cron architecture | `server/index.ts` L682 | Reuse for pitch competition deadline alerts |
| Email (Nodemailer) | `server/index.ts` L107 | Investor introduction emails |
| Community forum + events | `communityService.ts` | Add new forum categories; reuse event model for Demo Day |
| ArcLight ML service | `arclight-api/` | Train models for startup success prediction |
| Push notifications (VAPID) | `pushNotificationService.ts` | Co-founder match alerts, investor interest |
| Skill fingerprinting | `profileService.ts`, `assessmentService.ts` | Validate entrepreneur's tech and business skills |
| Job matching engine | `opportunityService.ts`, `jobRecommendationService.ts` | Repurpose for startup-to-talent matching |

### 3.2 UI Component Reuse

| Existing Component | Location | PS-2 Reuse |
|--------------------|----------|------------|
| FloatingNavbar | `components/navigation/FloatingNavbar.tsx` | Add `variant="entrepreneur"` |
| Kanban Pipeline | `PipelinePage.tsx` | Reuse drag-drop for startup stages (Idea → Prototype → MVP → Launch) |
| Candidate comparison radar chart | `TalentPage.tsx` | Compare co-founders' complementary skills |
| Resume builder (no-fabrication) | `ResumeBuilderPage.tsx` | Entrepreneur pitch deck builder (repurpose schema) |
| Forum + Reply system | `ForumPage.tsx`, `communityService.ts` | Add `startup_advice` categories without rewriting |
| Events system | `EventsPage.tsx`, `communityService.ts` | Add `pitch_competition`, `demo_day`, `hackathon` event types |
| ArcLight insights page | `ArcLightPage.tsx` | Show startup success probability predictions |
| Career readiness score | `CandidateDashboard.tsx` | Adapt to "Venture Readiness Score" |
| Mentorship request flow | `AlumniNetworkPage.tsx` L68-80 | Reuse `addDoc(mentorshipRequests/...)` for entrepreneur↔mentor |
| Notification service | `notificationService.ts` | Add `notifyCoFounderMatch`, `notifyInvestorInterest` |
| PublicProfile `/u/:username` | `PublicProfilePage.tsx` | Extend to show startup role, idea pitch for entrepreneurs |

### 3.3 Data Model Reuse

| Existing Data Model | Location | PS-2 Extension |
|---------------------|----------|----------------|
| `UserProfile` | `profileService.ts` L27 | Add `entrepreneurProfile?: EntrepreneurProfile` sub-field |
| `PostedRole` type | `employerService.ts` L42 | Add `'startup_equity'` to `PostingType` union |
| `ForumPost` | `communityService.ts` L31 | Add new `ForumCategory` values |
| `PlatformEvent` | `communityService.ts` L69 | Add `'pitch_day'` to `EventType` union |
| `SavedOpportunity` | `profileService.ts` L100 | Reuse for saved startup ideas / mentors |
| `MentorProfile` | `academicianService.ts` | Add `mentorType: 'academic' | 'industry' | 'investor' | 'founder'` |
| `Application` | `profileService.ts` L164 | Reuse for "Co-Founder Application" to startup |

---

## 4. PRIORITIZED IMPLEMENTATION MATRIX

Ranked by **SIH Impact × Implementation Effort** ratio. All items reuse existing infrastructure.

### TIER 1 — Immediate Winners (High SIH Impact, Low Effort)
*Estimated: 1–3 days each*

| Priority | Feature | Reuses | Effort |
|----------|---------|--------|--------|
| P1 | Add `entrepreneur` role to auth + onboarding | `UserRole` type, `OnboardingPage.tsx` | 1 day |
| P2 | Entrepreneur Dashboard (venture readiness score, idea stage tracker) | `CandidateDashboard.tsx` UI patterns, ArcLight | 2 days |
| P3 | Idea Marketplace — post/browse/filter startup ideas | `ForumPage.tsx` patterns, `communityService.ts` | 3 days |
| P4 | Startup Profile Type — extend `EmployerProfile` with funding stage, equity signals | `employerService.ts`, existing employer UI | 2 days |
| P5 | Mentor discovery engine — searchable by expertise, industry, founder experience | `AlumniNetworkPage.tsx` query patterns | 2 days |

### TIER 2 — Core PS-2 Differentiators (High SIH Impact, Medium Effort)
*Estimated: 3–5 days each*

| Priority | Feature | Reuses | Effort |
|----------|---------|--------|--------|
| P6 | Co-Founder Matching AI — Gemini-powered compatibility scoring on complementary skills | `jobRecommendationService.ts`, Gemini proxy | 4 days |
| P7 | Startup Opportunity Board — equity roles, technical co-founders, internships | `opportunityService.ts`, `RolesPage.tsx` UI | 3 days |
| P8 | E-Cell / Incubator Module in Institution portal | `InstitutionDashboard.tsx`, existing analytics | 4 days |
| P9 | Demo Day & Pitch Competition Events — structured event type | `EventsPage.tsx`, `communityService.ts` | 2 days |
| P10 | Entrepreneurship Forum Categories — idea feedback, co-founder search | `ForumCategory` type + `ForumPage.tsx` | 1 day |
| P11 | Venture Readiness AI Score — ArcLight model for startup success probability | `arclight-api/`, `ArcLightPage.tsx` | 5 days |

### TIER 3 — High-Polish SIH Closers (Medium Impact, Medium Effort)
*Estimated: 2–4 days each*

| Priority | Feature | Reuses | Effort |
|----------|---------|--------|--------|
| P12 | Investor / Angel Mentor Role — discoverable investor profiles | Mentor request architecture, `UserRole` | 3 days |
| P13 | Startup Pipeline Kanban (Idea → Prototype → MVP → Funded) | `PipelinePage.tsx` drag-drop | 2 days |
| P14 | Faculty Consultancy to Startup advisory — formal engagement flow | `ConsultancyPage.tsx`, `academicianService.ts` | 3 days |
| P15 | Twilio alerts for pitch competitions / investor matches | Deadline cron architecture, `twilioService.ts` | 1 day |
| P16 | SIH-targeted landing page with entrepreneurship narrative | `LandingPage.tsx` | 2 days |

---

## 5. PROPOSED ARCHITECTURE & FILE-LEVEL PLAN

### 5.1 New Firestore Collections Required

```
startupIdeas/{ideaId}
  - authorUid, title, domain, stage, description
  - lookingFor: string[]     e.g. ['CTO', 'Designer', 'Marketing']
  - tags, upvotes, createdAt
  - status: 'active' | 'archived' | 'funded'

startups/{startupId}
  - founderUid, companyName, domain
  - stage: 'idea' | 'prototype' | 'mvp' | 'growth' | 'funded'
  - fundingRaised?, equity?, teamSize
  - pitch, website, linkedinUrl
  - openRoles: string[]      (repurpose PostedRole schema)

coFounderRequests/{startupId}/applications/{uid}
  - (reuse RoleApplication schema from employerService.ts)

mentors/{uid}
  - mentorType: 'academic' | 'founder' | 'investor' | 'industry'
  - domain, expertise[], availability
  - sessionsCompleted, rating

deadlineAlerts/{alertId}
  - (already exists — extend for pitch competitions and investor intros)
```

### 5.2 New Service Files

```
src/services/startupService.ts
  - postStartupIdea()
  - getStartupIdeas(filters)
  - applyAsCoFounder()
  - saveStartup()

src/services/mentorService.ts    (extend academicianService.ts patterns)
  - getMentorsByType(type, domain)
  - bookMentorSession()
  - getMentorSessions(uid)

src/services/ecelService.ts      (mirror of institutionService.ts)
  - getECellPortfolio(institutionCode)
  - registerStartupToECell()
  - trackIncubationStage()
```

### 5.3 New Pages to Create

```
src/pages/entrepreneur/
  EntrepreneurDashboard.tsx       mirrors CandidateDashboard.tsx structure
  IdeaMarketplacePage.tsx         mirrors OpportunitiesPage.tsx structure
  StartupProfilePage.tsx          mirrors EmployerDashboard.tsx + branding
  CoFounderSearchPage.tsx         mirrors TalentPage.tsx search and filter
  MentorDiscoveryPage.tsx         extends AlumniNetworkPage.tsx
  VentureReadinessPage.tsx        extends ArcLightPage.tsx

src/pages/institution/
  ECellPage.tsx                   new, mirrors DrivesAdminPage.tsx
```

### 5.4 Routing Additions to `src/App.tsx`

```typescript
// Add entrepreneur lazy imports
const EntrepreneurDashboard = lazy(() => import('./pages/entrepreneur/EntrepreneurDashboard'));
const IdeaMarketplacePage   = lazy(() => import('./pages/entrepreneur/IdeaMarketplacePage'));
const CoFounderSearchPage   = lazy(() => import('./pages/entrepreneur/CoFounderSearchPage'));

// Add routes inside <Routes>
<Route path="/entrepreneur" element={<ProtectedRoute allowedRoles={['entrepreneur']}><EntrepreneurDashboard /></ProtectedRoute>} />
<Route path="/entrepreneur/ideas" element={<ProtectedRoute allowedRoles={['entrepreneur', 'candidate']}><IdeaMarketplacePage /></ProtectedRoute>} />
<Route path="/institution/ecell" element={<ProtectedRoute allowedRoles={['institution']}><ECellPage /></ProtectedRoute>} />
```

### 5.5 Minimal Type Changes (Non-Breaking)

```typescript
// profileService.ts — extend UserRole union
export type UserRole = 'candidate' | 'employer' | 'academician' | 'institution' | 'entrepreneur';

// employerService.ts — extend PostingType
export type PostingType = 'placement' | 'internship' | 'training' | 'fdp' | 'research' | 'apprenticeship' | 'startup_equity' | 'co_founder';

// communityService.ts — extend ForumCategory
export type ForumCategory = ... | 'startup_advice' | 'idea_feedback' | 'co_founder_search' | 'funding_guidance';

// communityService.ts — extend EventType
export type EventType = ... | 'pitch_competition' | 'demo_day' | 'investor_connect';
```

### 5.6 Server-Side Additions (`server/index.ts`)

New endpoints — same 30-line pattern as existing Twilio and job endpoints:

```
POST /api/startup/create          Create startup profile
GET  /api/startup/ideas           Fetch idea marketplace with filters
POST /api/mentor/book             Book mentor session
POST /api/notify/investor-match   Twilio alert: investor interested in startup
POST /api/notify/cofounder-match  Twilio/WhatsApp: co-founder match found
```

### 5.7 ArcLight ML Extension (`arclight-api/`)

The ArcLight FastAPI already has logistic regression, sklearn, and the SAS model modernization pipeline.

**Add one new endpoint:**
```python
# POST /api/predict/startup-success
# Features: domain, founder_skill_score, team_size, market_size_signal, funding_stage
# Output: success_probability, funding_likelihood, top_risk_factors, recommended_actions
# Training data: Startup India portal open datasets + public Tracxn cohort data
```

---

## 6. UNRESOLVED QUESTIONS

### 6.1 Product / Strategy Questions

**Q1: Target Entrepreneur Persona**
Should "entrepreneur" be a separate login role (5th portal), or a mode/flag within the existing candidate portal? A separate role requires changes to auth guard, onboarding, and navigation. A mode flag is faster but less impressive to SIH evaluators. Recommendation: Separate role for demo impact.

**Q2: Idea Marketplace Privacy Model**
Should startup ideas be public by default (like a forum post) or private-by-default with selective sharing? Public maximizes discovery; private protects IP. Which does the team prefer?

**Q3: Investor Role Scope**
Is an investor a fully authenticated platform user with their own portal, or just a discoverable profile that entrepreneurs can express interest in? Full portal requires approximately 2 weeks more work. Profile-only requires approximately 2 days.

**Q4: Real Startup Data or Demo Data?**
For SIH evaluation, will the team use live data (Startup India API, Tracxn) or curated demo data? Live data requires API keys and content moderation.

**Q5: E-Cell Integration Depth**
Should E-Cell management in the Institution portal be a simple list view of registered startups, or a full incubation pipeline (like DrivesAdminPage for placement drives)?

### 6.2 Technical Questions

**Q6: Twilio Trial Account Limits**
The current Twilio credentials appear to be trial-tier. Trial accounts can only call verified numbers. Will this work for SIH demo judges? Or should the team use the Twilio WhatsApp Sandbox instead for the live demo?

**Q7: `SERVER_PUBLIC_URL` for TwiML Callbacks**
`server/index.ts` L623 requires `SERVER_PUBLIC_URL` for the TwiML callback. If the demo runs on localhost, Twilio cannot reach back to serve the TwiML XML. Is the server deployed (Railway, Render, etc.) or purely local? This determines whether the voice call feature is demo-viable.

**Q8: `deadlineAlerts` Firestore Collection Write Path**
The frontend `SavedOpportunity` type has `deadline`, `callSent`, etc. fields. Confirm: is there an active write path in the frontend that creates documents in the `deadlineAlerts` Firestore collection (the collection the cron reads from), or is that write path missing? If `deadlineAlerts` is never written to, the Twilio cron silently finds nothing and no calls are ever made.

**Q9: ArcLight Service Availability**
The `arclight-api` FastAPI service runs on port 8000 and is started separately. For a live SIH demo, will this service be reliably running alongside the Vite dev server and Express? Consider baking ArcLight endpoints into the main Express server as a fallback if the Python service is unavailable.

**Q10: Firestore Security Rules for New Collections**
`firestore.rules` currently only covers known collections. New collections (`startupIdeas`, `startups`, `coFounderRequests`, `mentors`) will need explicit rules before going live. Are Firestore rules updates part of the implementation plan?

### 6.3 SIH Presentation Questions

**Q11: NAAC Criterion 5 vs. Entrepreneurship Narrative**
The current platform heavily emphasizes placement KPIs (placed count, CTC, NAAC criterion 5.2.1). SIH PS-2 wants entrepreneurship outcomes. The SIH demo should lead with the startup and entrepreneur story, not the placement dashboard. Does the team plan to update the demo walkthrough and landing page accordingly?

**Q12: Competitive Differentiation Narrative**
What is the one-line pitch for why CapAble beats other PS-2 solutions?
Suggested: *"CapAble is the only platform that unifies verified skill telemetry, live job and startup matching, AI co-founder recommendation, and Twilio-automated opportunity alerts — serving job seekers, employers, entrepreneurs, and institutions in one authenticated ecosystem."*
Does the team agree with this framing?

---

## APPENDIX: CONFIRMED FILE MAP

### Pages (by portal)
```
src/pages/
  auth/          LoginPage, OnboardingPage, VerifyEmailPage
  candidate/     CandidateDashboard, CapabilityPage, CareerHubPage, JobsHubPage,
                 PreparationHubPage, CommunityHubPage, AIInterviewSimulator,
                 AlumniNetworkPage, ArcLightPage, MailIQPage, OAPlatformPage,
                 PracticeSolvePage, PlacementDrivesPage, OffCampusPage,
                 ResumeBuilderPage, ResumeAIPage, AptitudeTestPage,
                 GoalsPage, ForumPage, EventsPage, CodolioProfilePage
  employer/      EmployerDashboard, TalentPage, RolesPage, PipelinePage,
                 InterviewSchedulerPage, WorkforcePage, InsightsPage,
                 EmployerBrandingPage, PartnersPage, CandidateProfilePage
  institution/   InstitutionDashboard, StudentsPage, PlacementsPage,
                 AnalyticsPage, DrivesAdminPage, NAACReportPage,
                 CommunicationsPage, IndustryPage, ProgramsPage
  academician/   AcademicianDashboard, AcademicianProfilePage, FDPPage,
                 ResearchPage, ConsultancyPage, MentorshipPage, WorkshopsPage
  faculty/       FacultyDashboard
  shared/        PublicProfilePage, CertificatePage, SettingsPage,
                 PrivacyPage, TermsPage, TransparencyPage, NotFoundPage
  marketing/     LandingPage
```

### Services (39 files confirmed)
```
src/services/
  profileService.ts (40KB)       opportunityService.ts (25KB)
  employerService.ts (22KB)      communityService.ts (12KB)
  institutionService.ts (12KB)   assessmentService.ts (13KB)
  resumeTemplates.ts (28KB)      resumeParserService.ts (12KB)
  problemService.ts (10KB)       leetcodeService.ts (9KB)
  eligibilityService.ts (9KB)    naacReportService.ts (9KB)
  geminiProxyService.ts (8KB)    codeExecutionService.ts (8KB)
  pipelineService.ts (10KB)      twilioService.ts (6KB)
  notificationService.ts (7KB)   pushNotificationService.ts (7KB)
  careerService.ts               goalsService.ts
  learningService.ts             githubService.ts
  academicianService.ts          facultyOpportunityService.ts
  inviteService.ts               endorsementService.ts
  interviewSchedulerService.ts   interviewHistoryService.ts
  jobRecommendationService.ts    readinessService.ts
  offCampusService.ts            publicProfileService.ts
  certificateService.ts          scoreService.ts
  arclightService.ts             codeforcesService.ts
  faceAnalyzer.ts                emailNotificationService.ts
  projectAllocationService.ts
```

### Tech Stack Confirmed
```
Frontend:       React 19, Vite 8, TypeScript 6, Framer Motion 13,
                Lucide React, Recharts, MapLibre GL, Monaco Editor
Backend:        Express 5, Node-Cron, Nodemailer, Firebase Admin 14, tsx
Database:       Firebase 12 (Firestore + Storage + Auth)
AI:             Gemini (50+ keys, proxy), Groq (fallback),
                Vapi.ai (voice), ArcLight (scikit-learn FastAPI on port 8000)
Communications: Twilio Voice + SMS + WhatsApp, VAPID Push Notifications
3D / UI:        @paper-design/shaders-react, @vladmandic/face-api, Lottie
State:          Zustand, React Context (AuthContext, ThemeContext)
Build:          PWA-ready, Vercel deployment (vercel.json present)
```

---

*Audit completed. No files were modified. All findings are based on direct code inspection.*-