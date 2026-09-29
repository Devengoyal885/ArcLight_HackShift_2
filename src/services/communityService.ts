/**
 * communityService.ts
 * ────────────────────
 * Community Forum and Events for CapAble platform.
 *
 * Firestore:
 *   forum/posts/{postId}
 *   forum/posts/{postId}/replies/{replyId}
 *   events/{eventId}
 */

import {
    collection, addDoc, getDocs, updateDoc, deleteDoc, doc,
    serverTimestamp, query, orderBy, limit, where,
    increment, arrayUnion, arrayRemove, getDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// ─── Forum Types ──────────────────────────────────────────────────────────────

export type ForumCategory =
    | 'placement_experience'
    | 'interview_tips'
    | 'company_reviews'
    | 'career_advice'
    | 'off_campus'
    | 'resume_help'
    | 'coding'
    | 'general';

export interface ForumPost {
    id?: string;
    authorUid: string;
    authorName: string;
    authorAvatar?: string;
    authorRole?: string;
    title: string;
    body: string;
    category: ForumCategory;
    tags: string[];
    upvotes: number;
    upvotedBy: string[];       // Array of UIDs
    replyCount: number;
    views: number;
    isPinned: boolean;
    isAnswered: boolean;
    createdAt?: unknown;
    updatedAt?: unknown;
}

export interface ForumReply {
    id?: string;
    postId: string;
    authorUid: string;
    authorName: string;
    authorAvatar?: string;
    authorRole?: string;
    body: string;
    upvotes: number;
    upvotedBy: string[];
    isAcceptedAnswer: boolean;
    createdAt?: unknown;
}

// ─── Event Types ──────────────────────────────────────────────────────────────

export type EventType = 'webinar' | 'workshop' | 'hackathon' | 'career_fair' | 'gd_session' | 'networking';

export interface PlatformEvent {
    id?: string;
    title: string;
    description: string;
    type: EventType;
    organizer: string;
    organizerUid?: string;
    date: string;           // ISO string
    duration?: number;      // Minutes
    link?: string;          // Registration/join link
    isOnline: boolean;
    venue?: string;
    maxParticipants?: number;
    registeredUids: string[];
    tags: string[];
    image?: string;
    createdAt?: unknown;
}

// ─── Forum CRUD ───────────────────────────────────────────────────────────────

export async function getForumPosts(
    category?: ForumCategory,
    limitCount = 20
): Promise<ForumPost[]> {
    try {
        const col = collection(db, 'forum', 'posts', 'items');
        const q = category
            ? query(col, where('category', '==', category), orderBy('createdAt', 'desc'), limit(limitCount))
            : query(col, orderBy('createdAt', 'desc'), limit(limitCount));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as ForumPost));
    } catch (e) {
        console.error('[communityService] getForumPosts error:', e);
        return [];
    }
}

export async function createForumPost(
    post: Omit<ForumPost, 'id' | 'upvotes' | 'upvotedBy' | 'replyCount' | 'views' | 'isPinned' | 'isAnswered' | 'createdAt' | 'updatedAt'>
): Promise<string> {
    const col = collection(db, 'forum', 'posts', 'items');
    const ref = await addDoc(col, {
        ...post,
        upvotes: 0,
        upvotedBy: [],
        replyCount: 0,
        views: 0,
        isPinned: false,
        isAnswered: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref.id;
}

export async function upvotePost(postId: string, uid: string, hasUpvoted: boolean): Promise<void> {
    const ref = doc(db, 'forum', 'posts', 'items', postId);
    await updateDoc(ref, {
        upvotes: hasUpvoted ? increment(-1) : increment(1),
        upvotedBy: hasUpvoted ? arrayRemove(uid) : arrayUnion(uid),
    });
}

export async function incrementPostViews(postId: string): Promise<void> {
    const ref = doc(db, 'forum', 'posts', 'items', postId);
    await updateDoc(ref, { views: increment(1) }).catch(() => {});
}

export async function deleteForumPost(postId: string): Promise<void> {
    await deleteDoc(doc(db, 'forum', 'posts', 'items', postId));
}

// ─── Forum Replies ────────────────────────────────────────────────────────────

export async function getReplies(postId: string): Promise<ForumReply[]> {
    try {
        const col = collection(db, 'forum', 'posts', 'items', postId, 'replies');
        const snap = await getDocs(query(col, orderBy('createdAt', 'asc')));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as ForumReply));
    } catch {
        return [];
    }
}

export async function addReply(
    postId: string,
    reply: Omit<ForumReply, 'id' | 'upvotes' | 'upvotedBy' | 'isAcceptedAnswer' | 'createdAt'>
): Promise<string> {
    const col = collection(db, 'forum', 'posts', 'items', postId, 'replies');
    const ref = await addDoc(col, {
        ...reply,
        postId,
        upvotes: 0,
        upvotedBy: [],
        isAcceptedAnswer: false,
        createdAt: serverTimestamp(),
    });
    // Increment post reply count
    await updateDoc(doc(db, 'forum', 'posts', 'items', postId), {
        replyCount: increment(1),
        updatedAt: serverTimestamp(),
    });
    return ref.id;
}

export async function upvoteReply(postId: string, replyId: string, uid: string, hasUpvoted: boolean): Promise<void> {
    const ref = doc(db, 'forum', 'posts', 'items', postId, 'replies', replyId);
    await updateDoc(ref, {
        upvotes: hasUpvoted ? increment(-1) : increment(1),
        upvotedBy: hasUpvoted ? arrayRemove(uid) : arrayUnion(uid),
    });
}

