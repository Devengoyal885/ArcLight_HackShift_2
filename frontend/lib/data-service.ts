import {
  mockUser,
  mockDevenUser,
  mockSunitaUser,
  mockCapabilities,
  mockDevenCapabilities,
  mockSunitaCapabilities,
  mockOpportunities,
  mockWorkforceDepartments,
  mockEquityCandidates,
  getUserProfile,
  getUserCapabilities,
} from '@/data/mockData';
import type { UserProfile, Capability, Opportunity, WorkforceDepartment, EquityCandidate } from '@/types';

/**
 * AccessHire Unified Data Access Layer (Service Layer)
 * 
 * All UI components fetch data through this single interface.
 * Swapping internal data providers (e.g. from local seed objects to SAP OData / REST APIs)
 * requires NO changes to UI components — only modifying these functions.
 */

export const DataService = {
  /**
   * Fetch active candidate profile by email/identifier
   */
  async getProfile(email?: string): Promise<UserProfile> {
    // Abstraction layer: returns user profile
    return getUserProfile(email);
  },

  /**
   * Fetch candidate verified capability twin nodes
   */
  async getCapabilities(email?: string): Promise<Capability[]> {
    return getUserCapabilities(email);
  },

  /**
   * Fetch all candidate profiles in the enterprise pool
   */
  async getAllCandidates(): Promise<UserProfile[]> {
    return [mockDevenUser, mockUser, mockSunitaUser];
  },

  /**
   * Fetch live opportunity postings radar dataset
   */
  async getOpportunities(): Promise<Opportunity[]> {
    return mockOpportunities;
  },

  /**
   * Fetch single opportunity details by ID
   */
  async getOpportunityById(id: string): Promise<Opportunity | undefined> {
    return mockOpportunities.find(o => o.id === id);
  },

  /**
   * Fetch enterprise workforce departments & capabilities matrix
   */
  async getWorkforceDepartments(): Promise<WorkforceDepartment[]> {
    return mockWorkforceDepartments;
  },

  /**
   * Fetch candidates for equity review
   */
  async getEquityCandidates(): Promise<EquityCandidate[]> {
    return mockEquityCandidates;
  },
};
