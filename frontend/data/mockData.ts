import type {
  UserProfile,
  Capability,
  Opportunity,
  Action,
  Email,
  TransferRole,
  WorkforceDepartment,
  EquityCandidate,
  MomentumDataPoint,
  Notification,
  PatentItem,
} from '@/types';

// ─── Primary Candidate (Priya Sharma) ─────────────────────────

export const mockUser: UserProfile = {
  id: 'user-priya',
  name: 'Priya Sharma',
  email: 'priya.sharma@accesshire.ai',
  age: 29,
  location: 'Hubli, India',
  education: 'B.Sc. Computer Applications',
  careerGap: '3 years',
  targetRole: 'AI Operations Engineer',
  capabilityMomentum: 18,
  capabilityTwinScore: 82,
  futureReadiness: 74,
  opportunityMatch: 91,
  activeTransitions: 2,
  capabilities: [],
};

// ─── Seeded Founder Flagship Candidate (Deven Goyal) ───────────

export const mockDevenPatents: PatentItem[] = [
  {
    id: 'pat-1',
    title: 'A Smart Freshness Detection Knife',
    applicationNo: '202611092508',
    status: 'FILED',
    year: '2026',
  },
  {
    id: 'pat-2',
    title: 'Adaptive Ventilation Barrier with Selective Sunlight Attenuation and Environmental Response Mechanism',
    applicationNo: '202611101525',
    status: 'FILED',
    year: '2026',
  },
  {
    id: 'pat-3',
    title: 'AI-Driven Wearable System for Air-Based Multi-Instrument Musical Performance',
    applicationNo: '202611068506',
    status: 'PUBLISHED',
    year: '2026',
  },
  {
    id: 'pat-4',
    title: 'Adaptive AI-Powered Dumbbell with Dynamic Center-of-Gravity Shifting and Smart Docking System',
    applicationNo: '202611096293',
    status: 'FILED',
    year: '2026',
  },
  {
    id: 'pat-5',
    title: 'AgriShield: Smart Complete Agriculture System',
    applicationNo: '202611073983',
    status: 'PUBLISHED',
    year: '2026',
  },
  {
    id: 'pat-6',
    title: 'ConneCX: Smart Storage Device with Network Storage Capability',
    applicationNo: '202511122602',
    status: 'PUBLISHED',
    year: '2025',
  },
  {
    id: 'pat-7',
    title: 'DentaSense — An AI-Enabled Intraoral Device for Adaptive Dental, Psychological, and Predictive Health Analysis',
    applicationNo: '202611076579',
    status: 'PUBLISHED',
    year: '2026',
  },
  {
    id: 'pat-8',
    title: 'Dual-Mode Wearable-Controlled Smart Laptop System with Physical and Virtual Display Interface',
    applicationNo: '202611068512',
    status: 'PUBLISHED',
    year: '2026',
  },
  {
    id: 'pat-9',
    title: 'Energy Distribution and Regeneration System',
    applicationNo: '202611020405',
    status: 'PUBLISHED',
    year: '2026',
  },
  {
    id: 'pat-10',
    title: 'EyeLux: A Smart Gaze-Aware Circadian-Safe Wearable Illumination System',
    applicationNo: '202611065620',
    status: 'PUBLISHED',
    year: '2026',
  },
  {
    id: 'pat-11',
    title: 'Fan-less Auto-Cooling Laptop Stand Using Passive Thermal Management',
    applicationNo: '202611065622',
    status: 'PUBLISHED',
    year: '2026',
  },
  {
    id: 'pat-12',
    title: 'Intelligent Dustbin System for Waste Sorting, Hygienic Processing and Optimized Collection Routing',
    applicationNo: '202511126806',
    status: 'PUBLISHED',
    year: '2025',
  },
  {
    id: 'pat-13',
    title: 'Kinetic Neuro-Adaptive Footwear (KNAF): Intelligent Energy-Harvesting and Emotion-Synchronized Smart Shoes for Human Neuro-Energetic Optimization',
    applicationNo: '202611021600',
    status: 'PUBLISHED',
    year: '2026',
  },
  {
    id: 'pat-14',
    title: 'LumiTrack Reader: Smart Night Book Reader',
    applicationNo: '202611079826',
    status: 'PUBLISHED',
    year: '2026',
  },
  {
    id: 'pat-15',
    title: 'Lumo Intelligence: Smart Light, Ventilation and Mobile Detection System',
    applicationNo: '202511132517',
    status: 'PUBLISHED',
    year: '2025',
  },
  {
    id: 'pat-16',
    title: 'Neuro-Adaptive Smart Hydration System for Cognitive, Emotional, and Physiological Performance Optimization',
    applicationNo: '202611096290',
    status: 'FILED',
    year: '2026',
  },
  {
    id: 'pat-17',
    title: 'NeuroSync — AI-Assisted Wearable Circadian Sleep and Cognitive Optimization System Using Bio-Signal Feedback and Adaptive Light Regulation',
    applicationNo: '202611092906',
    status: 'FILED',
    year: '2026',
  },
  {
    id: 'pat-18',
    title: 'Passive Adaptive Biomechanical Smart Sock',
    applicationNo: '202611101524',
    status: 'FILED',
    year: '2026',
  },
  {
    id: 'pat-19',
    title: 'Smart Photonic Sleep Mask with Circadian Adaptive Sunrise Wake Simulation',
    applicationNo: '202611092904',
    status: 'FILED',
    year: '2026',
  },
  {
    id: 'pat-20',
    title: 'Smart Pillow — Adaptive Sleep Posture and Softness Optimization System',
    applicationNo: '202611079796',
    status: 'PUBLISHED',
    year: '2026',
  },
  {
    id: 'pat-21',
    title: 'Smart Tire with Integrated Auto-Braking, Energy Generation, Balance Control, and Speed Limiting System',
    applicationNo: '202611007559',
    status: 'PUBLISHED',
    year: '2026',
  },
];

