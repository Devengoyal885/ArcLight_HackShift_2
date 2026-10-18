/**
 * ventureService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * CapAble Ventures & Entrepreneurship Service
 * Connects aspiring founders, co-founders, early-stage startup roles,
 * and institutional E-cell incubation programs.
 *
 * Firestore Collections:
 *   - ventures/{ventureId}
 *   - incubationPrograms/{programId}
 *   - collaborationRequests/{requestId}
 *   - incubationApplications/{appId}
 */

import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    addDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { OpportunityCard } from './opportunityService';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface StartupVenture {
    id: string;
    ownerUid: string;
    ownerName: string;
    ownerPhoto?: string;
    title: string;
    tagline: string;
    problem: string;
    solution: string;
    stage: 'Idea' | 'Prototype' | 'MVP' | 'Early Traction' | 'Growth';
    domain: string;
    skillsNeeded: string[];
    rolesNeeded: string[];
    equityOffer: string;
    stipendOffer: string;
    location: string;
    remote: boolean;
    visibility: 'public' | 'collaborators' | 'private';
    collaboratorUids?: string[];
    createdAt: string;
    updatedAt?: string;
}

export interface IncubationProgram {
    id: string;
    institutionCode: string;
    institutionName: string;
    title: string;
    organizer: string;
    cohort: string;
    description: string;
    grantAmount: string;
    perks: string[];
    eligibility: string;
    deadline: string;
    mode: 'Hybrid' | 'Online' | 'In-Person';
    status: 'Applications Open' | 'Reviewing' | 'Closed';
    link?: string;
    createdAt: string;
}

export interface CollaborationRequest {
    id: string;
    ventureId: string;
    ventureTitle: string;
    fromUid: string;
    fromName: string;
    fromEmail: string;
    fromHeadline: string;
    toUid: string;
    roleInterested: string;
    message: string;
    skills: string[];
    status: 'pending' | 'accepted' | 'declined' | 'withdrawn';
    createdAt: string;
}

export interface IncubationApplication {
    id: string;
    programId: string;
    programTitle: string;
    institutionCode: string;
    applicantUid: string;
    applicantName: string;
    applicantEmail: string;
    startupName: string;
    pitchSummary: string;
    deckUrl?: string;
    teamSize: number;
    status: 'submitted' | 'under_review' | 'shortlisted' | 'selected' | 'rejected';
    submittedAt: string;
}

import { notifyCofounderMatchWhatsApp, notifyIncubationStatusWhatsApp } from './twilioService';

export interface VentureMilestone {
    id: string;
    title: string;
    description: string;
    status: 'completed' | 'in_progress' | 'pending';
    dueDate?: string;
}

export interface VentureTask {
    id: string;
    title: string;
    assignee: string;
    status: 'todo' | 'in_progress' | 'done';
    priority: 'high' | 'medium' | 'low';
}

export interface VentureTeamMember {
    id: string;
    name: string;
    role: string;
    equityShare: string;
    joinedAt: string;
    photoURL?: string;
}

export interface SystemArchitectureNode {
    id: string;
    label: string;
    category: 'client' | 'gateway' | 'service' | 'event' | 'database' | 'infra';
    technology: string;
    protocol?: string;
    description: string;
    scalingPolicy?: string;
    sla?: string;
    status: 'planned' | 'in_development' | 'production';
}

export interface EquityAllocations {
    founders: number;
    coFounders: number;
    esopPool: number;
    advisors: number;
    investors: number;
}

export interface VentureWorkspace {
    ventureId: string;
    title: string;
    milestones: VentureMilestone[];
    tasks: VentureTask[];
    team: VentureTeamMember[];
    pitchDeckUrl?: string;
    demoUrl?: string;
    repoUrl?: string;
    notes?: string;
    updatedAt: string;
    // Section 8.3 & Architecture & Co-Design extensions
    architectureNodes?: SystemArchitectureNode[];
    designNotes?: string;
    equityAllocations?: EquityAllocations;
    whiteboardNotes?: string;
}

