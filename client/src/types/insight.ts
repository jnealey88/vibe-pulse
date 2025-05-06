export interface Recommendation {
  text: string;
}

export type ImpactLevel = "High" | "Medium" | "Low";
export type Category = "Traffic" | "Conversion" | "Performance" | "Content" | "User Experience";

export interface Insight {
  id: number;
  websiteId: number;
  title: string;
  description: string;
  category: Category | string;
  impact: ImpactLevel | string;
  icon: string;
  recommendations: string[];
  detectedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface InsightFilters {
  category: string;
  impact: string;
}

export interface GenerateReportRequest {
  query: string;
}

export interface Report {
  id: number;
  userId: number;
  websiteId: number;
  query: string;
  response: ReportResponse | null;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface ReportResponse {
  title: string;
  summary: string;
  findings: string[];
  causes: string[];
  recommendations: string[];
  nextSteps: string[];
}