export const mockDevenCapabilities: Capability[] = [
  {
    id: 'cap-deven-patents',
    name: 'Patent & IP Innovation',
    category: 'leadership',
    proficiency: 98,
    evidenceConfidence: 99,
    independent: 96,
    aiAssisted: 98,
    recency: 'high',
    evidence: [
      { source: 'patent', label: 'AI Wearable Musical System (App No. 202611068506)', date: '2026', confidence: 99, verified: true, applicationNo: '202611068506' },
      { source: 'patent', label: 'ConneCX Smart Storage Device (App No. 202511122602)', date: '2025', confidence: 99, verified: true, applicationNo: '202511122602' },
      { source: 'patent', label: 'DentaSense Intraoral AI Device (App No. 202611076579)', date: '2026', confidence: 99, verified: true, applicationNo: '202611076579' },
      { source: 'patent', label: 'Dual-Mode Wearable Display System (App No. 202611068512)', date: '2026', confidence: 99, verified: true, applicationNo: '202611068512' },
      { source: 'patent', label: 'NeuroSync Circadian Bio-Signal System (App No. 202611092906)', date: '2026', confidence: 98, verified: true, applicationNo: '202611092906' },
      { source: 'patent', label: '21 Total Filed & Published Patent Disclosures', date: '2025–2026', confidence: 99, verified: true },
    ],
    growth: [
      { year: 2024, score: 68 },
      { year: 2025, score: 89 },
      { year: 2026, score: 98 },
    ],
    tags: ['patents', 'intellectual-property', 'hardware-ai', 'innovation', 'systems'],
  },
  {
    id: 'cap-deven-ai',
    name: 'Artificial Intelligence & LLMs',
    category: 'technical',
    proficiency: 95,
    evidenceConfidence: 98,
    independent: 92,
    aiAssisted: 97,
    recency: 'high',
    evidence: [
      { source: 'certification', label: 'NVIDIA Certification — Rapid Application Development with LLMs', date: '2025-11', confidence: 99, verified: true },
      { source: 'project', label: 'MailIQ — AI-Powered Email Workflow Automation Platform', date: '2025-01', confidence: 96, verified: true },
      { source: 'project', label: 'Cogniflow AI — Business Analytics & Real-Time Intelligence Dashboard', date: '2026-07', confidence: 97, verified: true },
      { source: 'work', label: '1st Prize — AI for Social Good Hackathon, IIT Ropar', date: '2025-04', confidence: 98, verified: true },
    ],
    growth: [
      { year: 2024, score: 65 },
      { year: 2025, score: 84 },
      { year: 2026, score: 95 },
    ],
    tags: ['ai', 'llm', 'machine-learning', 'analytics', 'automation'],
  },
  {
    id: 'cap-deven-fullstack',
    name: 'Full Stack Web Development',
    category: 'technical',
    proficiency: 94,
    evidenceConfidence: 97,
    independent: 91,
    aiAssisted: 96,
    recency: 'high',
    evidence: [
      { source: 'project', label: 'MailIQ Full-Stack Architecture (Python, Next.js, REST APIs)', date: '2025-01', confidence: 96, verified: true },
      { source: 'project', label: 'Cogniflow AI Interactive Analytics & KPI Visualization Engine', date: '2026-07', confidence: 96, verified: true },
      { source: 'work', label: '1st Position — Stack Sprint 1.0 Hackathon, Chandigarh University', date: '2025-03', confidence: 95, verified: true },
      { source: 'github', label: 'GitHub Repositories (github.com/Devengoyal885)', date: '2026-02', confidence: 94, verified: true },
    ],
    growth: [
      { year: 2024, score: 74 },
      { year: 2025, score: 87 },
      { year: 2026, score: 94 },
    ],
    tags: ['react', 'nextjs', 'node', 'fullstack', 'typescript', 'python', 'apis'],
  },
  {
    id: 'cap-deven-iot',
    name: 'IoT & Embedded Systems',
    category: 'technical',
    proficiency: 93,
    evidenceConfidence: 96,
    independent: 90,
    aiAssisted: 94,
    recency: 'high',
    evidence: [
      { source: 'patent', label: 'EyeLux Circadian Wearable Illumination (App No. 202611065620)', date: '2026', confidence: 98, verified: true, applicationNo: '202611065620' },
      { source: 'patent', label: 'Smart Tire Auto-Braking & Energy System (App No. 202611007559)', date: '2026', confidence: 97, verified: true, applicationNo: '202611007559' },
      { source: 'patent', label: 'Fan-less Thermal Laptop Stand (App No. 202611065622)', date: '2026', confidence: 96, verified: true, applicationNo: '202611065622' },
      { source: 'patent', label: 'AgriShield Complete Agriculture System (App No. 202611073983)', date: '2026', confidence: 97, verified: true, applicationNo: '202611073983' },
    ],
    growth: [
      { year: 2024, score: 62 },
      { year: 2025, score: 81 },
      { year: 2026, score: 93 },
    ],
    tags: ['iot', 'embedded-systems', 'hardware-ai', 'sensors', 'thermal'],
  },
  {
    id: 'cap-deven-leadership',
    name: 'Hackathon Leadership & Innovation',
    category: 'leadership',
    proficiency: 96,
    evidenceConfidence: 99,
    independent: 94,
    aiAssisted: 95,
    recency: 'high',
    evidence: [
      { source: 'work', label: '2nd Position — Vibe Coding Hackathon 2026 (Ranked 2nd of 676 Teams Nationwide)', date: '2026-02', confidence: 99, verified: true },
      { source: 'work', label: 'Top 1,000 Finalist — India Innovates Hackathon (of 25,500+ Applicants)', date: '2025-10', confidence: 98, verified: true },
      { source: 'work', label: 'Selected Finalist — SmartEarth 2026 International Hackathon (Astana, Kazakhstan)', date: '2026-01', confidence: 98, verified: true },
      { source: 'work', label: 'Inter-University Excellence Award — Chandigarh University', date: '2025-12', confidence: 99, verified: true },
      { source: 'work', label: 'Kargil Batch Selection — Academic & Leadership Distinction', date: '2025-08', confidence: 97, verified: true },
    ],
    growth: [
      { year: 2024, score: 75 },
      { year: 2025, score: 89 },
      { year: 2026, score: 96 },
    ],
    tags: ['leadership', 'hackathons', 'team-orchestration', 'communication', 'problem-solving'],
  },
  {
    id: 'cap-deven-dsa',
    name: 'Algorithms & Problem Solving',
    category: 'technical',
    proficiency: 92,
    evidenceConfidence: 95,
    independent: 90,
    aiAssisted: 93,
    recency: 'high',
    evidence: [
      { source: 'work', label: 'Runner-Up — Peace of Code Hackathon, IIT Ropar', date: '2025-05', confidence: 96, verified: true },
      { source: 'assessment', label: 'Chandigarh University CSE Full Stack', date: '2026-01', confidence: 94, verified: true },
      { source: 'github', label: 'Honorable Mention — GitHub README Hackathon (Devpost)', date: '2025-09', confidence: 92, verified: true },
    ],
    growth: [
      { year: 2024, score: 76 },
      { year: 2025, score: 86 },
      { year: 2026, score: 92 },
    ],
    tags: ['dsa', 'c++', 'algorithms', 'problem-solving', 'data-structures'],
  },
  {
    id: 'cap-deven-sql',
    name: 'SQL & Data Engineering',
    category: 'technical',
    proficiency: 89,
    evidenceConfidence: 92,
    independent: 86,
    aiAssisted: 92,
    recency: 'high',
    evidence: [
      { source: 'project', label: 'Cogniflow AI Real-Time Analytical Database Schema', date: '2026-07', confidence: 93, verified: true },
      { source: 'project', label: 'MailIQ User & Workflow Pipeline Data Store', date: '2025-01', confidence: 91, verified: true },
    ],
    growth: [
      { year: 2024, score: 68 },
      { year: 2025, score: 80 },
      { year: 2026, score: 89 },
    ],
    tags: ['sql', 'database', 'schema', 'analytics', 'pipelines'],
  },
];

export const mockDevenUser: UserProfile = {
  id: 'user-deven',
  name: 'Deven Goyal',
  title: 'Neural Nexus | Technology Innovator',
  summary: 'Passionate technology innovator focused on Artificial Intelligence, Full Stack Development, Embedded Systems, IoT, and product innovation. Experienced in developing practical, research-driven solutions that solve real-world challenges. Actively involved in hackathons, intellectual property development, global certifications, and engineering innovation.',
  email: 'goyaldeven4809@gmail.com',
  location: 'Chandigarh / Haryana, India',
  education: 'B.E. Computer Science Engineering (Full Stack Development), Chandigarh University (2024–2028)',
  targetRole: 'AI Systems Architect / Full Stack Innovation Engineer',
  capabilityMomentum: 26,
  capabilityTwinScore: 94,
  futureReadiness: 92,
  opportunityMatch: 98,
  activeTransitions: 3,
  headlineStats: [
    { label: 'PATENTS', value: '20+' },
    { label: 'VIBE CODING 2026', value: '2nd' },
    { label: 'TEAMS COMPETED', value: '676' },
    { label: 'HACKATHON WINS', value: '1st' },
  ],
  contact: {
    phone: '8708252284',
    linkedin: 'Deven Goyal',
    github: 'Devengoyal885',
    email: 'goyaldeven4809@gmail.com',
  },
  certifications: [
    'NVIDIA — Rapid Application Development with Large Language Models (LLM)',
  ],
  projectsList: [
    {
      name: 'MailIQ — AI-Powered Email Management Platform',
      period: 'Dec 2024 – Jan 2025',
      description: 'AI-powered platform that intelligently organizes, prioritizes, and automates email workflows using AI classification and REST APIs.',
      bullets: [
        'Built full-stack with AI-based email classification and workflow automation.',
        'Improved email organization efficiency, eliminating manual sorting and boosting user productivity.',
        'Engineered high-throughput REST API integration for automated inbox triaging.',
      ],
      tech: ['Python', 'Next.js', 'REST APIs', 'LLM Classification', 'PostgreSQL'],
    },
    {
      name: 'Cogniflow AI — Business Analytics Dashboard',
      period: 'Jun 2026 – Jul 2026',
      description: 'AI-driven analytics dashboard for data visualization, KPI tracking, and automated enterprise decision support.',
      bullets: [
        'Full-stack web application with interactive dashboards, real-time analytics, and AI-powered insights.',
        'Designed modular SQL data architecture and responsive data visualizations for complex enterprise metrics.',
      ],
      tech: ['React', 'Next.js', 'TypeScript', 'SQL', 'Analytics Engine', 'Chart.js'],
    },
  ],
  hackathonsList: [
    { title: '2nd Position — Vibe Coding Hackathon 2026', placement: '2nd / 676 Teams', note: 'Nationwide competition with 676 participating teams' },
    { title: '1st Position — Stack Sprint 1.0 Hackathon', placement: '1st Prize', org: 'Chandigarh University' },
    { title: 'First Prize — AI for Social Good Hackathon', placement: '1st Prize', org: 'Pre-AI Summit, IIT Ropar' },
    { title: 'Runner-Up — Peace of Code Hackathon', placement: '2nd Place', org: 'Nirvana Event, IIT Ropar' },
    { title: 'Selected Finalist — India Innovates Hackathon', placement: 'Top 1,000', note: 'Selected among 25,500+ applicants nationwide' },
    { title: 'Selected Finalist — SmartEarth 2026 International Hackathon', org: 'Qaz.AI, Astana, Kazakhstan & Nazarbayev University' },
    { title: 'Honorable Mention — GitHub README Generation Hackathon', org: 'Devpost' },
    { title: 'Excellence Award — Inter-University Hackathon Winner', org: 'Chandigarh University' },
  ],
  educationList: [
    {
      degree: 'Bachelor of Engineering (B.E.), Computer Science Engineering (Full Stack Development)',
      institution: 'Chandigarh University',
      year: '2024–2028',
      distinction: 'Kargil Batch (5th Semester) — selected for academic excellence, discipline, and overall performance.',
    },
    {
      degree: 'Senior Secondary (Class XII)',
      institution: 'Indus Public School, Haryana',
      year: '2023–2024',
      score: '84%',
    },
    {
      degree: 'Secondary (Class X)',
      institution: 'Indus Public School, Haryana',
      year: '2021–2022',
      score: '87%',
    },
  ],
  capabilities: mockDevenCapabilities,
  patents: mockDevenPatents,
};

