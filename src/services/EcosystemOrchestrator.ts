import type { Project, ActivityEvent, Evidence } from '../types/domain';
import {
    projectRepository,
    activityEventRepository,
    evidenceRepository
} from '../repositories';

/**
 * Ecosystem Orchestrator Layer
 * Provides high-level mutation pipelines. UI calling this function triggers the full cascading flow.
 */
export const EcosystemOrchestrator = {
    triggerProjectCompletion: (project: Project) => {
        // 1. Mark Project Status
        project.status = 'completed';
        projectRepository.save(project);

        // 2. Generate Event
        const event: ActivityEvent = {
            id: `evt_${crypto.randomUUID()}`,
            type: 'project_updated',
            entityId: project.id,
            timestamp: new Date().toISOString(),
            capabilityIds: project.capabilityIds
        };
        activityEventRepository.save(event);

        // 3. Generate Evidence Automatically over the related capabilities
        const evidence: Evidence = {
            id: `ev_${crypto.randomUUID()}`,
            title: `Completed Project: ${project.title}`,
            type: 'project',
            description: project.description,
            capabilityIds: project.capabilityIds,
            sourceId: project.id,
            verificationStatus: 'unverified',
            strength: 75,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        evidenceRepository.save(evidence);

        // NOTE: Capabilities are technically completely derived by `recalculateCapabilities`
        // in `profileEngine.ts` upon read, so we don't necessarily update static tables if not caching.
    },

    // ... Additional lifecycles (Learning, Application) can be similarly composed
};
