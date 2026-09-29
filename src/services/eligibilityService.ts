/**
 * eligibilityService.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Eligibility Engine for campus placement drives.
 *
 * An institution admin defines eligibility rules per placement drive:
 *   - Minimum CGPA
 *   - Allowed branches / departments
 *   - Maximum number of standing backlogs
 *   - Graduation year
 *   - Skills required (soft match)
 *
 * The engine checks each student against rules and returns:
 *   - eligible: boolean
 *   - reasons: string[] (why ineligible)
 *
 * Firestore paths:
 *   placementDrives/{driveId}            — drive metadata + rules
 *   placementDrives/{driveId}/registrations/{uid}  — student registrations
 */

import {
    collection, doc, addDoc, setDoc, getDoc, getDocs,
    updateDoc, query, where, serverTimestamp, orderBy,
    type Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EligibilityCriteria {
    minCGPA?: number;                  // e.g. 6.5
    allowedBranches?: string[];        // ['CSE', 'IT', 'ECE']
    maxBacklogs?: number;              // 0 = no backlogs allowed
    graduationYear?: number;           // e.g. 2025
    requiredSkills?: string[];         // ['Python', 'SQL'] — soft match
    genderRestriction?: 'none' | 'male' | 'female';
    minAttendance?: number;            // 0–100
}

export interface PlacementDrive {
    id?: string;
    institutionCode: string;
    institutionName?: string;
    title: string;
    company: string;
    roleTitle: string;
    package?: string;          // e.g. '6–10 LPA'
    location?: string;
    description?: string;
    deadline: string;          // ISO date string
    eligibility: EligibilityCriteria;
    status: 'draft' | 'open' | 'closed';
    createdAt?: Timestamp | unknown;
    applicationCount?: number;
}

export interface DriveRegistration {
    uid: string;
    name: string;
    email: string;
    cgpa?: number;
    branch?: string;
    backlogs?: number;
    graduationYear?: number;
    skills?: string[];
    registeredAt?: unknown;
    eligible?: boolean;
    eligibilityReasons?: string[];
    offerStatus?: 'pending' | 'offered' | 'rejected';
    offerLetterUrl?: string;
}

export interface EligibilityResult {
    eligible: boolean;
    reasons: string[];
    passedChecks: string[];
}

// ── Engine ────────────────────────────────────────────────────────────────────

export function checkEligibility(
    student: {
        cgpa?: number;
        branch?: string;
        backlogs?: number;
        graduationYear?: number;
        skills?: string[];
        gender?: string;
        attendance?: number;
    },
    criteria: EligibilityCriteria,
): EligibilityResult {
    const reasons: string[] = [];
    const passedChecks: string[] = [];

    if (criteria.minCGPA !== undefined) {
        if (!student.cgpa || student.cgpa < criteria.minCGPA) {
            reasons.push(`CGPA ${student.cgpa ?? 'N/A'} is below minimum ${criteria.minCGPA}`);
        } else {
            passedChecks.push(`CGPA ${student.cgpa} ≥ ${criteria.minCGPA}`);
        }
    }

    if (criteria.allowedBranches && criteria.allowedBranches.length > 0) {
        const branch = student.branch?.trim().toUpperCase() || '';
        const allowed = criteria.allowedBranches.map(b => b.toUpperCase());
        if (!allowed.includes(branch)) {
            reasons.push(`Branch "${student.branch || 'Unknown'}" not in allowed list: ${criteria.allowedBranches.join(', ')}`);
        } else {
            passedChecks.push(`Branch "${student.branch}" is eligible`);
        }
    }

    if (criteria.maxBacklogs !== undefined) {
        const backlogs = student.backlogs ?? 0;
        if (backlogs > criteria.maxBacklogs) {
            reasons.push(`${backlogs} active backlogs exceed max ${criteria.maxBacklogs}`);
        } else {
            passedChecks.push(`Backlog count (${backlogs}) within limit`);
        }
    }

    if (criteria.graduationYear !== undefined) {
        if (!student.graduationYear || student.graduationYear !== criteria.graduationYear) {
            reasons.push(`Graduation year ${student.graduationYear ?? 'Unknown'} ≠ required ${criteria.graduationYear}`);
        } else {
            passedChecks.push(`Graduation year ${student.graduationYear} matches`);
        }
    }

    if (criteria.requiredSkills && criteria.requiredSkills.length > 0) {
        const studentSkills = (student.skills || []).map(s => s.toLowerCase());
        const missing = criteria.requiredSkills.filter(
            req => !studentSkills.some(s => s.includes(req.toLowerCase()))
        );
        if (missing.length > 0) {
            reasons.push(`Missing required skills: ${missing.join(', ')}`);
        } else {
            passedChecks.push(`All required skills present`);
        }
    }

    if (criteria.minAttendance !== undefined) {
        const att = student.attendance ?? 100;
        if (att < criteria.minAttendance) {
            reasons.push(`Attendance ${att}% below minimum ${criteria.minAttendance}%`);
        } else {
            passedChecks.push(`Attendance ${att}% ≥ ${criteria.minAttendance}%`);
        }
    }

    if (criteria.genderRestriction && criteria.genderRestriction !== 'none') {
        if (student.gender && student.gender !== criteria.genderRestriction) {
            reasons.push(`Drive is restricted to ${criteria.genderRestriction} candidates`);
        }
    }

    return { eligible: reasons.length === 0, reasons, passedChecks };
}

// ── Firestore CRUD ────────────────────────────────────────────────────────────

export async function createPlacementDrive(
    drive: Omit<PlacementDrive, 'id' | 'createdAt' | 'applicationCount'>
): Promise<string> {
    const ref = await addDoc(collection(db, 'placementDrives'), {
        ...drive,
        applicationCount: 0,
        createdAt: serverTimestamp(),
    });
    return ref.id;
}

export async function getPlacementDrives(institutionCode: string): Promise<PlacementDrive[]> {
    const q = query(
        collection(db, 'placementDrives'),
        where('institutionCode', '==', institutionCode),
        orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PlacementDrive));
}

