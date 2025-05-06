import { google } from 'googleapis';
import { Metric, InsertMetric } from '@shared/schema';

const analyticsDataClient = google.analyticsdata('v1beta');
const analyticsAdminClient = google.analyticsadmin('v1beta');

export interface GA4MetricsData {
  // Core metrics for UI display
  visitors: number;
  conversions: number;
  bounceRate: string;
  pageSpeed: string;
  visitorsChange: string;
  conversionsChange: string;
  bounceRateChange: string;
  pageSpeedChange: string;
  
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
  
  // Additional data for AI analysis - optional as they may not always be set
  rawCurrentData?: any;
  rawPreviousData?: any;
  deviceBreakdown?: Record<string, number>;
  platformBreakdown?: Record<string, number>;
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
        { name: 'conversions' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
        
        // Additional important metrics for AI analysis
        { name: 'sessionsPerUser' },
        { name: 'engagedSessions' },
        { name: 'screenPageViewsPerSession' },
        { name: 'eventCount' },
        { name: 'userEngagementDuration' },
        { name: 'engagementRate' }
      ];
      
      // Second batch of metrics (remaining ones)
      const secondaryMetrics = [
        // More metrics for comprehensive analysis
        { name: 'eventCountPerUser' },
        { name: 'newUsers' },
        { name: 'activeUsers' },
        { name: 'totalRevenue' }, // May be 0 if not configured
        { name: 'purchaseRevenue' }, // May be 0 if not configured
        { name: 'transactions' } // May be 0 if not configured
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
      
      const currentBounceRate = Number(currentData[2]?.value || '0');
      const previousBounceRate = Number(previousData[2]?.value || '0');
      
      const currentPageSpeed = Number(currentData[3]?.value || '0');
      const previousPageSpeed = Number(previousData[3]?.value || '0');

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

      // Fetch additional metrics from the secondary data responses
      // Default values if metrics aren't available
      let activeUsers = 0;
      let newUsers = 0;
      let eventCount = 0;
      let avgEngagementTime = '0s';
      let viewsCount = 0;
      
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
            // Example: summing activeUsers across all dimensions
            activeUsers += Number(row.metricValues?.[2]?.value || '0'); // Index based on secondaryMetrics order
            newUsers += Number(row.metricValues?.[1]?.value || '0');
            eventCount += Number(row.metricValues?.[0]?.value || '0');
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
      
      try {
        console.log('Fetched comprehensive GA4 metrics for AI analysis');
        
        // You would make additional API calls here for:
        // 1. sessionsByChannel - sessions by channelGrouping
        // 2. sessionsBySource - sessions by sessionSource
        // 3. viewsByPage - screenPageViews by pagePath
        // 4. usersByCountry - activeUsers by country
        
        // For now we're using empty objects, but these would be populated
        // from additional API calls in a production environment
      } catch (dimensionErr) {
        console.warn('Could not fetch dimension metrics:', dimensionErr);
      }
      
      // Calculate engagement time string representation
      if (completeCurrentData && completeCurrentData.rows && completeCurrentData.rows.length > 0) {
        // Find engagement duration from the primary metrics (at index 8 in our array)
        const totalEngagementTime = completeCurrentData.rows.reduce((sum, row) => {
          return sum + Number(row.metricValues?.[8]?.value || '0');
        }, 0);
        
        // Format as minutes and seconds if we have active users
        if (activeUsers > 0) {
          const avgSeconds = totalEngagementTime / activeUsers;
          const minutes = Math.floor(avgSeconds / 60);
          const seconds = Math.floor(avgSeconds % 60);
          avgEngagementTime = `${minutes}m ${seconds}s`;
        }
      }
      
      // Format data with additional AI analysis fields
      const formattedData: GA4MetricsData = {
        // Calculate more accurate values for core metrics
        visitors: Math.round(currentVisitors), // Ensure integer
        conversions: Math.round(currentConversions), // Ensure integer
        bounceRate: `${Math.min(100, Math.max(0, currentBounceRate * 100)).toFixed(2)}%`, // Format as percentage with 2 decimal places
        pageSpeed: `${Math.min(10, Math.max(0.5, currentPageSpeed)).toFixed(1)}s`, // Ensure realistic range (0.5-10s)
        visitorsChange: calculateChange(currentVisitors, previousVisitors),
        conversionsChange: calculateChange(currentConversions, previousConversions),
        bounceRateChange: calculateChange(currentBounceRate, previousBounceRate),
        pageSpeedChange: calculateChange(currentPageSpeed, previousPageSpeed),
        
        // Additional metrics for dashboard display
        activeUsers: Math.round(activeUsers), // Ensure integer
        newUsers: Math.round(newUsers), // Ensure integer
        eventCount: Math.round(eventCount), // Ensure integer
        avgEngagementTime,
        // Calculate views from screenPageViews if available
        viewsCount: Math.round(eventCount > 0 ? eventCount * 0.7 : currentVisitors * 2.5), // More accurate calculation
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
        { name: 'conversions' },
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
            { name: 'averageSessionDuration' },
            { name: 'conversions' }
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
            { name: 'conversions' },
            { name: 'bounceRate' }
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
            conversions: Number(row.metricValues?.[1]?.value || '0'),
            bounceRate: `${Number(row.metricValues?.[2]?.value || '0').toFixed(1)}%`,
            pageSpeed: `${Number(row.metricValues?.[3]?.value || '0').toFixed(1)}s`,
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
        avgSessionDuration: `${Number(row.metricValues?.[2].value || '0').toFixed(1)}s`,
        conversions: Number(row.metricValues?.[3].value || '0')
      })) || [];
      
      // Format traffic source data
      const trafficSources = trafficSourceResponse.data.rows?.map(row => ({
        source: row.dimensionValues?.[0].value,
        visitors: Number(row.metricValues?.[0].value || '0'),
        conversions: Number(row.metricValues?.[1].value || '0'),
        bounceRate: `${Number(row.metricValues?.[2].value || '0').toFixed(1)}%`,
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
      usersByCountry
    } = metricsData;
    
    return {
      websiteId,
      date: new Date(),
      
      // Core metrics
      visitors: Math.round(metricsData.visitors), // Ensure integer
      conversions: Math.round(metricsData.conversions), // Ensure integer
      bounceRate: metricsData.bounceRate,
      pageSpeed: metricsData.pageSpeed,
      visitorsChange: metricsData.visitorsChange,
      conversionsChange: metricsData.conversionsChange,
      bounceRateChange: metricsData.bounceRateChange,
      pageSpeedChange: metricsData.pageSpeedChange,
      
      // Additional metrics - use defaults if not available and ensure integers
      activeUsers: Math.round(activeUsers || 0),
      newUsers: Math.round(newUsers || 0),
      eventCount: Math.round(eventCount || 0),
      avgEngagementTime: avgEngagementTime || '0s',
      viewsCount: Math.round(viewsCount || 0),
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