export interface VentureReport {
    id?: string;
    ventureId: string;
    ventureTitle: string;
    reporterUid?: string;
    reason: 'ip_infringement' | 'plagiarism' | 'inappropriate' | 'spam' | 'other';
    details: string;
    createdAt: string;
}

export const SEED_VENTURES: StartupVenture[] = [
    {
        id: 'venture-1',
        ownerUid: 'founder-01',
        ownerName: 'Aarav Sharma',
        title: 'KavachAI',
        tagline: 'Autonomous cyber defense for rural cooperative banks and MSMEs',
        problem: 'Over 85% of tier-2 cooperative financial institutions face high-frequency ransomware attacks with zero specialized in-house SOC teams.',
        solution: 'Lightweight eBPF-based kernel telemetry agent paired with real-time LLM threat mitigation playbooks.',
        stage: 'MVP',
        domain: 'Cybersecurity / FinTech',
        skillsNeeded: ['Go', 'eBPF', 'Rust', 'Linux Internals', 'Next.js'],
        rolesNeeded: ['Technical Co-Founder (Systems/Rust)', 'Security Research Lead'],
        equityOffer: '12% – 18%',
        stipendOffer: '₹25,000 / mo after seed grant',
        location: 'Bengaluru, India',
        remote: true,
        visibility: 'public',
        createdAt: new Date().toISOString(),
    },
    {
        id: 'venture-2',
        ownerUid: 'founder-02',
        ownerName: 'Priya Narang',
        title: 'KrishiDrishti',
        tagline: 'Edge-AI multispectral drone analytics for precision horticulture',
        problem: 'Fruit and spice farmers lose 28% of harvest yield annually to undetected localized fungal blight.',
        solution: 'Affordable on-drone YOLOv11 edge computer generating automated micro-spray coordinates for farm rovers.',
        stage: 'Prototype',
        domain: 'AgriTech / Edge AI',
        skillsNeeded: ['Computer Vision', 'PyTorch', 'Embedded C++', 'React Native'],
        rolesNeeded: ['Embedded Computer Vision Lead', 'Product & Field Deployment Partner'],
        equityOffer: '10% – 15%',
        stipendOffer: 'Co-Founder Equity + Incubator Stipend',
        location: 'Pune / Hyderabad',
        remote: true,
        visibility: 'public',
        createdAt: new Date().toISOString(),
    },
    {
        id: 'venture-3',
        ownerUid: 'founder-03',
        ownerName: 'Devansh Singhania',
        title: 'NeuroLearn OS',
        tagline: 'Gamified cognitive therapy for neurodivergent K-12 students',
        problem: 'Special educators are overwhelmed with 1:40 student ratios, leaving ADHD and dyslexic children behind standard curricula.',
        solution: 'Adaptive spatial learning platform that translates textbook concepts into multisensory micro-challenges.',
        stage: 'Early Traction',
        domain: 'EdTech / HealthTech',
        skillsNeeded: ['Three.js', 'React', 'FastAPI', 'Child Psychology', 'Game Design'],
        rolesNeeded: ['Lead Frontend / 3D Engineer', 'Founding Growth Strategist'],
        equityOffer: '8% – 14%',
        stipendOffer: '₹20,000 / mo',
        location: 'Delhi NCR',
        remote: true,
        visibility: 'public',
        createdAt: new Date().toISOString(),
    },
    {
        id: 'venture-4',
        ownerUid: 'founder-04',
        ownerName: 'Meera Iyer',
        title: 'VoltGrid Energy',
        tagline: 'Decentralized peer-to-peer solar micro-grid settlement network',
        problem: 'Rooftop solar producers sell power back to utilities at asymmetric tariffs with delayed billing reconciliation.',
        solution: 'Sub-second smart contract settlement protocol built for residential battery storage clusters.',
        stage: 'Idea',
        domain: 'CleanTech / Web3',
        skillsNeeded: ['Solidity', 'IoT', 'Python', 'Energy Systems'],
        rolesNeeded: ['IoT Hardware Engineer', 'Full-Stack Web3 Developer'],
        equityOffer: '15% – 20%',
        stipendOffer: 'Equity-first until institutional grant',
        location: 'Chennai',
        remote: true,
        visibility: 'public',
        createdAt: new Date().toISOString(),
    }
];

