import { db } from "@db";
import * as schema from "@shared/schema";
import { eq, and, desc, asc, like, sql } from "drizzle-orm";

export const storage = {
  // User methods
  getUserByEmail: async (email: string) => {
    return await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });
  },

  getUserById: async (id: number) => {
    return await db.query.users.findFirst({
      where: eq(schema.users.id, id),
    });
  },

  getUserByGoogleId: async (googleId: string) => {
    return await db.query.users.findFirst({
      where: eq(schema.users.googleId, googleId),
    });
  },

  insertUser: async (user: schema.InsertUser) => {
    const [newUser] = await db.insert(schema.users).values(user).returning();
    return newUser;
  },

  updateUser: async (id: number, data: Partial<schema.InsertUser>) => {
    const [updatedUser] = await db
      .update(schema.users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return updatedUser;
  },

  // Website methods
  getWebsitesByUserId: async (userId: number) => {
    return await db.query.websites.findMany({
      where: eq(schema.websites.userId, userId),
      orderBy: [asc(schema.websites.name)],
    });
  },

  getWebsiteById: async (id: number) => {
    return await db.query.websites.findFirst({
      where: eq(schema.websites.id, id),
    });
  },

  insertWebsite: async (website: schema.InsertWebsite) => {
    const [newWebsite] = await db.insert(schema.websites).values(website).returning();
    return newWebsite;
  },

  // Metrics methods
  getLatestMetricsByWebsiteId: async (websiteId: number) => {
    return await db.query.metrics.findFirst({
      where: eq(schema.metrics.websiteId, websiteId),
      orderBy: [desc(schema.metrics.date)],
    });
  },

  insertMetrics: async (metrics: schema.InsertMetric) => {
    const [newMetrics] = await db.insert(schema.metrics).values(metrics).returning();
    return newMetrics;
  },

  // Insights methods
  getInsightsByWebsiteId: async (
    websiteId: number,
    options?: {
      category?: string;
      impact?: string;
      limit?: number;
      offset?: number;
    }
  ) => {
    let query = db
      .select()
      .from(schema.insights)
      .where(eq(schema.insights.websiteId, websiteId));

    if (options?.category && options.category !== "All Categories") {
      query = query.where(eq(schema.insights.category, options.category));
    }

    if (options?.impact && options.impact !== "All Impacts") {
      query = query.where(eq(schema.insights.impact, options.impact));
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.offset(options.offset);
    }

    return await query.orderBy(desc(schema.insights.detectedAt));
  },

  getInsightById: async (id: number) => {
    return await db.query.insights.findFirst({
      where: eq(schema.insights.id, id),
    });
  },

  insertInsight: async (insight: schema.InsertInsight) => {
    const [newInsight] = await db.insert(schema.insights).values(insight).returning();
    return newInsight;
  },

  // Reports methods
  getReportsByUserId: async (userId: number) => {
    return await db.query.reports.findMany({
      where: eq(schema.reports.userId, userId),
      orderBy: [desc(schema.reports.createdAt)],
    });
  },

  getReportById: async (id: number) => {
    return await db.query.reports.findFirst({
      where: eq(schema.reports.id, id),
    });
  },

  insertReport: async (report: schema.InsertReport) => {
    const [newReport] = await db.insert(schema.reports).values(report).returning();
    return newReport;
  },

  updateReport: async (id: number, data: Partial<schema.InsertReport>) => {
    const [updatedReport] = await db
      .update(schema.reports)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.reports.id, id))
      .returning();
    return updatedReport;
  },
};
