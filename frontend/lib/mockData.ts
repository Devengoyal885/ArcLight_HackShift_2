export interface EvidenceSource {
  id: string;
  title: string;
  type: 'Project' | 'Assessment' | 'Work Evidence' | 'Learning Evidence';
  date: string;
  confidenceScore: number; // 0-100
}

export interface CapabilityItem {
  id: string;
  name: string;
  proficiency: number; // 0-100
  confidence: number; // 0-100
  recency: string;
  independentCapability: number; // %
  aiAssistedCapability: number; // %
  evidence: EvidenceSource[];
}

export interface RoleOpportunity {
  id: string;
  title: string;
  department: string;
  matchPercent: number;
  alreadyHave: string[];
  missingCapabilities: string[];
  transitionRequirement: {
    capabilitiesCount: number;
    projectCount: number;
    assessmentCount: number;
    estimatedDays: number;
  };
}

export interface Candidate {
  id: string;
  name: string;
  currentRole: string;
  location: string;
  matchPercent: number;
  gapDays: number;
  hasCareerGap: boolean;
  gapReason?: string;
  capabilities: { name: string; score: number }[];
}

export interface WorkforceGap {
  id: string;
  roleTitle: string;
  openCount: number;
  urgency: 'High' | 'Critical' | 'Medium';
  candidates: Candidate[];
}

export interface AccommodationBlueprintItem {
  id: string;
  category: 'Tools' | 'Environment' | 'Communication' | 'Assessment';
  title: string;
  description: string;
  status: 'Configured & Verified' | 'Enabled' | 'Active' | 'Ready' | 'Granted';
  verifiedBy: string;
}

export const INITIAL_EMPLOYEE = {
  id: 'emp-001',
  name: 'Priya Sharma',
  age: 29,
  role: 'IT Operations Specialist',
  department: 'Enterprise Infrastructure & Ops',
  location: 'Bangalore, India',
  avatarUrl: '/avatars/priya.png',
  bio: 'Systems administrator and automation enthusiast focused on scaling IT infrastructure and expanding into AI operations.',
  capabilities: [
    {
      id: 'cap-1',
      name: 'Python Systems Scripting',
      proficiency: 87,
      confidence: 94,
      recency: 'Current',
      independentCapability: 85,
      aiAssistedCapability: 15,
      evidence: [
        { id: 'ev-1', title: 'Automated Log Parsing Pipeline (GitHub)', type: 'Project', date: 'Jan 2026', confidenceScore: 95 },
        { id: 'ev-2', title: 'Python Advanced Scripting Assessment', type: 'Assessment', date: 'Nov 2025', confidenceScore: 92 },
        { id: 'ev-3', title: 'IT Incident Automation Suite', type: 'Work Evidence', date: 'Dec 2025', confidenceScore: 96 }
      ]
    },
    {
      id: 'cap-2',
      name: 'Data Analysis & SQL',
      proficiency: 84,
      confidence: 90,
      recency: 'Current',
      independentCapability: 80,
      aiAssistedCapability: 20,
      evidence: [
        { id: 'ev-4', title: 'Quarterly Infrastructure Metrics Report', type: 'Work Evidence', date: 'Feb 2026', confidenceScore: 91 },
        { id: 'ev-5', title: 'Enterprise SQL Optimization Workshop', type: 'Learning Evidence', date: 'Oct 2025', confidenceScore: 88 }
      ]
    },
    {
      id: 'cap-3',
      name: 'AI Operations & Monitoring',
      proficiency: 74, // Increases to 83% after completing trial!
      confidence: 78,
      recency: '3 months ago',
      independentCapability: 70,
      aiAssistedCapability: 30,
      evidence: [
        { id: 'ev-6', title: 'LLM Latency Sandbox Experiment', type: 'Project', date: 'Nov 2025', confidenceScore: 78 },
        { id: 'ev-7', title: 'Prompt Evaluation Sandbox Trial', type: 'Assessment', date: 'Dec 2025', confidenceScore: 76 }
      ]
    },
    {
      id: 'cap-4',
      name: 'Workflow Automation (Airflow/CI-CD)',
      proficiency: 78,
      confidence: 88,
      recency: 'Current',
      independentCapability: 75,
      aiAssistedCapability: 25,
      evidence: [
        { id: 'ev-8', title: 'Jenkins to GitHub Actions Migration', type: 'Work Evidence', date: 'Jan 2026', confidenceScore: 90 }
      ]
    },
    {
      id: 'cap-5',
      name: 'Infrastructure as Code (Terraform)',
      proficiency: 71,
      confidence: 82,
      recency: '6 months ago',
      independentCapability: 65,
      aiAssistedCapability: 35,
      evidence: [
        { id: 'ev-9', title: 'AWS Terraform Module Library', type: 'Project', date: 'Aug 2025', confidenceScore: 82 }
      ]
    }
  ],
  futureOpportunities: [
    {
      id: 'opp-1',
      title: 'AI Operations Engineer',
      department: 'Cloud AI Operations',
      matchPercent: 83,
      alreadyHave: ['Python Systems Scripting', 'Data Analysis & SQL', 'Workflow Automation'],
      missingCapabilities: ['Cloud AI Deployment', 'Agent Orchestration', 'AI Guardrail Evaluation'],
      transitionRequirement: {
        capabilitiesCount: 3,
        projectCount: 1,
        assessmentCount: 1,
        estimatedDays: 14
      }
    },
    {
      id: 'opp-2',
      title: 'Data Operations Analyst',
      department: 'Data Platform & Analytics',
      matchPercent: 88,
      alreadyHave: ['Data Analysis & SQL', 'Python Systems Scripting', 'Workflow Automation'],
      missingCapabilities: ['Real-time Event Streaming', 'Enterprise Data Governance'],
      transitionRequirement: {
        capabilitiesCount: 2,
        projectCount: 1,
        assessmentCount: 1,
        estimatedDays: 10
      }
    },
    {
      id: 'opp-3',
      title: 'Cloud AI Solutions Architect',
      department: 'Enterprise Architecture',
      matchPercent: 75,
      alreadyHave: ['Infrastructure as Code', 'Python Systems Scripting', 'Workflow Automation'],
      missingCapabilities: ['Multi-Cloud AI Mesh', 'Zero-Trust Security Architecture', 'Model Governance'],
      transitionRequirement: {
        capabilitiesCount: 4,
        projectCount: 2,
        assessmentCount: 1,
        estimatedDays: 21
      }
    }
  ],
  recommendedGrowth: [
    'AI Evaluation & Safety',
    'Agent Orchestration',
    'Cloud AI Deployment',
    'RAG Architecture & Embeddings'
  ]
};

