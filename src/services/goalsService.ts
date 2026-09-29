/**
 * goalsService.ts
 * ───────────────
 * Goal setting with deadline tracking for candidates.
 *
 * Firestore:
 *   users/{uid}/goals/{goalId}
 */

import {
    collection, addDoc, getDocs, updateDoc, deleteDoc, doc,
    serverTimestamp, query, orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export type GoalCategory =
    | 'skill'
    | 'job_application'
    | 'preparation'
    | 'learning'
    | 'networking'
    | 'certification'
    | 'other';

export type GoalStatus = 'active' | 'completed' | 'overdue' | 'paused';

export interface Goal {
    id?: string;
    title: string;
    description?: string;
    category: GoalCategory;
    deadline: string;           // ISO date string 'YYYY-MM-DD'
    status: GoalStatus;
    progress: number;           // 0-100
    milestones?: GoalMilestone[];
    linkedSkill?: string;       // Optional skill link
    linkedCourse?: string;      // Optional course link
    reminderEnabled: boolean;
    createdAt?: unknown;
    updatedAt?: unknown;
    completedAt?: unknown;
}

export interface GoalMilestone {
    id: string;
    title: string;
    completed: boolean;
    completedAt?: string;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function getGoals(uid: string): Promise<Goal[]> {
    try {
        const col = collection(db, 'users', uid, 'goals');
        const snap = await getDocs(query(col, orderBy('deadline', 'asc')));
        const goals = snap.docs.map(d => ({ id: d.id, ...d.data() } as Goal));
        
        // Auto-update overdue status
        const now = new Date();
        for (const goal of goals) {
            if (goal.status === 'active' && new Date(goal.deadline) < now) {
                goal.status = 'overdue';
                updateGoal(uid, goal.id!, { status: 'overdue' }).catch(() => {});
            }
        }
        return goals;
    } catch (e) {
        console.error('[goalsService] getGoals failed:', e);
        return [];
    }
}

export async function addGoal(uid: string, goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const col = collection(db, 'users', uid, 'goals');
    const ref = await addDoc(col, {
        ...goal,
        milestones: goal.milestones || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref.id;
}

export async function updateGoal(uid: string, goalId: string, data: Partial<Goal>): Promise<void> {
    await updateDoc(doc(db, 'users', uid, 'goals', goalId), {
        ...data,
        updatedAt: serverTimestamp(),
        ...(data.status === 'completed' ? { completedAt: serverTimestamp() } : {}),
    });
}

export async function deleteGoal(uid: string, goalId: string): Promise<void> {
    await deleteDoc(doc(db, 'users', uid, 'goals', goalId));
}

export async function toggleMilestone(
    uid: string,
    goalId: string,
    milestoneId: string,
    currentMilestones: GoalMilestone[]
): Promise<GoalMilestone[]> {
    const updated = currentMilestones.map(m =>
        m.id === milestoneId
            ? { ...m, completed: !m.completed, completedAt: !m.completed ? new Date().toISOString() : undefined }
            : m
    );
    const completedCount = updated.filter(m => m.completed).length;
    const progress = updated.length > 0 ? Math.round((completedCount / updated.length) * 100) : 0;
    
    await updateGoal(uid, goalId, {
        milestones: updated,
        progress,
        status: progress === 100 ? 'completed' : 'active',
    });
    return updated;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export function computeGoalStats(goals: Goal[]): {
    total: number;
    active: number;
    completed: number;
    overdue: number;
    avgProgress: number;
    completionRate: number;
    upcomingDeadlines: Goal[];
} {
    const active = goals.filter(g => g.status === 'active').length;
    const completed = goals.filter(g => g.status === 'completed').length;
    const overdue = goals.filter(g => g.status === 'overdue').length;
    const avgProgress = goals.length > 0
        ? Math.round(goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length)
        : 0;
    const completionRate = goals.length > 0
        ? Math.round((completed / goals.length) * 100)
        : 0;
    
    const now = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines = goals
        .filter(g => g.status === 'active' && new Date(g.deadline) <= sevenDays)
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

    return { total: goals.length, active, completed, overdue, avgProgress, completionRate, upcomingDeadlines };
}
