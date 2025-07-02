// Analytics data types
export interface DashboardStats {
  totalAnalyses: number;
  averageScore: number;
  totalResumes: number;
  lastAnalysisDate?: string;
  improvementRate: number;
  skillsGained: number;
  topIndustry: string;
}

export interface SkillFrequency {
  skill: string;
  frequency: number;
  averageMatch: number;
}

export interface ScoreHistory {
  date: string;
  score: number;
  jobTitle: string;
  matchLevel: string;
}

export interface IndustryInsight {
  industry: string;
  analysisCount: number;
  averageScore: number;
  commonSkills: string[];
}

export interface AnalyticsData {
  dashboardStats: DashboardStats;
  skillsDistribution: Record<string, number>;
  topSkills: SkillFrequency[];
  scoreHistory: ScoreHistory[];
  industryInsights: IndustryInsight[];
  monthlyTrends: Record<string, number>;
  successRate: number;
  totalSkillsAnalyzed: number;
}
