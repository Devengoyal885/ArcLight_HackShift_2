// ─── Candidate Mock Data ─────────────────────────────────────────────────────

export const candidateProfile = {
  id: 'alex-morgan',
  name: 'Alex Morgan',
  role: 'Software Engineer',
  avatar: null,
  initials: 'AM',
  capabilityConfidence: 82,
  verifiedEvidence: 12,
  projectCount: 4,
  growthVelocity: '+14% this quarter',
};

export const candidateCapabilities = [
  { id: 'research',  label: 'Research',         score: 91, confidence: 96, evidenceCount: 7, color: '#2563eb' },
  { id: 'dsa',       label: 'DSA',              score: 88, confidence: 90, evidenceCount: 6, color: '#0ea5e9' },
  { id: 'python',    label: 'Python',            score: 82, confidence: 88, evidenceCount: 9, color: '#10b981' },
  { id: 'react',     label: 'React',             score: 73, confidence: 80, evidenceCount: 5, color: '#7c3aed' },
  { id: 'ml',        label: 'Machine Learning',  score: 64, confidence: 89, evidenceCount: 7, color: '#f59e0b' },
  { id: 'cloud',     label: 'Cloud',             score: 45, confidence: 60, evidenceCount: 2, color: '#f4845f' },
];

export const evidenceItems: Record<string, EvidenceItem[]> = {
  research: [
    { type: 'publication', label: 'Research Paper: NLP Bias Detection', date: 'Mar 2025', verified: true },
    { type: 'project',     label: 'Sentiment Analysis Pipeline',        date: 'Jan 2025', verified: true },
    { type: 'assessment',  label: 'Research Methodology Assessment',    date: 'Dec 2024', verified: true },
    { type: 'project',     label: 'Literature Survey Tool (GitHub)',    date: 'Nov 2024', verified: false },
  ],
  ml: [
    { type: 'project',    label: 'Image Classifier – CIFAR-10',       date: 'Feb 2025', verified: true },
    { type: 'trial',      label: 'Practical Trial: Model Deployment',  date: 'Apr 2025', verified: true },
    { type: 'github',     label: 'ml-experiments (12 repos)',          date: 'ongoing',  verified: false },
    { type: 'assessment', label: 'ML Fundamentals Assessment',         date: 'Jan 2025', verified: true },
  ],
  python: [
    { type: 'github',     label: '47 Python repositories',            date: 'ongoing',  verified: true },
    { type: 'trial',      label: 'Practical Trial: REST API Build',   date: 'Mar 2025', verified: true },
    { type: 'project',    label: 'Automation Scripts (production)',   date: 'Feb 2025', verified: false },
  ],
  dsa: [
    { type: 'assessment', label: '300+ LeetCode problems',           date: 'ongoing',  verified: true },
    { type: 'assessment', label: 'DSA Assessment – 88th percentile', date: 'Jan 2025', verified: true },
  ],
  react: [
    { type: 'project', label: 'CityPulse AI – Frontend Lead',       date: 'Sep 2025', verified: true },
    { type: 'github',  label: '8 React projects on GitHub',         date: 'ongoing',  verified: false },
  ],
  cloud: [
    { type: 'assessment', label: 'AWS Cloud Practitioner (in progress)', date: 'Oct 2025', verified: false },
  ],
};

export interface EvidenceItem {
  type: 'github' | 'project' | 'assessment' | 'trial' | 'publication';
  label: string;
  date: string;
  verified: boolean;
}

export const opportunities = [
  {
    id: 'ai-engineer-intern',
    title: 'AI Engineer Intern',
    company: 'TechVentures India',
    match: 96,
    capabilityMatch: 98,
    evidenceMatch: 94,
    experienceMatch: 91,
    learningAlignment: 96,
    deadline: '24 SEP',
    state: 'READY NOW' as const,
  },
  {
    id: 'research-assistant',
    title: 'Research Assistant',
    company: 'IIT Delhi AI Lab',
    match: 94,
    capabilityMatch: 96,
    evidenceMatch: 97,
    experienceMatch: 88,
    learningAlignment: 92,
    deadline: '01 OCT',
    state: 'READY NOW' as const,
  },
  {
    id: 'ml-hackathon',
    title: 'ML Hackathon — National Finals',
    company: 'SIH 2026',
    match: 97,
    capabilityMatch: 94,
    evidenceMatch: 98,
    experienceMatch: 96,
    learningAlignment: 99,
    deadline: '20 SEP',
    state: 'READY NOW' as const,
  },
  {
    id: 'backend-engineer',
    title: 'Backend Engineer',
    company: 'Startup Studio',
    match: 78,
    capabilityMatch: 82,
    evidenceMatch: 74,
    experienceMatch: 70,
    learningAlignment: 80,
    deadline: '15 OCT',
    state: 'NEAR MATCH' as const,
  },
  {
    id: 'data-analyst',
    title: 'Data Analyst',
    company: 'Analytics Co.',
    match: 62,
    capabilityMatch: 65,
    evidenceMatch: 60,
    experienceMatch: 58,
    learningAlignment: 70,
    deadline: '30 OCT',
    state: 'SKILL-BUILDING' as const,
  },
];

