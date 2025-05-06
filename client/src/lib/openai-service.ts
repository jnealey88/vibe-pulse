import { apiRequest } from '@/lib/queryClient';
import { Report } from '@/types/insight';

export const openaiService = {
  pollReportStatus: async (reportId: number): Promise<Report> => {
    const response = await apiRequest('GET', `/api/reports/${reportId}`);
    return response.json();
  }
};

export default openaiService;