export async function getOpenDrives(institutionCode: string): Promise<PlacementDrive[]> {
    const q = query(
        collection(db, 'placementDrives'),
        where('institutionCode', '==', institutionCode),
        where('status', '==', 'open'),
        orderBy('deadline'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PlacementDrive));
}

export async function updateDriveStatus(
    driveId: string,
    status: PlacementDrive['status'],
): Promise<void> {
    await updateDoc(doc(db, 'placementDrives', driveId), { status });
}

export async function registerForDrive(
    driveId: string,
    registration: Omit<DriveRegistration, 'registeredAt' | 'eligible' | 'eligibilityReasons'>,
    criteria: EligibilityCriteria,
): Promise<EligibilityResult> {
    const result = checkEligibility(registration, criteria);

    await setDoc(
        doc(db, 'placementDrives', driveId, 'registrations', registration.uid),
        {
            ...registration,
            eligible: result.eligible,
            eligibilityReasons: result.reasons,
            registeredAt: serverTimestamp(),
        }
    );

    // Update application count
    const driveSnap = await getDoc(doc(db, 'placementDrives', driveId));
    const current = (driveSnap.data()?.applicationCount || 0) as number;
    await updateDoc(doc(db, 'placementDrives', driveId), { applicationCount: current + 1 });

    return result;
}

export async function getDriveRegistrations(driveId: string): Promise<DriveRegistration[]> {
    const snap = await getDocs(collection(db, 'placementDrives', driveId, 'registrations'));
    return snap.docs.map(d => d.data() as DriveRegistration);
}

export async function getEligibleStudents(
    driveId: string,
): Promise<DriveRegistration[]> {
    const q = query(
        collection(db, 'placementDrives', driveId, 'registrations'),
        where('eligible', '==', true),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as DriveRegistration);
}

export async function updateOfferStatus(
    driveId: string,
    uid: string,
    offerStatus: 'pending' | 'offered' | 'rejected',
    offerLetterUrl?: string,
): Promise<void> {
    const updateData: any = { offerStatus };
    if (offerLetterUrl !== undefined) {
        updateData.offerLetterUrl = offerLetterUrl;
    }
    await updateDoc(doc(db, 'placementDrives', driveId, 'registrations', uid), updateData);
}