export const SEEDED_TRANSLATION_EXAMPLE = {
  inputText: "I organize my village's annual festival (~5,000 attendees). I manage the overall $50k budget, negotiate terms with 20+ vendors, lead 40+ volunteers, handle crisis logistics during heavy weather, and coordinate with municipal authorities.",
  extractedCapabilities: [
    {
      name: 'Large-Scale Event Operations',
      proficiency: 82,
      confidence: 88,
      category: 'Operations Management',
      evidenceNote: 'Demonstrated in managing 5,000-attendee logistics & emergency protocols'
    },
    {
      name: 'Budget & Fiscal Management',
      proficiency: 85,
      confidence: 92,
      category: 'Financial Governance',
      evidenceNote: 'Direct stewardship of $50,000 operational budget'
    },
    {
      name: 'Vendor & Partner Negotiation',
      proficiency: 79,
      confidence: 84,
      category: 'Procurement',
      evidenceNote: 'Managed contracts & service agreements with 20+ suppliers'
    },
    {
      name: 'Cross-Functional Stakeholder Coordination',
      proficiency: 88,
      confidence: 94,
      category: 'Leadership & Comms',
      evidenceNote: 'Aligned municipal authorities, volunteer teams & community leaders'
    },
    {
      name: 'Volunteer Leadership & Scheduling',
      proficiency: 84,
      confidence: 90,
      category: 'People Management',
      evidenceNote: 'Led & scheduled 40+ active volunteer staff members'
    },
    {
      name: 'Crisis & Risk Mitigation',
      proficiency: 76,
      confidence: 80,
      category: 'Risk Management',
      evidenceNote: 'Handled severe weather contingency & safety compliance'
    }
  ]
};

