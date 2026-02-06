export enum AppState {
  INPUT = 'INPUT',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  TAILORING = 'TAILORING'
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