export const mockSunitaCapabilities: Capability[] = [
  {
    id: 'cap-sunita-care',
    name: 'Healthcare & Patient Care Management',
    category: 'leadership',
    proficiency: 91,
    evidenceConfidence: 94,
    independent: 90,
    aiAssisted: 88,
    recency: 'high',
    evidence: [
      { source: 'work', label: '3-Year Primary Caregiver for Family & Elder Care (Lucknow)', date: '2023-2026', confidence: 95, verified: true },
      { source: 'work', label: 'Medical Scheduling & Healthcare Logistics', date: '2025-06', confidence: 92, verified: true },
    ],
    growth: [
      { year: 2023, score: 65 },
      { year: 2024, score: 80 },
      { year: 2026, score: 91 },
    ],
    tags: ['healthcare', 'patient-care', 'logistics'],
  },
  {
    id: 'cap-sunita-coord',
    name: 'Community Coordination & Logistics',
    category: 'leadership',
    proficiency: 88,
    evidenceConfidence: 90,
    independent: 86,
    aiAssisted: 85,
    recency: 'high',
    evidence: [
      { source: 'work', label: 'Lucknow Neighbourhood Support Network Coordinator', date: '2024-11', confidence: 91, verified: true },
    ],
    growth: [
      { year: 2024, score: 72 },
      { year: 2025, score: 82 },
      { year: 2026, score: 88 },
    ],
    tags: ['coordination', 'logistics', 'community'],
  },
  {
    id: 'cap-sunita-data',
    name: 'Data Entry & Analytics',
    category: 'technical',
    proficiency: 80,
    evidenceConfidence: 84,
    independent: 76,
    aiAssisted: 88,
    recency: 'high',
    evidence: [
      { source: 'project', label: 'Family & Medical Expense Tracking System (Excel/Python)', date: '2025-08', confidence: 86, verified: true },
    ],
    growth: [
      { year: 2024, score: 50 },
      { year: 2025, score: 68 },
      { year: 2026, score: 80 },
    ],
    tags: ['excel', 'data', 'analytics'],
  },
  {
    id: 'cap-sunita-python',
    name: 'Self-Taught Python & Automation',
    category: 'technical',
    proficiency: 74,
    evidenceConfidence: 78,
    independent: 68,
    aiAssisted: 86,
    recency: 'high',
    evidence: [
      { source: 'github', label: 'Python Automation Scripts', date: '2025-10', confidence: 80, verified: true },
    ],
    growth: [
      { year: 2024, score: 35 },
      { year: 2025, score: 58 },
      { year: 2026, score: 74 },
    ],
    tags: ['python', 'automation', 'scripting'],
  },
];

export const mockSunitaUser: UserProfile = {
  id: 'user-sunita',
  name: 'Sunita Verma',
  email: 'sunita.verma@accesshire.ai',
  age: 28,
  location: 'Lucknow, Uttar Pradesh, India',
  education: 'B.Com & Self-Taught Python Certificate',
  careerGap: '3 years (Caregiving Break)',
  targetRole: 'AI Operations & Care Logistics Specialist',
  capabilityMomentum: 24,
  capabilityTwinScore: 84,
  futureReadiness: 79,
  opportunityMatch: 93,
  activeTransitions: 2,
  capabilities: mockSunitaCapabilities,
};

export function getUserProfile(identifier?: string): UserProfile {
  if (!identifier) return mockDevenUser;
  const lower = identifier.toLowerCase();
  if (lower.includes('sunita')) {
    return { ...mockSunitaUser, capabilities: mockSunitaCapabilities };
  }
  if (lower.includes('priya')) {
    return { ...mockUser, capabilities: mockCapabilities };
  }
  return mockDevenUser;
}

export function getUserCapabilities(identifier?: string): Capability[] {
  if (!identifier) return mockDevenCapabilities;
  const lower = identifier.toLowerCase();
  if (lower.includes('sunita')) {
    return mockSunitaCapabilities;
  }
  if (lower.includes('priya')) {
    return mockCapabilities;
  }
  return mockDevenCapabilities;
}

// ─── Capabilities (Priya) ──────────────────────────────────────

export const mockCapabilities: Capability[] = [
  {
    id: 'cap-python',
    name: 'Python',
    category: 'technical',
    proficiency: 87,
    evidenceConfidence: 94,
    independent: 81,
    aiAssisted: 94,
    recency: 'high',
    evidence: [
      { source: 'github', label: 'GitHub Repositories', date: '2025-11', confidence: 96, verified: true },
      { source: 'project', label: 'Data Pipeline Project', date: '2025-08', confidence: 91, verified: true },
      { source: 'assessment', label: 'Practical Assessment', date: '2026-01', confidence: 94, verified: true },
      { source: 'work', label: 'Freelance Automation Scripts', date: '2024-06', confidence: 82, verified: false },
    ],
    growth: [
      { year: 2023, score: 62 },
      { year: 2024, score: 72 },
      { year: 2025, score: 81 },
      { year: 2026, score: 87 },
    ],
    tags: ['scripting', 'automation', 'data'],
  },
  {
    id: 'cap-ai',
    name: 'AI / ML',
    category: 'technical',
    proficiency: 78,
    evidenceConfidence: 81,
    independent: 72,
    aiAssisted: 91,
    recency: 'high',
    evidence: [
      { source: 'project', label: 'LLM Integration Project', date: '2025-10', confidence: 84, verified: true },
      { source: 'assessment', label: 'AI Evaluation Trial', date: '2026-02', confidence: 88, verified: true },
    ],
    growth: [
      { year: 2024, score: 45 },
      { year: 2025, score: 64 },
      { year: 2026, score: 78 },
    ],
    tags: ['llm', 'evaluation', 'prompting'],
  },
  {
    id: 'cap-sql',
    name: 'SQL',
    category: 'technical',
    proficiency: 83,
    evidenceConfidence: 89,
    independent: 85,
    aiAssisted: 92,
    recency: 'high',
    evidence: [
      { source: 'work', label: 'Database Queries — Self-taught', date: '2024-03', confidence: 80, verified: false },
      { source: 'project', label: 'Analytics Dashboard', date: '2025-07', confidence: 92, verified: true },
    ],
    growth: [
      { year: 2023, score: 55 },
      { year: 2024, score: 68 },
      { year: 2025, score: 79 },
      { year: 2026, score: 83 },
    ],
    tags: ['data', 'queries', 'analytics'],
  },
  {
    id: 'cap-cloud',
    name: 'Cloud',
    category: 'technical',
    proficiency: 61,
    evidenceConfidence: 65,
    independent: 55,
    aiAssisted: 78,
    recency: 'medium',
    evidence: [
      { source: 'project', label: 'AWS S3 Data Storage', date: '2025-04', confidence: 70, verified: false },
    ],
    growth: [
      { year: 2025, score: 42 },
      { year: 2026, score: 61 },
    ],
    tags: ['aws', 'deployment', 'infrastructure'],
  },
  {
    id: 'cap-apis',
    name: 'APIs',
    category: 'technical',
    proficiency: 84,
    evidenceConfidence: 88,
    independent: 82,
    aiAssisted: 91,
    recency: 'high',
    evidence: [
      { source: 'github', label: 'REST API Projects', date: '2025-09', confidence: 91, verified: true },
      { source: 'project', label: 'Integration Services', date: '2025-11', confidence: 87, verified: true },
    ],
    growth: [
      { year: 2024, score: 61 },
      { year: 2025, score: 76 },
      { year: 2026, score: 84 },
    ],
    tags: ['rest', 'integration', 'backend'],
  },
  {
    id: 'cap-linux',
    name: 'Linux',
    category: 'technical',
    proficiency: 76,
    evidenceConfidence: 79,
    independent: 78,
    aiAssisted: 83,
    recency: 'high',
    evidence: [
      { source: 'work', label: 'IT Support — 2 years', date: '2023-06', confidence: 81, verified: false },
      { source: 'project', label: 'Server Administration', date: '2024-08', confidence: 77, verified: false },
    ],
    growth: [
      { year: 2022, score: 52 },
      { year: 2023, score: 65 },
      { year: 2024, score: 72 },
      { year: 2026, score: 76 },
    ],
    tags: ['sysadmin', 'shell', 'servers'],
  },
  {
    id: 'cap-automation',
    name: 'Automation',
    category: 'technical',
    proficiency: 80,
    evidenceConfidence: 85,
    independent: 79,
    aiAssisted: 89,
    recency: 'high',
    evidence: [
      { source: 'github', label: 'Automation Scripts — GitHub', date: '2025-12', confidence: 88, verified: true },
      { source: 'project', label: 'Workflow Automation', date: '2025-06', confidence: 83, verified: true },
    ],
    growth: [
      { year: 2024, score: 58 },
      { year: 2025, score: 71 },
      { year: 2026, score: 80 },
    ],
    tags: ['scripting', 'workflows', 'efficiency'],
  },
  {
    id: 'cap-data-analysis',
    name: 'Data Analysis',
    category: 'technical',
    proficiency: 74,
    evidenceConfidence: 77,
    independent: 72,
    aiAssisted: 86,
    recency: 'high',
    evidence: [
      { source: 'project', label: 'Community Survey Analysis', date: '2025-05', confidence: 79, verified: false },
      { source: 'github', label: 'Pandas/NumPy Notebooks', date: '2025-08', confidence: 82, verified: true },
    ],
    growth: [
      { year: 2024, score: 48 },
      { year: 2025, score: 63 },
      { year: 2026, score: 74 },
    ],
    tags: ['analytics', 'pandas', 'visualization'],
  },
  {
    id: 'cap-leadership',
    name: 'Leadership',
    category: 'leadership',
    proficiency: 84,
    evidenceConfidence: 87,
    independent: 86,
    aiAssisted: 84,
    recency: 'high',
    evidence: [
      { source: 'work', label: 'Festival Coordination — 5,000 attendees', date: '2024-11', confidence: 91, verified: false },
      { source: 'project', label: 'Volunteer Management', date: '2025-02', confidence: 84, verified: false },
    ],
    growth: [
      { year: 2022, score: 65 },
      { year: 2023, score: 72 },
      { year: 2024, score: 79 },
      { year: 2026, score: 84 },
    ],
    tags: ['management', 'coordination', 'teams'],
  },
  {
    id: 'cap-communication',
    name: 'Communication',
    category: 'leadership',
    proficiency: 88,
    evidenceConfidence: 82,
    independent: 90,
    aiAssisted: 88,
    recency: 'high',
    evidence: [
      { source: 'work', label: 'Vendor Negotiations', date: '2024-10', confidence: 85, verified: false },
      { source: 'work', label: 'Stakeholder Management', date: '2024-11', confidence: 88, verified: false },
    ],
    growth: [
      { year: 2022, score: 71 },
      { year: 2024, score: 82 },
      { year: 2026, score: 88 },
    ],
    tags: ['stakeholders', 'negotiation', 'presentations'],
  },
  {
    id: 'cap-troubleshooting',
    name: 'Troubleshooting',
    category: 'operational',
    proficiency: 91,
    evidenceConfidence: 93,
    independent: 89,
    aiAssisted: 92,
    recency: 'high',
    evidence: [
      { source: 'work', label: 'IT Support — 2 years', date: '2023-06', confidence: 94, verified: false },
      { source: 'assessment', label: 'Practical Diagnostic Trial', date: '2026-01', confidence: 96, verified: true },
    ],
    growth: [
      { year: 2022, score: 72 },
      { year: 2023, score: 84 },
      { year: 2024, score: 88 },
      { year: 2026, score: 91 },
    ],
    tags: ['debugging', 'diagnostics', 'support'],
  },
  {
    id: 'cap-backend',
    name: 'Backend',
    category: 'technical',
    proficiency: 69,
    evidenceConfidence: 72,
    independent: 65,
    aiAssisted: 80,
    recency: 'medium',
    evidence: [
      { source: 'github', label: 'Node.js Projects', date: '2025-07', confidence: 74, verified: true },
    ],
    growth: [
      { year: 2025, score: 52 },
      { year: 2026, score: 69 },
    ],
    tags: ['node', 'servers', 'apis'],
  },
];

