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
    updateDoc, deleteDoc, where,
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
