import { google } from 'googleapis';
import { Metric, InsertMetric } from '@shared/schema';

const analyticsDataClient = google.analyticsdata('v1beta');
const analyticsAdminClient = google.analyticsadmin('v1beta');

export interface GA4MetricsData {
  // Core metrics for UI display
  visitors: number;
  // Conversions data made optional per client request
  conversions?: number;
  bounceRate: string;
  visitorsChange: string;
  conversionsChange?: string; // Made optional per client request
  bounceRateChange: string;
  
  // Additional metrics for display requested by user
  activeUsers?: number;
  newUsers?: number;
  eventCount?: number;
  avgEngagementTime?: string;
  viewsCount?: number;
  sessionsByChannel?: Record<string, number>;
  sessionsBySource?: Record<string, number>;
  viewsByPage?: Record<string, number>;
  usersByCountry?: Record<string, number>;
  userStickiness?: string; // DAU/MAU ratio as a percentage string
  
  // Additional data for AI analysis - optional as they may not always be set
  rawCurrentData?: any;
  rawPreviousData?: any;
  deviceBreakdown?: Record<string, number>;
  platformBreakdown?: Record<string, number>;
  countryBreakdown?: Record<string, number>; // Added for more comprehensive insights
  deviceCategory?: Record<string, number>; // Added for better device segmentation
  browserData?: Record<string, number>; // Added for browser analysis
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
    } catch (error: any) {
      console.error('Error authenticating with Google:', error);
      throw new Error(`Failed to authenticate with Google: ${error.message || 'Unknown error'}`);
    }
  },

  // Fetch key metrics from GA4 (respecting the 10 metrics per request limit)
  fetchKeyMetrics: async (propertyId: string, authClient: any, days: number = 30): Promise<GA4MetricsData> => {
    try {
      // GA4 API has a limit of 10 metrics per request, so we need to split our metrics
      
      // First batch of metrics (core metrics + some additional ones)
      const primaryMetrics = [
        // Core metrics for display (these are essential)
        { name: 'totalUsers' },
        { name: 'conversions' }, // Keep for index consistency, even if not using it
        { name: 'engagementRate' }, // Use engagementRate instead of bounceRate (1 - engagementRate = bounceRate)
        { name: 'userEngagementDuration' }, // Use this instead of averageSessionDuration for better accuracy
        
        // Additional important metrics for AI analysis
        { name: 'sessionsPerUser' },
        { name: 'engagedSessions' },
        { name: 'screenPageViewsPerSession' },
        { name: 'eventCount' },
        { name: 'sessions' },
        { name: 'activeUsers' }, // This is a valid GA4 metric
        { name: 'averageSessionDuration' } // Use instead of engagedSessionsPerUser
      ];
      
      // Second batch of metrics (remaining ones)
      const secondaryMetrics = [
        // More metrics for comprehensive analysis
        { name: 'eventCountPerUser' },
        { name: 'newUsers' },
        { name: 'sessionDuration' } // Use sessionDuration instead of duplicate activeUsers
        // Removed conversion/revenue related metrics per client request
      ];

      console.log('Fetching first batch of GA4 metrics...');
      // Determine date ranges based on days parameter
      const currentStartDate = `${days}daysAgo`;
      const previousStartDate = `${days * 2}daysAgo`;
      const previousEndDate = `${days + 1}daysAgo`;
      
      console.log(`Using date range: ${currentStartDate} to today (${days} days)`);
      
      // Current period data with first batch of metrics
      const currentPeriodResponse = await analyticsDataClient.properties.runReport({
        auth: authClient,
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate: currentStartDate, endDate: 'today' }],
          metrics: primaryMetrics,
          // Add dimensions for more context
          dimensions: [
            { name: 'platform' },
            { name: 'deviceCategory' }
          ]
        },
      });

      console.log('Fetching previous period data for first batch...');
      // Previous period data for comparison (with first batch)
      const previousPeriodResponse = await analyticsDataClient.properties.runReport({
        auth: authClient,
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate: previousStartDate, endDate: previousEndDate }],
          metrics: primaryMetrics,
          // Add dimensions for more context
          dimensions: [
            { name: 'platform' },
            { name: 'deviceCategory' }
          ]
        },
      });
      
      // Secondary metrics (optional, we'll try to fetch these but continue even if they fail)
      let currentSecondaryData = null;
      let previousSecondaryData = null;
      
      try {
        console.log('Fetching second batch of GA4 metrics...');
        // Current period data with second batch
        const currentSecondaryResponse = await analyticsDataClient.properties.runReport({
          auth: authClient,
          property: `properties/${propertyId}`,
          requestBody: {
            dateRanges: [{ startDate: currentStartDate, endDate: 'today' }],
            metrics: secondaryMetrics,
            dimensions: [
              { name: 'platform' },
              { name: 'deviceCategory' }
            ]
          },
        });
        currentSecondaryData = currentSecondaryResponse.data;
        
        console.log('Fetching previous period data for second batch...');
        // Previous period data with second batch
        const previousSecondaryResponse = await analyticsDataClient.properties.runReport({
          auth: authClient,
          property: `properties/${propertyId}`,
          requestBody: {
            dateRanges: [{ startDate: previousStartDate, endDate: previousEndDate }],
            metrics: secondaryMetrics,
            dimensions: [
              { name: 'platform' },
              { name: 'deviceCategory' }
            ]
          },
        });
        previousSecondaryData = previousSecondaryResponse.data;
      } catch (secondaryError) {
        console.warn('Could not fetch secondary metrics, continuing with primary metrics only:', secondaryError);
        // Continue with primary metrics only
      }

      // Store the complete raw responses for AI analysis later
      const completeCurrentData = currentPeriodResponse.data;
      const completePreviousData = previousPeriodResponse.data;
      
      // For display in UI, just extract the first 4 metrics (the ones we're displaying)
      const currentData = currentPeriodResponse.data.rows?.[0]?.metricValues?.slice(0, 4) || [];
      const previousData = previousPeriodResponse.data.rows?.[0]?.metricValues?.slice(0, 4) || [];

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
      
      // GA4 engagement rate is a percentage between 0 and 1 (e.g., 0.54 = 54%)
      // We want to calculate bounce rate as (1 - engagementRate)
      // and store it as a formatted string like "54.00%"
      const currentEngagementRate = Number(currentData[2]?.value || '0');
      const previousEngagementRate = Number(previousData[2]?.value || '0');
      
      // Calculate bounce rate from engagement rate (bounce rate = 1 - engagement rate)
      const currentBounceRate = Math.max(0, Math.min(1, 1 - currentEngagementRate));
      const previousBounceRate = Math.max(0, Math.min(1, 1 - previousEngagementRate));
      
      // Log raw values for debugging
      console.log(`Raw metrics from GA4: 
        - Users: ${currentData[0]?.value} 
        - Engagement rate: ${currentData[2]?.value} (${typeof currentData[2]?.value})
        - User engagement duration: ${currentData[3]?.value}
        - Sessions: ${currentData[8]?.value} 
      `);
      
      // Removed page speed metrics per client request

      // Process device and platform breakdown data for AI analysis
      const deviceBreakdown: Record<string, number> = {};
      const platformBreakdown: Record<string, number> = {};
      
      // Process the dimension data from the response
      if (currentPeriodResponse.data.rows && currentPeriodResponse.data.rows.length > 0) {
        currentPeriodResponse.data.rows.forEach(row => {
          const platform = row.dimensionValues?.[0]?.value || 'unknown';
          const device = row.dimensionValues?.[1]?.value || 'unknown';
          const users = Number(row.metricValues?.[0]?.value || '0');
          
          // Add to platform breakdown
          if (platform) {
            if (platformBreakdown[platform]) {
              platformBreakdown[platform] += users;
            } else {
              platformBreakdown[platform] = users;
            }
          }
          
          // Add to device breakdown
          if (device) {
            if (deviceBreakdown[device]) {
              deviceBreakdown[device] += users;
            } else {
              deviceBreakdown[device] = users;
            }
          }
        });
      }

      // Fetch additional metrics from the primary and secondary data responses
      // Default values if metrics aren't available
      let activeUsers = 0;
      let newUsers = 0;
      let eventCount = 0;
      let avgEngagementTime = '0s';
      let viewsCount = 0;
      
      // Extract active users from the primary metrics (at index 8)
      if (currentPeriodResponse.data.rows && currentPeriodResponse.data.rows[0]?.metricValues?.[8]) {
        activeUsers = Number(currentPeriodResponse.data.rows[0].metricValues[8].value || '0');
        console.log(`Active users from GA4: ${activeUsers}`);
      }
      
      // More structured data for display
      const sessionsByChannel: Record<string, number> = {};
      const sessionsBySource: Record<string, number> = {};
      const viewsByPage: Record<string, number> = {};
      const usersByCountry: Record<string, number> = {};
      
      // Try to extract these metrics from the secondary responses
      if (currentSecondaryData && currentSecondaryData.rows && currentSecondaryData.rows.length > 0) {
        try {
          // Get aggregate values for metrics from the batch
          currentSecondaryData.rows.forEach(row => {
            // Index based on secondaryMetrics order
            // In secondary metrics we now have:
            // [0] eventCountPerUser 
            // [1] newUsers
            // [2] sessionDuration
            newUsers += Number(row.metricValues?.[1]?.value || '0');
            eventCount += Number(row.metricValues?.[0]?.value || '0');
            // Extract from active users in the primary metrics instead
          });
          
          console.log('Retrieved secondary metrics successfully');
        } catch (err) {
          console.warn('Error extracting data from secondary metrics:', err);
        }
      }
      
      // Get additional metrics data
      try {
        // 1. Get channel breakdown
        const channelResponse = await analyticsDataClient.properties.runReport({
          auth: authClient,
          property: `properties/${propertyId}`,
          requestBody: {
            dateRanges: [{ startDate: currentStartDate, endDate: 'today' }],
            dimensions: [{ name: 'sessionDefaultChannelGroup' }],
            metrics: [{ name: 'sessions' }]
          }
        });
        
        if (channelResponse.data && channelResponse.data.rows) {
          channelResponse.data.rows.forEach(row => {
            const channel = (row.dimensionValues?.[0]?.value || 'unknown').toLowerCase();
            const sessions = Math.round(Number(row.metricValues?.[0]?.value || '0'));
            sessionsByChannel[channel] = sessions;
          });
        }
        
        // 2. Get source breakdown
        const sourceResponse = await analyticsDataClient.properties.runReport({
          auth: authClient,
          property: `properties/${propertyId}`,
          requestBody: {
            dateRanges: [{ startDate: currentStartDate, endDate: 'today' }],
            dimensions: [{ name: 'sessionSource' }],
            metrics: [{ name: 'sessions' }],
            limit: 10
          }
        });
        
        if (sourceResponse.data && sourceResponse.data.rows) {
          sourceResponse.data.rows.forEach(row => {
            const source = (row.dimensionValues?.[0]?.value || 'unknown').toLowerCase();
            const sessions = Math.round(Number(row.metricValues?.[0]?.value || '0'));
            sessionsBySource[source] = sessions;
          });
        }
        
        // 3. Get page views breakdown
        const pageResponse = await analyticsDataClient.properties.runReport({
          auth: authClient,
          property: `properties/${propertyId}`,
          requestBody: {
            dateRanges: [{ startDate: currentStartDate, endDate: 'today' }],
            dimensions: [{ name: 'pageTitle' }],
            metrics: [{ name: 'screenPageViews' }],
            limit: 15
          }
        });
        
        if (pageResponse.data && pageResponse.data.rows) {
          pageResponse.data.rows.forEach(row => {
            const pageTitle = row.dimensionValues?.[0]?.value || 'unknown';
            const views = Math.round(Number(row.metricValues?.[0]?.value || '0'));
            viewsByPage[pageTitle] = views;
          });
        }
        
        // 4. Get country breakdown
        const countryResponse = await analyticsDataClient.properties.runReport({
          auth: authClient,
          property: `properties/${propertyId}`,
          requestBody: {
            dateRanges: [{ startDate: currentStartDate, endDate: 'today' }],
            dimensions: [{ name: 'country' }],
            metrics: [{ name: 'totalUsers' }],
            limit: 10
          }
        });
        
        if (countryResponse.data && countryResponse.data.rows) {
          countryResponse.data.rows.forEach(row => {
            const country = row.dimensionValues?.[0]?.value || 'unknown';
            const users = Math.round(Number(row.metricValues?.[0]?.value || '0'));
            
            // Convert country names to country codes (simplified)
            // In a real app, we'd use a proper mapping library
            let countryCode = country.substring(0, 2).toUpperCase();
            if (country === 'United States') countryCode = 'US';
            if (country === 'United Kingdom') countryCode = 'GB';
            
            usersByCountry[countryCode] = users;
          });
        }
      } catch (err) {
        console.warn('Error fetching additional metrics:', err);
      }
      
      // Now let's fetch more specific dimension data for the other metrics
      // These require separate API calls because of the dimension combinations
      
      // Define variables to hold accurate metrics
      let actualViewsCount = 0;
      let actualEventCount = 0;
      let dauPerMau = 0; // Add DAU/MAU ratio metric from GA4
      
      // Remove the old declaration since we'll calculate it differently below
      const engagementTimeStr = "0m 0s"; // Temporary placeholder
      
      try {
        // Get actual screenPageViews count, accurate event count, and DAU/MAU ratio (no dimensions to avoid duplicates)
        const metricsResponse = await analyticsDataClient.properties.runReport({
          auth: authClient,
          property: `properties/${propertyId}`,
          requestBody: {
            dateRanges: [{ startDate: currentStartDate, endDate: 'today' }],
            metrics: [
              { name: 'screenPageViews' },
              { name: 'eventCount' },
              { name: 'dauPerMau' } // GA4's official user stickiness metric
            ]
          }
        });
        
        if (metricsResponse.data && metricsResponse.data.rows && metricsResponse.data.rows.length > 0) {
          actualViewsCount = Math.round(Number(metricsResponse.data.rows[0].metricValues?.[0]?.value || '0'));
          actualEventCount = Math.round(Number(metricsResponse.data.rows[0].metricValues?.[1]?.value || '0'));
          // GA4 returns dauPerMau as a decimal between 0 and 1 (e.g., 0.113 for 11.3%)
          const rawDauPerMau = metricsResponse.data.rows[0].metricValues?.[2]?.value || '0';
          dauPerMau = Number(rawDauPerMau);
          console.log(`Retrieved actual metrics: ${actualViewsCount} views, ${actualEventCount} events, DAU/MAU raw value: ${rawDauPerMau}, formatted: ${(dauPerMau * 100).toFixed(1)}%`);
        }
        
        console.log('Fetched comprehensive GA4 metrics for AI analysis');
      } catch (dimensionErr) {
        console.warn('Could not fetch dimension metrics:', dimensionErr);
      }
      
      // Get the user engagement duration (which is now at index 3 in the metrics)
      // This gives us a much more accurate metric for GA4 engagement time
      let userEngagementDuration = 0;
      if (currentData && currentData.length > 3) {
        userEngagementDuration = Number(currentData[3]?.value || '0');
        console.log(`User engagement duration from GA4: ${userEngagementDuration} seconds`);
      }
      
      // Calculate engagement time string representation
      // Format the user engagement duration as minutes and seconds
      const minutes = Math.floor(userEngagementDuration / 60);
      const seconds = Math.floor(userEngagementDuration % 60);
      const engagementTime = `${minutes}m ${seconds}s`;
      
      // We'll ONLY use actual data and not provide a default - that was causing the issue
      const engagementTimeToUse = engagementTime;
      
      // Format data with additional AI analysis fields
      const formattedData: GA4MetricsData = {
        // Calculate more accurate values for core metrics
        visitors: Math.round(currentVisitors), // Ensure integer
        conversions: Math.round(currentConversions), // Ensure integer
        // Calculate bounce rate from GA4's engagement rate
        // Don't use default values - display the actual GA4 data
        bounceRate: `${Math.min(100, Math.max(0, currentBounceRate * 100)).toFixed(2)}%`,
        visitorsChange: calculateChange(currentVisitors, previousVisitors),
        conversionsChange: calculateChange(currentConversions, previousConversions),
        bounceRateChange: isNaN(currentBounceRate) || isNaN(previousBounceRate) ? "0%" : calculateChange(currentBounceRate, previousBounceRate),
        
        // Additional metrics for dashboard display
        activeUsers: Math.round(activeUsers), // Ensure integer
        newUsers: Math.round(newUsers), // Ensure integer
        eventCount: actualEventCount > 0 ? actualEventCount : Math.round(eventCount), // Use accurate value when available
        avgEngagementTime: engagementTimeToUse, // Use our calculated value with realistic fallback
        // Use actual screenPageViews instead of calculated estimate
        viewsCount: actualViewsCount > 0 ? actualViewsCount : 0,
        // Use GA4's actual DAU/MAU ratio (user stickiness)
        // dauPerMau is already a decimal between 0 and 1, so format correctly
        userStickiness: dauPerMau > 0 ? `${(dauPerMau * 100).toFixed(1)}%` : undefined,
        sessionsByChannel,
        sessionsBySource,
        viewsByPage,
        usersByCountry,
        
        // Additional data for AI analysis
        rawCurrentData: completeCurrentData,
        rawPreviousData: completePreviousData,
        deviceBreakdown, 
        platformBreakdown
      };

      return formattedData;
    } catch (error: any) {
      console.error('Error fetching GA4 metrics:', error);
      throw new Error(`Failed to fetch metrics from Google Analytics: ${error.message || 'Unknown error'}`);
    }
  },

  // Fetch comprehensive historical data for more context (last 30 days by default)
  fetchHistoricalData: async (propertyId: string, authClient: any, days = 60) => {
    try {
      // Daily metrics (keep under 10 metrics per request)
      // First batch - core metrics only
      const coreMetrics = [
        { name: 'totalUsers' },
        // Removed conversions metric per client request
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' }
      ];
      
      // Second batch - enhanced metrics
      const enhancedMetrics = [
        { name: 'sessionsPerUser' },
        { name: 'engagedSessions' },
        { name: 'screenPageViewsPerSession' },
        { name: 'eventCount' },
        { name: 'userEngagementDuration' },
        { name: 'newUsers' }
      ];

      console.log('Fetching core historical metrics...');
      // Daily metrics - core metrics
      const dailyResponse = await analyticsDataClient.properties.runReport({
        auth: authClient,
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
          dimensions: [{ name: 'date' }],
          metrics: coreMetrics
        },
      });
      
      console.log('Fetching enhanced historical metrics...');
      // Daily metrics - enhanced metrics (separate request)
      const dailyEnhancedResponse = await analyticsDataClient.properties.runReport({
        auth: authClient,
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
          dimensions: [{ name: 'date' }],
          metrics: enhancedMetrics
        },
      });
      
      // Get landing page performance 
      const landingPageResponse = await analyticsDataClient.properties.runReport({
        auth: authClient,
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
          dimensions: [{ name: 'landingPage' }],
          metrics: [
            { name: 'totalUsers' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' }
            // Removed conversions metric per client request
          ],
          limit: 10,
          orderBys: [
            { metric: { metricName: 'totalUsers' }, desc: true }
          ]
        },
      });
      
      // Get traffic source data
      const trafficSourceResponse = await analyticsDataClient.properties.runReport({
        auth: authClient,
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
          dimensions: [{ name: 'sessionSource' }],
          metrics: [
            { name: 'totalUsers' },
            { name: 'bounceRate' }
            // Removed conversions metric per client request
          ],
          limit: 10,
          orderBys: [
            { metric: { metricName: 'totalUsers' }, desc: true }
          ]
        },
      });
      
      // Process and merge the data from both requests
      console.log('Processing historical trend data...');
      const dailyTrends = [];
      
      // First, process the core metrics
      const coreDailyData = dailyResponse.data.rows || [];
      
      // Create a map of dates to data for core metrics
      const dateToDataMap = new Map();
      
      coreDailyData.forEach(row => {
        const date = row.dimensionValues?.[0].value;
        if (date) {
          dateToDataMap.set(date, {
            date,
            visitors: Number(row.metricValues?.[0]?.value || '0'),
            // Removed conversions per client request
            bounceRate: `${Number(row.metricValues?.[1]?.value || '0').toFixed(1)}%`,
            // Removed pageSpeed per client request, use avgSessionDuration as session insight instead
            avgSessionDuration: `${Number(row.metricValues?.[2]?.value || '0').toFixed(1)}s`,
            // Initialize enhanced metrics with defaults
            sessionsPerUser: 0,
            engagedSessions: 0,
            pageViewsPerSession: 0,
            eventCount: 0, 
            engagementDuration: 0,
            newUsers: 0
          });
        }
      });
      
      // Process the enhanced metrics and merge with core metrics
      const enhancedDailyData = dailyEnhancedResponse.data.rows || [];
      
      enhancedDailyData.forEach(row => {
        const date = row.dimensionValues?.[0].value;
        if (date && dateToDataMap.has(date)) {
          const existingData = dateToDataMap.get(date);
          
          // Update with enhanced metrics
          existingData.sessionsPerUser = Number(row.metricValues?.[0]?.value || '0');
          existingData.engagedSessions = Number(row.metricValues?.[1]?.value || '0');
          existingData.pageViewsPerSession = Number(row.metricValues?.[2]?.value || '0');
          existingData.eventCount = Number(row.metricValues?.[3]?.value || '0');
          existingData.engagementDuration = Number(row.metricValues?.[4]?.value || '0');
          existingData.newUsers = Number(row.metricValues?.[5]?.value || '0');
          
          dateToDataMap.set(date, existingData);
        }
      });
      
      // Convert the map to an array sorted by date
      dateToDataMap.forEach(data => {
        dailyTrends.push(data);
      });
      
      // Sort by date
      dailyTrends.sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
      
      // Format landing page data
      const landingPages = landingPageResponse.data.rows?.map(row => ({
        page: row.dimensionValues?.[0].value,
        visitors: Number(row.metricValues?.[0].value || '0'),
        bounceRate: `${Number(row.metricValues?.[1].value || '0').toFixed(1)}%`,
        avgSessionDuration: `${Number(row.metricValues?.[2].value || '0').toFixed(1)}s`
        // Removed conversions per client request
      })) || [];
      
      // Format traffic source data
      const trafficSources = trafficSourceResponse.data.rows?.map(row => ({
        source: row.dimensionValues?.[0].value,
        visitors: Number(row.metricValues?.[0].value || '0'),
        bounceRate: `${Number(row.metricValues?.[1].value || '0').toFixed(1)}%`
        // Removed conversions per client request
      })) || [];
      
      // Combine all data into a comprehensive historical dataset
      const formattedData = {
        dailyTrends,
        landingPages,
        trafficSources,
        periodCovered: `${days} days`
      };

      return formattedData;
    } catch (error: any) {
      console.error('Error fetching historical GA4 data:', error);
      throw new Error(`Failed to fetch historical data from Google Analytics: ${error.message || 'Unknown error'}`);
    }
  },

  // Format GA4 data into our Metric schema
  formatMetricsForStorage: (metricsData: GA4MetricsData, websiteId: number): InsertMetric => {
    // Destructure any additional data we want to store
    const { 
      activeUsers, 
      newUsers, 
      eventCount, 
      avgEngagementTime,
      viewsCount,
      sessionsByChannel,
      sessionsBySource,
      viewsByPage,
      usersByCountry,
      userStickiness 
    } = metricsData;
    
    return {
      websiteId,
      date: new Date(),
      
      // Core metrics
      visitors: Math.round(metricsData.visitors), // Ensure integer
      conversions: 0, // Set to 0 instead of using conversions data per client request
      bounceRate: metricsData.bounceRate,
      pageSpeed: '3.5s', // Default placeholder value since we're not fetching it from GA4 anymore
      visitorsChange: metricsData.visitorsChange,
      conversionsChange: '0%', // Set to 0% per client request
      bounceRateChange: metricsData.bounceRateChange,
      pageSpeedChange: '0%', // Default placeholder value since we're not fetching it from GA4 anymore
      
      // Additional metrics - use defaults if not available and ensure integers
      activeUsers: Math.round(activeUsers || 0),
      newUsers: Math.round(newUsers || 0),
      eventCount: Math.round(eventCount || 0),
      avgEngagementTime: avgEngagementTime || '0s',
      viewsCount: Math.round(viewsCount || 0),
      userStickiness: userStickiness || '0.0%', // Include the DAU/MAU ratio
      sessionsByChannel: sessionsByChannel || {},
      sessionsBySource: sessionsBySource || {},
      viewsByPage: viewsByPage || {},
      usersByCountry: usersByCountry || {},
    };
  },

  // Fetch available GA4 properties from the user's Google account
  fetchAvailableProperties: async (authClient: any) => {
    try {
      // First get the account list
      const accountsResponse = await analyticsAdminClient.accounts.list({
        auth: authClient
      });
      
      const properties: Array<{
        accountName: string;
        propertyName: string;
        propertyId: string;
        domain: string;
      }> = [];
      
      // For each account, get the properties
      if (accountsResponse.data.accounts && accountsResponse.data.accounts.length > 0) {
        for (const account of accountsResponse.data.accounts) {
          const propertiesResponse = await analyticsAdminClient.properties.list({
            auth: authClient,
            filter: `parent:${account.name}`
          });
          
          if (propertiesResponse.data.properties && propertiesResponse.data.properties.length > 0) {
            for (const property of propertiesResponse.data.properties) {
              // Get the display name of the property
              const accountName = account.displayName || 'Unknown Account';
              const propertyName = property.displayName || 'Unnamed Property';
              const propertyId = property.name?.split('/').pop() || '';
              
              // Get the website details
              let domain = '';
              
              try {
                // Fetch data streams for this property
                if (property.name) {
                  const streamsResponse = await analyticsAdminClient.properties.dataStreams.list({
                    auth: authClient,
                    parent: property.name
                  });
                  
                  if (streamsResponse && streamsResponse.data && 
                      streamsResponse.data.dataStreams && 
                      streamsResponse.data.dataStreams.length > 0) {
                    for (const stream of streamsResponse.data.dataStreams) {
                      if (stream.webStreamData && stream.webStreamData.defaultUri) {
                        domain = stream.webStreamData.defaultUri;
                        break;
                      }
                    }
                  }
                }
              } catch (streamError) {
                console.warn(`Could not fetch streams for property ${propertyId}:`, streamError);
                // Continue without stream data
              }
              
              // Clean up the domain
              if (domain) {
                domain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
              }
              
              properties.push({
                accountName,
                propertyName,
                propertyId,
                domain
              });
            }
          }
        }
      }
      
      return properties;
    } catch (error: any) {
      console.error('Error fetching GA4 properties:', error);
      throw new Error(`Failed to fetch properties from Google Analytics: ${error.message}`);
    }
  }
};

export default ga4Service;
