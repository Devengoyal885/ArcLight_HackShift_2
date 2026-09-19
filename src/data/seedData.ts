import {
    candidateRepository,
    projectRepository,
    evidenceRepository,
    activityEventRepository,
    learningRepository
} from '../repositories';
import type {
    Candidate,
    Project,
    Evidence,
    ActivityEvent,
    LearningActivity
} from '../types/domain';

export function seedEcosystem() {
    // Only seed if ecosystem is entirely empty
    if (candidateRepository.getAll().length > 0) return;

    console.log("Seeding CapAble Ecosystem with Connected Records...");

    const candidateId = "cand_" + crypto.randomUUID();

    const candidate: Candidate = {
        id: candidateId,
        name: "Siddharth Singh",
        username: "siddharthsingh",
        avatar: "https://i.pravatar.cc/150?u=siddharth",
        headline: "Innovating at the intersection of AI and Web",
        bio: "Building next-generation intelligent platforms.",
        location: "Delhi, India",
        education: ["Delhi Technological University"],
        experience: ["Software Engineer Intern @ TechCorp"],
        careerGoal: "AI Engineer",
        preferredRoles: ["Software Engineer", "AI Engineer"],
        socialLinks: {
            github: "https://github.com/siddharth",
            linkedin: "https://linkedin.com/in/siddharth"
        },
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
    };
    candidateRepository.save(candidate);

    // Initial Capabilities are created by the capability engine usually, but we need capability IDs.
    const cap_ml = "cap_ml";
    const cap_backend = "cap_backend";
    const cap_react = "cap_react";

    // 1. Projects
    const project1: Project = {
        id: "proj_1",
        title: "Medical Image Diagnostic API",
        description: "Built a Python FastAPI backend running a CNN classifier.",
        technologies: ["Python", "FastAPI", "TensorFlow"],
        capabilityIds: [cap_ml, cap_backend],
        evidenceIds: ["ev_1"],
        status: "completed",
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    };
    projectRepository.save(project1);

    // 2. Learning
    const learning1: LearningActivity = {
        id: "lrn_1",
        title: "Deep Learning Specialization",
        capabilityId: cap_ml,
        progress: 100,
        completed: true,
        completedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString()
    };
    learningRepository.save(learning1);

    // 3. Evidence
    const evidence1: Evidence = {
        id: "ev_1",
        title: "Medical Image Artifact",
        type: "project",
        description: "GitHub repository containing CNN model",
        capabilityIds: [cap_ml, cap_backend],
        sourceId: "proj_1",
        verificationStatus: "verified",
        strength: 85,
        createdAt: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000).toISOString()
    };

    const evidence2: Evidence = {
        id: "ev_2",
        title: "DL Specialization Certificate",
        type: "certificate",
        description: "Coursera ID xyz123",
        capabilityIds: [cap_ml],
        sourceId: "lrn_1",
        verificationStatus: "verified",
        strength: 70,
        createdAt: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000).toISOString()
    };
    evidenceRepository.saveMultiple([evidence1, evidence2]);

    // 4. Activity Events (Used for Heatmap & Streak)
    const events: ActivityEvent[] = [];
    const baseDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000); // 180 days ago

    // Generate random activity over 6 months
    for (let i = 0; i < 180; i++) {
        const currentDate = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
        // 40% chance of activity on any given day
        if (Math.random() < 0.4) {
            events.push({
                id: `evt_${i}`,
                type: "learning_completed",
                timestamp: currentDate.toISOString(),
                entityId: "mock",
                capabilityIds: Math.random() > 0.5 ? [cap_ml] : [cap_react]
            });
        }
    }

    // Explicit events for the concrete items
    events.push({
        id: "evt_proj_created",
        type: "project_created",
        timestamp: project1.createdAt,
        entityId: project1.id,
        capabilityIds: project1.capabilityIds
    });

    events.push({
        id: "evt_evidence_1",
        type: "evidence_verified",
        timestamp: evidence1.createdAt,
        entityId: evidence1.id,
        capabilityIds: evidence1.capabilityIds
    });

    activityEventRepository.saveMultiple(events);
    console.log(`Seeded 1 Candidate, 1 Project, 1 Learning, 2 Evidence, and ${events.length} Events.`);
}