export const SEED_PROGRAMS: IncubationProgram[] = [
    {
        id: 'prog-1',
        institutionCode: 'IIT-DELHI',
        institutionName: 'IIT Delhi FITT & E-Cell',
        title: 'UDAAN Venture Acceleration Cohort 2026',
        organizer: 'Foundation for Innovation and Technology Transfer (FITT)',
        cohort: 'Batch 6 (Summer 2026)',
        description: 'Comprehensive 16-week pre-seed incubator offering institutional lab access, deep-tech IP guidance, and direct Demo Day presentation to top Indian venture syndicates.',
        grantAmount: 'Up to ₹25,00,000 Seed Grant (NIDHI-PRAYAS supported)',
        perks: [
            'Prototyping FabLab & Supercomputing access',
            'Full legal, IPR & patent filing expense reimbursement',
            'AWS & Google Cloud $100K credit package',
            '1-on-1 mentorship from exited unicorn founders'
        ],
        eligibility: 'Student or early-alumni founded deep-tech, AI, climate or hardware ventures with at least an architectural MVP.',
        deadline: new Date(Date.now() + 86400000 * 21).toISOString(),
        mode: 'Hybrid',
        status: 'Applications Open',
        createdAt: new Date().toISOString(),
    },
    {
        id: 'prog-2',
        institutionCode: 'BITS-PILANI',
        institutionName: 'BITS Pilani Technology Business Incubator',
        title: 'Conquest Global Startup Challenge & Incubation',
        organizer: 'Centre for Entrepreneurial Leadership (CEL)',
        cohort: 'Cohort 2026',
        description: 'India’s premier student-run startup accelerator providing a 7-week structured mentorship sprint, fundraising bootcamps, and a grand finale in Bengaluru.',
        grantAmount: '₹15,00,000 Equity-Free Seed Pool + Investor Syndicate',
        perks: [
            'Direct access to Blume Ventures & Matrix Partners partners',
            'Free co-working space in Bengaluru & Hyderabad',
            'Cloud & enterprise SaaS tool perks exceeding ₹50 Lakhs'
        ],
        eligibility: 'Open to all college students & recent graduates across India. Idea, MVP or early revenue stages.',
        deadline: new Date(Date.now() + 86400000 * 35).toISOString(),
        mode: 'Hybrid',
        status: 'Applications Open',
        createdAt: new Date().toISOString(),
    },
    {
        id: 'prog-3',
        institutionCode: 'TIH-AICTE',
        institutionName: 'AICTE Innovation Cell & Startup India',
        title: 'National Student Innovation Challenge (Yukti 2.0)',
        organizer: 'Ministry of Education Innovation Cell (MIC)',
        cohort: 'National Edition 2026',
        description: 'National program dedicated to transforming student academic prototypes and hackathon winners into sustainable commercial enterprises.',
        grantAmount: '₹10,00,000 Technology Transfer & Prototype Commercialization Grant',
        perks: [
            'Government of India Startup India fast-track DPIIT recognition',
            'Mentorship from CSIR and DRDO senior scientists',
            'Exemption from standard corporate public procurement tender conditions'
        ],
        eligibility: 'Enrolled undergraduate or postgraduate engineering & management students with verified working prototypes.',
        deadline: new Date(Date.now() + 86400000 * 14).toISOString(),
        mode: 'Online',
        status: 'Applications Open',
        createdAt: new Date().toISOString(),
    }
];

// ─── Service Methods ──────────────────────────────────────────────────────────

/**
 * Fetch all available startup ventures & co-founder listings
 */
export async function getStartupVentures(): Promise<StartupVenture[]> {
    try {
        let res = await fetch('/api/ventures').catch(() => null);
        if (!res || !res.ok) {
            res = await fetch(`${SERVER_URL}/api/ventures`).catch(() => null);
        }
        if (res && res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) return data;
        }

        const q = query(
            collection(db, 'ventures'),
            where('visibility', 'in', ['public', 'collaborators']),
            limit(30)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
            const list: StartupVenture[] = [];
            snap.forEach(d => list.push({ id: d.id, ...(d.data() as any) }));
            return list;
        }
    } catch (e) {
        console.warn('[VentureService] Firestore ventures query unavailable:', e);
    }
    return SEED_VENTURES;
}

