import { db } from '../lib/firebase';
import { doc, updateDoc, increment, getDoc, collection, query, orderBy, limit, getDocs, setDoc } from 'firebase/firestore';

export interface LeaderboardUser {
    id: string;
    name: string;
    score: number;
    branch: string;
    avatar?: string;
    trend: 'up' | 'down' | 'flat';
    change: string;
}

export const addPoints = async (userId: string, points: number, reason: string) => {
    const userRef = doc(db, 'users', userId);
    
    // Check if user document exists, if not, wait for profile creation or init it
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
        // Technically profileService creates this, but just in case
        await setDoc(userRef, { totalScore: points, recentPoints: points }, { merge: true });
    } else {
        await updateDoc(userRef, {
            totalScore: increment(points),
            recentPoints: increment(points) // Used for trend calculation later
        });
    }

    // Log the transaction
    const historyRef = doc(collection(userRef, 'scoreHistory'));
    await setDoc(historyRef, {
        points,
        reason,
        timestamp: new Date().toISOString()
    });
};

export const getLeaderboard = async (limitCount = 10): Promise<LeaderboardUser[]> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('totalScore', 'desc'), limit(limitCount));
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name || 'Anonymous Student',
            score: data.totalScore || 0,
            branch: data.branch || 'CSE',
            avatar: data.avatar || '',
            trend: data.recentPoints > 0 ? 'up' : 'flat',
            change: data.recentPoints > 0 ? `+${data.recentPoints}` : '0'
        } as LeaderboardUser;
    });
};
