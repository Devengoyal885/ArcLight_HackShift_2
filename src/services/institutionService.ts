/**
 * institutionService.ts
 * ──────────────────────
 * Firestore operations for the Institution/Admin portal.
 * All queries are scoped by institutionCode for multi-tenant isolation.
 */

import {
    collection, getDocs, addDoc, serverTimestamp,
    query, where, orderBy, doc, deleteDoc, updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { UserProfile } from './profileService';
import type { RoleApplication } from './employerService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlacementRecord {
    applicationId: string;
    studentUid: string;
    studentName: string;
    roleId: string;
    roleTitle: string;
    companyName: string;
    status: RoleApplication['status'];
    appliedAt: unknown;
    offerLetterUrl?: string;
    offerVerified?: boolean;
    salaryPackage?: string;
}

export interface InstitutionEvent {
    id?: string;
    type: 'workshop' | 'guest_lecture' | 'live_project' | 'placement_drive';
    title: string;
    description: string;
    speaker: string;
    company: string;
    date: string;
    mode: 'online' | 'offline' | 'hybrid';
    venue?: string;
    link?: string;
    institutionCode: string;
    createdAt?: unknown;
}

export interface LinkedCompany {
    id?: string;
    employerUid?: string; // Optional for backward compatibility with manual entries
    companyName: string;
    contactEmail?: string;
    sector?: string;
    status?: 'pending' | 'approved' | 'rejected';
    addedAt?: unknown;
}

export interface StudentRecord {
    profile: UserProfile;
    capabilityCount: number;
    topSkills: string[];
    learningCount: number;
    applicationCount: number;
}

// ─── Internal helper ─────────────────────────────────────────────────────────

async function getUsersWithRole(
    role: string,
    institutionCode?: string
): Promise<UserProfile[]> {
    const { collectionGroup } = await import('firebase/firestore');
    const snap = await getDocs(collectionGroup(db, 'profile'));
    const profiles: UserProfile[] = [];
    
    for (const pDoc of snap.docs) {
        const data = pDoc.data() as UserProfile;
        if (data.role !== role) continue;
        
        if (institutionCode) {
            const code1 = (data.institutionCode || '').trim().toUpperCase();
            const code2 = institutionCode.trim().toUpperCase();
            if (code1 !== code2) continue;
        }
        
        const pathSegments = pDoc.ref.path.split('/');
        // Assuming path is users/{uid}/profile/data
        const docUid = pathSegments.length >= 3 ? pathSegments[pathSegments.length - 3] : '';
        profiles.push({ ...data, uid: data.uid || docUid });
    }
    return profiles;
}

// ─── Candidates / Students ────────────────────────────────────────────────────

export async function getAllStudents(): Promise<UserProfile[]> {
    return getUsersWithRole('candidate');
}

export async function getInstitutionCandidates(
    institutionCode: string
): Promise<UserProfile[]> {
    return getUsersWithRole('candidate', institutionCode);
}

// ─── Faculty ──────────────────────────────────────────────────────────────────

export async function getAllFaculty(): Promise<UserProfile[]> {
    return getUsersWithRole('academician');
}

export async function getInstitutionFaculty(
    institutionCode: string
): Promise<UserProfile[]> {
    return getUsersWithRole('academician', institutionCode);
}

// ─── Per-student record ───────────────────────────────────────────────────────

export async function updateStudentAdminFlags(
    uid: string,
    flags: { isFrozen?: boolean; isNotInterested?: boolean; isVerified?: boolean }
): Promise<void> {
    const docRef = doc(db, 'users', uid, 'profile', 'data');
    await updateDoc(docRef, flags as any);
}

export async function getStudentRecord(
    uid: string,
    profile: UserProfile
): Promise<StudentRecord> {
    try {
        const [capsSnap, learnSnap] = await Promise.all([
            getDocs(collection(db, 'users', uid, 'capabilities')),
            getDocs(collection(db, 'users', uid, 'learningPaths')),
        ]);

        // application count: query global applications subcollection under postedRoles
        let applicationCount = 0;
        try {
            const rolesSnap = await getDocs(collection(db, 'postedRoles'));
            for (const roleDoc of rolesSnap.docs) {
                const appsSnap = await getDocs(
                    query(
                        collection(db, 'postedRoles', roleDoc.id, 'applications'),
                        where('candidateUid', '==', uid)
                    )
                );
                applicationCount += appsSnap.size;
            }
        } catch { /* noop */ }

        const topSkills = capsSnap.docs
            .map(d => d.data())
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 4)
            .map(d => d.skill as string);

        return {
            profile,
            capabilityCount: capsSnap.size,
            topSkills,
            learningCount: learnSnap.size,
            applicationCount,
        };
    } catch {
        return { profile, capabilityCount: 0, topSkills: [], learningCount: 0, applicationCount: 0 };
    }
}

// ─── Global Placements ────────────────────────────────────────────────────────

