/**
 * interviewSchedulerService.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Manages interview slots:
 *   employers/{uid}/interviewSlots/{slotId}        — available slots
 *   postedRoles/{roleId}/applications/{appId}      — booked slot stored on application
 *   notifications/{candidateUid}/items             — notifies candidate
 */

import {
    collection, addDoc, getDocs, updateDoc, deleteDoc,
    doc, query, orderBy, serverTimestamp, where, getDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { createNotification } from './notificationService';

export interface InterviewSlot {
    id?: string;
    employerUid: string;
    roleId: string;
    roleTitle: string;
    date: string;           // ISO date string 'YYYY-MM-DD'
    time: string;           // '10:00 AM'
    duration: number;       // minutes
    mode: 'video' | 'in_person' | 'phone';
    meetLink?: string;
    venue?: string;
    status: 'available' | 'booked' | 'cancelled';
    bookedByUid?: string;
    bookedByName?: string;
    createdAt?: unknown;
}

export interface BookingPayload {
    candidateUid: string;
    candidateName: string;
    candidateEmail: string;
    appId: string;
}

// ── Employer: create a slot ───────────────────────────────────────────────────

export async function createInterviewSlot(
    employerUid: string,
    slot: Omit<InterviewSlot, 'id' | 'employerUid' | 'status' | 'createdAt'>
): Promise<string> {
    const ref = await addDoc(collection(db, 'employers', employerUid, 'interviewSlots'), {
        ...slot,
        employerUid,
        status: 'available',
        createdAt: serverTimestamp(),
    });
    return ref.id;
}

// ── Employer: get all slots for a role ────────────────────────────────────────

export async function getInterviewSlots(
    employerUid: string,
    roleId?: string,
): Promise<InterviewSlot[]> {
    const col = collection(db, 'employers', employerUid, 'interviewSlots');
    const q = roleId
        ? query(col, where('roleId', '==', roleId), orderBy('date'), orderBy('time'))
        : query(col, orderBy('date'), orderBy('time'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as InterviewSlot));
}

// ── Employer: book a slot for a candidate ─────────────────────────────────────

export async function bookInterviewSlot(
    employerUid: string,
    slotId: string,
    payload: BookingPayload,
): Promise<void> {
    // Mark slot as booked
    await updateDoc(doc(db, 'employers', employerUid, 'interviewSlots', slotId), {
        status: 'booked',
        bookedByUid: payload.candidateUid,
        bookedByName: payload.candidateName,
    });

    // Fetch slot details to notify candidate
    const slotSnap = await getDoc(doc(db, 'employers', employerUid, 'interviewSlots', slotId));
    const slot = slotSnap.data() as InterviewSlot;

    // Update application status
    await updateDoc(doc(db, 'postedRoles', slot.roleId, 'applications', payload.appId), {
        status: 'Interview Scheduled',
        interviewDetails: {
            venue: slot.mode === 'video' ? (slot.meetLink || 'Video call — link TBA') : (slot.venue || 'To be confirmed'),
            date: slot.date,
            time: slot.time,
            mode: slot.mode,
            duration: slot.duration,
        },
    });

    // Notify candidate
    await createNotification(payload.candidateUid, {
        type: 'interview_scheduled',
        title: '🗓️ Interview Scheduled!',
        message: `Your interview for "${slot.roleTitle}" is on ${slot.date} at ${slot.time} (${slot.mode === 'video' ? 'Video Call' : slot.venue || 'In-person'}). Duration: ${slot.duration} min.`,
        link: '/candidate/applications',
    });
}

// ── Employer: cancel a slot ───────────────────────────────────────────────────

export async function cancelInterviewSlot(
    employerUid: string,
    slotId: string,
): Promise<void> {
    await updateDoc(doc(db, 'employers', employerUid, 'interviewSlots', slotId), {
        status: 'cancelled',
    });
}

// ── Employer: delete a slot ───────────────────────────────────────────────────

export async function deleteInterviewSlot(
    employerUid: string,
    slotId: string,
): Promise<void> {
    await deleteDoc(doc(db, 'employers', employerUid, 'interviewSlots', slotId));
}
