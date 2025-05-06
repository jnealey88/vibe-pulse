export interface Metric {
  id: number;
  websiteId: number;
  date: string;
  visitors: number;
  conversions: number;
  bounceRate: string;
  pageSpeed: string;
  visitorsChange: string;
  conversionsChange: string;
  bounceRateChange: string;
  pageSpeedChange: string;
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
