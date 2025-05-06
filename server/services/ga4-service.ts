import { google } from 'googleapis';
import { Metric, InsertMetric } from '@shared/schema';

const analyticsDataClient = google.analyticsdata('v1beta');

export interface GA4MetricsData {
  visitors: number;
  conversions: number;
  bounceRate: string;
  pageSpeed: string;
  visitorsChange: string;
  conversionsChange: string;
  bounceRateChange: string;
  pageSpeedChange: string;
}

export const ga4Service = {
  // Authenticate to Google Analytics API
  authenticate: async (refreshToken: string) => {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      return oauth2Client;
    } catch (error) {
      console.error('Error authenticating with Google:', error);
      throw new Error(`Failed to authenticate with Google: ${error.message}`);
    }
  },

  // Fetch key metrics from GA4
  fetchKeyMetrics: async (propertyId: string, authClient: any): Promise<GA4MetricsData> => {
    try {
      // Current period data
      const currentPeriodResponse = await analyticsDataClient.properties.runReport({
        auth: authClient,
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          metrics: [
            { name: 'totalUsers' },
            { name: 'conversions' },
            { name: 'bounceRate' },
            { name: 'averagePageLoadTime' }
          ],
        },
      });

      // Previous period data for comparison
      const previousPeriodResponse = await analyticsDataClient.properties.runReport({
        auth: authClient,
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate: '14daysAgo', endDate: '8daysAgo' }],
          metrics: [
            { name: 'totalUsers' },
            { name: 'conversions' },
            { name: 'bounceRate' },
            { name: 'averagePageLoadTime' }
          ],
        },
      });

      const currentData = currentPeriodResponse.data.rows?.[0]?.metricValues || [];
      const previousData = previousPeriodResponse.data.rows?.[0]?.metricValues || [];

      // Calculate percentage changes
      const calculateChange = (current: number, previous: number): string => {
        if (previous === 0) return '0%';
        const change = ((current - previous) / previous) * 100;
        return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
      };

      // Extract values safely with fallbacks
      const currentVisitors = Number(currentData[0]?.value || '0');
      const previousVisitors = Number(previousData[0]?.value || '0');
      
      const currentConversions = Number(currentData[1]?.value || '0');
      const previousConversions = Number(previousData[1]?.value || '0');
      
      const currentBounceRate = Number(currentData[2]?.value || '0');
      const previousBounceRate = Number(previousData[2]?.value || '0');
      
      const currentPageSpeed = Number(currentData[3]?.value || '0');
      const previousPageSpeed = Number(previousData[3]?.value || '0');

      // Format data
      const formattedData: GA4MetricsData = {
        visitors: currentVisitors,
        conversions: currentConversions,
        bounceRate: `${currentBounceRate.toFixed(1)}%`,
        pageSpeed: `${currentPageSpeed.toFixed(1)}s`,
        visitorsChange: calculateChange(currentVisitors, previousVisitors),
        conversionsChange: calculateChange(currentConversions, previousConversions),
        bounceRateChange: calculateChange(currentBounceRate, previousBounceRate),
        pageSpeedChange: calculateChange(currentPageSpeed, previousPageSpeed)
      };

      return formattedData;
    } catch (error) {
      console.error('Error fetching GA4 metrics:', error);
      throw new Error(`Failed to fetch metrics from Google Analytics: ${error.message}`);
    }
  },

  // Fetch historical data for more context (last 30 days by default)
  fetchHistoricalData: async (propertyId: string, authClient: any, days = 30) => {
    try {
      const response = await analyticsDataClient.properties.runReport({
        auth: authClient,
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
          dimensions: [{ name: 'date' }],
          metrics: [
            { name: 'totalUsers' },
            { name: 'conversions' },
            { name: 'bounceRate' },
            { name: 'averagePageLoadTime' }
          ],
        },
      });

      const formattedData = response.data.rows?.map(row => ({
        date: row.dimensionValues?.[0].value,
        visitors: Number(row.metricValues?.[0].value || '0'),
        conversions: Number(row.metricValues?.[1].value || '0'),
        bounceRate: `${Number(row.metricValues?.[2].value || '0').toFixed(1)}%`,
        pageSpeed: `${Number(row.metricValues?.[3].value || '0').toFixed(1)}s`,
      })) || [];

      return formattedData;
    } catch (error) {
      console.error('Error fetching historical GA4 data:', error);
      throw new Error(`Failed to fetch historical data from Google Analytics: ${error.message}`);
    }
  },

  // Format GA4 data into our Metric schema
  formatMetricsForStorage: (metricsData: GA4MetricsData, websiteId: number): InsertMetric => {
    return {
      websiteId,
      date: new Date(),
      visitors: metricsData.visitors,
      conversions: metricsData.conversions,
      bounceRate: metricsData.bounceRate,
      pageSpeed: metricsData.pageSpeed,
      visitorsChange: metricsData.visitorsChange,
      conversionsChange: metricsData.conversionsChange,
      bounceRateChange: metricsData.bounceRateChange,
      pageSpeedChange: metricsData.pageSpeedChange,
    };
  },
};

export default ga4Service;
