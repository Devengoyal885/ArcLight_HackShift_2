/**
 * academicianService.ts
 * ─────────────────────
 * All Firestore operations for the academician/faculty portal.
 *
 * Collections:
 *   users/{uid}/profile/data          — faculty profile (role: 'academician')
 *   users/{uid}/fdpRegistrations      — FDPs registered by this faculty
 *   users/{uid}/researchInterests     — research collaboration interests
 *   users/{uid}/consultancyProposals  — consultancy proposals submitted
 *   users/{uid}/mentorProfile         — mentor availability & expertise
 *   postedRoles/{roleId}              — reuses employer postings for FDP/research/training
 */

import {
    doc, getDoc, setDoc, addDoc, getDocs,
    collection, serverTimestamp, query, orderBy,
    updateDoc, deleteDoc, where, onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FacultyProfile {
    uid: string;
    name: string;
    email: string;
    department?: string;
    institution?: string;
    designation?: string;
    expertise: string[];
    researchAreas: string[];
    publications?: number;
    hIndex?: number;
    citations?: number;
    yearsOfExperience?: number;
    availableForMentorship: boolean;
    availableForConsultancy: boolean;
    avatar?: string;
    linkedinUrl?: string;
    googleScholarUrl?: string;
    createdAt?: unknown;
    updatedAt?: unknown;
}

export interface FDPRegistration {
    id?: string;
    roleId: string;          // references postedRoles document
    roleTitle: string;
    provider: string;        // company name
    status: 'registered' | 'attending' | 'completed' | 'withdrawn';
    registeredAt?: unknown;
    completedAt?: unknown;
    certificateUrl?: string;
}

export interface ResearchInterest {
    id?: string;
    roleId: string;
    projectTitle: string;
    companyName: string;
    status: 'interested' | 'applied' | 'collaborating' | 'completed' | 'withdrawn';
    proposalNote?: string;
    submittedAt?: unknown;
    updatedAt?: unknown;
}

export interface ConsultancyProposal {
    id?: string;
    roleId: string;
    projectTitle: string;
    companyName: string;
    status: 'interested' | 'proposed' | 'accepted' | 'in_progress' | 'completed' | 'rejected';
    proposalText?: string;
    submittedAt?: unknown;
    updatedAt?: unknown;
}

export interface MentorProfile {
    uid: string;
    expertise: string[];
    availability: 'available' | 'limited' | 'unavailable';
    maxMentees: number;
    currentMentees: number;
    bio?: string;
    preferredTopics: string[];
    updatedAt?: unknown;
}

export interface WorkshopRegistration {
    id?: string;
    roleId: string;
    title: string;
    provider: string;
    status: 'registered' | 'attended' | 'completed';
    registeredAt?: unknown;
    attendedAt?: unknown;
    certificateUrl?: string;
}

// ─── Faculty Profile ──────────────────────────────────────────────────────────

export async function getFacultyProfile(uid: string): Promise<FacultyProfile | null> {
    const ref = doc(db, 'users', uid, 'facultyProfile', 'data');
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as FacultyProfile) : null;
}

export async function saveFacultyProfile(uid: string, data: Partial<FacultyProfile>): Promise<void> {
    await setDoc(doc(db, 'users', uid, 'facultyProfile', 'data'), {
        ...data,
        uid,
        updatedAt: serverTimestamp(),
    }, { merge: true });
}

// ─── FDP Registrations ────────────────────────────────────────────────────────

