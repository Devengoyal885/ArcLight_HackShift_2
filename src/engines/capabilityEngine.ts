import type { Capability, Evidence } from '../types/domain';

/**
 * Calculates raw capability score based on evidence strength
 */
export function recalculateCapabilities(
    capabilities: Capability[],
    evidence: Evidence[]
): Capability[] {
    return capabilities.map(cap => {
        // Find all evidence tied to this capability
        const relatedEvidence = evidence.filter(e => e.capabilityIds.includes(cap.id));

        let totalStrength = 0;
        let verifiedCount = 0;

        relatedEvidence.forEach(ev => {
            totalStrength += ev.strength;
            if (ev.verificationStatus === 'verified') {
                verifiedCount += 1;
            }
        });

        // Derive confidence - caps at 100
        // e.g. 5 pieces of evidence loosely equals 100% confidence
        const confidence = Math.min(Math.round((relatedEvidence.length / 5) * 100), 100);

        // Derive score based on evidence strength averages, highly simplified logic
        let rawScore = cap.score;
        if (relatedEvidence.length > 0) {
            rawScore = Math.min(Math.round(totalStrength / relatedEvidence.length), 100);
        }

        // Derive Status
        let status = cap.status;
        if (verifiedCount > 0) {
            status = 'verified';
        } else if (relatedEvidence.some(e => e.type === 'assessment' || e.type === 'practical_trial')) {
            status = 'assessed';
        } else if (relatedEvidence.some(e => e.type === 'project' || e.type === 'learning')) {
            status = 'practised';
        }

        return {
            ...cap,
            score: rawScore,
            confidence: confidence,
            status: status,
            lastUpdated: new Date().toISOString()
        };
    });
}