// ─── Translated Capabilities (from festival experience) ───────

export const mockTranslatedCapabilities = [
  { name: 'Large-Scale Event Operations', score: 87, color: '#6366f1' },
  { name: 'Budget Management', score: 82, color: '#8b5cf6' },
  { name: 'Vendor Negotiation', score: 79, color: '#06b6d4' },
  { name: 'Stakeholder Coordination', score: 91, color: '#10b981' },
  { name: 'Team Leadership', score: 84, color: '#f59e0b' },
  { name: 'Risk Management', score: 76, color: '#ef4444' },
];

// ─── Transfer Roles ───────────────────────────────────────────

export const mockTransferRoles: TransferRole[] = [
  {
    id: 'role-ai-ops',
    title: 'AI Operations Engineer',
    readiness: 74,
    transferable: ['Python', 'APIs', 'Linux', 'Automation', 'Troubleshooting', 'SQL'],
    missing: ['AI Evaluation', 'Agent Orchestration', 'Cloud AI Deployment'],
    transitionEffort: 'medium',
    marketTrend: 'rising',
    transitionSteps: [
      { phase: 'CURRENT', items: ['Python 87%', 'APIs 84%', 'Linux 76%', 'Automation 80%'] },
      { phase: 'LEARN', items: ['AI Evaluation frameworks', 'Agent orchestration (LangChain)', 'Cloud AI (AWS SageMaker)'] },
      { phase: 'PRACTICE', items: ['Deploy AI service', 'Monitor model performance', 'Evaluate LLM outputs'] },
      { phase: 'VERIFY', items: ['Practical trial assessment', '1 portfolio project'] },
      { phase: 'READY', items: ['AI Operations Engineer — 89% readiness'] },
    ],
  },
  {
    id: 'role-cloud-eng',
    title: 'Cloud Engineer',
    readiness: 68,
    transferable: ['Linux', 'Automation', 'APIs', 'Python'],
    missing: ['Cloud Architecture', 'Kubernetes', 'CI/CD', 'Terraform'],
    transitionEffort: 'high',
    marketTrend: 'rising',
    transitionSteps: [
      { phase: 'CURRENT', items: ['Linux 76%', 'Automation 80%'] },
      { phase: 'LEARN', items: ['AWS/GCP architecture', 'Kubernetes', 'Infrastructure as code'] },
      { phase: 'PRACTICE', items: ['Deploy containerised apps', 'Manage infrastructure'] },
      { phase: 'VERIFY', items: ['Cloud deployment project'] },
      { phase: 'READY', items: ['Cloud Engineer — 78% readiness'] },
    ],
  },
  {
    id: 'role-data-eng',
    title: 'Data Engineer',
    readiness: 61,
    transferable: ['Python', 'SQL', 'Data Analysis', 'APIs'],
    missing: ['Apache Spark', 'Data Warehousing', 'Airflow', 'dbt'],
    transitionEffort: 'high',
    marketTrend: 'stable',
    transitionSteps: [
      { phase: 'CURRENT', items: ['SQL 83%', 'Python 87%', 'Data Analysis 74%'] },
      { phase: 'LEARN', items: ['Data pipeline tools', 'Spark fundamentals', 'dbt'] },
      { phase: 'PRACTICE', items: ['Build ETL pipeline', 'Data warehouse project'] },
      { phase: 'VERIFY', items: ['End-to-end pipeline trial'] },
      { phase: 'READY', items: ['Data Engineer — 74% readiness'] },
    ],
  },
  {
    id: 'role-ai-analyst',
    title: 'AI-Enabled Business Analyst',
    readiness: 79,
    transferable: ['Communication', 'Leadership', 'Data Analysis', 'SQL', 'Python'],
    missing: ['Business Process Modeling', 'AI Product Knowledge'],
    transitionEffort: 'low',
    marketTrend: 'rising',
    transitionSteps: [
      { phase: 'CURRENT', items: ['Communication 88%', 'Data Analysis 74%', 'Leadership 84%'] },
      { phase: 'LEARN', items: ['Business analysis frameworks', 'AI tool proficiency'] },
      { phase: 'PRACTICE', items: ['Requirements analysis', 'AI-augmented reporting'] },
      { phase: 'VERIFY', items: ['Business case project'] },
      { phase: 'READY', items: ['AI-Enabled BA — 86% readiness'] },
    ],
  },
  {
    id: 'role-ai-security',
    title: 'AI Security Analyst',
    readiness: 54,
    transferable: ['Troubleshooting', 'Linux', 'Python'],
    missing: ['Threat Modeling', 'AI Red Teaming', 'Cybersecurity Fundamentals', 'MLSecOps'],
    transitionEffort: 'high',
    marketTrend: 'rising',
    transitionSteps: [
      { phase: 'CURRENT', items: ['Troubleshooting 91%', 'Linux 76%'] },
      { phase: 'LEARN', items: ['Security fundamentals', 'AI threat modeling', 'Red teaming'] },
      { phase: 'PRACTICE', items: ['Security audit', 'AI system red team'] },
      { phase: 'VERIFY', items: ['Security challenge trial'] },
      { phase: 'READY', items: ['AI Security Analyst — 68% readiness'] },
    ],
  },
];

// ─── Opportunities (Priya Sharma) ─────────────────────────────

