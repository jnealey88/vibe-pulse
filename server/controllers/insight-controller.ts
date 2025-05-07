import { Request, Response } from 'express';
import { storage } from '../storage';
import { ga4Service } from '../services/ga4-service';
import { openAiService } from '../services/openai-service';
import { insightInsertSchema, reportInsertSchema } from '@shared/schema';

export const insightController = {
  // Generate a summary of insights
  generateInsightsSummary: async (req: Request, res: Response) => {
    try {
      const { websiteId } = req.params;
      const { insights, metrics } = req.body;
      const parsedWebsiteId = parseInt(websiteId);

      if (isNaN(parsedWebsiteId)) {
        return res.status(400).json({ message: 'Invalid website ID' });
      }

      if (!Array.isArray(insights) || insights.length === 0) {
        return res.status(400).json({ message: 'No insights provided' });
      }

      const website = await storage.getWebsiteById(parsedWebsiteId);
      
      if (!website) {
        return res.status(404).json({ message: 'Website not found' });
      }
      
      if (website.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Not authorized to access this website' });
      }

      // Generate summary using OpenAI
      const summary = await openAiService.generateInsightsSummary(insights, metrics, website.domain);
      return res.json(summary);
    } catch (error: unknown) {
      console.error('Error generating insights summary:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return res.status(500).json({ message: `Failed to generate insights summary: ${errorMessage}` });
    }
  },

  // Get insights for a website
  getInsights: async (req: Request, res: Response) => {
    try {
      const { websiteId } = req.params;
      const { category, impact, limit = 10, offset = 0 } = req.query;
      const parsedWebsiteId = parseInt(websiteId);
      
      if (isNaN(parsedWebsiteId)) {
        return res.status(400).json({ message: 'Invalid website ID' });
      }

      // Check if website exists and belongs to the user
      const website = await storage.getWebsiteById(parsedWebsiteId);
      
      if (!website) {
        return res.status(404).json({ message: 'Website not found' });
      }
      
      if (website.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Not authorized to access this website' });
      }

      // Get insights with filters
      const insights = await storage.getInsightsByWebsiteId(parsedWebsiteId, {
        category: category as string,
        impact: impact as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      return res.json(insights);
    } catch (error) {
      console.error('Error getting insights:', error);
      return res.status(500).json({ message: 'Failed to get insights' });
    }
  },

  // Generate new insights using OpenAI
  generateInsights: async (req: Request, res: Response) => {
    try {
      const { websiteId } = req.params;
      const parsedWebsiteId = parseInt(websiteId);
      
      if (isNaN(parsedWebsiteId)) {
        return res.status(400).json({ message: 'Invalid website ID' });
      }

      // Check if website exists and belongs to the user
      const website = await storage.getWebsiteById(parsedWebsiteId);
      
      if (!website) {
        return res.status(404).json({ message: 'Website not found' });
      }
      
      if (website.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Not authorized to access this website' });
      }

      // Get the user for Google auth
      const user = await storage.getUserById(req.session.userId);
      
      if (!user || !user.refreshToken) {
        return res.status(400).json({ message: 'User authentication data is missing' });
      }

      // Get latest metrics
      const metrics = await storage.getLatestMetricsByWebsiteId(parsedWebsiteId);
      
      if (!metrics) {
        return res.status(404).json({ message: 'No metrics found for this website' });
      }

      // Authenticate with Google
      const authClient = await ga4Service.authenticate(user.refreshToken);
      
      // Fetch comprehensive GA4 metrics for OpenAI analysis
      let gaMetricsData = null;
      try {
        gaMetricsData = await ga4Service.fetchKeyMetrics(website.gaPropertyId, authClient);
        console.log('Fetched comprehensive GA4 metrics for AI analysis');
      } catch (gaError) {
        console.warn('Could not fetch full GA4 metrics:', gaError);
        // Continue without the additional metrics data
      }
      
      // Fetch detailed historical data for context
      const historicalData = await ga4Service.fetchHistoricalData(website.gaPropertyId, authClient);
      
      // Generate insights with OpenAI using enhanced data
      const generatedInsights = await openAiService.generateInsights(
        metrics, 
        historicalData, 
        website.domain,
        gaMetricsData // Pass additional GA4 metrics to OpenAI
      );

      // Save the generated insights to the database
      const savedInsights = [];
      
      for (const insight of generatedInsights) {
        try {
          const insightData = {
            websiteId: parsedWebsiteId,
            title: insight.title,
            description: insight.description,
            category: insight.category,
            impact: insight.impact,
            icon: insight.icon,
            recommendations: JSON.stringify(insight.recommendations),
            detectedAt: new Date(),
          };

          const validatedInsight = insightInsertSchema.parse(insightData);
          const savedInsight = await storage.insertInsight(validatedInsight);
          savedInsights.push(savedInsight);
        } catch (err) {
          console.error('Error saving individual insight:', err);
          // Continue with other insights if one fails
        }
      }

      return res.json(savedInsights);
    } catch (error: unknown) {
      console.error('Error generating insights:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return res.status(500).json({ message: `Failed to generate insights: ${errorMessage}` });
    }
  },

  // Generate custom report
  generateReport: async (req: Request, res: Response) => {
    try {
      const { websiteId } = req.params;
      const { query } = req.body;
      const parsedWebsiteId = parseInt(websiteId);
      
      if (isNaN(parsedWebsiteId)) {
        return res.status(400).json({ message: 'Invalid website ID' });
      }
      
      if (!query) {
        return res.status(400).json({ message: 'Query is required' });
      }

      // Check if website exists and belongs to the user
      const website = await storage.getWebsiteById(parsedWebsiteId);
      
      if (!website) {
        return res.status(404).json({ message: 'Website not found' });
      }
      
      if (website.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Not authorized to access this website' });
      }

      // First create a pending report
      const reportData = {
        userId: req.session.userId,
        websiteId: parsedWebsiteId,
        query,
        status: 'pending'
      };

      const validatedReport = reportInsertSchema.parse(reportData);
      const savedReport = await storage.insertReport(validatedReport);

      // Get the latest metrics
      const metrics = await storage.getLatestMetricsByWebsiteId(parsedWebsiteId);
      
      if (!metrics) {
        // Update report status to failed
        await storage.updateReport(savedReport.id, { status: 'failed' });
        return res.status(404).json({ message: 'No metrics found for this website' });
      }
      
      // Get the user for Google auth
      const user = await storage.getUserById(req.session.userId);
      
      if (!user || !user.refreshToken) {
        await storage.updateReport(savedReport.id, { status: 'failed' });
        return res.status(400).json({ message: 'User authentication data is missing' });
      }

      // Generate the report asynchronously with enhanced data
      (async () => {
        try {
          // Authenticate with Google
          if (!user.refreshToken) {
            throw new Error('User refresh token missing');
          }
          const authClient = await ga4Service.authenticate(user.refreshToken);
          
          // Fetch additional data for improved insights
          let gaMetricsData = null;
          let historicalData = null;
          
          try {
            // Fetch comprehensive GA4 metrics for analysis
            gaMetricsData = await ga4Service.fetchKeyMetrics(website.gaPropertyId, authClient);
            
            // Fetch detailed historical data
            historicalData = await ga4Service.fetchHistoricalData(website.gaPropertyId, authClient);
            
            console.log('Fetched comprehensive data for custom report');
          } catch (dataError) {
            console.warn('Could not fetch additional data for report:', dataError);
            // Continue with basic metrics only
          }
          
          // Generate enhanced report with all available data
          const reportResponse = await openAiService.generateCustomReport(
            query, 
            metrics, 
            website.domain,
            historicalData,
            gaMetricsData
          );
          
          // Update the report with the response
          await storage.updateReport(savedReport.id, {
            response: reportResponse,
            status: 'completed'
          });
        } catch (error) {
          console.error('Error in async report generation:', error);
          await storage.updateReport(savedReport.id, { status: 'failed' });
        }
      })(); // Immediately invoke the async function

      // Return the pending report immediately
      return res.status(202).json({
        id: savedReport.id,
        status: 'pending',
        message: 'Report generation started'
      });
    } catch (error: unknown) {
      console.error('Error generating report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return res.status(500).json({ message: `Failed to generate report: ${errorMessage}` });
    }
  },

  // Get a specific report
  getReport: async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params;
      const parsedReportId = parseInt(reportId);
      
      if (isNaN(parsedReportId)) {
        return res.status(400).json({ message: 'Invalid report ID' });
      }

      const report = await storage.getReportById(parsedReportId);
      
      if (!report) {
        return res.status(404).json({ message: 'Report not found' });
      }
      
      if (report.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Not authorized to access this report' });
      }

      return res.json(report);
    } catch (error) {
      console.error('Error getting report:', error);
      return res.status(500).json({ message: 'Failed to get report' });
    }
  },

  // Get all reports for the user
  getUserReports: async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const reports = await storage.getReportsByUserId(userId);
      return res.json(reports);
    } catch (error) {
      console.error('Error getting user reports:', error);
      return res.status(500).json({ message: 'Failed to get reports' });
    }
  }
};

export default insightController;