export const careerTarget = {
  role: 'AI Engineer',
  requiredCapabilities: [
    { id: 'python',   label: 'Python',            status: 'met'  as const, current: 82, required: 80 },
    { id: 'data',     label: 'Data Analysis',     status: 'met'  as const, current: 88, required: 75 },
    { id: 'ml',       label: 'Machine Learning',  status: 'gap'  as const, current: 64, required: 80 },
    { id: 'dl',       label: 'Deep Learning',     status: 'missing' as const, current: 0,  required: 70 },
    { id: 'mlops',    label: 'MLOps',             status: 'missing' as const, current: 0,  required: 60 },
    { id: 'cloud2',   label: 'Cloud Deployment',  status: 'missing' as const, current: 45, required: 65 },
  ],
  transitionPath: [
    { step: 1, label: 'Machine Learning',  duration: 'Week 1–2', type: 'learning' as const },
    { step: 2, label: 'Deep Learning',    duration: 'Week 3–4',  type: 'learning' as const },
    { step: 3, label: 'MLOps',            duration: 'Week 5',    type: 'learning' as const },
    { step: 4, label: 'Practical Project', duration: 'Week 6',   type: 'project'  as const },
    { step: 5, label: 'Verification',     duration: 'Week 7',    type: 'verify'   as const },
  ],
};

export const learningPath = [
  {
    week: 1,
    label: 'Machine Learning Foundations',
    exercise: 'Practical Exercise: Feature Engineering',
    capability: 'ml',
    fromScore: 64,
    toScore: 70,
  },
  {
    week: 2,
    label: 'Deep Learning Essentials',
    exercise: 'Mini Project: CNN Image Classifier',
    capability: 'ml',
    fromScore: 70,
    toScore: 74,
  },
  {
    week: 3,
    label: 'MLOps & Model Serving',
    exercise: 'Deployment Task: Serve a Model via API',
    capability: 'cloud',
    fromScore: 45,
    toScore: 55,
  },
  {
    week: 4,
    label: 'Cloud Integration',
    exercise: 'Practical Trial: Deploy on AWS Free Tier',
    capability: 'cloud',
    fromScore: 55,
    toScore: 65,
  },
];

export const mailItems = [
  {
    id: 'm1',
    category: 'Opportunities' as const,
    subject: 'Application deadline detected.',
    org: 'AI Engineer Intern — TechVentures India',
    deadline: '24 SEP  11:59 PM',
    priority: 'high' as const,
    read: false,
  },
  {
    id: 'm2',
    category: 'Deadlines' as const,
    subject: 'SIH 2026 registration closes soon.',
    org: 'Smart India Hackathon',
    deadline: '20 SEP  6:00 PM',
    priority: 'high' as const,
    read: false,
  },
  {
    id: 'm3',
    category: 'Meetings' as const,
    subject: 'Mock interview scheduled.',
    org: 'IIT Delhi AI Lab — Research Assistant Role',
    deadline: '19 SEP  2:00 PM',
    priority: 'medium' as const,
    read: true,
  },
  {
    id: 'm4',
    category: 'Applications' as const,
    subject: 'Application status update.',
    org: 'Backend Engineer — Startup Studio',
    deadline: 'No deadline',
    priority: 'low' as const,
    read: true,
  },
];

export const growthTimeline = [
  { year: '2024', label: 'DSA', level: 'Foundation', color: '#2563eb' },
  { year: '2024', label: 'Python', level: 'Proficient', color: '#0ea5e9' },
  { year: '2025', label: 'Research', level: 'Advanced', color: '#7c3aed' },
  { year: '2025', label: 'Full Stack', level: 'Proficient', color: '#10b981' },
  { year: '2026', label: 'Machine Learning', level: 'Developing', color: '#f59e0b' },
  { year: '2026', label: 'Practical Verification', level: 'Active', color: '#f4845f' },
];