export const mockOpportunities: Opportunity[] = [
  {
    id: 'opp-ai-ops-intern',
    title: 'AI Operations Internship',
    company: 'Infosys AI Labs',
    type: 'paid-internship',
    location: 'Bangalore, India',
    remote: true,
    matchScore: 94,
    capabilityFit: 89,
    futureFit: 92,
    evidenceFit: 86,
    resumeFit: 81,
    deadline: '2026-09-01',
    compensation: '₹25,000/month',
    applicationEffort: 'medium',
    requiredCapabilities: ['Python', 'APIs', 'Linux', 'AI Evaluation', 'Monitoring'],
    missingCapabilities: [
      { name: 'AI Evaluation', current: 45, required: 70 },
    ],
    transferableCapabilities: ['Python', 'APIs', 'Linux', 'Automation', 'Troubleshooting'],
    description: 'Join our AI Operations team to deploy, monitor and evaluate AI services in production environments. Work with cutting-edge LLM pipelines.',
    tags: ['ai', 'operations', 'paid', 'remote'],
  },
  {
    id: 'opp-data-fellowship',
    title: 'Data Engineering Fellowship',
    company: 'Tata Consultancy Services',
    type: 'fellowship',
    location: 'Mumbai, India',
    remote: false,
    matchScore: 81,
    capabilityFit: 78,
    futureFit: 83,
    evidenceFit: 74,
    resumeFit: 69,
    deadline: '2026-09-15',
    compensation: '₹20,000/month stipend',
    applicationEffort: 'high',
    requiredCapabilities: ['SQL', 'Python', 'Data Analysis', 'Apache Spark'],
    missingCapabilities: [
      { name: 'Apache Spark', current: 20, required: 65 },
      { name: 'Data Warehousing', current: 30, required: 60 },
    ],
    transferableCapabilities: ['SQL', 'Python', 'Data Analysis'],
    description: 'A 6-month structured fellowship to develop production-grade data engineering skills with mentorship from senior engineers.',
    tags: ['data', 'fellowship', 'mentorship'],
  },
  {
    id: 'opp-ai-hackathon',
    title: 'National AI Builders Hackathon',
    company: 'NASSCOM Foundation',
    type: 'hackathon',
    location: 'Online',
    remote: true,
    matchScore: 88,
    capabilityFit: 85,
    futureFit: 90,
    evidenceFit: 82,
    resumeFit: 75,
    deadline: '2026-09-05',
    compensation: '₹1,00,000 prize pool',
    applicationEffort: 'low',
    requiredCapabilities: ['Python', 'AI / ML', 'APIs'],
    missingCapabilities: [],
    transferableCapabilities: ['Python', 'AI / ML', 'APIs', 'Automation'],
    description: 'Build AI solutions for social impact. Prizes, mentorship, and fast-track recruitment for top performers.',
    tags: ['hackathon', 'ai', 'remote', 'prize'],
  },
  {
    id: 'opp-cloud-junior',
    title: 'Junior Cloud Engineer',
    company: 'Wipro Digital',
    type: 'job',
    location: 'Pune, India',
    remote: false,
    matchScore: 72,
    capabilityFit: 68,
    futureFit: 76,
    evidenceFit: 63,
    resumeFit: 58,
    deadline: '2026-09-30',
    compensation: '₹6.5 LPA',
    applicationEffort: 'high',
    requiredCapabilities: ['Linux', 'Cloud', 'Automation', 'Python', 'Kubernetes'],
    missingCapabilities: [
      { name: 'Kubernetes', current: 15, required: 70 },
      { name: 'Cloud Architecture', current: 35, required: 75 },
    ],
    transferableCapabilities: ['Linux', 'Automation', 'Python'],
    description: 'Manage and scale cloud infrastructure for enterprise clients. Good stepping stone into DevOps and MLOps.',
    tags: ['cloud', 'devops', 'full-time'],
  },
  {
    id: 'opp-community-tech',
    title: 'Community Tech Lead',
    company: 'Digital Bharat Initiative',
    type: 'fellowship',
    location: 'Hubli, India',
    remote: true,
    matchScore: 95,
    capabilityFit: 93,
    futureFit: 88,
    evidenceFit: 91,
    resumeFit: 90,
    deadline: '2026-09-25',
    compensation: '₹22,000/month',
    applicationEffort: 'low',
    requiredCapabilities: ['Leadership', 'Communication', 'Python', 'Data Analysis'],
    missingCapabilities: [],
    transferableCapabilities: ['Leadership', 'Communication', 'Python', 'Data Analysis', 'Automation'],
    description: 'Lead digital literacy and AI programs in rural Karnataka. Perfect alignment with community leadership background.',
    tags: ['fellowship', 'leadership', 'social-impact', 'local'],
  },
];

// ─── Opportunities (Deven Goyal) ──────────────────────────────

export const mockDevenOpportunities: Opportunity[] = [
  {
    id: 'opp-deven-nvidia',
    title: 'AI Systems & LLM Architecture Fellow',
    company: 'NVIDIA Applied AI Labs',
    type: 'fellowship',
    location: 'Bangalore, India',
    remote: true,
    matchScore: 98,
    capabilityFit: 97,
    futureFit: 99,
    evidenceFit: 98,
    resumeFit: 96,
    deadline: '2026-09-15',
    compensation: '₹45,000/month stipend',
    applicationEffort: 'medium',
    requiredCapabilities: ['Artificial Intelligence & LLMs', 'Patent & IP Innovation', 'Full Stack Web Development', 'Python'],
    missingCapabilities: [],
    transferableCapabilities: ['Artificial Intelligence & LLMs', 'Patent & IP Innovation', 'IoT & Embedded Systems', 'Full Stack Web Development', 'Algorithms & Problem Solving'],
    description: 'Research and deploy edge-optimized LLM architectures and wearable AI inference engines. Backed by 20+ patents and hackathon achievements.',
    tags: ['nvidia', 'ai', 'fellowship', 'wearable-ai', 'high-match'],
  },
  {
    id: 'opp-deven-sap',
    title: 'SAP BTP AI Core Innovation Engineer',
    company: 'SAP Labs India',
    type: 'job',
    location: 'Gurugram / Bangalore, India',
    remote: true,
    matchScore: 96,
    capabilityFit: 95,
    futureFit: 98,
    evidenceFit: 97,
    resumeFit: 94,
    deadline: '2026-09-28',
    compensation: '₹14 LPA',
    applicationEffort: 'low',
    requiredCapabilities: ['Full Stack Web Development', 'Artificial Intelligence & LLMs', 'SQL & Data Engineering', 'Algorithms & Problem Solving'],
    missingCapabilities: [],
    transferableCapabilities: ['Full Stack Web Development', 'Artificial Intelligence & LLMs', 'Patent & IP Innovation', 'SQL & Data Engineering'],
    description: 'Engineer full-stack AI applications and predictive workflow microservices on SAP Business Technology Platform (BTP).',
    tags: ['sap', 'btp', 'ai-core', 'full-time', 'innovation'],
  },
  {
    id: 'opp-deven-vibe',
    title: 'Smart Systems & Hardware-AI Fellow',
    company: 'IIT Ropar Technology Innovation Hub',
    type: 'research',
    location: 'Ropar, Punjab',
    remote: true,
    matchScore: 95,
    capabilityFit: 96,
    futureFit: 94,
    evidenceFit: 99,
    resumeFit: 93,
    deadline: '2026-09-20',
    compensation: '₹35,000/month',
    applicationEffort: 'low',
    requiredCapabilities: ['Patent & IP Innovation', 'IoT & Embedded Systems', 'Artificial Intelligence & LLMs'],
    missingCapabilities: [],
    transferableCapabilities: ['Patent & IP Innovation', 'IoT & Embedded Systems', 'Hackathon Leadership & Innovation'],
    description: 'Prototype intelligent wearable biosensors, adaptive illumination, and passive thermal cooling systems supported by filed IP.',
    tags: ['research', 'iit', 'patents', 'wearables', 'hardware-ai'],
  },
  {
    id: 'opp-deven-hackathon',
    title: 'Global AI Grand Challenge 2026',
    company: 'Qaz.AI & Nazarbayev University',
    type: 'hackathon',
    location: 'Astana / Online',
    remote: true,
    matchScore: 97,
    capabilityFit: 98,
    futureFit: 96,
    evidenceFit: 98,
    resumeFit: 95,
    deadline: '2026-09-10',
    compensation: '$25,000 Grand Prize',
    applicationEffort: 'low',
    requiredCapabilities: ['Hackathon Leadership & Innovation', 'Artificial Intelligence & LLMs', 'Full Stack Web Development'],
    missingCapabilities: [],
    transferableCapabilities: ['Hackathon Leadership & Innovation', 'Artificial Intelligence & LLMs', 'Patent & IP Innovation'],
    description: 'International competition for high-impact AI robotics, healthcare, and neuro-adaptive innovations.',
    tags: ['hackathon', 'international', 'grand-prize', 'team-lead'],
  },
];

// ─── Opportunities (Sunita Verma) ─────────────────────────────

export const mockSunitaOpportunities: Opportunity[] = [
  {
    id: 'opp-sunita-care-ops',
    title: 'Healthcare Operations & Logistics Specialist',
    company: 'Apollo Health Tech',
    type: 'job',
    location: 'Lucknow, Uttar Pradesh',
    remote: false,
    matchScore: 95,
    capabilityFit: 94,
    futureFit: 91,
    evidenceFit: 93,
    resumeFit: 92,
    deadline: '2026-09-18',
    compensation: '₹6 LPA',
    applicationEffort: 'low',
    requiredCapabilities: ['Healthcare & Patient Care Management', 'Community Coordination & Logistics', 'Data Entry & Analytics'],
    missingCapabilities: [],
    transferableCapabilities: ['Healthcare & Patient Care Management', 'Community Coordination & Logistics', 'Self-Taught Python & Automation'],
    description: 'Coordinate patient workflows, supplier logistics, and operational data pipelines for multi-facility healthcare delivery in Uttar Pradesh.',
    tags: ['healthcare', 'operations', 'lucknow', 'return-to-work'],
  },
  {
    id: 'opp-sunita-ai-ops',
    title: 'AI Workflow & Data Automation Associate',
    company: 'Cognizant Returnship Program',
    type: 'paid-internship',
    location: 'Noida / Remote',
    remote: true,
    matchScore: 92,
    capabilityFit: 89,
    futureFit: 94,
    evidenceFit: 88,
    resumeFit: 86,
    deadline: '2026-09-22',
    compensation: '₹28,000/month',
    applicationEffort: 'medium',
    requiredCapabilities: ['Self-Taught Python & Automation', 'Data Entry & Analytics', 'Community Coordination & Logistics'],
    missingCapabilities: [],
    transferableCapabilities: ['Self-Taught Python & Automation', 'Healthcare & Patient Care Management'],
    description: 'Dedicated transition program for professionals returning after caregiving breaks. Full training on enterprise automation pipelines.',
    tags: ['returnship', 'automation', 'remote', 'mentorship'],
  },
];

