import { db } from "./index";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

async function seed() {
  try {
    console.log("Seeding database...");

    // Check if seed data already exists to avoid duplicates
    const existingUsers = await db.query.users.findMany();
    if (existingUsers.length > 0) {
      console.log("Seed data already exists. Skipping seed operation.");
      return;
    }

    // Sample user for testing
    const [user] = await db.insert(schema.users).values({
      email: "demo@example.com",
      name: "Demo User",
      googleId: "demo_google_id",
      accessToken: "demo_access_token",
      refreshToken: "demo_refresh_token",
      profileImage: "https://ui-avatars.com/api/?name=Demo+User&background=4285F4&color=fff",
    }).returning();

    // Sample website
    const [website] = await db.insert(schema.websites).values({
      userId: user.id,
      name: "Example Website",
      domain: "example.com",
      gaPropertyId: "123456789",
    }).returning();

    // Sample metrics
    await db.insert(schema.metrics).values({
      websiteId: website.id,
      date: new Date(),
      visitors: 24582,
      conversions: 1284,
      bounceRate: "42.8%",
      pageSpeed: "2.4s",
      visitorsChange: "12.3%",
      conversionsChange: "8.7%",
      bounceRateChange: "-3.2%",
      pageSpeedChange: "5.1%",
    });

    // Sample insights
    const insights = [
      {
        websiteId: website.id,
        title: "Mobile Conversion Drop",
        description: "Mobile conversion rate has dropped by 18% in the past week, primarily affecting checkout completion on Android devices. This is causing an estimated revenue loss of $4,200.",
        category: "Conversion",
        impact: "High",
        icon: "priority_high",
        recommendations: JSON.stringify([
          "Investigate recent changes to the checkout process on Android",
          "Check for JavaScript errors in the payment flow",
          "Review page load time for checkout steps on mobile devices"
        ]),
        detectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        websiteId: website.id,
        title: "New Traffic Source Opportunity",
        description: "Referral traffic from industry forums has increased by 34% with a higher-than-average session duration. These visitors are viewing product pages but not converting at expected rates.",
        category: "Traffic",
        impact: "Medium",
        icon: "trending_up",
        recommendations: JSON.stringify([
          "Create targeted landing pages for referral traffic",
          "Add forum-specific promotions to increase conversion",
          "Engage more actively in these forums to capitalize on interest"
        ]),
        detectedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      {
        websiteId: website.id,
        title: "Critical Page Speed Issue",
        description: "Your product category pages are loading 62% slower than last month, resulting in a 24% increase in bounce rate. This is likely causing significant conversion and revenue loss.",
        category: "Performance",
        impact: "High",
        icon: "speed",
        recommendations: JSON.stringify([
          "Optimize image sizes on category pages",
          "Reduce JavaScript execution time by deferring non-critical scripts",
          "Implement lazy loading for product images below the fold"
        ]),
        detectedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        websiteId: website.id,
        title: "Content Engagement Opportunity",
        description: "Visitors are spending 45% more time on blog content about [Topic X], but this content is not prominently featured in your site navigation or homepage.",
        category: "Content",
        impact: "Low",
        icon: "schedule",
        recommendations: JSON.stringify([
          "Create a featured content section on your homepage",
          "Add related product recommendations to these blog posts",
          "Develop more content on this topic to capitalize on interest"
        ]),
        detectedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      }
    ];

    await db.insert(schema.insights).values(insights);

    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
