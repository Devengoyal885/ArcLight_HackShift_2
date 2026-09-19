import type { Candidate, Capability, SkillGap } from '../types/domain';

export function calculateSkillGaps(candidate: Candidate, capabilities: Capability[]): SkillGap[] {
    // Example: based on career goal, define target caps
    const targetCaps: Record<string, number> = {};
    if (candidate.careerGoal.toLowerCase().includes('ai')) {
        targetCaps['cap_ml'] = 80;
        targetCaps['cap_python'] = 85;
        targetCaps['cap_math'] = 75;
    } else if (candidate.careerGoal.toLowerCase().includes('front')) {
        targetCaps['cap_react'] = 85;
        targetCaps['cap_css'] = 80;
    }

    const gaps: SkillGap[] = [];
    Object.keys(targetCaps).forEach(key => {
        const found = capabilities.find(c => c.id === key);
        const currentScore = found ? found.score : 0;
        const target = targetCaps[key];
        if (currentScore < target) {
            gaps.push({
                capabilityName: found ? found.name : key.replace('cap_', '').toUpperCase(),
                currentScore,
                targetScore: target,
                gap: target - currentScore
            });
        }
    });

    return gaps;
}