export function getUserOpportunities(identifier?: string): Opportunity[] {
  if (!identifier) return mockDevenOpportunities;
  const lower = identifier.toLowerCase();
  if (lower.includes('sunita')) {
    return mockSunitaOpportunities;
  }
  if (lower.includes('priya')) {
    return mockOpportunities;
  }
  return mockDevenOpportunities;
}

// ─── Actions & Agent Telemetry ────────────────────────────────

export const mockDevenActions: Action[] = [
  {
    id: 'act-deven-1',
    title: 'Submit Application — NVIDIA AI Systems Architecture Fellow',
    description: 'Deadline approaching. 98% match backed by NVIDIA LLM certification and 20+ patents.',
    priority: 'urgent',
    category: 'application',
    agentCode: 'IM',
    agentName: 'Inclusive Matching Agent',
    deadline: '2026-09-15',
    dueDate: '2026-09-15',
    relatedOpportunity: 'opp-deven-nvidia',
    estimatedTime: '15 min',
    completed: false,
    createdAt: '2026-08-28T10:00:00Z',
    verificationSteps: [
      { step: 1, title: 'Sandboxed Micro-Task Generated', description: 'Generated LLM benchmark verification suite based on NVIDIA requirements.', status: 'completed' },
      { step: 2, title: 'System Evaluates Output', description: 'Real-time telemetry parsed MailIQ and Cogniflow AI code repositories.', status: 'completed' },
      { step: 3, title: 'Skills Discovery Agent Logs Evidence', description: 'Logged NVIDIA certification and patent disclosures as high-confidence evidence.', status: 'active' },
      { step: 4, title: 'Twin Score Updates', description: 'Capability Twin verified at 98% confidence.', status: 'pending' },
    ],
  },
  {
    id: 'act-deven-2',
    title: 'Micro-Project: Deploy AI Core Telemetry on SAP BTP',
    description: 'Complete a micro-project using SAP AI Launchpad datasets to verify enterprise MLOps capability.',
    priority: 'high',
    category: 'learning',
    agentCode: 'LP',
    agentName: 'Learning Pathway Agent',
    estimatedTime: '45 min',
    completed: false,
    createdAt: '2026-08-27T14:00:00Z',
    microProjectFraming: 'Complete a micro-project using SAP AI Core & AI Launchpad to verify enterprise model deployment capabilities before final interview.',
    prepCourses: [
      'SAP AI Fundamentals & Business AI Concepts (DEV100)',
      'Developing with SAP AI Core & SAP AI Launchpad (DEV260)',
    ],
    verificationSteps: [
      { step: 1, title: 'Sandboxed Micro-Task Generated', description: 'Generated non-production SAP AI Core deployment pipeline template.', status: 'completed' },
      { step: 2, title: 'System Evaluates Output', description: 'Test inference container and API proxy contract validated.', status: 'active' },
      { step: 3, title: 'Skills Discovery Agent Logs Evidence', description: 'Logs practical trial output as verifiable enterprise evidence.', status: 'pending' },
      { step: 4, title: 'Twin Score Updates', description: 'Advances SAP BTP AI Core capability to 96%.', status: 'pending' },
    ],
  },
  {
    id: 'act-deven-3',
    title: 'Verify Wearable AI Patent Evidence via Skills Discovery',
    description: 'Pass newly filed Patent App No. 202611092508 through the MPNet Skills Discovery Agent.',
    priority: 'medium',
    category: 'assessment',
    agentCode: 'SD',
    agentName: 'Skills Discovery Agent',
    estimatedTime: '10 min',
    completed: false,
    createdAt: '2026-08-26T11:00:00Z',
    verificationSteps: [
      { step: 1, title: 'Sandboxed Micro-Task Generated', description: 'Parsed patent abstract and claim specifications.', status: 'completed' },
      { step: 2, title: 'System Evaluates Output', description: 'AccessHire MPNet model scores semantic and keyword overlap.', status: 'completed' },
      { step: 3, title: 'Skills Discovery Agent Logs Evidence', description: 'Logged 469-taxonomy capability matches with verbatim evidence quotes.', status: 'completed' },
      { step: 4, title: 'Twin Score Updates', description: 'Twin reflects +2% Capability Momentum.', status: 'completed' },
    ],
  },
  {
    id: 'act-deven-4',
    title: 'Review Fairness Score for Smart Systems Research Fellow',
    description: 'Equity review confirms zero demographic bias penalties in the IIT Ropar candidate evaluation pipeline.',
    priority: 'low',
    category: 'follow-up',
    agentCode: 'BA',
    agentName: 'Bias Audit Agent',
    estimatedTime: '5 min',
    completed: false,
    createdAt: '2026-08-25T09:00:00Z',
  },
];

export const mockActions: Action[] = [
  {
    id: 'act-1',
    title: 'Apply — AI Operations Internship',
    description: 'Deadline today. Resume optimized to 94% ATS fit. Strong match.',
    priority: 'urgent',
    category: 'application',
    agentCode: 'IM',
    agentName: 'Inclusive Matching Agent',
    deadline: '2026-09-01',
    dueDate: '2026-09-01',
    relatedOpportunity: 'opp-ai-ops-intern',
    estimatedTime: '20 min',
    completed: false,
    createdAt: '2026-08-27T10:00:00Z',
    verificationSteps: [
      { step: 1, title: 'Sandboxed Micro-Task Generated', description: 'Debug non-production AI agent script.', status: 'completed' },
      { step: 2, title: 'System Evaluates Output', description: 'Code execution output evaluated for accuracy.', status: 'completed' },
      { step: 3, title: 'Skills Discovery Agent Logs Evidence', description: 'Evidence quote and test results saved.', status: 'active' },
      { step: 4, title: 'Twin Score Updates', description: 'Twin proficiency increased by +6%.', status: 'pending' },
    ],
  },
  {
    id: 'act-2',
    title: 'Start AI Evaluation Assessment — Micro-Project',
    description: 'Closes capability gap. Complete internal micro-project to verify LLM evaluation.',
    priority: 'high',
    category: 'assessment',
    agentCode: 'LP',
    agentName: 'Learning Pathway Agent',
    relatedCapability: 'cap-ai',
    estimatedTime: '35 min',
    completed: false,
    createdAt: '2026-08-26T14:00:00Z',
    microProjectFraming: 'Complete a micro-project using RAGAS evaluation datasets to verify AI evaluation capabilities before applying.',
    prepCourses: [
      'SAP AI Fundamentals & Business AI Concepts (DEV100)',
      'Developing with SAP AI Core & SAP AI Launchpad (DEV260)',
    ],
    verificationSteps: [
      { step: 1, title: 'Sandboxed Micro-Task Generated', description: 'Generate AI model evaluation test set.', status: 'completed' },
      { step: 2, title: 'System Evaluates Output', description: 'Evaluate precision, recall, and hallucination scoring.', status: 'active' },
      { step: 3, title: 'Skills Discovery Agent Logs Evidence', description: 'Log capability proof to Adaptive Twin.', status: 'pending' },
      { step: 4, title: 'Twin Score Updates', description: 'Capability score updates to 86%.', status: 'pending' },
    ],
  },
  {
    id: 'act-3',
    title: 'Optimize Resume — Data Engineering Fellowship',
    description: 'Current ATS fit 69%. Can improve to 84% with keyword optimization.',
    priority: 'high',
    category: 'application',
    agentCode: 'JF',
    agentName: 'Job Fairness Agent',
    relatedOpportunity: 'opp-data-fellowship',
    estimatedTime: '15 min',
    completed: false,
    createdAt: '2026-08-27T09:00:00Z',
  },
  {
    id: 'act-4',
    title: 'Respond to Interview Invitation',
    description: 'Infosys AI Labs — response required within 24 hours.',
    priority: 'urgent',
    category: 'interview',
    agentCode: 'EN',
    agentName: 'Equity Nudge Agent',
    deadline: '2026-08-29',
    estimatedTime: '10 min',
    completed: false,
    createdAt: '2026-08-28T08:00:00Z',
  },
  {
    id: 'act-5',
    title: 'Submit Hackathon Registration',
    description: 'NASSCOM AI Hackathon closes tomorrow. Team needs 2 more members.',
    priority: 'high',
    category: 'hackathon',
    agentCode: 'SD',
    agentName: 'Skills Discovery Agent',
    deadline: '2026-09-05',
    relatedOpportunity: 'opp-ai-hackathon',
    estimatedTime: '15 min',
    completed: false,
    createdAt: '2026-08-26T12:00:00Z',
  },
];

