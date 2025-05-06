import { apiRequest } from '@/lib/queryClient';
import { Metric, Website } from '@/types/metric';
import { Insight } from '@/types/insight';

export const ga4Service = {
  getWebsites: async (): Promise<Website[]> => {
    const response = await apiRequest('GET', '/api/websites');
    return response.json();
  },

  getLatestMetrics: async (websiteId: number): Promise<Metric> => {
    const response = await apiRequest('GET', `/api/websites/${websiteId}/metrics`);
    return response.json();
  },

  syncMetrics: async (websiteId: number): Promise<Metric> => {
    const response = await apiRequest('POST', `/api/websites/${websiteId}/metrics/sync`);
    return response.json();
  },

  getInsights: async (
    websiteId: number, 
    category?: string, 
    impact?: string, 
    limit?: number, 
    offset?: number
  ): Promise<Insight[]> => {
    const params = new URLSearchParams();
    
    if (category && category !== 'All Categories') {
      params.append('category', category);
    }
    
    if (impact && impact !== 'All Impacts') {
      params.append('impact', impact);
    }
    
    if (limit) {
      params.append('limit', limit.toString());
    }
    
    if (offset) {
      params.append('offset', offset.toString());
    }
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await apiRequest('GET', `/api/websites/${websiteId}/insights${queryString}`);
    return response.json();
  },

  generateInsights: async (websiteId: number): Promise<Insight[]> => {
    const response = await apiRequest('POST', `/api/websites/${websiteId}/insights/generate`);
    return response.json();
  },

  generateReport: async (websiteId: number, query: string): Promise<{ id: number; status: string }> => {
    const response = await apiRequest('POST', `/api/websites/${websiteId}/reports`, { query });
    return response.json();
  },

  getReport: async (reportId: number) => {
    const response = await apiRequest('GET', `/api/reports/${reportId}`);
    return response.json();
  },

  addWebsite: async (name: string, domain: string, gaPropertyId: string): Promise<Website> => {
    const response = await apiRequest('POST', '/api/websites', { name, domain, gaPropertyId });
    return response.json();
  },
  
  getAvailableGa4Properties: async (): Promise<Array<{
    accountName: string;
    propertyName: string;
    propertyId: string;
    domain: string;
  }>> => {
    const response = await apiRequest('GET', '/api/ga4-properties');
    return response.json();
  }
};

export default ga4Service;