export const WORKFORCE_CONSOLE_DATA = {
  totalEmployees: 10000,
  internalMobilityRate: 34,
  verifiedSkillsIndex: 78,
  transitionReadyCount: 1420,
  currentCapabilities: [
    { skill: 'AI & Machine Learning', percent: 42, target: 70 },
    { skill: 'Cloud Infrastructure', percent: 58, target: 80 },
    { skill: 'Data Analytics & SQL', percent: 61, target: 75 },
    { skill: 'Cybersecurity & Governance', percent: 37, target: 65 },
    { skill: 'Workflow Automation', percent: 54, target: 75 }
  ],
  futureSkillDemand: [
    { skill: 'AI Operations & Agentic Systems', trend: '↑↑↑', change: '+45%', priority: 'Critical' },
    { skill: 'Cloud AI Infrastructure', trend: '↑↑', change: '+30%', priority: 'High' },
    { skill: 'AI Security & Guardrails', trend: '↑↑↑', change: '+60%', priority: 'Critical' },
    { skill: 'Legacy Infrastructure Maintenance', trend: '↓', change: '-25%', priority: 'Declining' }
  ],
  workforceGaps: [
    {
      id: 'gap-1',
      roleTitle: 'AI Engineering',
      openCount: 1240,
      urgency: 'Critical' as const,
      candidates: [
        {
          id: 'cand-1',
          name: 'Priya Sharma',
          currentRole: 'IT Operations Specialist',
          location: 'Bangalore, India',
          matchPercent: 83,
          gapDays: 14,
          hasCareerGap: false,
          gapReason: undefined,
          capabilities: [
            { name: 'Python Scripting', score: 87 },
            { name: 'Data Analysis', score: 84 },
            { name: 'AI Ops Trial', score: 83 }
          ]
        },
        {
          id: 'cand-2',
          name: 'Marcus Chen',
          currentRole: 'Senior Systems Admin',
          location: 'Singapore',
          matchPercent: 86,
          gapDays: 10,
          hasCareerGap: false,
          gapReason: undefined,
          capabilities: [
            { name: 'Python Scripting', score: 91 },
            { name: 'Cloud Infra', score: 88 },
            { name: 'Automation', score: 84 }
          ]
        },
        {
          id: 'cand-3',
          name: 'Sarah Jenkins',
          currentRole: 'Database Analyst (Internal)',
          location: 'London, UK',
          matchPercent: 81,
          gapDays: 18,
          hasCareerGap: true,
          gapReason: '2-year career gap for family caregiving (2022-2024)',
          capabilities: [
            { name: 'Data Modeling', score: 92 },
            { name: 'SQL & Analytics', score: 89 },
            { name: 'Python Sandbox Trial', score: 81 }
          ]
        }
      ] as Candidate[]
    },
    {
      id: 'gap-2',
      roleTitle: 'AI Security & Safety',
      openCount: 680,
      urgency: 'Critical' as const,
      candidates: [
        {
          id: 'cand-4',
          name: 'Elena Rostova',
          currentRole: 'Security Operations Analyst',
          location: 'Berlin, Germany',
          matchPercent: 89,
          gapDays: 7,
          hasCareerGap: false,
          gapReason: undefined,
          capabilities: [
            { name: 'Cybersecurity', score: 94 },
            { name: 'Risk Audit', score: 90 },
            { name: 'Python', score: 82 }
          ]
        }
      ] as Candidate[]
    },
    {
      id: 'gap-3',
      roleTitle: 'Cloud AI Deployment',
      openCount: 520,
      urgency: 'High' as const,
      candidates: [
        {
          id: 'cand-5',
          name: 'Devon Vance',
          currentRole: 'DevOps Engineer',
          location: 'Austin, TX',
          matchPercent: 87,
          gapDays: 12,
          hasCareerGap: false,
          gapReason: undefined,
          capabilities: [
            { name: 'Terraform', score: 90 },
            { name: 'Docker/K8s', score: 88 },
            { name: 'Python', score: 80 }
          ]
        }
      ] as Candidate[]
    }
  ]
};

