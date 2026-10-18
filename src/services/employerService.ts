/**
 * employerService.ts
 * ──────────────────
 * All Firestore operations for the employer/industry side.
 *
 * Collections:
 *   employers/{uid}/profile      — employer profile
 *   employers/{uid}/postedRoles  — roles/internships posted by this employer
 *   postedRoles/{roleId}/applications/{appId} — applications per role
 */

import {
    doc, getDoc, setDoc, addDoc, getDocs,
    collection, serverTimestamp, query, orderBy,
    updateDoc, deleteDoc, where, collectionGroup
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { callGeminiJSON } from '../lib/gemini';
import {
    notifyOAInvite, notifyOAPassed, notifyOARejected,
    notifyRejected, notifyOfferExtended, notifyPlaced,
} from './notificationService';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PostingType = 'placement' | 'internship' | 'training' | 'fdp' | 'research' | 'apprenticeship' | 'startup_equity' | 'co_founder';
export type OrgType = 'startup' | 'smb' | 'enterprise' | 'nonprofit' | 'other';

export interface EmployerProfile {
    uid: string;
    companyName: string;
    industry: string;
    size?: string;
    website?: string;
    description?: string;
    logoUrl?: string;
    location?: string;
    contactEmail?: string;
    /** Organization type: startup / smb / enterprise / nonprofit / other */
    orgType?: OrgType;
    /** Current startup stage — only relevant when orgType === 'startup' */
    startupStage?: 'Idea' | 'Prototype' | 'MVP' | 'Early Traction' | 'Growth' | 'Funded';
    /** Founding year — helps surface early-stage companies to candidates */
    foundingYear?: string;
    createdAt?: unknown;
    updatedAt?: unknown;
}

export interface PostedRole {
    id?: string;
    employerUid: string;
    companyName: string;
    title: string;
    type: PostingType;
    location: string;
    remote: boolean;
    description: string;
    requiredSkills: string[];
    requiredCapabilities: { skill: string; required: number }[];
    salary?: string;
    stipend?: string;
    duration?: string;          // for internships, FDPs
    deadline?: string;
    tags: string[];
    status: 'active' | 'closed' | 'draft';
    applicantCount?: number;
    applicants?: number;
    postedAt?: unknown;
    updatedAt?: unknown;
    seatCapacity?: number;
    autoCloseOnSeatCap?: boolean;
    isStartupRole?: boolean;
    startupStage?: 'Idea' | 'Prototype' | 'MVP' | 'Early Traction' | 'Growth';
    equityRange?: string;
}

export interface RoleApplication {
    id?: string;
    roleId: string;
    roleTitle: string;
    companyName: string;
    candidateUid: string;
    candidateName: string;
    candidateEmail: string;
    candidateHeadline?: string;
    capabilityMatch?: number;   // 0-100
    status: 'Applied' | 'Screening' | 'OA Pending' | 'Interview Scheduled' | 'Offer Extended' | 'Placed' | 'OA Rejected' | 'Rejected';
    message?: string;
    interviewDetails?: { venue: string; date: string; time: string };
    offerDetails?: { salary: string; startDate: string; offerLetterUrl?: string };
    feedback?: string;
    scheduledAssessment?: {
        type: 'ai_interview' | 'coding_assessment';
        domain: string;
        status: 'pending' | 'completed';
        score?: number;
    };
    appliedAt?: unknown;
    updatedAt?: unknown;
}

// ─── Employer Profile ─────────────────────────────────────────────────────────

export async function getEmployerProfile(uid: string): Promise<EmployerProfile | null> {
    const rawUid = uid.replace(/_(employer|candidate|academician|institution)$/, '');
    const tryUids = [
        uid,
        `${rawUid}_employer`,
        rawUid,
        `${rawUid}_candidate`,
    ];

    for (const u of tryUids) {
        try {
            const snap = await getDoc(doc(db, 'employers', u, 'profile', 'data'));
            if (snap.exists() && snap.data()?.companyName) {
                return snap.data() as EmployerProfile;
            }
        } catch {}
        try {
            const snap2 = await getDoc(doc(db, 'employers', u));
            if (snap2.exists() && snap2.data()?.companyName) {
                return snap2.data() as EmployerProfile;
            }
        } catch {}
        try {
            const userSnap = await getDoc(doc(db, 'users', u, 'profile', 'data'));
            if (userSnap.exists() && (userSnap.data() as any)?.companyName) {
                return userSnap.data() as any as EmployerProfile;
            }
        } catch {}
    }

    // Check localStorage fallback
    const localName = localStorage.getItem('employer_companyName');
    if (localName) {
        return {
            uid,
            companyName: localName,
            industry: localStorage.getItem('employer_industry') || 'Technology',
            orgType: (localStorage.getItem('employer_orgType') as OrgType) || 'enterprise',
            startupStage: localStorage.getItem('employer_startupStage') as any,
            foundingYear: localStorage.getItem('employer_foundingYear') || undefined,
        };
    }

    return null;
}

export async function saveEmployerProfile(uid: string, data: Partial<EmployerProfile>): Promise<void> {
    const rawUid = uid.replace(/_(employer|candidate|academician|institution)$/, '');
    if (data.companyName) {
        localStorage.setItem('employer_companyName', data.companyName);
    }
    if (data.industry) {
        localStorage.setItem('employer_industry', data.industry);
    }
    if (data.orgType) {
        localStorage.setItem('employer_orgType', data.orgType);
    }
    if (data.startupStage) {
        localStorage.setItem('employer_startupStage', data.startupStage);
    }
    if (data.foundingYear) {
        localStorage.setItem('employer_foundingYear', data.foundingYear);
    }

    const payload = {
        ...data,
        uid: `${rawUid}_employer`,
        updatedAt: serverTimestamp(),
    };

    await Promise.allSettled([
        setDoc(doc(db, 'employers', `${rawUid}_employer`, 'profile', 'data'), payload, { merge: true }),
        setDoc(doc(db, 'employers', rawUid, 'profile', 'data'), payload, { merge: true }),
        setDoc(doc(db, 'users', `${rawUid}_employer`, 'profile', 'data'), payload, { merge: true }),
    ]);
}

export async function getAllEmployerProfiles(): Promise<EmployerProfile[]> {
    const snap = await getDocs(collectionGroup(db, 'profile'));
    return snap.docs
        .filter(d => d.ref.path.includes('employers/'))
        .map(d => {
            const data = d.data() as EmployerProfile;
            // Ensure uid is correctly parsed if it's missing in data
            if (!data.uid) {
                const pathParts = d.ref.path.split('/');
                data.uid = pathParts.length >= 3 ? pathParts[pathParts.length - 3] : '';
            }
            return data;
        });
}

// ─── Posted Roles (by this employer) ─────────────────────────────────────────

/**
 * Syncs all roles from an employer's private collection to the global
 * postedRoles collection. Repairs roles that failed to sync due to prior
 * permission errors. Only writes if the global doc is missing.
 */
async function syncEmployerRolesToGlobal(roles: PostedRole[], employerUid: string): Promise<void> {
    const syncs = roles
        .filter(r => r.id && r.status === 'active')
        .map(async (r) => {
            try {
                const globalRef = doc(db, 'postedRoles', r.id!);
                const existing = await getDoc(globalRef);
                if (!existing.exists()) {
                    // Missing from global collection — mirror it now
                    await setDoc(globalRef, {
                        ...r,
                        employerUid,
                        id: r.id,
                        postedAt: r.postedAt || serverTimestamp(),
                        updatedAt: serverTimestamp(),
                    });
                    console.log(`[sync] Mirrored role "${r.title}" (${r.id}) to global collection.`);
                }
            } catch (e) {
                console.warn(`[sync] Could not mirror role ${r.id}:`, e);
            }
        });
    await Promise.allSettled(syncs);
}

export async function getPostedRoles(employerUid: string): Promise<PostedRole[]> {
    const col = collection(db, 'employers', employerUid, 'postedRoles');
    const snap = await getDocs(query(col, orderBy('postedAt', 'desc')));
    const localRoles = snap.docs.map(d => ({ id: d.id, ...d.data() } as PostedRole));

    let globalRoles: PostedRole[] = [];
    try {
        // Fetch all global roles and filter manually to handle both exact employerUid match 
        // and raw UID match (for manually seeded data missing the _employer suffix).
        const rawUid = employerUid.replace('_employer', '').replace('_academician', '').replace('_candidate', '');
        const globalSnap = await getDocs(collection(db, 'postedRoles'));
        const allGlobalRoles = globalSnap.docs.map(d => ({ id: d.id, ...d.data() } as PostedRole));
        
        globalRoles = allGlobalRoles.filter(r => 
            r.employerUid === employerUid || 
            r.employerUid === rawUid
        );
    } catch (e) {
        console.warn("Failed to fetch global roles for employer", e);
    }

    const allRoles = [...localRoles, ...globalRoles];
    const seen = new Set<string>();
    const roles = allRoles.filter(r => {
        if (!r.id || seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
    }).sort((a, b) => {
        const dateA = (a.postedAt as any)?.toMillis ? (a.postedAt as any).toMillis() : 0;
        const dateB = (b.postedAt as any)?.toMillis ? (b.postedAt as any).toMillis() : 0;
        return dateB - dateA;
    });

    // Silently repair any roles missing from the global student-visible collection
    syncEmployerRolesToGlobal(roles, employerUid).catch(console.warn);
    return roles;
}

export async function postRole(employerUid: string, role: Omit<PostedRole, 'id' | 'postedAt' | 'updatedAt'>): Promise<string> {
    const col = collection(db, 'employers', employerUid, 'postedRoles');
    let docRef;
    
    // §3.8 — Self-post path: always tag with source and postingPath
    // This separates employer-direct posts from any future ingestion pipeline.
    const enrichedRole = {
        ...role,
        source: 'CapAble Portal',        // §3.7 source attribution
        postingPath: 'self-post',          // §3.8 explicit path tag
    };
    
    try {
        docRef = await addDoc(col, {
            ...enrichedRole,
            employerUid,
            applicantCount: 0,
            postedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    } catch (e: any) {
        console.error("Permission error on employers subcollection:", e);
        throw new Error("Failed to save to employer profile: " + e.message);
    }

    try {
        // Mirror to top-level for student discovery
        await setDoc(doc(db, 'postedRoles', docRef.id), {
            ...enrichedRole,
            id: docRef.id,
            employerUid,
            applicantCount: 0,
            postedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    } catch (e: any) {
        console.error("Permission error on global postedRoles collection:", e);
        throw new Error("Failed to publish to student feed: " + e.message);
    }
    
    return docRef.id;
}

export async function updatePostedRole(employerUid: string, roleId: string, updates: Partial<PostedRole>): Promise<void> {
    await updateDoc(doc(db, 'employers', employerUid, 'postedRoles', roleId), {
        ...updates,
        updatedAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'postedRoles', roleId), {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

export async function deletePostedRole(employerUid: string, roleId: string): Promise<void> {
    await deleteDoc(doc(db, 'employers', employerUid, 'postedRoles', roleId));
    await deleteDoc(doc(db, 'postedRoles', roleId));
}

// ─── Global Role Discovery (for students) ────────────────────────────────────

export async function getAllPostedRoles(): Promise<PostedRole[]> {
    try {
        const col = collection(db, 'postedRoles');
        // Avoid compound query (status filter + orderBy) which needs a composite index.
        // Instead: fetch all, filter and sort client-side. Collection is small.
        const snap = await getDocs(col);
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as PostedRole));
        return all
            .filter(r => {
                const status = r.status ?? 'active';
                return status === 'active';
            })
            .sort((a, b) => {
                const dateA = (a.postedAt as any)?.toMillis ? (a.postedAt as any).toMillis() : 0;
                const dateB = (b.postedAt as any)?.toMillis ? (b.postedAt as any).toMillis() : 0;
                return dateB - dateA;
            });
    } catch (e) {
        console.error('[employerService] Failed to fetch posted roles:', e);
        return [];
    }
}

// ─── Applications ─────────────────────────────────────────────────────────────

export async function applyToRole(
    roleId: string,
    application: Omit<RoleApplication, 'id' | 'appliedAt' | 'updatedAt'>
): Promise<void> {
    // Generate a single shared ID for this application
    const appRef = doc(collection(db, 'postedRoles', roleId, 'applications'));
    const appId = appRef.id;

    // Save under the role
    await setDoc(appRef, {
        ...application,
        status: 'Applied',
        appliedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    // Also track on student side (under users/{uid}/applications for tracking)
    await setDoc(doc(db, 'users', application.candidateUid, 'applications', appId), {
        opportunityId: roleId,
        title: application.roleTitle,
        company: application.companyName,
        url: '',
        status: 'Applied',
        appliedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    // Increment applicant count on the posted role
    try {
        await updateDoc(doc(db, 'postedRoles', roleId), {
            applicantCount: (await getDoc(doc(db, 'postedRoles', roleId))).data()?.applicantCount + 1 || 1,
        });
    } catch { /* non-critical */ }
}

export async function getApplicationsForRole(roleId: string): Promise<RoleApplication[]> {
    const snap = await getDocs(
        query(collection(db, 'postedRoles', roleId, 'applications'), orderBy('appliedAt', 'desc'))
    );
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as RoleApplication));
}

export async function getCandidateApplications(candidateUid: string): Promise<RoleApplication[]> {
    const snap = await getDocs(
        query(collection(db, 'users', candidateUid, 'applications'), orderBy('appliedAt', 'desc'))
    );
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as RoleApplication));
}

export async function updateApplicationStatus(
    roleId: string,
    applicationId: string,
    candidateUid: string,
    status: RoleApplication['status'],
    message?: string,
    interviewDetails?: { venue: string; date: string; time: string },
    offerDetails?: { salary: string; startDate: string; offerLetterUrl?: string },
    feedback?: string
): Promise<void> {
    const updates: any = {
        status,
        updatedAt: serverTimestamp(),
    };
    if (message) updates.message = message;
    if (interviewDetails) updates.interviewDetails = interviewDetails;
    if (offerDetails) updates.offerDetails = offerDetails;
    if (feedback) updates.feedback = feedback;

    // Update Employer side
    await updateDoc(doc(db, 'postedRoles', roleId, 'applications', applicationId), updates);
    // Update Candidate side
    await updateDoc(doc(db, 'users', candidateUid, 'applications', applicationId), updates);

    // Fire notifications for the candidate
    // Retrieve role title from the application for the notification message
    try {
        const appSnap = await getDoc(doc(db, 'users', candidateUid, 'applications', applicationId));
        const appData = appSnap.data();
        const roleTitle = appData?.title || 'the role';
        const companyName = appData?.company || 'the company';

        if (status === 'OA Pending') {
            await notifyOAInvite(candidateUid, roleTitle);
        } else if (status === 'Interview Scheduled' && interviewDetails) {
            await notifyOAPassed(candidateUid, roleTitle, interviewDetails.venue, interviewDetails.date, interviewDetails.time);
        } else if (status === 'OA Rejected') {
            await notifyOARejected(candidateUid, roleTitle, message);
        } else if (status === 'Rejected') {
            await notifyRejected(candidateUid, roleTitle);
        } else if (status === 'Offer Extended') {
            await notifyOfferExtended(candidateUid, roleTitle, companyName);
        } else if (status === 'Placed') {
            await notifyPlaced(candidateUid, roleTitle, companyName);
        }
    } catch (e) {
        console.warn('[employerService] Notification dispatch failed (non-critical):', e);
    }
}

export async function scheduleAssessment(
    roleId: string,
    applicationId: string,
    candidateUid: string,
    type: 'ai_interview' | 'coding_assessment',
    domain: string
): Promise<void> {
    const updates: any = {
        status: 'OA Pending',
        scheduledAssessment: {
            type,
            domain,
            status: 'pending'
        },
        updatedAt: serverTimestamp(),
    };

    // Update Employer side
    await updateDoc(doc(db, 'postedRoles', roleId, 'applications', applicationId), updates);
    // Update Candidate side
    await updateDoc(doc(db, 'users', candidateUid, 'applications', applicationId), updates);

    try {
        const appSnap = await getDoc(doc(db, 'users', candidateUid, 'applications', applicationId));
        const roleTitle = appSnap.data()?.title || 'the role';
        await notifyOAInvite(candidateUid, roleTitle);
    } catch (e) {
        console.warn('Failed to notify candidate about OA:', e);
    }
}

export async function submitScheduledAssessment(
    candidateUid: string,
    roleId: string,
    applicationId: string,
    score: number
): Promise<void> {
    const updates: any = {
        'scheduledAssessment.status': 'completed',
        'scheduledAssessment.score': score,
        updatedAt: serverTimestamp(),
    };
    await updateDoc(doc(db, 'postedRoles', roleId, 'applications', applicationId), updates);
    await updateDoc(doc(db, 'users', candidateUid, 'applications', applicationId), updates);
}

// ─── AI Capability Model Generator ───────────────────────────────────────────

export interface CapabilityModel {
    role: string;
    type: PostingType;
    summary: string;
    capabilities: { label: string; weight: number; required: number }[];
    suggestedSkills: string[];
    suggestedDuration?: string;
}

const CAPABILITY_MODEL_SYSTEM = `You are an expert HR and talent intelligence AI for CapAble, an Academia-Industry Collaboration Portal.

Given a job/internship title and optional context, generate a detailed capability model.

Return ONLY valid JSON matching this exact schema:
{
  "role": "exact role title",
  "type": "placement" | "internship" | "training" | "fdp" | "research" | "apprenticeship",
  "summary": "2-sentence role description",
  "capabilities": [
    { "label": "Skill Name", "weight": 0.20, "required": 80 }
  ],
  "suggestedSkills": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "suggestedDuration": "6 months"
}

Rules:
- capabilities array must have 4-6 items
- weights must sum to 1.0
- required is 0-100 (minimum capability score to be eligible)
- suggestedSkills is 4-6 short tech tags
- type should match what makes sense (e.g. internship for 3-6 month roles, fdp for faculty programs)`;

export async function generateCapabilityModel(roleTitle: string, context?: string): Promise<CapabilityModel | null> {
    const prompt = `Role/Opportunity Title: "${roleTitle}"
${context ? `Additional Context: ${context}` : ''}

Generate a comprehensive capability model for this role on an Academia-Industry platform.`;

    return callGeminiJSON<CapabilityModel>(prompt, CAPABILITY_MODEL_SYSTEM);
}

// ─── Global Talent Discovery (for employers) ──────────────────────────────────

export async function getAllCandidates() {
    try {
        const col = collection(db, 'users');
        const snap = await getDocs(query(col, where('role', '==', 'candidate')));
        
        return snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));
    } catch (e) {
        console.error('[employerService] Failed to fetch all candidates:', e);
        return [];
    }
}

// ─── Shortlist ─────────────────────────────────────────────────────────────────

export interface ShortlistedCandidate {
    id?: string;
    candidateUid: string;
    candidateName: string;
    candidateHeadline?: string;
    roleId?: string;
    roleTitle?: string;
    shortlistedAt?: unknown;
}

export async function shortlistCandidate(employerUid: string, data: Omit<ShortlistedCandidate, 'id' | 'shortlistedAt'>): Promise<void> {
    const col = collection(db, 'employers', employerUid, 'shortlist');
    // Avoid duplicates
    const existing = await getDocs(query(col, where('candidateUid', '==', data.candidateUid)));
    if (!existing.empty) return;
    await addDoc(col, { ...data, shortlistedAt: serverTimestamp() });
}

export async function removeFromShortlist(employerUid: string, candidateUid: string): Promise<void> {
    const col = collection(db, 'employers', employerUid, 'shortlist');
    const snap = await getDocs(query(col, where('candidateUid', '==', candidateUid)));
    for (const d of snap.docs) await deleteDoc(d.ref);
}

export async function getShortlist(employerUid: string): Promise<ShortlistedCandidate[]> {
    const col = collection(db, 'employers', employerUid, 'shortlist');
    const snap = await getDocs(query(col, orderBy('shortlistedAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ShortlistedCandidate));
}

// ─── Recruiter Notes ───────────────────────────────────────────────────────────

export interface RecruiterNote {
    id?: string;
    note: string;
    createdAt?: unknown;
}

export async function addRecruiterNote(employerUid: string, candidateUid: string, note: string): Promise<void> {
    const col = collection(db, 'employers', employerUid, 'notes', candidateUid, 'entries');
    await addDoc(col, { note, createdAt: serverTimestamp() });
}

export async function getRecruiterNotes(employerUid: string, candidateUid: string): Promise<RecruiterNote[]> {
    const col = collection(db, 'employers', employerUid, 'notes', candidateUid, 'entries');
    const snap = await getDocs(query(col, orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as RecruiterNote));
}

export async function deleteRecruiterNote(employerUid: string, candidateUid: string, noteId: string): Promise<void> {
    await deleteDoc(doc(db, 'employers', employerUid, 'notes', candidateUid, 'entries', noteId));
}

// ─── Candidate Profile ─────────────────────────────────────────────────────────

export async function getCandidateProfile(uid: string) {
    try {
        const docRef = doc(db, 'users', uid, 'profile', 'data');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            return { id: snap.id, ...snap.data() };
        }
        // Fallback: If document doesn't exist but we reached here, return a basic object
        // so the page doesn't crash and we can still show their capabilities
        return { id: uid, name: 'Candidate Profile', headline: 'Platform User', email: '' };
    } catch (e) {
        console.error('[employerService] Failed to fetch candidate profile:', e);
        // Fallback on error to prevent blocking the employer
        return { id: uid, name: 'Candidate Profile', headline: 'Platform User', email: '' };
    }
}
