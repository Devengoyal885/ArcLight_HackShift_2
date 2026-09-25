// ─── Employer Mock Data ───────────────────────────────────────────────────────

export const employerProfile = {
    id: 'acme-tech',
    name: 'Acme Technologies',
    industry: 'AI & Deep Tech',
    size: '800–1200 employees',
    openRoles: 24,
    capabilityGaps: 8,
    internalMoves: 17,
    verifiedTalent: 146,
};

export const workforceCapabilities = [
    { label: 'Python', current: 78, required: 85, employees: 210 },
    { label: 'Machine Learning', current: 42, required: 60, employees: 98 },
    { label: 'Cloud Infrastructure', current: 55, required: 70, employees: 134 },
    { label: 'Data Analysis', current: 71, required: 75, employees: 165 },
    { label: 'Research', current: 62, required: 65, employees: 90 },
    { label: 'Leadership', current: 58, required: 70, employees: 72 },
    { label: 'Problem Solving', current: 80, required: 80, employees: 340 },
    { label: 'Communication', current: 74, required: 75, employees: 290 },
];

export const openRoles = [
    { id: 'ai-engineer', title: 'AI Engineer', department: 'AI Platform', openings: 4, urgency: 'high' as const },
    { id: 'ml-engineer', title: 'ML Engineer', department: 'Products', openings: 3, urgency: 'high' as const },
    { id: 'data-engineer', title: 'Data Engineer', department: 'Data Infra', openings: 5, urgency: 'medium' as const },
    { id: 'cloud-architect', title: 'Cloud Architect', department: 'Infrastructure', openings: 2, urgency: 'medium' as const },
    { id: 'research-eng', title: 'Research Engineer', department: 'Research', openings: 3, urgency: 'low' as const },
];

export const roleCapabilityModel = {
    role: 'AI Engineer',
    capabilities: [
        { label: 'Python', weight: 0.22, required: 80 },
        { label: 'Machine Learning', weight: 0.26, required: 82 },
        { label: 'Data Analysis', weight: 0.18, required: 75 },
        { label: 'Cloud', weight: 0.14, required: 65 },
        { label: 'Problem Solving', weight: 0.12, required: 78 },
        { label: 'Communication', weight: 0.08, required: 70 },
    ],
};

export const candidates = [
    {
        id: 'deven',
        name: 'Deven',
        headline: 'Software Engineer → AI Engineer',
        capabilityAlignment: 94,
        evidenceConfidence: 'HIGH' as const,
        transitionDistance: 'LOW' as const,
        capabilities: { Python: 82, 'Machine Learning': 64, Research: 91, Cloud: 45, DSA: 88 },
        projects: 4,
        verifiedTrials: 2,
        evidence: 12,
        available: 'Immediately',
    },
    {
        id: 'priya-sharma',
        name: 'Priya Sharma',
        headline: 'Data Scientist → AI Engineer',
        capabilityAlignment: 91,
        evidenceConfidence: 'HIGH' as const,
        transitionDistance: 'LOW' as const,
        capabilities: { Python: 90, 'Machine Learning': 82, Research: 76, Cloud: 60, DSA: 74 },
        projects: 6,
        verifiedTrials: 3,
        evidence: 16,
        available: 'Oct 2025',
    },
    {
        id: 'rohan-verma',
        name: 'Rohan Verma',
        headline: 'Backend Engineer → AI Engineer',
        capabilityAlignment: 78,
        evidenceConfidence: 'MEDIUM' as const,
        transitionDistance: 'MEDIUM' as const,
        capabilities: { Python: 78, 'Machine Learning': 48, Research: 55, Cloud: 72, DSA: 80 },
        projects: 3,
        verifiedTrials: 1,
        evidence: 8,
        available: 'Nov 2025',
    },
    {
        id: 'sarah-chen',
        name: 'Sarah Chen',
        headline: 'AI Researcher → AI Engineer',
        capabilityAlignment: 88,
        evidenceConfidence: 'HIGH' as const,
        transitionDistance: 'LOW' as const,
        capabilities: { Python: 85, 'Machine Learning': 90, Research: 94, Cloud: 40, DSA: 70 },
        projects: 5,
        verifiedTrials: 2,
        evidence: 14,
        available: 'Jan 2026',
    },
];

export const workforceGaps = [
    {
        role: 'ML Engineers',
        current: 42,
        required: 60,
        gap: 18,
        internalTransitions: 11,
        pathway: [
            'Software Developer',
            'Skill Gap Identified',
            'Learning Program',
            'Practical Trial',
            'ML Engineer',
        ],
    },
    {
        role: 'Cloud Architects',
        current: 28,
        required: 40,
        gap: 12,
        internalTransitions: 7,
        pathway: [
            'Infrastructure Engineer',
            'Gap: Cloud Native',
            'Certification Program',
            'Deployment Trial',
            'Cloud Architect',
        ],
    },
];

export const insightsData = {
    rolesDemand: [
        { month: 'Apr', value: 18 },
        { month: 'May', value: 20 },
        { month: 'Jun', value: 22 },
        { month: 'Jul', value: 21 },
        { month: 'Aug', value: 23 },
        { month: 'Sep', value: 24 },
    ],
    capabilityGaps: [
        { capability: 'Machine Learning', gap: 18 },
        { capability: 'Cloud', gap: 12 },
        { capability: 'Leadership', gap: 9 },
        { capability: 'Python', gap: 7 },
        { capability: 'Data Engineering', gap: 5 },
    ],
    internalMobilityMonths: [
        { month: 'Q1', completed: 4, potential: 12 },
        { month: 'Q2', completed: 7, potential: 14 },
        { month: 'Q3', completed: 6, potential: 17 },
    ],
};