export const ACCESSIBILITY_PROFILE = {
  candidateName: 'Alex Rivera',
  age: 31,
  currentTitle: 'Senior Systems Analyst',
  disabilityType: 'Visual Impairment (Screen Reader User)',
  capabilities: [
    { name: 'Distributed Systems Architecture', proficiency: 92 },
    { name: 'Incident Diagnosis & Debugging', proficiency: 89 },
    { name: 'API Design & Integration', proficiency: 94 },
    { name: 'Python & Shell Automation', proficiency: 86 }
  ],
  workRequirements: [
    'Complex System Architecture Review',
    'Real-time Production Incident Triaging',
    'Cross-team Technical Design Synchronization'
  ],
  accessibilityPreferences: [
    'Primary Tooling: Screen Reader (NVDA / JAWS / VoiceOver)',
    'Strict Keyboard Navigation Compatibility (No mouse-dependent UIs)',
    'High Contrast & Accessible Semantic Markup (ARIA 1.2+)',
    'Asynchronous Audio / Text-First Communication Protocol',
    'Extended Time Allowances (1.5x) for Practical Assessments'
  ],
  blueprintItems: [
    {
      id: 'ab-1',
      category: 'Tools' as const,
      title: 'Screen-Reader Compatible Development Environment',
      description: 'Configured VS Code & Terminal CLI with accessible screen-reader bindings and stdout verbosity filters.',
      status: 'Configured & Verified' as const,
      verifiedBy: 'SAP Inclusive IT Engineering'
    },
    {
      id: 'ab-2',
      category: 'Environment' as const,
      title: 'Accessible System Architecture Schemas',
      description: 'All system topology documents rendered in text-based Mermaid/PlantUML formats alongside graphical diagrams.',
      status: 'Enabled' as const,
      verifiedBy: 'Accessibility Agent & Enterprise Architecture'
    },
    {
      id: 'ab-3',
      category: 'Communication' as const,
      title: 'Text-First Asynchronous Sync Protocol',
      description: 'Meeting notes pre-summarized via text; screen-share sessions recorded with spoken descriptive narration.',
      status: 'Active' as const,
      verifiedBy: 'Team Operations Manager'
    },
    {
      id: 'ab-4',
      category: 'Assessment' as const,
      title: '1.5x Extended Time Allowance for Micro-Trials',
      description: 'Practical verification sandbox automatically adjusts timer and provides accessible keyboard shortcuts.',
      status: 'Granted' as const,
      verifiedBy: 'Inclusive Hiring Board'
    }
  ]
};

export const HOW_IT_WORKS_DATA = {
  closedLoopSteps: [
    { id: 1, title: 'Discover', desc: 'Identify latent experience and uncredited practical skills beyond resumes.', icon: 'Search' },
    { id: 2, title: 'Translate', desc: 'Convert real-world lived experience into standardized enterprise capability nodes.', icon: 'Languages' },
    { id: 3, title: 'Understand', desc: 'Map proficiency, recency, independence, and multi-source evidence confidence.', icon: 'Brain' },
    { id: 4, title: 'Forecast', desc: 'Project organizational skill gaps and future capability demand in real-time.', icon: 'TrendingUp' },
    { id: 5, title: 'Transfer', desc: 'Calculate adjacency and minimum transition paths between current and target roles.', icon: 'GitBranch' },
    { id: 6, title: 'Reskill', desc: 'Deliver targeted micro-learning focused exclusively on the missing gap.', icon: 'GraduationCap' },
    { id: 7, title: 'Practice', desc: 'Execute real-world hands-on trials in isolated sandbox environments.', icon: 'Terminal' },
    { id: 8, title: 'Verify', desc: 'Evaluate execution, problem-solving, and independence with evidence scoring.', icon: 'CheckCircle2' },
    { id: 9, title: 'Match', desc: 'Connect verified candidates to internal roles, free of proxy credential bias.', icon: 'UserCheck' },
    { id: 10, title: 'Real Work', desc: 'Perform in role, generate fresh work evidence, and update the Capability Twin.', icon: 'Briefcase' }
  ],
  systemAgents: [
    { name: 'Skills Discovery Agent', role: 'Scans non-traditional experience & work outputs' },
    { name: 'Capability Translator Agent', role: 'Parses free text into SAP capability taxonomy' },
    { name: 'Market Intelligence Agent', role: 'Forecasts workforce capability demand trends' },
    { name: 'Learning Pathway Agent', role: 'Calculates minimum transition paths' },
    { name: 'Inclusive Matching Agent', role: 'Matches candidates based on verified potential' },
    { name: 'Equity Nudge Agent', role: 'Flags career gap biases & provides structured questions' },
    { name: 'Job Fairness Agent', role: 'Detects degree proxy requirements & rewrites JDs' },
    { name: 'Accessibility Agent', role: 'Generates candidate Accommodation Blueprints' },
    { name: 'Bias Audit Agent', role: 'Monitors matching algorithms for systemic equity' }
  ]
};