export async function markAcceptedAnswer(postId: string, replyId: string): Promise<void> {
    const ref = doc(db, 'forum', 'posts', 'items', postId, 'replies', replyId);
    await updateDoc(ref, { isAcceptedAnswer: true });
    await updateDoc(doc(db, 'forum', 'posts', 'items', postId), { isAnswered: true });
}

// ─── Events CRUD ──────────────────────────────────────────────────────────────

export async function getEvents(limitCount = 20): Promise<PlatformEvent[]> {
    try {
        const col = collection(db, 'events');
        const snap = await getDocs(query(col, orderBy('date', 'asc'), limit(limitCount)));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as PlatformEvent));
    } catch (e) {
        console.error('[communityService] getEvents error:', e);
        return [];
    }
}

export async function getUpcomingEvents(limitCount = 10): Promise<PlatformEvent[]> {
    try {
        const now = new Date().toISOString();
        const col = collection(db, 'events');
        const snap = await getDocs(
            query(col, where('date', '>=', now), orderBy('date', 'asc'), limit(limitCount))
        );
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as PlatformEvent));
    } catch {
        return getEvents(limitCount); // fallback without where filter
    }
}

export async function createEvent(event: Omit<PlatformEvent, 'id' | 'registeredUids' | 'createdAt'>): Promise<string> {
    const col = collection(db, 'events');
    const ref = await addDoc(col, {
        ...event,
        registeredUids: [],
        createdAt: serverTimestamp(),
    });
    return ref.id;
}

export async function registerForEvent(eventId: string, uid: string): Promise<void> {
    await updateDoc(doc(db, 'events', eventId), {
        registeredUids: arrayUnion(uid),
    });
}

export async function unregisterFromEvent(eventId: string, uid: string): Promise<void> {
    await updateDoc(doc(db, 'events', eventId), {
        registeredUids: arrayRemove(uid),
    });
}

// ─── Seed Sample Data ─────────────────────────────────────────────────────────

export async function seedSampleForumPosts(authorUid: string): Promise<void> {
    const posts: Omit<ForumPost, 'id' | 'upvotes' | 'upvotedBy' | 'replyCount' | 'views' | 'isPinned' | 'isAnswered' | 'createdAt' | 'updatedAt'>[] = [
        {
            authorUid,
            authorName: 'Platform',
            authorRole: 'admin',
            title: 'Welcome to the CapAble Community Forum! 👋',
            body: 'This is the place to share your placement experiences, ask for interview tips, and support fellow candidates. Let\'s build a strong community together!\n\nRules:\n1. Be respectful and supportive\n2. Share real experiences\n3. No spam or self-promotion\n4. Help others whenever you can',
            category: 'general',
            tags: ['welcome', 'community', 'guidelines'],
        },
        {
            authorUid,
            authorName: 'Platform',
            authorRole: 'admin',
            title: 'How I cracked Amazon SDE-1 in my 3rd attempt 🎯',
            body: 'After failing twice, I finally got my Amazon offer letter! Here\'s what changed:\n\n**Round 1 (Online Assessment):** Focused on greedy algorithms and DP. Solved 150+ LeetCode problems focusing on Amazon tag.\n\n**Round 2-4 (Technical):** Prepared behavioral questions using the STAR method. Every answer had specific Amazon leadership principles.\n\n**Key resources:**\n- Blind 75\n- Grokking the Coding Interview\n- Amazon LP questions on Glassdoor\n\nHappy to answer any questions!',
            category: 'placement_experience',
            tags: ['amazon', 'sde', 'placement', 'coding'],
        },
    ];
    
    for (const post of posts) {
        try {
            await createForumPost(post);
        } catch { /* skip if already exists */ }
    }
}

export async function seedSampleEvents(): Promise<void> {
    const events: Omit<PlatformEvent, 'id' | 'registeredUids' | 'createdAt'>[] = [
        {
            title: 'Resume Building Masterclass',
            description: 'Learn how to craft an ATS-optimized resume that gets noticed by top recruiters. Covers format, keywords, and common mistakes.',
            type: 'webinar',
            organizer: 'CapAble Team',
            date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            duration: 90,
            link: 'https://meet.google.com/placeholder',
            isOnline: true,
            tags: ['resume', 'career', 'beginner'],
            maxParticipants: 500,
        },
        {
            title: 'AI & ML Career Paths — Panel Discussion',
            description: 'Industry experts from Google, Microsoft, and startups discuss career opportunities in AI/ML, required skills, and how to break in.',
            type: 'webinar',
            organizer: 'CapAble × Industry Partners',
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            duration: 120,
            isOnline: true,
            link: 'https://meet.google.com/placeholder',
            tags: ['ai', 'ml', 'career', 'panel'],
        },
        {
            title: 'Mock GD Session — Practice Group Discussion',
            description: 'Practice group discussion skills with 6-8 participants. A moderator will provide feedback on your communication, leadership, and analytical thinking.',
            type: 'gd_session',
            organizer: 'Peer Learning Circle',
            date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            duration: 60,
            isOnline: true,
            maxParticipants: 8,
            tags: ['gd', 'group discussion', 'soft skills'],
        },
    ];
    
    for (const event of events) {
        try {
            await createEvent(event);
        } catch { /* skip */ }
    }
}
