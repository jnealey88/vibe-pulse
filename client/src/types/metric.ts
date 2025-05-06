export interface Metric {
  id: number;
  websiteId: number;
  date: string;
  
  // Original core metrics
  visitors: number;
  conversions: number;
  bounceRate: string;
  pageSpeed: string;
  visitorsChange: string;
  conversionsChange: string;
  bounceRateChange: string;
  pageSpeedChange: string;
  
  // Additional metrics 
  activeUsers?: number;
  newUsers?: number;
  eventCount?: number;
  avgEngagementTime?: string;
  viewsCount?: number;
  userStickiness?: string; // DAU/MAU ratio as percentage string
  sessionsByChannel?: Record<string, number>;
  sessionsBySource?: Record<string, number>;
  viewsByPage?: Record<string, number>;
  usersByCountry?: Record<string, number>;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface Website {
  id: number;
  userId: number;
  name: string;
  domain: string;
  gaPropertyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  profileImage: string;
}
