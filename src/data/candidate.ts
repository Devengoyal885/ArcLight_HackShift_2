// ─── Candidate Mock Data ─────────────────────────────────────────────────────

export const candidateProfile = {
  id: 'deven',
  name: 'Deven',
  role: 'Software Engineer',
  avatar: null,
  initials: 'D',
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

export interface JobOpportunity {
  id: string;
  title: string;
  company: string;
  match: number;
  logo: string;
  type: 'Placement' | 'Internship';
  state: 'READY NOW' | 'NEAR MATCH' | 'SKILL-BUILDING';
  location: string;
  salary?: string;
  stipend?: string;
  tags: string[];
}

export const placements: JobOpportunity[] = [
  {
    id: 'google-swe',
    title: 'Software Engineer',
    company: 'Google',
    match: 94,
    logo: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg',
    type: 'Placement',
    state: 'READY NOW',
    location: 'Bangalore / Remote',
    salary: '₹30L - ₹45L',
    tags: ['DSA', 'System Design', 'Python'],
  },
  {
    id: 'amazon-sde',
    title: 'SDE-1 (Backend)',
    company: 'Amazon',
    match: 88,
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg',
    type: 'Placement',
    state: 'NEAR MATCH',
    location: 'Hyderabad',
    salary: '₹28L - ₹40L',
    tags: ['Java', 'AWS', 'DSA'],
  },
  {
    id: 'microsoft-ai',
    title: 'AI Engineer',
    company: 'Microsoft',
    match: 96,
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
    type: 'Placement',
    state: 'READY NOW',
    location: 'Bangalore',
    salary: '₹35L - ₹50L',
    tags: ['Machine Learning', 'Research', 'Python'],
  },
];

export const internships: JobOpportunity[] = [
  {
    id: 'techventures-ai',
    title: 'AI Research Intern',
    company: 'TechVentures India',
    match: 98,
    logo: 'https://ui-avatars.com/api/?name=TV&background=0D8ABC&color=fff',
    type: 'Internship',
    state: 'READY NOW',
    location: 'Remote',
    stipend: '₹50,000 / mo',
    tags: ['Research', 'Python', 'ML'],
  },
  {
    id: 'iitd-research',
    title: 'Research Assistant',
    company: 'IIT Delhi AI Lab',
    match: 94,
    logo: 'https://ui-avatars.com/api/?name=IIT&background=b91d47&color=fff',
    type: 'Internship',
    state: 'READY NOW',
    location: 'Delhi',
    stipend: '₹35,000 / mo',
    tags: ['Research', 'Publication'],
  },
  {
    id: 'stripe-frontend',
    title: 'Frontend Intern',
    company: 'Stripe',
    match: 75,
    logo: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg',
    type: 'Internship',
    state: 'SKILL-BUILDING',
    location: 'Remote',
    stipend: '₹80,000 / mo',
    tags: ['React', 'TypeScript'],
  },
];

export interface TrendingRole {
  id: string;
  title: string;
  demand: 'Very High' | 'High';
  targetCompany: string;
  requiredSkills: { name: string; targetScore: number; currentScore?: number }[];
}

export const trendingRoles: TrendingRole[] = [
  {
    id: 'prompt-engineer',
    title: 'Prompt Engineer',
    demand: 'Very High',
    targetCompany: 'OpenAI',
    requiredSkills: [
      { name: 'Machine Learning', targetScore: 85, currentScore: 64 },
      { name: 'Research', targetScore: 90, currentScore: 91 },
      { name: 'Prompting', targetScore: 80, currentScore: 0 },
    ],
  },
  {
    id: 'cloud-architect',
    title: 'Cloud Architect',
    demand: 'High',
    targetCompany: 'AWS',
    requiredSkills: [
      { name: 'Cloud', targetScore: 85, currentScore: 45 },
      { name: 'System Design', targetScore: 80, currentScore: 0 },
    ],
  },
];

export interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  action: 'Take Assessment' | 'Coding Practice' | 'Build Project';
  domain: string;
  completed: boolean;
}

export const skillRoadmaps: Record<string, RoadmapStep[]> = {
  'prompt-engineer': [
    { id: '1', title: 'Master NLP Fundamentals', description: 'Take the Machine Learning assessment to prove fundamental NLP knowledge.', action: 'Take Assessment', domain: 'Machine Learning', completed: false },
    { id: '2', title: 'Prompting Techniques', description: 'Complete the Prompt Engineering specialized quiz covering zero-shot, few-shot, and chain-of-thought.', action: 'Take Assessment', domain: 'Prompting', completed: false },
    { id: '3', title: 'OpenAI API Integration', description: 'Complete a coding challenge to integrate and stream OpenAI responses in Python.', action: 'Coding Practice', domain: 'Python', completed: false },
  ],
  'cloud-architect': [
    { id: '1', title: 'Cloud Fundamentals', description: 'Pass the core Cloud capabilities assessment.', action: 'Take Assessment', domain: 'Cloud', completed: false },
    { id: '2', title: 'Distributed Systems', description: 'Take the System Design theoretical quiz.', action: 'Take Assessment', domain: 'System Design', completed: false },
    { id: '3', title: 'Infrastructure as Code', description: 'Write a Terraform script in a coding challenge.', action: 'Coding Practice', domain: 'Cloud', completed: false },
  ],
};

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

/**
 * Historic assessment summary — read by CareerPage, LearningPage and Dashboard.
 * Kept in sync with assessmentStore via the store's seed data.
 * New results land in assessmentStore first; this is the pre-seeded snapshot.
 */
export const candidateAssessmentHistory = [
  {
    domain: 'dsa' as const,
    label: 'DSA',
    score: 88,
    color: '#2563eb',
    date: 'Jan 2026',
    percentile: 91,
  },
  {
    domain: 'development' as const,
    label: 'Software Development',
    score: 74,
    color: '#7c3aed',
    date: 'Feb 2026',
    percentile: 72,
  },
];

