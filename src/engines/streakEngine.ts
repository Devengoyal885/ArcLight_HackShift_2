import type { ActivityEvent } from '../types/domain';

export function calculateActivityStreak(events: ActivityEvent[]) {
    if (!events.length) return { currentStreak: 0, longestStreak: 0, activeDays: 0, heatmap: [] };

    // Group by YYYY-MM-DD
    const activeDates = new Set<string>();
    events.forEach(e => {
        const d = new Date(e.timestamp);
        activeDates.add(d.toISOString().split('T')[0]);
    });

    const sortedDates = Array.from(activeDates).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < sortedDates.length; i++) {
        tempStreak++;
        if (i < sortedDates.length - 1) {
            const d1 = new Date(sortedDates[i]);
            const d2 = new Date(sortedDates[i + 1]);
            const diff = (d2.getTime() - d1.getTime()) / (1000 * 3600 * 24);
            if (diff > 1) {
                if (tempStreak > longestStreak) longestStreak = tempStreak;
                tempStreak = 0;
            }
        } else {
            if (tempStreak > longestStreak) longestStreak = tempStreak;
        }
    }

    // Check if current streak extends to today/yesterday
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const lastActive = sortedDates[sortedDates.length - 1];

    if (lastActive === today || lastActive === yesterday) {
        currentStreak = tempStreak;
    } else {
        currentStreak = 0;
    }

    // Heatmap data generating last 180 days
    const heatmap = [];
    const now = Date.now();
    for (let i = 180; i >= 0; i -= Math.floor(180 / 40)) { // Downsample to fit generic heatmap
        const d = new Date(now - i * 86400000).toISOString().split('T')[0];
        const count = events.filter(e => e.timestamp.startsWith(d)).length;
        heatmap.push({
            date: d,
            active: activeDates.has(d),
            intensity: Math.min(count / 3, 1)
        });
    }

    return {
        activeDays: activeDates.size,
        currentStreak,
        longestStreak,
        heatmap
    };
}