/**
 * Fetch all available incubation and accelerator programs
 */
export async function getIncubationPrograms(): Promise<IncubationProgram[]> {
    try {
        let res = await fetch('/api/incubation/programs').catch(() => null);
        if (!res || !res.ok) {
            res = await fetch(`${SERVER_URL}/api/incubation/programs`).catch(() => null);
        }
        if (res && res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) return data;
        }

        const q = query(
            collection(db, 'incubationPrograms'),
            where('status', '==', 'Applications Open'),
            limit(30)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
            const list: IncubationProgram[] = [];
            snap.forEach(d => list.push({ id: d.id, ...(d.data() as any) }));
            return list;
        }
    } catch (e) {
        console.warn('[VentureService] Firestore incubation query unavailable:', e);
    }
    return SEED_PROGRAMS;
}

/**
 * Normalize startup venture opportunities into standard OpportunityCards
 * so they can be discovered seamlessly alongside conventional jobs.
 */
export function convertVenturesToOpportunityCards(ventures: StartupVenture[]): OpportunityCard[] {
    return ventures.map(v => ({
        id: `venture_${v.id}`,
        source: 'CapAble Ventures',
        title: `${v.rolesNeeded[0] || 'Founding Team Member'} — ${v.title}`,
        company: `${v.title} (${v.stage} Stage)`,
        location: v.location,
        remote: v.remote,
        type: 'contract',
        url: `#venture-${v.id}`,
        description: `${v.tagline}. Problem: ${v.problem}. Solution: ${v.solution}`,
        tags: [v.domain, v.stage, `Equity: ${v.equityOffer}`, ...v.skillsNeeded.slice(0, 3)],
        salary: v.stipendOffer || `Equity: ${v.equityOffer}`,
        postedAt: v.createdAt,
        isInternalPosting: true,
        internalRoleId: v.id,
    }));
}

/**
 * Normalize incubation programs into OpportunityCards
 */
export function convertProgramsToOpportunityCards(programs: IncubationProgram[]): OpportunityCard[] {
    return programs.map(p => ({
        id: `program_${p.id}`,
        source: p.institutionName,
        title: p.title,
        company: p.organizer,
        location: p.institutionName,
        remote: p.mode !== 'In-Person',
        type: 'freelance',
        url: p.link || `#program-${p.id}`,
        description: `${p.description}. Grant: ${p.grantAmount}. Eligibility: ${p.eligibility}`,
        tags: ['Incubation', p.cohort, p.grantAmount, p.mode],
        salary: p.grantAmount,
        deadline: p.deadline,
        postedAt: p.createdAt,
        isInternalPosting: true,
    }));
}

/**
 * Post a new startup venture or co-founder search
 */
export async function createStartupVenture(venture: Omit<StartupVenture, 'id' | 'createdAt'>): Promise<string> {
    const payload = {
        ...venture,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        serverTimestamp: serverTimestamp(),
    };

    try {
        const ref = await addDoc(collection(db, 'ventures'), payload);
        return ref.id;
    } catch (e) {
        console.error('[VentureService] Failed to create venture in Firestore, falling back to local memory:', e);
        const mockId = `venture_${Date.now()}`;
        SEED_VENTURES.unshift({ id: mockId, ...payload } as StartupVenture);
        return mockId;
    }
}

/**
 * Send a collaboration or co-founder interest request
 */
export async function sendCollaborationRequest(
    req: Omit<CollaborationRequest, 'id' | 'status' | 'createdAt'>
): Promise<string> {
    const payload = {
        ...req,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        serverTimestamp: serverTimestamp(),
    };

    try {
        const ref = await addDoc(collection(db, 'collaborationRequests'), payload);
        return ref.id;
    } catch (e) {
        console.warn('[VentureService] Falling back to local storage for collaboration request:', e);
        const existing = JSON.parse(localStorage.getItem('capable_collab_requests') || '[]');
        const mockId = `collab_${Date.now()}`;
        existing.push({ id: mockId, ...payload });
        localStorage.setItem('capable_collab_requests', JSON.stringify(existing));
        return mockId;
    }
}