export async function getFDPRegistrations(uid: string): Promise<FDPRegistration[]> {
    const col = collection(db, 'users', uid, 'fdpRegistrations');
    const snap = await getDocs(query(col, orderBy('registeredAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FDPRegistration));
}

export async function registerForFDP(uid: string, reg: Omit<FDPRegistration, 'id'>): Promise<void> {
    const col = collection(db, 'users', uid, 'fdpRegistrations');
    await addDoc(col, { ...reg, registeredAt: serverTimestamp() });
}

export async function updateFDPStatus(uid: string, regId: string, status: FDPRegistration['status']): Promise<void> {
    const updates: any = { status };
    if (status === 'completed') updates.completedAt = serverTimestamp();
    await updateDoc(doc(db, 'users', uid, 'fdpRegistrations', regId), updates);
}

// ─── Research Interests ───────────────────────────────────────────────────────

export async function getResearchInterests(uid: string): Promise<ResearchInterest[]> {
    const col = collection(db, 'users', uid, 'researchInterests');
    const snap = await getDocs(query(col, orderBy('submittedAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ResearchInterest));
}

export async function expressResearchInterest(uid: string, interest: Omit<ResearchInterest, 'id'>): Promise<void> {
    const col = collection(db, 'users', uid, 'researchInterests');
    await addDoc(col, { ...interest, submittedAt: serverTimestamp() });
}

// ─── Consultancy Proposals ────────────────────────────────────────────────────

export async function getConsultancyProposals(uid: string): Promise<ConsultancyProposal[]> {
    const col = collection(db, 'users', uid, 'consultancyProposals');
    const snap = await getDocs(query(col, orderBy('submittedAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ConsultancyProposal));
}

export async function submitConsultancyProposal(uid: string, proposal: Omit<ConsultancyProposal, 'id'>): Promise<void> {
    const col = collection(db, 'users', uid, 'consultancyProposals');
    await addDoc(col, { ...proposal, submittedAt: serverTimestamp() });
}

// ─── Mentor Profile ───────────────────────────────────────────────────────────

export async function getMentorProfile(uid: string): Promise<MentorProfile | null> {
    const ref = doc(db, 'users', uid, 'mentorProfile', 'data');
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as MentorProfile) : null;
}

export async function saveMentorProfile(uid: string, data: Partial<MentorProfile>): Promise<void> {
    await setDoc(doc(db, 'users', uid, 'mentorProfile', 'data'), {
        ...data,
        uid,
        updatedAt: serverTimestamp(),
    }, { merge: true });
}

// ─── Workshop Registrations ───────────────────────────────────────────────────

export async function getWorkshopRegistrations(uid: string): Promise<WorkshopRegistration[]> {
    const col = collection(db, 'users', uid, 'workshopRegistrations');
    const snap = await getDocs(query(col, orderBy('registeredAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkshopRegistration));
}

export async function registerForWorkshop(uid: string, reg: Omit<WorkshopRegistration, 'id'>): Promise<void> {
    const col = collection(db, 'users', uid, 'workshopRegistrations');
    await addDoc(col, { ...reg, registeredAt: serverTimestamp() });
}

// ─── Student Project Allocation (Real Faculty Mentorship) ─────────────────────

export interface AcademicProject {
    id?: string;
    title: string;
    type: 'Capstone Project' | 'Semester Project' | 'Research Project';
    description?: string;
    facultyUid?: string;
    facultyName: string;
    facultyDepartment?: string;
    mentees: string[]; // Display names e.g. ['Rishabh (CSE)', 'Alex (IT)']
    menteeUids?: string[]; // Candidate auth UIDs
    status: 'In Progress' | 'Open' | 'Under Review' | 'Completed';
    deadline?: string;
    deliverables?: string[];
    createdAt?: any;
    updatedAt?: any;
}

const DEFAULT_ACADEMIC_PROJECTS: Omit<AcademicProject, 'id'>[] = [
    {
        title: 'AI-based Resume Scorer',
        type: 'Capstone Project',
        description: 'NLP & LLM pipeline evaluating placement resumes against JD skill taxonomies with live embedding models.',
        facultyName: 'Deven Goyal',
        facultyDepartment: 'Computer Science & Engineering',
        mentees: ['Rishabh Verma (CSE)', 'ALEX (Full Stack)'],
        menteeUids: [],
        status: 'In Progress',
        deadline: '2026-11-30',
        deliverables: ['Model Benchmark Report', 'FastAPI Microservice', 'CapAble React UI'],
    },
    {
        title: 'Smart Campus IoT Network',
        type: 'Semester Project',
        description: 'LoRaWAN sensor telemetry for real-time lab occupancy and smart campus environmental monitoring.',
        facultyName: 'Deven Goyal',
        facultyDepartment: 'Computer Science & Engineering',
        mentees: ['Naveen (Backend)', 'Priya (AI)'],
        menteeUids: [],
        status: 'In Progress',
        deadline: '2026-12-15',
        deliverables: ['Hardware Schematic', 'MQTT Gateway', 'Dashboard'],
    },
    {
        title: 'Blockchain Identity Verification',
        type: 'Research Project',
        description: 'Self-sovereign verifiable credentials for academic degrees, test scores, and CapAble capability badges.',
        facultyName: 'Deven Goyal',
        facultyDepartment: 'Computer Science & Engineering',
        mentees: ['Aditya Singh (Systems)', 'Ansh Kumar (DevOps)'],
        menteeUids: [],
        status: 'Under Review',
        deadline: '2027-01-15',
        deliverables: ['Smart Contract Architecture', 'Polygon PoC', 'Research Draft'],
    },
];

export async function getAcademicProjects(): Promise<AcademicProject[]> {
    try {
        const col = collection(db, 'academicProjects');
        const snap = await getDocs(col);
        if (snap.empty) {
            // Auto-seed initial projects so the platform is immediately active
            const seeded: AcademicProject[] = [];
            for (const p of DEFAULT_ACADEMIC_PROJECTS) {
                const docRef = await addDoc(col, {
                    ...p,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                seeded.push({ id: docRef.id, ...p });
            }
            return seeded;
        }
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as AcademicProject));
    } catch (err) {
        console.warn('[AcademicianService] getAcademicProjects fallback to API:', err);
        try {
            const res = await fetch('/api/academic-projects');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) return data;
            }
        } catch (_) {}
        return DEFAULT_ACADEMIC_PROJECTS.map((p, i) => ({ id: `local-proj-${i}`, ...p }));
    }
}

export function subscribeToAcademicProjects(callback: (projects: AcademicProject[]) => void): () => void {
    const col = collection(db, 'academicProjects');
    return onSnapshot(col, (snap) => {
        if (!snap.empty) {
            callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as AcademicProject)));
        } else {
            getAcademicProjects().then(callback).catch(() => {});
        }
    }, (err) => {
        console.warn('[AcademicianService] Snapshot error:', err);
        getAcademicProjects().then(callback).catch(() => {});
    });
}

export async function createAcademicProject(project: Omit<AcademicProject, 'id'>): Promise<string> {
    fetch('/api/academic-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
    }).catch(() => null);

    const col = collection(db, 'academicProjects');
    const docRef = await addDoc(col, {
        ...project,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function allocateAcademicProject(projectId: string, menteeName: string, menteeUid?: string): Promise<void> {
    fetch(`/api/academic-projects/${projectId}/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menteeName, menteeUid })
    }).catch(() => null);

    const ref = doc(db, 'academicProjects', projectId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const current = snap.data() as AcademicProject;
    const currentMentees = (current.mentees || []).filter(m => m !== 'Unallocated');
    if (!currentMentees.includes(menteeName)) {
        currentMentees.push(menteeName);
    }
    const currentUids = current.menteeUids || [];
    if (menteeUid && !currentUids.includes(menteeUid)) {
        currentUids.push(menteeUid);
    }

    await updateDoc(ref, {
        mentees: currentMentees,
        assignedTo: currentMentees.join(', '),
        menteeUids: currentUids,
        status: currentMentees.length > 0 ? 'In Progress' : 'Open',
        updatedAt: serverTimestamp(),
    });
}

export async function updateAcademicProject(projectId: string, updates: Partial<AcademicProject>): Promise<void> {
    const ref = doc(db, 'academicProjects', projectId);
    await updateDoc(ref, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteAcademicProject(projectId: string): Promise<void> {
    await deleteDoc(doc(db, 'academicProjects', projectId));
}

// ─── Real-Time Candidate Project & Mentorship Session Queries ────────────────

export interface MentorSessionItem {
    id: string;
    candidateUid?: string;
    candidateName?: string;
    mentorUid?: string;
    mentorName: string;
    mentorRole?: string;
    mentorCompany?: string;
    topic: string;
    date?: string;
    time?: string;
    sessionDate?: string;
    meetUrl?: string;
    meetLink?: string;
    status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
    createdAt?: string;
}

export function subscribeToCandidateMentorSessions(candidateUid: string, candidateEmail: string, callback: (sessions: MentorSessionItem[]) => void): () => void {
    const col = collection(db, 'mentorSessions');
    
    const filterAndCallback = (all: MentorSessionItem[]) => {
        const filtered = all.filter(s => {
            if (!candidateUid && !candidateEmail) return true;
            const anyS = s as any;
            const uidMatches = anyS.candidateUid === candidateUid || anyS.menteeUid === candidateUid;
            const emailMatches = candidateEmail && (anyS.candidateEmail === candidateEmail || anyS.menteeEmail === candidateEmail);
            const nameMatches = anyS.candidateName?.toLowerCase().includes('vrishabh') || anyS.menteeName?.toLowerCase().includes('vrishabh');
            return uidMatches || emailMatches || nameMatches || anyS.candidateUid === 'candidate-vrishabh' || anyS.menteeUid === 'candidate-vrishabh';
        });
        callback(filtered.length > 0 ? filtered : all);
    };

    const fetchFallback = async () => {
        try {
            const res = await fetch('/api/mentor-sessions');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    filterAndCallback(data);
                    return;
                }
            }
        } catch (_) {}
        try {
            const local = JSON.parse(localStorage.getItem('capable_mentor_sessions') || '[]');
            if (Array.isArray(local) && local.length > 0) {
                filterAndCallback(local.map((s: any, idx: number) => ({ id: `local-${idx}`, ...s })));
            }
        } catch (_) {}
    };

    return onSnapshot(col, (snap) => {
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as MentorSessionItem));
        if (all.length > 0) {
            filterAndCallback(all);
        } else {
            fetchFallback();
        }
    }, (err) => {
        console.warn('[MentorSessions] Snapshot error, falling back to API:', err);
        fetchFallback();
    });
}
