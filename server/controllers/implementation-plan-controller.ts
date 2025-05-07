import { Request, Response } from "express";
import { storage } from "../storage";
import { implementationPlanInsertSchema } from "@shared/schema";
import { openAiService } from "../services/openai-service";

export const implementationPlanController = {
  // Get implementation plans for a website
  getImplementationPlans: async (req: Request, res: Response) => {
    try {
      const { websiteId } = req.params;
      const parsedWebsiteId = parseInt(websiteId);
      
      if (isNaN(parsedWebsiteId)) {
        return res.status(400).json({ message: 'Invalid website ID' });
      }

      const website = await storage.getWebsiteById(parsedWebsiteId);
      
      if (!website) {
        return res.status(404).json({ message: 'Website not found' });
      }
      
      if (website.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Not authorized to access this website' });
      }

      const plans = await storage.getImplementationPlansByWebsiteId(parsedWebsiteId);
      return res.json(plans);
    } catch (error: unknown) {
      console.error('Error getting implementation plans:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return res.status(500).json({ message: `Failed to get implementation plans: ${errorMessage}` });
    }
  },

  // Get a specific implementation plan
  getImplementationPlan: async (req: Request, res: Response) => {
    try {
      const { planId } = req.params;
      const parsedPlanId = parseInt(planId);
      
      if (isNaN(parsedPlanId)) {
        return res.status(400).json({ message: 'Invalid plan ID' });
      }

      const plan = await storage.getImplementationPlanById(parsedPlanId);
      
      if (!plan) {
        return res.status(404).json({ message: 'Implementation plan not found' });
      }
      
      // Get the website to check ownership
      const website = await storage.getWebsiteById(plan.websiteId);
      
      if (!website || website.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Not authorized to access this plan' });
      }

      return res.json(plan);
    } catch (error: unknown) {
      console.error('Error getting implementation plan:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return res.status(500).json({ message: `Failed to get implementation plan: ${errorMessage}` });
    }
  },

  // Generate implementation plan from selected insights
  generateImplementationPlan: async (req: Request, res: Response) => {
    try {
      const { websiteId } = req.params;
      const { insightIds } = req.body;
      const parsedWebsiteId = parseInt(websiteId);
      
      if (isNaN(parsedWebsiteId)) {
        return res.status(400).json({ message: 'Invalid website ID' });
      }
      
      if (!Array.isArray(insightIds) || insightIds.length === 0) {
        return res.status(400).json({ message: 'No insights selected' });
      }

      // Check if website exists and belongs to the user
      const website = await storage.getWebsiteById(parsedWebsiteId);
      
      if (!website) {
        return res.status(404).json({ message: 'Website not found' });
      }
      
      if (website.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Not authorized to access this website' });
      }

      // Fetch the selected insights
      const insights = [];
      for (const insightId of insightIds) {
        const insight = await storage.getInsightById(parseInt(insightId));
        if (insight && insight.websiteId === parsedWebsiteId) {
          insights.push(insight);
        }
      }
      
      if (insights.length === 0) {
        return res.status(404).json({ message: 'No valid insights found' });
      }

      // Generate the implementation plan using OpenAI
      const implementationPlan = await openAiService.generateImplementationPlan(
        insights, 
        website.domain
      );

      // Save the plan to the database
      const planData = {
        websiteId: parsedWebsiteId,
        title: implementationPlan.title,
        summary: implementationPlan.summary,
        insightIds: insightIds,
        steps: implementationPlan.steps
      };

      const validatedPlan = implementationPlanInsertSchema.parse(planData);
      const savedPlan = await storage.insertImplementationPlan(validatedPlan);

      return res.status(201).json(savedPlan);
    } catch (error: unknown) {
      console.error('Error generating implementation plan:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return res.status(500).json({ message: `Failed to generate implementation plan: ${errorMessage}` });
    }
  },

  // Delete implementation plan
  deleteImplementationPlan: async (req: Request, res: Response) => {
    try {
      const { planId } = req.params;
      const parsedPlanId = parseInt(planId);
      
      if (isNaN(parsedPlanId)) {
        return res.status(400).json({ message: 'Invalid plan ID' });
      }

      const plan = await storage.getImplementationPlanById(parsedPlanId);
      
      if (!plan) {
        return res.status(404).json({ message: 'Implementation plan not found' });
      }
      
      // Get the website to check ownership
      const website = await storage.getWebsiteById(plan.websiteId);
      
      if (!website || website.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Not authorized to delete this plan' });
      }

      await storage.deleteImplementationPlan(parsedPlanId);
      return res.json({ message: 'Implementation plan deleted successfully' });
    } catch (error: unknown) {
      console.error('Error deleting implementation plan:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return res.status(500).json({ message: `Failed to delete implementation plan: ${errorMessage}` });
    }
  }
};

export default implementationPlanController;