export function getUserActions(identifier?: string): Action[] {
  if (!identifier) return mockDevenActions;
  const lower = identifier.toLowerCase();
  if (lower.includes('deven') || lower.includes('goyal')) {
    return mockDevenActions;
  }
  return mockActions;
}


// ─── Emails ───────────────────────────────────────────────────

export const mockEmails: Email[] = [
  {
    id: 'email-1',
    from: 'Rohan Mehta',
    fromOrg: 'Infosys AI Labs',
    subject: 'You have been shortlisted — AI Operations Internship',
    preview: 'Congratulations! You have been shortlisted for the next round of our AI Operations Internship selection...',
    body: 'Dear Candidate,\n\nCongratulations! We are pleased to inform you that you have been shortlisted for the next round of our AI Operations Internship selection process.\n\nYour technical interview is scheduled for September 2, 2026 at 2:00 PM IST. Please confirm your availability by replying to this email.\n\nBest regards,\nRohan Mehta\nTalent Acquisition, Infosys AI Labs',
    date: '2026-08-28T08:30:00Z',
    category: 'interview',
    extractedEvent: { type: 'Interview', date: 'September 2, 2026', role: 'AI Operations Intern' },
    recommendedAction: 'Confirm availability and begin interview preparation',
    read: false,
  },
  {
    id: 'email-2',
    from: 'Applications Team',
    fromOrg: 'NASSCOM Foundation',
    subject: 'National AI Hackathon — Registration closes in 72 hours',
    preview: 'This is a reminder that registration for the National AI Builders Hackathon closes on September 5...',
    body: 'Dear Participant,\n\nThis is a reminder that registration for the National AI Builders Hackathon closes on September 5, 2026.\n\nTeams of 2-4 participants. ₹1,00,000 prize pool. Problem statements focus on AI for social impact.\n\nRegister now at nasscom.in/ai-hackathon',
    date: '2026-08-27T14:00:00Z',
    category: 'deadline',
    extractedEvent: { type: 'Hackathon Registration', date: 'September 5, 2026', role: 'Participant' },
    recommendedAction: 'Register before deadline',
    read: false,
  },
  {
    id: 'email-3',
    from: 'Priya Nair',
    fromOrg: 'Google India',
    subject: 'Women in Tech Scholarship — Application Received',
    preview: 'Thank you for applying to the Google Women in Tech Scholarship 2026. Your application is under review...',
    body: 'Dear Candidate,\n\nThank you for your application to the Google Women in Tech Scholarship 2026.\n\nYour application is currently under review. You will hear back from us within 2 weeks.\n\nBest wishes,\nPriya Nair\nGoogle India Scholarships Team',
    date: '2026-08-26T11:15:00Z',
    category: 'opportunity',
    extractedEvent: { type: 'Scholarship Review', date: '2 weeks', role: 'Applicant' },
    recommendedAction: 'Send polite follow-up in 5 days',
    read: true,
  },
  {
    id: 'email-4',
    from: 'HR Team',
    fromOrg: 'Zoho Corporation',
    subject: 'Application Status Update — Backend Engineering Intern',
    preview: 'Your application for Backend Engineering Intern has been reviewed. We would like to invite you for an assessment...',
    body: 'Dear Candidate,\n\nYour application for the Backend Engineering Intern position has been reviewed by our team.\n\nWe would like to invite you to complete our technical assessment. The assessment takes approximately 90 minutes and must be completed by September 10.\n\nLink: zoho.com/careers/assessment/12345\n\nGood luck!\nZoho HR Team',
    date: '2026-08-27T09:45:00Z',
    category: 'assessment',
    extractedEvent: { type: 'Technical Assessment', date: 'September 10, 2026', role: 'Backend Engineering Intern' },
    recommendedAction: 'Complete technical assessment before September 10',
    read: false,
  },
  {
    id: 'email-5',
    from: 'Community Manager',
    fromOrg: 'Digital Bharat Initiative',
    subject: 'Community Tech Lead — Shortlisted',
    preview: 'We are excited to inform you that your application for Community Tech Lead has progressed to the final round...',
    body: 'Dear Candidate,\n\nWe are excited to inform you that your application for the Community Tech Lead position has progressed to the final round.\n\nWe will be conducting a 30-minute call to discuss your vision and experience. Please suggest 3 time slots that work for you this week.\n\nDigital Bharat Initiative Team',
    date: '2026-08-28T10:00:00Z',
    category: 'interview',
    extractedEvent: { type: 'Final Round Call', date: 'This week', role: 'Community Tech Lead' },
    recommendedAction: 'Reply with available time slots',
    read: false,
  },
  {
    id: 'email-6',
    from: 'Learning Team',
    fromOrg: 'Coursera',
    subject: 'Your AI Engineering path — 2 modules remaining',
    preview: 'You are making great progress! Complete the remaining 2 modules to earn your AI Engineering certificate...',
    body: 'Hi Candidate,\n\nYou are making fantastic progress on the AI Engineering learning path!\n\nYou have 2 modules remaining:\n- Module 7: Agent Orchestration (60 min)\n- Module 8: Cloud AI Deployment (45 min)\n\nComplete them to earn your certificate and add verified evidence to your AccessHire profile.',
    date: '2026-08-25T16:30:00Z',
    category: 'general',
    extractedEvent: { type: 'Learning Milestone', role: 'AI Engineering Certificate' },
    recommendedAction: 'Complete remaining 2 modules',
    read: true,
  },
  {
    id: 'email-7',
    from: 'Scale AI Recruitment',
    fromOrg: 'Scale AI',
    subject: 'AI Quality Evaluator — We reviewed your profile',
    preview: 'We noticed your profile on AccessHire and believe you could be a great fit for our AI Quality Evaluator contract...',
    body: 'Hi Candidate,\n\nOur team reviewed your capability profile and believe you would be a strong fit for our AI Quality Evaluator contract role.\n\nThis is a flexible, remote contract that pays $18/hr. You can work 10-20 hours per week.\n\nInterested? Reply to this email or apply at scale.ai/careers.',
    date: '2026-08-26T13:00:00Z',
    category: 'opportunity',
    extractedEvent: { type: 'Job Opportunity', role: 'AI Quality Evaluator' },
    recommendedAction: 'Apply directly — strong capability match',
    read: false,
  },
  {
    id: 'email-8',
    from: 'Dr. Aisha Patel',
    fromOrg: 'IIT Dharwad',
    subject: 'Research Assistant Position — Interest Check',
    preview: 'I came across your work on AI automation and would like to discuss a potential Research Assistant opportunity...',
    body: 'Dear Candidate,\n\nI am a faculty member at IIT Dharwad working on AI for inclusive education. I came across your work and would like to discuss a potential Research Assistant opportunity.\n\nThe role is part-time remote and includes co-authorship on our upcoming publication.\n\nWould you be available for a 20-minute call next week?\n\nDr. Aisha Patel\nAssistant Professor, AI & Education Lab',
    date: '2026-08-24T11:00:00Z',
    category: 'opportunity',
    extractedEvent: { type: 'Research Opportunity', role: 'Research Assistant' },
    recommendedAction: 'Schedule 20-minute introductory call',
    read: true,
  },
  {
    id: 'email-9',
    from: 'AccessHire AI',
    fromOrg: 'AccessHire',
    subject: 'Capability Update — Your AI score increased by 6%',
    preview: 'Your recent AI Evaluation trial has updated your Capability Twin. AI / ML proficiency increased from 72% to 78%...',
    body: 'Hi Candidate,\n\nYour recent AI Evaluation practical trial has been processed and your Capability Twin has been updated.\n\nAI / ML: 72% → 78% (+6%)\nAI Evaluation: New capability added at 74%\nFuture Readiness: 67% → 74% (+7%)\n\nYour capability momentum is now +18% this month.',
    date: '2026-08-27T18:00:00Z',
    category: 'general',
    read: false,
  },
  {
    id: 'email-10',
    from: 'TCS Recruitment',
    fromOrg: 'Tata Consultancy Services',
    subject: 'Data Engineering Fellowship — Application Open',
    preview: 'Applications are now open for our 2026 Data Engineering Fellowship. Limited seats available...',
    body: 'Dear Candidate,\n\nApplications are now open for TCS Data Engineering Fellowship 2026.\n\nEligibility: Any graduate with demonstrated data skills.\nDuration: 6 months\nStipend: ₹20,000/month\nDeadline: September 15, 2026\n\nApply at tcs.com/fellowship',
    date: '2026-08-23T09:00:00Z',
    category: 'opportunity',
    extractedEvent: { type: 'Fellowship Application', date: 'September 15, 2026', role: 'Data Engineering Fellow' },
    recommendedAction: 'Apply — 81% capability match',
    read: true,
  },
];

// ─── Momentum Chart Data ───────────────────────────────────────

