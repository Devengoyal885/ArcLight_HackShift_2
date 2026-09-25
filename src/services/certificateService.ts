/**
 * certificateService.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Generates and stores verifiable skill certificates in Firestore.
 * Each certificate has a unique ID, is publicly accessible at
 * /certificate/:certId, and contains a QR code linking to that URL.
 */

import {
    collection, addDoc, getDoc, doc, serverTimestamp, query, where, getDocs,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface SkillCertificate {
    id?: string;
    uid: string;
    candidateName: string;
    skill: string;
    domain: string;
    score: number;          // 0–100
    grade: string;          // A+, A, B+, B, C
    issuedAt?: unknown;
    institutionCode?: string;
    institutionName?: string;
    verifyUrl?: string;
}

function scoreToGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    return 'C';
}

export async function issueCertificate(
    cert: Omit<SkillCertificate, 'id' | 'issuedAt' | 'grade' | 'verifyUrl'>
): Promise<SkillCertificate> {
    const grade = scoreToGrade(cert.score);

    const ref = await addDoc(collection(db, 'certificates'), {
        ...cert,
        grade,
        issuedAt: serverTimestamp(),
    });

    const verifyUrl = `${window.location.origin}/certificate/${ref.id}`;

    // Update doc with its own ID + verify URL
    const { updateDoc } = await import('firebase/firestore');
    await updateDoc(ref, { id: ref.id, verifyUrl });

    return { ...cert, id: ref.id, grade, verifyUrl };
}

export async function getCertificate(certId: string): Promise<SkillCertificate | null> {
    const snap = await getDoc(doc(db, 'certificates', certId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as SkillCertificate;
}

export async function getUserCertificates(uid: string): Promise<SkillCertificate[]> {
    const q = query(collection(db, 'certificates'), where('uid', '==', uid));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SkillCertificate));
}
