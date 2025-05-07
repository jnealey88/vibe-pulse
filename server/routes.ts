import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { pool } from "@db";

// Extend express-session with our custom properties
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}
import { authController } from "./controllers/auth-controller";
import { metricsController } from "./controllers/metrics-controller";
import { insightController } from "./controllers/insight-controller";
import { implementationPlanController } from "./controllers/implementation-plan-controller";

// Authentication middleware
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session store
  const PgSession = ConnectPgSimple(session);
  
  app.use(
    session({
      store: new PgSession({
        pool,
        tableName: "session",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "ga4-insights-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      },
    })
  );

  // API routes
  const apiPrefix = "/api";

  // Auth routes
  app.get(`${apiPrefix}/auth/url`, authController.getAuthUrl);
  app.get(`${apiPrefix}/auth/callback`, authController.handleAuthCallback);
  app.post(`${apiPrefix}/auth/callback`, authController.handleAuthCallback); // Keeping POST for backward compatibility
  app.get(`${apiPrefix}/auth/user`, authenticate, authController.getCurrentUser);
  app.post(`${apiPrefix}/auth/logout`, authenticate, authController.logout);
  
  // Add route to handle Google's actual redirect URI
  app.get(`/auth`, authController.handleAuthCallback);

  // Websites routes
  app.get(`${apiPrefix}/websites`, authenticate, metricsController.getUserWebsites);
  app.post(`${apiPrefix}/websites`, authenticate, metricsController.addWebsite);
  app.delete(`${apiPrefix}/websites/:websiteId`, authenticate, metricsController.deleteWebsite);
  app.get(`${apiPrefix}/ga4-properties`, authenticate, metricsController.getAvailableGa4Properties);

  // Metrics routes
  app.get(`${apiPrefix}/websites/:websiteId/metrics`, authenticate, metricsController.getLatestMetrics);
  app.post(`${apiPrefix}/websites/:websiteId/metrics/sync`, authenticate, metricsController.syncMetrics);

  // Insights routes
  app.get(`${apiPrefix}/websites/:websiteId/insights`, authenticate, insightController.getInsights);
  app.post(`${apiPrefix}/websites/:websiteId/insights/generate`, authenticate, insightController.generateInsights);
  app.post(`${apiPrefix}/websites/:websiteId/insights/summary`, authenticate, insightController.generateInsightsSummary);

  // Reports routes
  app.post(`${apiPrefix}/websites/:websiteId/reports`, authenticate, insightController.generateReport);
  app.get(`${apiPrefix}/reports/:reportId`, authenticate, insightController.getReport);
  app.get(`${apiPrefix}/reports`, authenticate, insightController.getUserReports);

  // Implementation Plans routes
  app.get(`${apiPrefix}/websites/:websiteId/implementation-plans`, authenticate, implementationPlanController.getImplementationPlans);
  app.get(`${apiPrefix}/implementation-plans/:planId`, authenticate, implementationPlanController.getImplementationPlan);
  app.post(`${apiPrefix}/websites/:websiteId/implementation-plans`, authenticate, implementationPlanController.generateImplementationPlan);
  app.delete(`${apiPrefix}/implementation-plans/:planId`, authenticate, implementationPlanController.deleteImplementationPlan);

  // Healthcheck
  app.get(`${apiPrefix}/health`, (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  const httpServer = createServer(app);

  return httpServer;
}