export async function getGlobalPlacements(): Promise<PlacementRecord[]> {
    const rolesSnap = await getDocs(collection(db, 'postedRoles'));
    const placements: PlacementRecord[] = [];
    for (const roleDoc of rolesSnap.docs) {
        const appsSnap = await getDocs(
            collection(db, 'postedRoles', roleDoc.id, 'applications')
        );
        appsSnap.forEach(appDoc => {
            const data = appDoc.data() as RoleApplication;
            placements.push({
                applicationId: appDoc.id,
                studentUid: data.candidateUid,
                studentName: data.candidateName,
                roleId: data.roleId,
                roleTitle: data.roleTitle,
                companyName: data.companyName,
                status: data.status,
                appliedAt: data.appliedAt,
                offerLetterUrl: (data as any).offerLetterUrl,
                offerVerified: (data as any).offerVerified,
                salaryPackage: (data as any).salaryPackage,
            });
        });
    }
    const weight: Record<string, number> = {
        'Placed': 6, 'Offer Extended': 5, 'Interview Scheduled': 4,
        'OA Pending': 3, 'Screening': 2, 'Applied': 1,
        'OA Rejected': -1, 'Rejected': -2,
    };
    return placements.sort(
        (a, b) => (weight[b.status] || 0) - (weight[a.status] || 0)
    );
}

export async function verifyPlacementOffer(
    roleId: string,
    applicationId: string,
    verified: boolean
): Promise<void> {
    const appRef = doc(db, 'postedRoles', roleId, 'applications', applicationId);
    await updateDoc(appRef, { offerVerified: verified });
}

// ─── Institution Events ───────────────────────────────────────────────────────

export async function getInstitutionEvents(
    institutionCode: string
): Promise<InstitutionEvent[]> {
    try {
        const eventsRef = collection(db, 'institutions', institutionCode, 'events');
        const snap = await getDocs(query(eventsRef, orderBy('date', 'asc')));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as InstitutionEvent));
    } catch { return []; }
}

export async function postInstitutionEvent(
    institutionCode: string,
    event: Omit<InstitutionEvent, 'id' | 'createdAt' | 'institutionCode'>
): Promise<string> {
    const ref = await addDoc(
        collection(db, 'institutions', institutionCode, 'events'),
        { ...event, institutionCode, createdAt: serverTimestamp() }
    );
    return ref.id;
}

export async function deleteInstitutionEvent(
    institutionCode: string,
    eventId: string
): Promise<void> {
    await deleteDoc(
        doc(db, 'institutions', institutionCode, 'events', eventId)
    );
}

// ─── Linked Companies ─────────────────────────────────────────────────────────

export async function getLinkedCompanies(
    institutionCode: string
): Promise<LinkedCompany[]> {
    try {
        const snap = await getDocs(
            collection(db, 'institutions', institutionCode, 'linkedCompanies')
        );
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as LinkedCompany));
    } catch { return []; }
}

export async function addLinkedCompany(
    institutionCode: string,
    company: Omit<LinkedCompany, 'id' | 'addedAt'>
): Promise<void> {
    await addDoc(
        collection(db, 'institutions', institutionCode, 'linkedCompanies'),
        { ...company, status: company.status || 'pending', addedAt: serverTimestamp() }
    );
}

export async function removeLinkedCompany(
    institutionCode: string,
    companyId: string
): Promise<void> {
    await deleteDoc(
        doc(db, 'institutions', institutionCode, 'linkedCompanies', companyId)
    );
}

// Get all pending requests for a specific employer across all institutions
export async function getEmployerLinkRequests(employerUid: string): Promise<{ id: string; institutionCode: string; companyName: string; status: string }[]> {
    try {
        const { collectionGroup } = await import('firebase/firestore');
        const cg = collectionGroup(db, 'linkedCompanies');
        // Fetch all to avoid composite index requirements for collectionGroup+where
        const snap = await getDocs(cg);
        
        // Fetch current employer profile to fallback match by name for older docs missing employerUid
        const { getEmployerProfile } = await import('./employerService');
        const empProfile = await getEmployerProfile(employerUid);
        const empName = empProfile?.companyName?.toLowerCase().trim() || '';

        const requests: any[] = [];
        snap.docs.forEach(d => {
            const data = d.data();
            const matchByUid = data.employerUid === employerUid;
            const matchByName = empName && data.companyName?.toLowerCase().trim() === empName;

            if (matchByUid || matchByName) {
                const pathSegments = d.ref.path.split('/');
                const institutionCode = pathSegments.length >= 3 ? pathSegments[pathSegments.length - 3] : 'UNKNOWN';
                requests.push({
                    id: d.id,
                    institutionCode,
                    companyName: data.companyName,
                    status: data.status || 'pending'
                });
            }
        });
        return requests;
    } catch (e) {
        console.error('Failed to get employer link requests:', e);
        return [];
    }
}

export async function updateLinkRequestStatus(
    institutionCode: string,
    companyId: string,
    status: 'approved' | 'rejected'
): Promise<void> {
    const docRef = doc(db, 'institutions', institutionCode, 'linkedCompanies', companyId);
    await updateDoc(docRef, { status });
}
