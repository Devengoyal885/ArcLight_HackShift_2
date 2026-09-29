/**
 * profileService.ts
 * ─────────────────
 * All Firestore read/write operations for the candidate profile.
 * Data lives at: users/{uid}/profile (document)
 *                users/{uid}/projects (subcollection)
 *                users/{uid}/capabilities (subcollection)
 *                users/{uid}/assessments (subcollection)
 *                users/{uid}/savedOpportunities (subcollection)
 *                users/{uid}/applications (subcollection)
 *                users/{uid}/learningPath (subcollection)
 *                users/{uid}/careerTarget (document)
 */

import {
    doc, getDoc, setDoc, updateDoc, collection,
    getDocs, addDoc, deleteDoc, serverTimestamp,
    query, orderBy, limit, where, arrayUnion
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = 'candidate' | 'employer' | 'academician' | 'institution';

export interface UserProfile {
    uid: string;
    name: string;
    email: string;
    role?: UserRole;
    avatar?: string;
    headline?: string;
    bio?: string;
    location?: string;
    phone?: string;
    website?: string;
    githubUsername?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
    leetcodeUsername?: string;
    resumeText?: string;
    resumeUrl?: string;
    videoPitchUrl?: string;
    skills?: string[];
    education?: any[];
    institutionCode?: string;
    department?: string;
    profileComplete: boolean;
    capabilities?: any[];
    endorsements?: { facultyUid: string; facultyName: string; date: string }[];
    hobbies?: string[];                  // NEW: hobbies & extracurriculars
    visibility?: 'public' | 'employers' | 'private';  // NEW: profile visibility
    profileViews?: number;               // NEW: view count
    isFrozen?: boolean;
    isNotInterested?: boolean;
    isVerified?: boolean;
    cgpa?: number;
    activeBacklogs?: number;
    createdAt?: unknown;
    updatedAt?: unknown;
}

export interface UserProject {
    id?: string;
    name: string;
    description?: string;
    url?: string;
    repositoryUrl?: string;
    screenshotUrl?: string;
    technologies: string[];
    source: 'github' | 'manual';
    stars?: number;
    language?: string;
    createdAt?: unknown;
    updatedAt?: unknown;
}

export interface UserCapability {
    id?: string;
    skill: string;
    score: number;              // 0-100
    confidence: 'low' | 'medium' | 'high';
    evidenceSources: string[];  // ["GitHub", "Assessment", "Project"]
    lastUpdated?: unknown;
}

export interface UserCertification {
    id?: string;
    name: string;
    issuer: string;
    issueDate: string;
    credentialId?: string;
    credentialUrl?: string;
    badgeUrl?: string;
    skills: string[];
    addedAt?: unknown;
}

export interface SavedOpportunity {
    id?: string;
    opportunityId: string;
    title: string;
    company: string;
    url?: string;
    savedAt?: unknown;
}

export interface WorkExperience {
    id?: string;
    company: string;
    role: string;
    location?: string;
    startDate: string;       // 'YYYY-MM' format
    endDate?: string;        // 'YYYY-MM' or empty = current
    current: boolean;
    description?: string;
    type: 'fulltime' | 'internship' | 'parttime' | 'freelance' | 'contract';
    addedAt?: unknown;
}

export interface Award {
    id?: string;
    title: string;
    issuer: string;
    date: string;            // 'YYYY-MM'
    description?: string;
    addedAt?: unknown;
}

export interface Language {
    id?: string;
    language: string;
    proficiency: 'native' | 'professional' | 'intermediate' | 'basic';
    score?: string;          // e.g. "IELTS 7.5", "TOEFL 110"
    addedAt?: unknown;
}

export interface Publication {
    id?: string;
    title: string;
    journal?: string;
    date: string;
    url?: string;
    coAuthors?: string;
    description?: string;
    addedAt?: unknown;
}

export interface ProfileView {
    viewerUid: string;
    viewerName?: string;
    viewerAvatar?: string;
    viewerRole?: string;
    viewedAt: unknown;
}

export interface Application {
    id?: string;
    opportunityId: string;
    title: string;
    company: string;
    url?: string;
    status: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Rejected' | 'Withdrawn';
    appliedAt?: unknown;
    updatedAt?: unknown;
}

export interface CareerTarget {
    role: string;
    setAt?: unknown;
    roadmapProgress?: string[];
}

export interface LearningResource {
    id?: string;
    resourceTitle: string;
    url: string;
    provider: string;
    skill: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedMinutes: number;
    completed: boolean;
    completedAt?: unknown;
    addedAt?: unknown;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Firestore does not accept `undefined` values.
 * This strips any key whose value is strictly `undefined` before a write.
 * Keys set to `null` are preserved (they explicitly clear a field).
 */
function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
    return Object.fromEntries(
        Object.entries(obj).filter(([, v]) => v !== undefined)
    ) as Partial<T>;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getProfile(uid: string): Promise<UserProfile | null> {
    const ref = doc(db, 'users', uid, 'profile', 'data');
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
}

export async function createProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    const ref = doc(db, 'users', uid, 'profile', 'data');
    await setDoc(ref, stripUndefined({
        uid,
        profileComplete: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...data,
    }));
}

export async function updateProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    const ref = doc(db, 'users', uid, 'profile', 'data');
    await setDoc(ref, stripUndefined({ ...data, updatedAt: serverTimestamp() }), { merge: true });
}

