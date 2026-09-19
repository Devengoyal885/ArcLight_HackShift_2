import { BaseRepository } from './BaseRepository';
import type {
    Candidate,
    Project,
    Evidence,
    ActivityEvent,
    LearningActivity,
    Assessment,
    Opportunity,
    Application,
    PracticalTrial,
    Capability
} from '../types/domain';

export const candidateRepository = new BaseRepository<Candidate>('capable_candidates');
export const projectRepository = new BaseRepository<Project>('capable_projects');
export const evidenceRepository = new BaseRepository<Evidence>('capable_evidence');
export const activityEventRepository = new BaseRepository<ActivityEvent>('capable_activity_events');
export const learningRepository = new BaseRepository<LearningActivity>('capable_learning');
export const assessmentRepository = new BaseRepository<Assessment>('capable_assessments');
export const trialRepository = new BaseRepository<PracticalTrial>('capable_trials');
export const opportunityRepository = new BaseRepository<Opportunity>('capable_opportunities');
export const applicationRepository = new BaseRepository<Application>('capable_applications');
export const capabilityRepository = new BaseRepository<Capability>('capable_capabilities');
