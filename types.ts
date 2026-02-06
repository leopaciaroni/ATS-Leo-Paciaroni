export enum AppState {
  INPUT = 'INPUT',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  TAILORING = 'TAILORING'
}

export interface CareerMatch {
  role: string;
  industry: string;
  matchPercentage: number;
}

export interface ATSAnalysis {
  overallScore: number;
  keywordMatch: number;
  formattingScore: number;
  impactScore: number;
  foundKeywords: string[];
  missingKeywords: string[];
  criticalIssues: string[];
  improvementSuggestions: string[];
  careerMatches: CareerMatch[];
  summary: string;
}

export interface OptimizationResult {
  markdownCV: string;
  rationale: string;
}

export interface TailoredResult {
  markdownCV: string;
  matchScore: number;
  changesMade: string[];
}

// Auth Types
export interface User {
  email: string;
  password?: string;
  role: 'admin' | 'user';
  name: string;
}

export interface AccessRequest {
  id: string;
  email: string;
  name: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}