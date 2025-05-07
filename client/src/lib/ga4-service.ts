import { apiRequest } from '@/lib/queryClient';
import { Metric, Website } from '@/types/metric';
import { Insight, InsightImplementationPlan } from '@/types/insight';

export const ga4Service = {
  getWebsites: async (): Promise<Website[]> => {
    const response = await apiRequest('GET', '/api/websites');
    return response.json();
  },

  getLatestMetrics: async (websiteId: number): Promise<Metric> => {
    const response = await apiRequest('GET', `/api/websites/${websiteId}/metrics`);
    return response.json();
  },

  syncMetrics: async (websiteId: number, days: number = 30): Promise<Metric> => {
    const response = await apiRequest('POST', `/api/websites/${websiteId}/metrics/sync?days=${days}`);
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
  
  deleteWebsite: async (websiteId: number): Promise<{message: string}> => {
    const response = await apiRequest('DELETE', `/api/websites/${websiteId}`);
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      } else {
        const text = await response.text();
        return { message: text || 'Website deleted successfully' };
      }
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      return { message: 'Website deleted, but response parsing failed' };
    }
  },
  
  getAvailableGa4Properties: async (): Promise<Array<{
    accountName: string;
    propertyName: string;
    propertyId: string;
    domain: string;
  }>> => {
    const response = await apiRequest('GET', '/api/ga4-properties');
    return response.json();
  },

  // Implementation plans methods
  getImplementationPlans: async (websiteId: number): Promise<InsightImplementationPlan[]> => {
    const response = await apiRequest('GET', `/api/websites/${websiteId}/implementation-plans`);
    return response.json();
  },

  getImplementationPlan: async (planId: number): Promise<InsightImplementationPlan> => {
    const response = await apiRequest('GET', `/api/implementation-plans/${planId}`);
    return response.json();
  },

  generateImplementationPlan: async (websiteId: number, insightIds: number[]): Promise<InsightImplementationPlan> => {
    const response = await apiRequest('POST', `/api/websites/${websiteId}/implementation-plans`, { insightIds });
    return response.json();
  },

  deleteImplementationPlan: async (planId: number): Promise<{ message: string }> => {
    const response = await apiRequest('DELETE', `/api/implementation-plans/${planId}`);
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      } else {
        const text = await response.text();
        return { message: text || 'Implementation plan deleted successfully' };
      }
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      return { message: 'Implementation plan deleted, but response parsing failed' };
    }
  }
};

export default ga4Service;
