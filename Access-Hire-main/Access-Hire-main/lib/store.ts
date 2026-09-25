import { create } from 'zustand';
import {
  INITIAL_EMPLOYEE,
  CapabilityItem,
  ACCESSIBILITY_PROFILE,
  AccommodationBlueprintItem
} from './mockData';

interface TrialScores {
  technicalExecution: number;
  problemSolving: number;
  aiEvaluation: number;
  cloudDeployment: number;
  independence: number;
  overallVerified: number;
}

interface AccessHireState {
  // Employee State
  employee: typeof INITIAL_EMPLOYEE;
  addCapabilityFromTranslation: (newCap: { name: string; proficiency: number; confidence: number; category: string; evidenceNote: string }) => void;
  updateCapabilityScore: (id: string, newProficiency: number) => void;

  // Practical Trial Modal State
  isTrialOpen: boolean;
  trialStep: number; // 1 to 5, 6 is results
  trialCompleted: boolean;
  trialScores: TrialScores | null;
  openTrial: () => void;
  closeTrial: () => void;
  setTrialStep: (step: number) => void;
  completeTrial: () => void;

  // Job Fairness Agent State
  jobPostTitle: string;
  jobPostRequirements: string;
  jobPostFlagged: boolean;
  jobPostRewrite: string;
  setJobPostRequirements: (text: string) => void;
  setJobPostTitle: (title: string) => void;
  acceptJobPostRewrite: () => void;
  dismissJobPostFlag: () => void;

  // Equity Nudge State
  selectedCandidateId: string | null;
  nudgeQuestions: string[];
  isGeneratingQuestions: boolean;
  setSelectedCandidateId: (id: string | null) => void;
  generateNudgeQuestions: (candidateName: string) => void;

  // Accommodation Blueprint State
  blueprintItems: AccommodationBlueprintItem[];
  toggleBlueprintItem: (id: string) => void;
}

export const useAccessHireStore = create<AccessHireState>((set, get) => ({
  // Employee initial state
  employee: INITIAL_EMPLOYEE,

  addCapabilityFromTranslation: (newCap) => {
    set((state) => {
      const exists = state.employee.capabilities.some(
        (c) => c.name.toLowerCase() === newCap.name.toLowerCase()
      );
      if (exists) return state;

      const created: CapabilityItem = {
        id: `cap-translated-${Date.now()}`,
        name: newCap.name,
        proficiency: newCap.proficiency,
        confidence: newCap.confidence,
        recency: 'Current',
        independentCapability: 85,
        aiAssistedCapability: 15,
        evidence: [
          {
            id: `ev-trans-${Date.now()}`,
            title: `Capability Translator: ${newCap.evidenceNote}`,
            type: 'Work Evidence',
            date: 'Feb 2026',
            confidenceScore: newCap.confidence
          }
        ]
      };

      return {
        employee: {
          ...state.employee,
          capabilities: [created, ...state.employee.capabilities]
        }
      };
    });
  },

  updateCapabilityScore: (id, newProficiency) => {
    set((state) => ({
      employee: {
        ...state.employee,
        capabilities: state.employee.capabilities.map((c) =>
          c.id === id
            ? {
                ...c,
                proficiency: newProficiency,
                confidence: Math.min(98, c.confidence + 12),
                recency: 'Just Verified',
                evidence: [
                  {
                    id: `ev-verified-${Date.now()}`,
                    title: 'Verified via Practical Transition Trial (Scored 83%)',
                    type: 'Assessment',
                    date: 'Feb 2026',
                    confidenceScore: 96
                  },
                  ...c.evidence
                ]
              }
            : c
        )
      }
    }));
  },

  // Practical Trial State
  isTrialOpen: false,
  trialStep: 1,
  trialCompleted: false,
  trialScores: null,

  openTrial: () => set({ isTrialOpen: true, trialStep: 1 }),
  closeTrial: () => set({ isTrialOpen: false }),
  setTrialStep: (step) => set({ trialStep: step }),

  completeTrial: () => {
    const scores: TrialScores = {
      technicalExecution: 85,
      problemSolving: 88,
      aiEvaluation: 82,
      cloudDeployment: 80,
      independence: 84,
      overallVerified: 83
    };

    // Boost AI Operations capability score from 74% to 83%!
    const aiCap = get().employee.capabilities.find((c) =>
      c.name.toLowerCase().includes('ai ops') || c.name.toLowerCase().includes('ai operations')
    );

    if (aiCap) {
      get().updateCapabilityScore(aiCap.id, 83);
    }

    set({
      trialStep: 6, // Results screen
      trialCompleted: true,
      trialScores: scores
    });
  },

  // Job Fairness Agent
  jobPostTitle: 'Senior Cloud AI Systems Engineer',
  jobPostRequirements: "Master's degree in Computer Science required from a top tier university. Minimum 8+ years experience in large-scale infrastructure.",
  jobPostFlagged: true,
  jobPostRewrite: 'Demonstrated proficiency in distributed systems, algorithm design, cloud AI orchestration, or verified evidence of practical engineering execution.',

  setJobPostTitle: (title) => set({ jobPostTitle: title }),
  setJobPostRequirements: (text) => {
    const isProxy = /master'?s|degree|top[- ]tier|computer science degree|phd/i.test(text);
    set({
      jobPostRequirements: text,
      jobPostFlagged: isProxy,
      jobPostRewrite: isProxy
        ? 'Demonstrated proficiency in distributed systems, algorithm design, cloud AI orchestration, or verified evidence of practical engineering execution.'
        : ''
    });
  },

  acceptJobPostRewrite: () => {
    const rewrite = get().jobPostRewrite;
    if (rewrite) {
      set({
        jobPostRequirements: rewrite,
        jobPostFlagged: false
      });
    }
  },

  dismissJobPostFlag: () => set({ jobPostFlagged: false }),

  // Equity Nudge State
  selectedCandidateId: 'cand-3', // Sarah Jenkins default
  nudgeQuestions: [],
  isGeneratingQuestions: false,

  setSelectedCandidateId: (id) => set({ selectedCandidateId: id, nudgeQuestions: [] }),

  generateNudgeQuestions: (candidateName) => {
    set({ isGeneratingQuestions: true });

    setTimeout(() => {
      set({
        isGeneratingQuestions: false,
        nudgeQuestions: [
          `"Walk us through how you designed and deployed the automated monitoring workflow in your recent practical trial."`,
          `"How do you handle edge-case hallucinations when evaluating LLM output quality under operational load?"`,
          `"Can you describe a specific instance where you prioritized system fault tolerance during high-traffic anomalies?"`,
          `"What methodology do you use to rapidly master and integrate new API frameworks into legacy pipelines?"`
        ]
      });
    }, 800);
  },

  // Accommodation Blueprint State
  blueprintItems: ACCESSIBILITY_PROFILE.blueprintItems,

  toggleBlueprintItem: (id) => {
    set((state) => ({
      blueprintItems: state.blueprintItems.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === 'Configured & Verified' ? 'Active' : 'Configured & Verified'
            }
          : item
      )
    }));
  }
}));