/**
 * Apply to an incubation or accelerator program
 */
export async function applyToIncubationProgram(
    app: Omit<IncubationApplication, 'id' | 'status' | 'submittedAt'>
): Promise<string> {
    const payload = {
        ...app,
        status: 'submitted' as const,
        submittedAt: new Date().toISOString(),
        serverTimestamp: serverTimestamp(),
    };

    try {
        const ref = await addDoc(collection(db, 'incubationApplications'), payload);
        return ref.id;
    } catch (e) {
        console.warn('[VentureService] Falling back to local storage for incubation application:', e);
        const existing = JSON.parse(localStorage.getItem('capable_incubation_apps') || '[]');
        const mockId = `inc_app_${Date.now()}`;
        existing.push({ id: mockId, ...payload });
        localStorage.setItem('capable_incubation_apps', JSON.stringify(existing));
        return mockId;
    }
}

/**
 * Get candidate's submitted collaboration requests
 */
export async function getCandidateCollaborationRequests(uid: string): Promise<CollaborationRequest[]> {
    try {
        const q = query(
            collection(db, 'collaborationRequests'),
            where('fromUid', '==', uid),
            limit(50)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
            const list: CollaborationRequest[] = [];
            snap.forEach(d => list.push({ id: d.id, ...(d.data() as any) }));
            return list;
        }
    } catch (e) {
        // Local storage fallback
    }
    const local = JSON.parse(localStorage.getItem('capable_collab_requests') || '[]');
    return local.filter((r: CollaborationRequest) => r.fromUid === uid);
}

/**
 * Get candidate's submitted incubation applications
 */
export async function getCandidateIncubationApplications(uid: string): Promise<IncubationApplication[]> {
    try {
        const q = query(
            collection(db, 'incubationApplications'),
            where('applicantUid', '==', uid),
            limit(50)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
            const list: IncubationApplication[] = [];
            snap.forEach(d => list.push({ id: d.id, ...(d.data() as any) }));
            return list;
        }
    } catch (e) {
        // Local storage fallback
    }
    const local = JSON.parse(localStorage.getItem('capable_incubation_apps') || '[]');
    return local.filter((r: IncubationApplication) => r.applicantUid === uid);
}

/**
 * Get all incubation applications for an institution E-Cell
 */
export async function getInstitutionIncubationApplications(instCode?: string): Promise<IncubationApplication[]> {
    try {
        const path = instCode ? `/api/incubation/applications?instCode=${encodeURIComponent(instCode)}` : '/api/incubation/applications';
        let res = await fetch(path).catch(() => null);
        if (!res || !res.ok) {
            res = await fetch(`${SERVER_URL}${path}`).catch(() => null);
        }
        if (res && res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) return data;
        }

        let q = query(collection(db, 'incubationApplications'), limit(50));
        if (instCode) {
            q = query(
                collection(db, 'incubationApplications'),
                where('institutionCode', '==', instCode),
                limit(50)
            );
        }
        const snap = await getDocs(q);
        if (!snap.empty) {
            const list: IncubationApplication[] = [];
            snap.forEach(d => list.push({ id: d.id, ...(d.data() as any) }));
            return list;
        }
    } catch (e) {
        console.warn('[VentureService] Falling back to local storage for institution incubation applications:', e);
    }
    const local = JSON.parse(localStorage.getItem('capable_incubation_apps') || '[]');
    if (instCode) {
        return local.filter((r: IncubationApplication) => r.institutionCode === instCode);
    }
    return local;
}

/**
 * Update the evaluation status of a student incubation application
 */
