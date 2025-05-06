import { Request, Response } from 'express';
import { storage } from '../storage';
import ga4Service from '../services/ga4-service';

export const metricsController = {
  // Get available GA4 properties for the current user
  getAvailableGa4Properties: async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      // Get the user for Google auth
      const user = await storage.getUserById(userId);
      
      if (!user || !user.refreshToken) {
        return res.status(400).json({ message: 'User authentication data is missing' });
      }

      // Authenticate with Google
      const authClient = await ga4Service.authenticate(user.refreshToken);
      
      // Fetch available GA4 properties
      const properties = await ga4Service.fetchAvailableProperties(authClient);
      
      return res.json(properties);
    } catch (error: any) {
      console.error('Error fetching GA4 properties:', error);
      return res.status(500).json({ message: `Failed to fetch GA4 properties: ${error.message}` });
    }
  },
  // Get the latest metrics for a website
  getLatestMetrics: async (req: Request, res: Response) => {
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

      // Get the latest metrics from the database
      const metrics = await storage.getLatestMetricsByWebsiteId(parsedWebsiteId);
      
      if (!metrics) {
        // Instead of returning a 404, return an empty response to prevent client errors
        console.log(`No metrics found for website ${websiteId}, user should sync`);
        return res.json(null);
      }

      return res.json(metrics);
    } catch (error) {
      console.error('Error getting metrics:', error);
      return res.status(500).json({ message: 'Failed to get metrics' });
    }
  },

  // Sync metrics from GA4
  syncMetrics: async (req: Request, res: Response) => {
    try {
      const { websiteId } = req.params;
      const { days = 30 } = req.query; // Default to 30 days if not specified
      const parsedWebsiteId = parseInt(websiteId);
      const parsedDays = parseInt(days as string);
      
      if (isNaN(parsedWebsiteId)) {
        return res.status(400).json({ message: 'Invalid website ID' });
      }
      
      // Validate days parameter (between 1 and 90)
      const validDays = !isNaN(parsedDays) ? Math.min(90, Math.max(1, parsedDays)) : 30;

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

      // Authenticate with Google
      const authClient = await ga4Service.authenticate(user.refreshToken);
      
      // Fetch metrics from GA4
      const metricsData = await ga4Service.fetchKeyMetrics(website.gaPropertyId, authClient);
      
      // Format and store metrics
      const formattedMetrics = ga4Service.formatMetricsForStorage(metricsData, parsedWebsiteId);
      const savedMetrics = await storage.insertMetrics(formattedMetrics);

      return res.json(savedMetrics);
    } catch (error: any) {
      console.error('Error syncing metrics:', error);
      return res.status(500).json({ message: `Failed to sync metrics: ${error.message}` });
    }
  },

  // Get websites for the current user
  getUserWebsites: async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const websites = await storage.getWebsitesByUserId(userId);
      return res.json(websites);
    } catch (error) {
      console.error('Error getting user websites:', error);
      return res.status(500).json({ message: 'Failed to get websites' });
    }
  },

  // Add a new website
  addWebsite: async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const { name, domain, gaPropertyId } = req.body;
      
      if (!name || !domain || !gaPropertyId) {
        return res.status(400).json({ message: 'Name, domain, and GA property ID are required' });
      }

      const newWebsite = await storage.insertWebsite({
        userId,
        name,
        domain,
        gaPropertyId
      });

      return res.status(201).json(newWebsite);
    } catch (error) {
      console.error('Error adding website:', error);
      return res.status(500).json({ message: 'Failed to add website' });
    }
  },
  
  // Delete a website
  deleteWebsite: async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const websiteId = parseInt(req.params.websiteId);
      
      if (isNaN(websiteId)) {
        return res.status(400).json({ message: 'Invalid website ID' });
      }
      
      // Verify the website belongs to the user
      const website = await storage.getWebsiteById(websiteId);
      
      if (!website) {
        return res.status(404).json({ message: 'Website not found' });
      }
      
      if (website.userId !== userId) {
        return res.status(403).json({ message: 'Not authorized to delete this website' });
      }
      
      const deletedWebsite = await storage.deleteWebsite(websiteId);
      
      // Make sure to set the correct content type and return a properly formatted JSON response
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({ 
        message: 'Website deleted successfully',
        websiteId,
        deleted: !!deletedWebsite
      });
    } catch (error: any) {
      console.error('Error deleting website:', error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ 
        message: `Failed to delete website: ${error.message || 'Unknown error'}`,
        error: true 
      });
    }
  }
};

export default metricsController;