export async function endorseCandidate(candidateUid: string, facultyUid: string, facultyName: string): Promise<void> {
    const ref = doc(db, 'users', candidateUid, 'profile', 'data');
    await updateDoc(ref, {
        endorsements: arrayUnion({
            facultyUid,
            facultyName,
            date: new Date().toISOString()
        })
    });
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function getProjects(uid: string): Promise<UserProject[]> {
    const col = collection(db, 'users', uid, 'projects');
    const snap = await getDocs(query(col, orderBy('updatedAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProject));
}

export async function saveProjects(uid: string, projects: UserProject[]): Promise<void> {
    const col = collection(db, 'users', uid, 'projects');
    for (const proj of projects) {
        await addDoc(col, { ...proj, updatedAt: serverTimestamp() });
    }
}

export async function clearManualProjects(uid: string): Promise<void> {
    const col = collection(db, 'users', uid, 'projects');
    const existing = await getDocs(col);
    for (const d of existing.docs) {
        if (d.data().source === 'manual') {
            await deleteDoc(d.ref);
        }
    }
}

export async function deleteProject(uid: string, projectId: string): Promise<void> {
    await deleteDoc(doc(db, 'users', uid, 'projects', projectId));
}

export async function updateProject(uid: string, projectId: string, updates: Partial<UserProject>): Promise<void> {
    await updateDoc(doc(db, 'users', uid, 'projects', projectId), { ...updates, updatedAt: serverTimestamp() });
}

// ─── Capabilities ─────────────────────────────────────────────────────────────

export async function getCapabilities(uid: string): Promise<UserCapability[]> {
    const col = collection(db, 'users', uid, 'capabilities');
    const snap = await getDocs(col);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as UserCapability));
}

export async function saveCapabilities(uid: string, caps: UserCapability[]): Promise<void> {
    // Overwrite all capabilities
    const col = collection(db, 'users', uid, 'capabilities');
    const existing = await getDocs(col);
    for (const d of existing.docs) await deleteDoc(d.ref);
    for (const cap of caps) {
        await addDoc(col, { ...cap, lastUpdated: serverTimestamp() });
    }
}

export async function addCapability(uid: string, cap: Omit<UserCapability, 'id'>): Promise<string> {
    const col = collection(db, 'users', uid, 'capabilities');
    const docRef = await addDoc(col, { ...cap, lastUpdated: serverTimestamp() });
    return docRef.id;
}

export async function deleteCapability(uid: string, capId: string): Promise<void> {
    await deleteDoc(doc(db, 'users', uid, 'capabilities', capId));
}

// ─── Certifications ───────────────────────────────────────────────────────────

export async function getCertifications(uid: string): Promise<UserCertification[]> {
    const col = collection(db, 'users', uid, 'certifications');
    const snap = await getDocs(query(col, orderBy('addedAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as UserCertification));
}

export async function addCertification(uid: string, cert: Omit<UserCertification, 'id'>): Promise<string> {
    const col = collection(db, 'users', uid, 'certifications');
    const docRef = await addDoc(col, { ...cert, addedAt: serverTimestamp() });
    return docRef.id;
}

export async function deleteCertification(uid: string, certId: string): Promise<void> {
    await deleteDoc(doc(db, 'users', uid, 'certifications', certId));
}

// ─── Saved Opportunities ──────────────────────────────────────────────────────

export async function getSavedOpportunities(uid: string): Promise<SavedOpportunity[]> {
    const col = collection(db, 'users', uid, 'savedOpportunities');
    const snap = await getDocs(query(col, orderBy('savedAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SavedOpportunity));
}

export async function saveOpportunity(uid: string, opp: Omit<SavedOpportunity, 'id'>): Promise<void> {
    const col = collection(db, 'users', uid, 'savedOpportunities');
    await addDoc(col, { ...opp, savedAt: serverTimestamp() });
}

export async function unsaveOpportunity(uid: string, savedId: string): Promise<void> {
    await deleteDoc(doc(db, 'users', uid, 'savedOpportunities', savedId));
}

// ─── Applications ─────────────────────────────────────────────────────────────

export async function getApplications(uid: string): Promise<Application[]> {
    const col = collection(db, 'users', uid, 'applications');
    const snap = await getDocs(query(col, orderBy('appliedAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Application));
}

export async function addApplication(uid: string, app: Omit<Application, 'id'>): Promise<void> {
    const col = collection(db, 'users', uid, 'applications');
    await addDoc(col, { ...app, appliedAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export async function updateApplicationStatus(uid: string, appId: string, status: Application['status']): Promise<void> {
    await updateDoc(doc(db, 'users', uid, 'applications', appId), { status, updatedAt: serverTimestamp() });
}

// ─── Career Target ────────────────────────────────────────────────────────────

export async function getCareerTarget(uid: string): Promise<CareerTarget | null> {
    const ref = doc(db, 'users', uid, 'career', 'target');
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as CareerTarget;
}

export async function setCareerTarget(uid: string, target: CareerTarget): Promise<void> {
    await setDoc(doc(db, 'users', uid, 'career', 'target'), {
        ...target, setAt: serverTimestamp()
    });
}

// ─── Learning Path ────────────────────────────────────────────────────────────

export async function getLearningPath(uid: string): Promise<LearningResource[]> {
    const col = collection(db, 'users', uid, 'learningPath');
    const snap = await getDocs(query(col, orderBy('addedAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as LearningResource));
}

export async function saveLearningPath(uid: string, resources: LearningResource[]): Promise<void> {
    const col = collection(db, 'users', uid, 'learningPath');
    for (const r of resources) {
        await addDoc(col, { ...r, addedAt: serverTimestamp() });
    }
}

export async function markLearningComplete(uid: string, resourceId: string): Promise<void> {
    await updateDoc(doc(db, 'users', uid, 'learningPath', resourceId), {
        completed: true, completedAt: serverTimestamp()
    });
}

// ─── Assessment Results ───────────────────────────────────────────────────────

export interface AssessmentRecord {
    id?: string;
    domain: string;
    score: number;
    correctCount: number;
    totalCount: number;
    timeTakenSeconds: number;
    topicBreakdown: { topic: string; correct: number; total: number; percentage: number }[];
    completedAt?: unknown;
}

export async function getAssessmentHistory(uid: string): Promise<AssessmentRecord[]> {
    const col = collection(db, 'users', uid, 'assessments');
    const snap = await getDocs(query(col, orderBy('completedAt', 'desc'), limit(50)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AssessmentRecord));
}

export async function saveAssessmentResult(uid: string, result: Omit<AssessmentRecord, 'id'>): Promise<void> {
    const col = collection(db, 'users', uid, 'assessments');
    await addDoc(col, { ...result, completedAt: serverTimestamp() });
}

export async function getLatestScoreForDomain(uid: string, domain: string): Promise<number | null> {
    const col = collection(db, 'users', uid, 'assessments');
    const q = query(col, where('domain', '==', domain), orderBy('completedAt', 'desc'), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return (snap.docs[0].data() as AssessmentRecord).score;
}

// ─── Institution-scoped Discovery (for faculty/admin) ────────────────────────

/**
 * Uses collectionGroup to query across ALL users' profile subcollections.
 * Intentionally avoids a where() on the collectionGroup query since that
 * would require a Firestore composite index. Instead we fetch all profile/data
 * docs and filter by role + institutionCode in JS — zero index setup required.
 */
async function getAllProfilesFromGroup(): Promise<UserProfile[]> {
    const { collectionGroup: cg } = await import('firebase/firestore');
    const snap = await getDocs(cg(db, 'profile'));
    return snap.docs.map(d => d.data() as UserProfile);
}

export async function getCandidatesByInstitution(institutionCode: string): Promise<UserProfile[]> {
    if (!institutionCode?.trim()) return [];
    const code = institutionCode.trim().toUpperCase();
    try {
        const all = await getAllProfilesFromGroup();
        return all.filter(p =>
            p.role === 'candidate' &&
            (p.institutionCode || '').trim().toUpperCase() === code
        );
    } catch (e) {
        console.error('[profileService] getCandidatesByInstitution failed:', e);
        return [];
    }
}

export async function getFacultyByInstitution(institutionCode: string): Promise<UserProfile[]> {
    if (!institutionCode?.trim()) return [];
    const code = institutionCode.trim().toUpperCase();
    try {
        const all = await getAllProfilesFromGroup();
        return all.filter(p =>
            p.role === 'academician' &&
            (p.institutionCode || '').trim().toUpperCase() === code
        );
    } catch (e) {
        console.error('[profileService] getFacultyByInstitution failed:', e);
        return [];
    }
}

export async function getAllEmployers(): Promise<UserProfile[]> {
    try {
        const all = await getAllProfilesFromGroup();
        return all.filter(p => p.role === 'employer');
    } catch (e) {
        console.error('[profileService] getAllEmployers failed:', e);
        return [];
    }
}

// ─── Coding Submissions & Stats ───────────────────────────────────────────────

export interface CodingSubmissionRecord {
    id?: string;
    problemId: string;
    problemTitle: string;
    domain: string;
    topic: string;
    difficulty: 'easy' | 'medium' | 'hard';
    language: string;
    code: string;
    passedCount: number;
    totalCount: number;
    score: number;
    timeTakenSeconds: number;
    status: 'accepted' | 'partial' | 'failed';
    errorType?: string;
    memoryUsedKb?: number;
    submittedAt: unknown;
}

/** Save a single coding submission to Firestore */
export async function saveCodingSubmission(
    uid: string,
    submission: Omit<CodingSubmissionRecord, 'id' | 'submittedAt'>
): Promise<string> {
    const col = collection(db, 'users', uid, 'codingSubmissions');
    const ref = await addDoc(col, {
        ...submission,
        submittedAt: serverTimestamp(),
    });
    return ref.id;
}

/** Get recent coding submissions for a user */
export async function getCodingSubmissions(
    uid: string,
    limitCount = 50
): Promise<CodingSubmissionRecord[]> {
    const col = collection(db, 'users', uid, 'codingSubmissions');
    const q = query(col, orderBy('submittedAt', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CodingSubmissionRecord));
}

/** Compute coding stats from all submissions */
export async function getCodingStats(uid: string): Promise<{
    totalSolved: number;
    totalAttempted: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    acceptanceRate: number;
    byDomain: Record<string, number>;
    byLanguage: Record<string, number>;
    favoriteLanguage: string | null;
    recentSubmissions: CodingSubmissionRecord[];
    activityHeatmap: Record<string, number>;
}> {
    const submissions = await getCodingSubmissions(uid, 200);
    const accepted = submissions.filter(s => s.status === 'accepted');
    const solvedIds = new Set(accepted.map(s => s.problemId));
    const byDomain: Record<string, number> = {};
    const byLanguage: Record<string, number> = {};
    const heatmap: Record<string, number> = {};

    for (const s of submissions) {
        if (s.status === 'accepted') byDomain[s.domain] = (byDomain[s.domain] || 0) + 1;
        byLanguage[s.language] = (byLanguage[s.language] || 0) + 1;
        if (s.submittedAt) {
            try {
                const ts = (s.submittedAt as any).toDate?.() ?? new Date(s.submittedAt as any);
                const dateKey = ts.toISOString().slice(0, 10);
                heatmap[dateKey] = (heatmap[dateKey] || 0) + 1;
            } catch { /* skip */ }
        }
    }

    const favLang = Object.entries(byLanguage).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    return {
        totalSolved: solvedIds.size,
        totalAttempted: new Set(submissions.map(s => s.problemId)).size,
        easySolved: accepted.filter(s => s.difficulty === 'easy').length,
        mediumSolved: accepted.filter(s => s.difficulty === 'medium').length,
        hardSolved: accepted.filter(s => s.difficulty === 'hard').length,
        acceptanceRate: submissions.length > 0 ? Math.round((accepted.length / submissions.length) * 100) : 0,
        byDomain,
        byLanguage,
        favoriteLanguage: favLang,
        recentSubmissions: submissions.slice(0, 10),
        activityHeatmap: heatmap,
    };
}

/** Save or update the ML-style learning pattern for a user */
export async function saveLearningPattern(uid: string, pattern: Record<string, unknown>): Promise<void> {
    const ref = doc(db, 'users', uid, 'learningPattern', 'data');
    await setDoc(ref, { ...pattern, updatedAt: serverTimestamp() }, { merge: true });
}

/** Get the learning pattern for a user */
export async function getLearningPattern(uid: string): Promise<Record<string, unknown> | null> {
    const ref = doc(db, 'users', uid, 'learningPattern', 'data');
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
}

/** Compute which resume skills are verified by actual coding performance */
export async function getResumeSkillVerification(
    uid: string,
    resumeSkills: string[]
): Promise<Array<{ skill: string; status: 'verified' | 'unverified' | 'mismatch'; score: number; evidence: string }>> {
    const submissions = await getCodingSubmissions(uid, 200);
    const accepted = submissions.filter(s => s.status === 'accepted');

    const langMap: Record<string, string[]> = {
        python: ['python', 'python3', 'py'],
        javascript: ['javascript', 'js', 'node', 'nodejs', 'react', 'vue', 'angular'],
        typescript: ['typescript', 'ts'],
        java: ['java', 'spring', 'android'],
        cpp: ['c++', 'cpp'],
        c: ['c language'],
        go: ['golang', 'go lang'],
        rust: ['rust'],
        kotlin: ['kotlin'],
        csharp: ['c#', 'csharp', '.net'],
    };

    return resumeSkills.map(skill => {
        const sl = skill.toLowerCase().trim();
        const matchedLang = Object.entries(langMap).find(([, aliases]) =>
            aliases.some(a => sl.includes(a) || a.includes(sl))
        );
        if (matchedLang) {
            const langSubs = accepted.filter(s => s.language === matchedLang[0]);
            if (langSubs.length >= 3) {
                const avg = langSubs.reduce((s, sub) => s + sub.score, 0) / langSubs.length;
                return { skill, status: avg >= 70 ? 'verified' : 'mismatch' as const, score: Math.round(avg), evidence: `${langSubs.length} problems solved` };
            }
            return { skill, status: 'unverified' as const, score: 0, evidence: langSubs.length > 0 ? `Only ${langSubs.length} problem(s) — needs more` : 'No submissions found' };
        }
        const domainMap: Record<string, string[]> = {
            dsa: ['data structures', 'algorithms', 'dsa', 'leetcode'],
            system_design: ['system design', 'distributed systems'],
            dbms: ['sql', 'database', 'mysql', 'postgresql'],
            devops: ['devops', 'docker', 'kubernetes'],
        };
        for (const [domain, aliases] of Object.entries(domainMap)) {
            if (aliases.some(a => sl.includes(a) || a.includes(sl))) {
                const domSubs = accepted.filter(s => s.domain === domain);
                if (domSubs.length >= 3) return { skill, status: 'verified' as const, score: Math.min(100, domSubs.length * 10), evidence: `${domSubs.length} problems solved` };
                if (domSubs.length > 0) return { skill, status: 'unverified' as const, score: 0, evidence: `${domSubs.length} problem(s) — needs more` };
            }
        }
        return { skill, status: 'unverified' as const, score: 0, evidence: 'No related activity found' };
    });
}
// ─── Work Experience ──────────────────────────────────────────────────────────

export async function getWorkExperiences(uid: string): Promise<WorkExperience[]> {
    const col = collection(db, 'users', uid, 'workExperiences');
    const snap = await getDocs(query(col, orderBy('addedAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkExperience));
}

export async function addWorkExperience(uid: string, data: Omit<WorkExperience, 'id' | 'addedAt'>): Promise<string> {
    const col = collection(db, 'users', uid, 'workExperiences');
    const ref = await addDoc(col, { ...data, addedAt: serverTimestamp() });
    return ref.id;
}

export async function deleteWorkExperience(uid: string, id: string): Promise<void> {
    await deleteDoc(doc(db, 'users', uid, 'workExperiences', id));
}

export async function updateWorkExperience(uid: string, id: string, data: Partial<WorkExperience>): Promise<void> {
    await setDoc(doc(db, 'users', uid, 'workExperiences', id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// ─── Awards & Honors ─────────────────────────────────────────────────────────

export async function getAwards(uid: string): Promise<Award[]> {
    const col = collection(db, 'users', uid, 'awards');
    const snap = await getDocs(query(col, orderBy('addedAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Award));
}

export async function addAward(uid: string, data: Omit<Award, 'id' | 'addedAt'>): Promise<string> {
    const col = collection(db, 'users', uid, 'awards');
    const ref = await addDoc(col, { ...data, addedAt: serverTimestamp() });
    return ref.id;
}

export async function deleteAward(uid: string, id: string): Promise<void> {
    await deleteDoc(doc(db, 'users', uid, 'awards', id));
}

// ─── Languages ────────────────────────────────────────────────────────────────

export async function getLanguages(uid: string): Promise<Language[]> {
    const col = collection(db, 'users', uid, 'languages');
    const snap = await getDocs(col);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Language));
}

export async function addLanguage(uid: string, data: Omit<Language, 'id' | 'addedAt'>): Promise<string> {
    const col = collection(db, 'users', uid, 'languages');
    const ref = await addDoc(col, { ...data, addedAt: serverTimestamp() });
    return ref.id;
}

export async function deleteLanguage(uid: string, id: string): Promise<void> {
    await deleteDoc(doc(db, 'users', uid, 'languages', id));
}

// ─── Publications ─────────────────────────────────────────────────────────────

export async function getPublications(uid: string): Promise<Publication[]> {
    const col = collection(db, 'users', uid, 'publications');
    const snap = await getDocs(query(col, orderBy('addedAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Publication));
}

export async function addPublication(uid: string, data: Omit<Publication, 'id' | 'addedAt'>): Promise<string> {
    const col = collection(db, 'users', uid, 'publications');
    const ref = await addDoc(col, { ...data, addedAt: serverTimestamp() });
    return ref.id;
}

export async function deletePublication(uid: string, id: string): Promise<void> {
    await deleteDoc(doc(db, 'users', uid, 'publications', id));
}

// ─── Profile Views ────────────────────────────────────────────────────────────

export async function recordProfileView(viewedUid: string, viewer: Omit<ProfileView, 'viewedAt'>): Promise<void> {
    try {
        // Store individual view record
        const viewsCol = collection(db, 'users', viewedUid, 'profileViews');
        await addDoc(viewsCol, { ...viewer, viewedAt: serverTimestamp() });
        // Increment total counter on profile
        const profileRef = doc(db, 'users', viewedUid, 'profile', 'data');
        const snap = await getDoc(profileRef);
        const current = snap.exists() ? (snap.data().profileViews || 0) : 0;
        await setDoc(profileRef, { profileViews: current + 1 }, { merge: true });
    } catch { /* fail silently — view tracking is non-critical */ }
}

export async function getRecentProfileViews(uid: string, limitCount = 10): Promise<ProfileView[]> {
    const col = collection(db, 'users', uid, 'profileViews');
    const snap = await getDocs(query(col, orderBy('viewedAt', 'desc'), limit(limitCount)));
    return snap.docs.map(d => d.data() as ProfileView);
}

// ─── Profile Completeness ─────────────────────────────────────────────────────

export function computeProfileCompleteness(profile: UserProfile | null, extras: {
    hasCapabilities: boolean;
    hasCertifications: boolean;
    hasProjects: boolean;
    hasWorkExperience: boolean;
    hasEducation: boolean;
}): { score: number; suggestions: { label: string; action: string; points: number }[] } {
    if (!profile) return { score: 0, suggestions: [] };
    const suggestions: { label: string; action: string; points: number }[] = [];
    let score = 0;

    const checks: [boolean, string, string, number][] = [
        [!!profile.avatar, 'Add a profile photo', 'Upload your photo in the profile section', 10],
        [!!profile.name?.trim(), 'Add your full name', 'Edit your profile to add your name', 5],
        [!!profile.headline?.trim(), 'Add a professional headline', 'e.g. "Final Year CSE Student | MERN Developer"', 5],
        [!!profile.bio?.trim(), 'Write a bio / summary', 'Add 2-3 sentences about yourself and your goals', 5],
        [!!profile.location?.trim(), 'Add your location', 'City, State — helps with local opportunity matching', 5],
        [!!profile.linkedinUrl?.trim(), 'Connect LinkedIn', 'Link your LinkedIn profile for social proof', 5],
        [!!profile.githubUsername?.trim(), 'Connect GitHub', 'Sync your repos for automatic skill detection', 10],
        [!!profile.resumeUrl, 'Upload your resume', 'Upload a PDF resume for AI parsing', 10],
        [extras.hasCapabilities, 'Add skills / capabilities', 'Add at least 3 skills to your capability profile', 10],
        [extras.hasCertifications, 'Add certifications', 'Add any certifications or courses completed', 5],
        [extras.hasProjects, 'Showcase a project', 'Add at least one personal/academic project', 10],
        [extras.hasWorkExperience, 'Add work experience', 'Add internships, part-time jobs, or freelance work', 10],
        [extras.hasEducation, 'Add education', 'Add your college and degree details', 10],
    ];

    for (const [done, label, action, points] of checks) {
        if (done) {
            score += points;
        } else {
            suggestions.push({ label, action, points });
        }
    }

    return { score: Math.min(100, score), suggestions };
}

export async function uploadOfferLetterToApplication(
    opportunityId: string,
    applicationId: string,
    file: File
): Promise<string> {
    const fileRef = ref(storage, `offerLetters/${opportunityId}/${applicationId}/${file.name}`);
    await uploadBytes(fileRef, file);
    const downloadUrl = await getDownloadURL(fileRef);

    const appRef = doc(db, 'postedRoles', opportunityId, 'applications', applicationId);
    await updateDoc(appRef, { offerLetterUrl: downloadUrl });

    return downloadUrl;
}