export async function updateIncubationApplicationStatus(
    appId: string,
    status: IncubationApplication['status'],
    feedback?: string,
    opts?: { applicantPhone?: string; applicantName?: string; ventureTitle?: string; institutionName?: string }
): Promise<void> {
    try {
        await setDoc(doc(db, 'incubationApplications', appId), { status, feedback, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
        const local = JSON.parse(localStorage.getItem('capable_incubation_apps') || '[]');
        const updated = local.map((a: IncubationApplication) => a.id === appId ? { ...a, status, feedback } : a);
        localStorage.setItem('capable_incubation_apps', JSON.stringify(updated));
    }

    // Trigger WhatsApp notification via Twilio service only when real recipient phone is provided
    if (opts?.applicantPhone) {
        notifyIncubationStatusWhatsApp({
            phone: opts.applicantPhone,
            status,
            feedback,
            ventureTitle: opts.ventureTitle || 'Your Incubation Pitch',
            institutionName: opts.institutionName || 'CapAble E-Cell Incubation',
            applicantName: opts.applicantName,
        }).catch(err => console.warn('[VentureService] WA alert failed:', err));
    }
}

/**
 * Update collaboration request status (accept, decline, withdraw)
 */
export async function updateCollaborationRequestStatus(
    requestId: string,
    status: CollaborationRequest['status'],
    opts?: { founderName?: string; applicantPhone?: string; ventureTitle?: string }
): Promise<void> {
    try {
        await setDoc(doc(db, 'collaborationRequests', requestId), { status, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
        const local = JSON.parse(localStorage.getItem('capable_collab_requests') || '[]');
        const updated = local.map((r: CollaborationRequest) => r.id === requestId ? { ...r, status } : r);
        localStorage.setItem('capable_collab_requests', JSON.stringify(updated));
    }

    if (status === 'accepted' && opts?.ventureTitle && opts?.applicantPhone) {
        notifyCofounderMatchWhatsApp({
            phone: opts.applicantPhone,
            founderName: opts.founderName || 'Founder',
            ventureTitle: opts.ventureTitle,
            action: 'accepted',
        }).catch(err => console.warn('[VentureService] Match notification failed:', err));
    }
}

/**
 * Create a new incubation program / grant challenge
 */
export async function createIncubationProgram(
    prog: Omit<IncubationProgram, 'id' | 'createdAt'>
): Promise<string> {
    const payload = {
        ...prog,
        createdAt: new Date().toISOString(),
        serverTimestamp: serverTimestamp(),
    };
    try {
        const ref = await addDoc(collection(db, 'incubationPrograms'), payload);
        return ref.id;
    } catch (e) {
        const mockId = `prog_${Date.now()}`;
        SEED_PROGRAMS.unshift({ id: mockId, ...payload } as IncubationProgram);
        return mockId;
    }
}

// ─── Venture Workspace Management (Section 8.3) ───────────────────────────────

const DEFAULT_WORKSPACE: VentureWorkspace = {
    ventureId: 'venture-1',
    title: 'KavachAI Workspace',
    milestones: [
        { id: 'm1', title: 'Problem Discovery & MSME Interviews', description: 'Interview 20 cooperative bank IT officers in tier-2 districts.', status: 'completed', dueDate: '2026-09-15' },
        { id: 'm2', title: 'Telemetry Agent Alpha Prototype', description: 'Build lightweight eBPF kernel event logger streaming to Kafka.', status: 'in_progress', dueDate: '2026-11-01' },
        { id: 'm3', title: 'Seed Grant & E-Cell Pitch Deck', description: 'Complete 10-slide pitch deck + financial model for campus incubator.', status: 'pending', dueDate: '2026-11-20' },
        { id: 'm4', title: 'Pilot Deployment with 2 Cooperative Banks', description: 'Live threat detection sandbox trial.', status: 'pending', dueDate: '2026-12-15' },
    ],
    tasks: [
        { id: 't1', title: 'Finish eBPF network probe in C', assignee: 'Aarav Sharma', status: 'in_progress', priority: 'high' },
        { id: 't2', title: 'Design dark-mode security telemetry dashboard in React', assignee: 'Technical Co-Founder', status: 'todo', priority: 'high' },
        { id: 't3', title: 'Draft NDA and founder IP assignment agreement', assignee: 'Legal Advisor', status: 'done', priority: 'medium' },
        { id: 't4', title: 'Apply to NIDHI-EIR Incubation Fellowship', assignee: 'Aarav Sharma', status: 'todo', priority: 'medium' },
    ],
    team: [
        { id: 'tm1', name: 'Aarav Sharma', role: 'Founder & Systems Architect', equityShare: '65%', joinedAt: '2026-08-01' },
        { id: 'tm2', name: 'Open Role', role: 'Technical Co-Founder (Systems/Rust)', equityShare: '15%', joinedAt: 'Recruiting' },
        { id: 'tm3', name: 'Dr. S. K. Mukherjee', role: 'Faculty Advisor & Mentor', equityShare: '2%', joinedAt: '2026-09-01' },
    ],
    pitchDeckUrl: 'https://capable.app/docs/sample_pitch_deck.pdf',
    repoUrl: 'https://github.com/capable-ventures/kavach-ai-core',
    notes: 'Primary focus this month: finalize core agent and secure E-Cell prototype grant.',
    updatedAt: new Date().toISOString(),
    equityAllocations: {
        founders: 55,
        coFounders: 20,
        esopPool: 15,
        advisors: 2,
        investors: 8,
    },
    designNotes: `# KavachAI System Architecture RFC (Rev 1.4)
## 1. Executive Summary
High-throughput kernel telemetry pipeline ingesting 150,000+ system calls/sec per node with sub-5ms anomaly classification.

## 2. Ingestion & Protocol
- **Telemetry Agent**: eBPF bytecode compiled via clang/LLVM in C.
- **Transport**: Encrypted mutual-TLS (mTLS) over QUIC/HTTP3 to regional Envoy Ingress Gateway.
- **Message Broker**: Partitioned Kafka topics keyed by Organization UUID.

## 3. Storage Strategy
- **Hot Tier**: Redis Cluster for dynamic IP blocklists and sliding window token buckets.
- **Analytical Tier**: TimescaleDB / ClickHouse for immutable forensic audit logs.
- **Vector Embeddings**: pgvector storing security playbook embeddings for automated mitigation.`,
    whiteboardNotes: `TODO Architecture Checklist:
- [x] eBPF socket filter verification on Linux 6.x kernels
- [x] Envoy rate-limiter circuit breaker configuration
- [ ] Multi-region Redis replica failover test
- [ ] End-to-end telemetry encryption benchmark`,
    architectureNodes: [
        {
            id: 'node-client-web',
            label: 'Web Security Console',
            category: 'client',
            technology: 'React 19 / Vite / Tailwind',
            protocol: 'HTTPS / WSS',
            description: 'Real-time telemetry dashboard for bank CISO & SOC responders.',
            scalingPolicy: 'Global CDN edge distribution via Cloudflare Pages',
            sla: '99.95% Availability',
            status: 'production'
        },
        {
            id: 'node-client-agent',
            label: 'Host eBPF Probe',
            category: 'client',
            technology: 'C / Rust / eBPF Kernel Bytecode',
            protocol: 'mTLS QUIC/gRPC',
            description: 'Zero-overhead kernel probe monitoring execve, connect, and bpf syscalls.',
            scalingPolicy: 'DaemonSet per Linux server / container host',
            sla: '< 1.5% CPU overhead',
            status: 'in_development'
        },
        {
            id: 'node-gateway',
            label: 'Envoy Ingress & WAF',
            category: 'gateway',
            technology: 'Envoy Proxy / Cloudflare WAF',
            protocol: 'HTTP/3 / gRPC',
            description: 'Terminates TLS, performs JWT & API key verification, enforces token bucket rate-limits.',
            scalingPolicy: 'Autoscale 3 to 12 replicas on CPU > 75%',
            sla: '< 8ms p99 latency',
            status: 'production'
        },
        {
            id: 'node-core-api',
            label: 'Telemetry Aggregation Service',
            category: 'service',
            technology: 'Go (Golang 1.23)',
            protocol: 'gRPC internal',
            description: 'Decompresses eBPF telemetry batches, sanitizes payload, pushes to Kafka.',
            scalingPolicy: 'HPA 4 to 20 pods',
            sla: '< 15ms response time',
            status: 'production'
        },
        {
            id: 'node-ai-engine',
            label: 'AI Threat Analyzer (LLM)',
            category: 'service',
            technology: 'Python / FastAPI / PyTorch / ONNX',
            protocol: 'REST / async worker',
            description: 'Runs lightweight anomaly classifier & synthesizes remediation playbooks.',
            scalingPolicy: 'GPU-backed nodes scaling on queue length > 500',
            sla: '< 450ms inference time',
            status: 'in_development'
        },
        {
            id: 'node-kafka',
            label: 'Event Streaming Broker',
            category: 'event',
            technology: 'Apache Kafka / Strimzi',
            protocol: 'TCP / Kafka Protocol',
            description: 'Distributed pub/sub log for audit events, alerts, and live agent configurations.',
            scalingPolicy: '3-broker high-availability cluster with RF=3',
            sla: 'Zero message loss guarantee',
            status: 'production'
        },
        {
            id: 'node-timescale',
            label: 'Primary Audit Datastore',
            category: 'database',
            technology: 'PostgreSQL + TimescaleDB',
            protocol: 'Postgres Wire Protocol',
            description: 'Stores user accounts, tenant policies, historical forensic telemetry partitions.',
            scalingPolicy: 'Primary instance + 2 read-replicas with pgBouncer pool',
            sla: '99.99% Durability',
            status: 'production'
        },
        {
            id: 'node-redis',
            label: 'Distributed Session & Cache',
            category: 'database',
            technology: 'Redis Cluster (Memory-Optimized)',
            protocol: 'RESP3',
            description: 'Fast IP blocklist cache, active WebSocket connection registry, and token buckets.',
            scalingPolicy: '3-shard master-replica cluster',
            sla: '< 2ms sub-millisecond latency',
            status: 'production'
        },
        {
            id: 'node-k8s',
            label: 'Cloud Infrastructure & K8s',
            category: 'infra',
            technology: 'Kubernetes (AWS EKS / DigitalOcean)',
            protocol: 'WireGuard / VPC Mesh',
            description: 'Container orchestration, secret management, Prometheus & Grafana alerting.',
            scalingPolicy: 'Cluster Autoscaler across multiple availability zones',
            sla: '99.95% Infrastructure SLA',
            status: 'production'
        }
    ]
};

/**
 * Get venture workspace data
 */
export async function getVentureWorkspace(ventureId: string): Promise<VentureWorkspace> {
    try {
        const snap = await getDoc(doc(db, 'ventureWorkspaces', ventureId));
        if (snap.exists()) {
            return snap.data() as VentureWorkspace;
        }
    } catch (e) {
        // Fallback to local storage
    }
    const local = localStorage.getItem(`venture_workspace_${ventureId}`);
    if (local) {
        try { return JSON.parse(local); } catch { /* ignore */ }
    }
    return { ...DEFAULT_WORKSPACE, ventureId };
}

/**
 * Save venture workspace updates
 */
export async function saveVentureWorkspace(workspace: VentureWorkspace): Promise<void> {
    const payload = {
        ...workspace,
        updatedAt: new Date().toISOString(),
    };
    try {
        await setDoc(doc(db, 'ventureWorkspaces', workspace.ventureId), payload, { merge: true });
    } catch (e) {
        // Local storage fallback
    }
    localStorage.setItem(`venture_workspace_${workspace.ventureId}`, JSON.stringify(payload));
}

// ─── Moderation & Reporting (Section 17) ──────────────────────────────────────

/**
 * Report a venture idea or posting for IP infringement, plagiarism, or spam
 */
export async function reportVentureIdea(report: Omit<VentureReport, 'id' | 'createdAt'>): Promise<string> {
    const payload = {
        ...report,
        createdAt: new Date().toISOString(),
        serverTimestamp: serverTimestamp(),
    };
    try {
        const ref = await addDoc(collection(db, 'moderationReports'), payload);
        return ref.id;
    } catch (e) {
        console.warn('[VentureService] Moderation report local fallback:', e);
        const existing = JSON.parse(localStorage.getItem('capable_moderation_reports') || '[]');
        const mockId = `report_${Date.now()}`;
        existing.push({ id: mockId, ...payload });
        localStorage.setItem('capable_moderation_reports', JSON.stringify(existing));
        return mockId;
    }
}