export const mockMomentumData: MomentumDataPoint[] = [
  { month: 'Mar', capabilities: 54, opportunities: 35, readiness: 48 },
  { month: 'Apr', capabilities: 59, opportunities: 42, readiness: 52 },
  { month: 'May', capabilities: 63, opportunities: 48, readiness: 56 },
  { month: 'Jun', capabilities: 67, opportunities: 55, readiness: 60 },
  { month: 'Jul', capabilities: 72, opportunities: 63, readiness: 65 },
  { month: 'Aug', capabilities: 78, opportunities: 74, readiness: 71 },
  { month: 'Sep', capabilities: 82, opportunities: 83, readiness: 74 },
];

// ─── Future Workforce Signals ─────────────────────────────────

export const mockFutureSignals = [
  { role: 'AI Engineering', trend: 'rising', magnitude: 3, year2026: 72, year2027: 88, year2028: 95 },
  { role: 'AI Security & Red Teaming', trend: 'rising', magnitude: 3, year2026: 58, year2027: 74, year2028: 89 },
  { role: 'Cloud AI & MLOps', trend: 'rising', magnitude: 2, year2026: 64, year2027: 77, year2028: 85 },
  { role: 'AI Evaluation & Quality', trend: 'rising', magnitude: 2, year2026: 51, year2027: 68, year2028: 81 },
  { role: 'Traditional QA', trend: 'stable', magnitude: 0, year2026: 62, year2027: 61, year2028: 58 },
  { role: 'Routine IT Support', trend: 'declining', magnitude: -2, year2026: 58, year2027: 47, year2028: 35 },
  { role: 'Data Systems & Pipelines', trend: 'rising', magnitude: 1, year2026: 69, year2027: 75, year2028: 78 },
  { role: 'AI Product & Governance', trend: 'rising', magnitude: 2, year2026: 44, year2027: 61, year2028: 73 },
];

// ─── Workforce Departments ────────────────────────────────────

export const mockWorkforceDepartments: WorkforceDepartment[] = [
  {
    id: 'dept-it',
    name: 'IT Support & Infrastructure',
    headcount: 1240,
    capabilities: {
      'Python': 54, 'AI / ML': 21, 'Cloud': 43, 'SQL': 67, 'Linux': 78, 'Automation': 52, 'Data Analysis': 38, 'Security': 44,
    },
    transitions: [
      { from: 'IT Support', to: 'AI Operations Engineer', readiness: 74, employees: 312 },
      { from: 'IT Support', to: 'Cloud Engineer', readiness: 61, employees: 218 },
    ],
  },
  {
    id: 'dept-data',
    name: 'Data & Analytics',
    headcount: 890,
    capabilities: {
      'Python': 79, 'AI / ML': 58, 'Cloud': 62, 'SQL': 91, 'Linux': 44, 'Automation': 61, 'Data Analysis': 88, 'Security': 28,
    },
    transitions: [
      { from: 'Data Analyst', to: 'AI Analytics Engineer', readiness: 86, employees: 267 },
      { from: 'Data Analyst', to: 'Data Engineer', readiness: 71, employees: 195 },
    ],
  },
  {
    id: 'dept-qa',
    name: 'Quality Assurance',
    headcount: 650,
    capabilities: {
      'Python': 48, 'AI / ML': 34, 'Cloud': 29, 'SQL': 61, 'Linux': 52, 'Automation': 73, 'Data Analysis': 55, 'Security': 31,
    },
    transitions: [
      { from: 'QA Engineer', to: 'AI Evaluation Specialist', readiness: 81, employees: 234 },
      { from: 'QA Engineer', to: 'AI Security Analyst', readiness: 59, employees: 98 },
    ],
  },
  {
    id: 'dept-ops',
    name: 'Operations & Business',
    headcount: 2100,
    capabilities: {
      'Python': 22, 'AI / ML': 15, 'Cloud': 34, 'SQL': 52, 'Linux': 18, 'Automation': 41, 'Data Analysis': 63, 'Security': 22,
    },
    transitions: [
      { from: 'Business Analyst', to: 'AI-Enabled BA', readiness: 79, employees: 445 },
    ],
  },
  {
    id: 'dept-engineering',
    name: 'Software Engineering',
    headcount: 3200,
    capabilities: {
      'Python': 81, 'AI / ML': 52, 'Cloud': 71, 'SQL': 74, 'Linux': 68, 'Automation': 65, 'Data Analysis': 59, 'Security': 43,
    },
    transitions: [
      { from: 'Backend Engineer', to: 'AI Operations Engineer', readiness: 82, employees: 512 },
      { from: 'Frontend Engineer', to: 'AI Product Engineer', readiness: 68, employees: 289 },
    ],
  },
  {
    id: 'dept-security',
    name: 'Cybersecurity',
    headcount: 420,
    capabilities: {
      'Python': 65, 'AI / ML': 38, 'Cloud': 55, 'SQL': 48, 'Linux': 82, 'Automation': 57, 'Data Analysis': 44, 'Security': 89,
    },
    transitions: [
      { from: 'Security Analyst', to: 'AI Security Analyst', readiness: 77, employees: 156 },
    ],
  },
];

// ─── Equity Candidates ────────────────────────────────────────

export const mockEquityCandidates: EquityCandidate[] = [
  {
    id: 'eq-1',
    name: 'Priya Sharma',
    capabilityFit: 88,
    evidenceConfidence: 92,
    careerGap: '3 years',
    location: 'Hubli, India',
    credentials: 'B.Sc. Computer Applications',
  },
  {
    id: 'eq-2',
    name: 'Deven Goyal',
    capabilityFit: 94,
    evidenceConfidence: 98,
    careerGap: 'None (Engineering Student & Innovator)',
    location: 'Chandigarh / Haryana, India',
    credentials: 'B.E. Computer Science Engineering · 3 Patents',
  },
  {
    id: 'eq-3',
    name: 'Arjun Nair',
    capabilityFit: 79,
    evidenceConfidence: 81,
    careerGap: '1 year',
    location: 'Kochi, India',
    credentials: 'Diploma in CS',
  },
  {
    id: 'eq-4',
    name: 'Fatima Sheikh',
    capabilityFit: 84,
    evidenceConfidence: 87,
    careerGap: '5 years',
    location: 'Hyderabad, India',
    credentials: 'Self-taught + Certifications',
  },
];

// ─── Notifications ────────────────────────────────────────────

export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'capability',
    title: 'Patent Evidence Verified',
    message: 'Patent App 202611068506 verified. Innovation Capability score updated to 96%.',
    timestamp: '2026-08-28T18:00:00Z',
    read: false,
  },
  {
    id: 'notif-2',
    type: 'opportunity',
    title: 'New 95% Match',
    message: 'AI Systems Architect / Software Engineer — 95% match with your Capability Twin.',
    timestamp: '2026-08-28T14:00:00Z',
    read: false,
  },
  {
    id: 'notif-3',
    type: 'email',
    title: 'Interview Email Detected',
    message: 'Infosys AI Labs shortlisted you for AI Operations Internship. Response required.',
    timestamp: '2026-08-28T08:30:00Z',
    read: false,
  },
  {
    id: 'notif-4',
    type: 'resume',
    title: 'Resume Optimized to 94%',
    message: 'Tailored resume generated with verified Patent and Full Stack evidence.',
    timestamp: '2026-08-27T20:00:00Z',
    read: true,
  },
  {
    id: 'notif-5',
    type: 'verification',
    title: 'Capability Verified: 93%',
    message: 'Cogniflow AI Dashboard project verified. Full Stack capability updated.',
    timestamp: '2026-08-27T17:00:00Z',
    read: true,
  },
];

// ─── AI Mock Responses ────────────────────────────────────────

export const mockAIResponses: Record<string, string> = {
  'interview-prep': `Great! I've loaded your full context for the Software Engineer / AI Systems Architect interview.

**Your Capability Profile for This Role:**
- Full Stack Dev 93% ✓ (above threshold)
- Patent & Innovation 96% ✓ (Top 1% Evidence)
- Problem Solving & DSA 94% ✓
- Python 91% ✓
- SQL & Databases 89% ✓

**Likely Interview Topics Based on Your Profile:**

1. **Patent Architecture** — Walk through the AI-Driven Wearable System (App No. 202611068506) and how signal processing / hardware-software interfaces work.
2. **Full-Stack Performance** — Discuss MailIQ & Cogniflow AI backend classification pipelines and real-time dashboard analytics.
3. **Problem Solving / DSA** — Code optimization and algorithmic efficiency demonstrated in your IIT Ropar hackathon wins.

Want me to run a mock interview session?`,

  'resume-help': `Your Master Profile includes 3 filed patents and 5 hackathon awards. Your current ATS fit is **94%**.

**Key strengths highlighted:**
- Patent Applications: 202611068506, 202511122602, 202511132517
- Full-Stack & AI Projects: MailIQ, Cogniflow AI
- Hackathon Wins: IIT Ropar AI for Social Good Winner, Stack Sprint 1.0 Winner

Resume is optimized and ready for export!`,

  'capability-question': `Based on your Adaptive Capability Twin:

**Top Verified Capabilities:**
- Patent & Innovation: 96% (3 Patents Filed)
- Problem Solving & DSA: 94% (IIT Ropar Hackathon Winner)
- Full Stack Dev: 93% (MailIQ, Cogniflow AI)
- Python: 91%

All capability scores are verified with high-confidence evidence.`,
};
