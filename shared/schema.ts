import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  googleId: text("google_id").notNull().unique(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const websites = pgTable("websites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  domain: text("domain").notNull(),
  gaPropertyId: text("ga_property_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const metrics = pgTable("metrics", {
  id: serial("id").primaryKey(),
  websiteId: integer("website_id").references(() => websites.id).notNull(),
  date: timestamp("date").notNull(),
  
  // Original core metrics
  visitors: integer("visitors").notNull(),
  conversions: integer("conversions").notNull(),
  bounceRate: text("bounce_rate").notNull(),
  pageSpeed: text("page_speed").notNull(),
  visitorsChange: text("visitors_change").notNull(),
  conversionsChange: text("conversions_change").notNull(),
  bounceRateChange: text("bounce_rate_change").notNull(),
  pageSpeedChange: text("page_speed_change").notNull(),
  
  // Additional metrics requested by user
  activeUsers: integer("active_users").default(0),
  newUsers: integer("new_users").default(0),
  eventCount: integer("event_count").default(0),
  avgEngagementTime: text("avg_engagement_time").default("0s"),
  viewsCount: integer("views_count").default(0),
  userStickiness: text("user_stickiness").default("0.0%"), // DAU/MAU ratio as percentage
  sessionsByChannel: jsonb("sessions_by_channel").default({}).notNull(),
  sessionsBySource: jsonb("sessions_by_source").default({}).notNull(),
  viewsByPage: jsonb("views_by_page").default({}).notNull(),
  usersByCountry: jsonb("users_by_country").default({}).notNull(),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insights = pgTable("insights", {
  id: serial("id").primaryKey(),
  websiteId: integer("website_id").references(() => websites.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // Traffic, Conversion, Performance, Content, etc.
  impact: text("impact").notNull(), // High, Medium, Low
  icon: text("icon").notNull(), // Material icon name
  recommendations: jsonb("recommendations").notNull(), // Array of recommendation strings
  detectedAt: timestamp("detected_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  websiteId: integer("website_id").references(() => websites.id).notNull(),
  query: text("query").notNull(),
  response: jsonb("response"),
  status: text("status").notNull(), // pending, completed, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  websites: many(websites),
  reports: many(reports),
}));

export const websitesRelations = relations(websites, ({ one, many }) => ({
  user: one(users, { fields: [websites.userId], references: [users.id] }),
  metrics: many(metrics),
  insights: many(insights),
  reports: many(reports),
}));

export const metricsRelations = relations(metrics, ({ one }) => ({
  website: one(websites, { fields: [metrics.websiteId], references: [websites.id] }),
}));

export const insightsRelations = relations(insights, ({ one }) => ({
  website: one(websites, { fields: [insights.websiteId], references: [websites.id] }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  user: one(users, { fields: [reports.userId], references: [users.id] }),
  website: one(websites, { fields: [reports.websiteId], references: [websites.id] }),
}));

// Schemas
export const userInsertSchema = createInsertSchema(users, {
  email: (schema) => schema.email("Please enter a valid email"),
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
  googleId: (schema) => schema.min(1, "Google ID is required"),
});

export const websiteInsertSchema = createInsertSchema(websites, {
  name: (schema) => schema.min(2, "Website name must be at least 2 characters"),
  domain: (schema) => schema.min(3, "Domain must be at least 3 characters"),
  gaPropertyId: (schema) => schema.min(1, "GA Property ID is required"),
});

export const metricInsertSchema = createInsertSchema(metrics);

export const insightInsertSchema = createInsertSchema(insights, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters"),
  description: (schema) => schema.min(10, "Description must be at least 10 characters"),
  category: (schema) => schema.min(1, "Category is required"),
  impact: (schema) => schema.min(1, "Impact is required"),
});

export const reportInsertSchema = createInsertSchema(reports, {
  query: (schema) => schema.min(5, "Query must be at least 5 characters"),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Website = typeof websites.$inferSelect;
export type InsertWebsite = typeof websites.$inferInsert;

export type Metric = typeof metrics.$inferSelect;
export type InsertMetric = typeof metrics.$inferInsert;

export type Insight = typeof insights.$inferSelect;
export type InsertInsight = typeof insights.$inferInsert;

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;
