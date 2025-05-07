import OpenAI from "openai";
import { Metric, Insight } from "@shared/schema";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. Do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type Recommendation = string;

export interface GeneratedInsight {
  title: string;
  description: string;
  category: string;
  impact: "High" | "Medium" | "Low";
  icon: string;
  recommendations: Recommendation[];
}

export interface InsightImplementationStep {
  stepNumber: number;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  effort: 'Easy' | 'Medium' | 'Difficult';
  estimatedTime: string;
  dependencies?: number[];
  resources?: string[];
}

export interface GeneratedImplementationPlan {
  title: string;
  summary: string;
  steps: InsightImplementationStep[];
}

export const openAiService = {
  // Generate a summary of insights
  generateInsightsSummary: async (
    insights: Insight[],
    metrics: Metric | null,
    websiteDomain: string
  ): Promise<{ summary: string }> => {
    try {
      // Count insights by category
      const categoryCounts: Record<string, number> = {};
      insights.forEach(insight => {
        if (!categoryCounts[insight.category]) {
          categoryCounts[insight.category] = 0;
        }
        categoryCounts[insight.category]++;
      });
      
      // Count insights by impact
      const impactCounts: Record<string, number> = {};
      insights.forEach(insight => {
        if (!impactCounts[insight.impact]) {
          impactCounts[insight.impact] = 0;
        }
        impactCounts[insight.impact]++;
      });

      const prompt = `
        I need you to analyze a collection of website insights and metrics for "${websiteDomain}" and generate a client-friendly executive summary that's easy to read and understand.
        
        YOUR TASK:
        Create a clear, professional executive summary of the website's performance insights that a web designer could confidently present to their client. The summary should be well-structured, use straightforward business language, and highlight actionable findings.
        
        INSIGHTS OVERVIEW:
        - Total number of insights: ${insights.length}
        
        INSIGHTS BY CATEGORY:
        ${Object.entries(categoryCounts)
          .map(([category, count]) => `- ${category}: ${count} insights`)
          .join('\n')}
        
        INSIGHTS BY IMPACT:
        ${Object.entries(impactCounts)
          .map(([impact, count]) => `- ${impact} Impact: ${count} insights`)
          .join('\n')}
        
        DETAILED INSIGHTS:
        ${insights.map((insight, index) => `
        INSIGHT ${index + 1}: ${insight.title}
        - Category: ${insight.category}
        - Impact: ${insight.impact}
        - Description: ${insight.description}
        `).join('\n')}
        
        ${metrics ? `
        CURRENT WEBSITE METRICS:
        - Visitors: ${metrics.visitors} (${metrics.visitorsChange} change)
        - Bounce Rate: ${metrics.bounceRate} (${metrics.bounceRateChange} change)
        - Active Users: ${metrics.activeUsers || 0}
        - New Users: ${metrics.newUsers || 0}
        - Avg Engagement Time: ${metrics.avgEngagementTime || "N/A"}
        ` : ''}
        
        SUMMARY REQUIREMENTS:
        1. Start with a clear, concise overview sentence that frames the analysis
        2. Group related insights into 2-3 key themes or patterns (traffic patterns, user engagement, content quality, etc.)
        3. Clearly identify the high-impact issues that require immediate attention
        4. Provide specific, actionable next steps for each major finding
        5. Use professional, client-friendly language (no technical jargon)
        6. Format your response with proper paragraphs (2-3 paragraphs total) for easier reading
        7. Include a brief, forward-looking conclusion with a positive tone
        
        GUIDELINES FOR TONE AND STYLE:
        - Write in a professional but conversational tone
        - Use clear section breaks between paragraphs
        - Limit each paragraph to 3-5 sentences
        - Focus on business outcomes rather than technical details
        - Address the client directly like you're presenting findings to a business owner
        - Use simple, clear language that explains the "why" behind each insight
        - Balance identifying problems with highlighting opportunities
        
        Return only the executive summary text with proper paragraph breaks (use line breaks between paragraphs). No introductions, headings, or sign-offs.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 500
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }

      return { summary: content };
    } catch (error: unknown) {
      console.error("Error generating insights summary with OpenAI:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to generate insights summary: ${errorMessage}`);
    }
  },
  // Generate insights based on comprehensive metrics data
  generateInsights: async (
    currentMetrics: Metric,
    historicalData: any,
    websiteDomain: string,
    gaMetricsData?: any // Additional detailed GA4 data (optional)
  ): Promise<GeneratedInsight[]> => {
    try {
      // Prepare device and platform data if available
      let deviceAnalysis = "No device data available.";
      let platformAnalysis = "No platform data available.";
      let landingPageAnalysis = "No landing page data available.";
      let trafficSourceAnalysis = "No traffic source data available.";
      
      if (gaMetricsData) {
        // Format device breakdown data
        if (gaMetricsData.deviceBreakdown) {
          deviceAnalysis = "Device breakdown:\n" + 
            Object.entries(gaMetricsData.deviceBreakdown)
              .map(([device, count]) => `- ${device}: ${count} users`)
              .join("\n");
        }
        
        // Format platform breakdown data
        if (gaMetricsData.platformBreakdown) {
          platformAnalysis = "Platform breakdown:\n" + 
            Object.entries(gaMetricsData.platformBreakdown)
              .map(([platform, count]) => `- ${platform}: ${count} users`)
              .join("\n");
        }
      }
      
      // Format landing page information
      if (historicalData && historicalData.landingPages && historicalData.landingPages.length > 0) {
        landingPageAnalysis = "Top landing pages performance:\n" + 
          historicalData.landingPages.map((page: any) => 
            `- ${page.page}: ${page.visitors} visitors, ${page.bounceRate} bounce rate`
          ).join("\n");
      }
      
      // Format traffic source information
      if (historicalData && historicalData.trafficSources && historicalData.trafficSources.length > 0) {
        trafficSourceAnalysis = "Traffic sources:\n" + 
          historicalData.trafficSources.map((source: any) => 
            `- ${source.source}: ${source.visitors} visitors, ${source.bounceRate} bounce rate`
          ).join("\n");
      }

      // Create a comprehensive prompt with all the available data
      const prompt = `
        I need to analyze comprehensive web analytics data for the website "${websiteDomain}" and generate actionable insights.
        
        CURRENT KEY METRICS:
        - Visitors: ${currentMetrics.visitors} (${currentMetrics.visitorsChange} change)
        - Bounce Rate: ${currentMetrics.bounceRate} (${currentMetrics.bounceRateChange} change)
        - Active Users: ${currentMetrics.activeUsers || 0}
        - New Users: ${currentMetrics.newUsers || 0}
        - Event Count: ${currentMetrics.eventCount || 0}
        - Average Engagement Time: ${currentMetrics.avgEngagementTime || "N/A"}
        - Page Views: ${currentMetrics.viewsCount || 0}
        
        DEVICE USAGE:
        ${deviceAnalysis}
        
        PLATFORM USAGE:
        ${platformAnalysis}
        
        LANDING PAGE ANALYSIS:
        ${landingPageAnalysis}
        
        TRAFFIC SOURCE ANALYSIS:
        ${trafficSourceAnalysis}
        
        SESSION CHANNEL BREAKDOWN:
        ${currentMetrics.sessionsByChannel ? 
          Object.entries(currentMetrics.sessionsByChannel)
            .map(([channel, count]) => `- ${channel}: ${count} sessions`)
            .join("\n") : 
          "No channel data available."}
        
        TOP PAGES:
        ${currentMetrics.viewsByPage ? 
          Object.entries(currentMetrics.viewsByPage)
            .slice(0, 10)
            .map(([page, views]) => `- ${page}: ${views} views`)
            .join("\n") : 
          "No page view data available."}
        
        GEOGRAPHIC DISTRIBUTION:
        ${currentMetrics.usersByCountry ? 
          Object.entries(currentMetrics.usersByCountry)
            .slice(0, 10)
            .map(([country, users]) => `- ${country}: ${users} users`)
            .join("\n") : 
          "No geographic data available."}
        
        HISTORICAL TRENDS:
        ${historicalData && historicalData.dailyTrends ? 
          `Historical data spanning ${historicalData.periodCovered} showing daily trends in visitors, bounce rates, and engagement metrics.` : 
          "No historical trend data available."}
        
        Based on this comprehensive data, generate 6-8 actionable, high-value insights. For each insight:
        
        1. Create a concise, specific title that clearly communicates the key finding
        2. Write a detailed description explaining the issue or opportunity, with specific data points supporting your analysis
        3. Categorize the insight into one of these categories: Traffic, Performance, Content, User Experience, Engagement, Audience, Technical
        4. Assess impact level (High, Medium, Low) based on potential ROI
        5. Suggest an appropriate Material icon name that visually represents the insight (e.g., trending_up, priority_high, speed, schedule, devices, language, group, location_on, public, visibility, trending_flat, etc.)
        6. Provide 2-4 specific, practical recommendations to address the insight, with clear expected outcomes
        
        Focus on insights that are:
        - Data-driven with specific metrics referenced
        - Actionable (clear what to do)
        - Business-relevant (tied to traffic, engagement, or user experience)
        - Diverse across different aspects of the website performance
        - Prioritized by potential impact
        - Include both immediate quick wins and longer-term strategic recommendations
        
        Make sure to cover a wide range of insights spanning traffic patterns, user behavior, content performance, geographic opportunities, device optimization, and engagement metrics.
        
        Return the insights as a JSON array where each object has the structure:
        {
          "title": string,
          "description": string,
          "category": string,
          "impact": "High" | "Medium" | "Low", 
          "icon": string,
          "recommendations": string[]
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.8, // Higher temperature for more creative and diverse insights
        max_tokens: 10000 // Ensure we have enough tokens for comprehensive insights
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }

      const parsedContent = JSON.parse(content);
      return parsedContent.insights || [];
    } catch (error: unknown) {
      console.error("Error generating insights with OpenAI:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to generate insights: ${errorMessage}`);
    }
  },

  // Generate comprehensive custom report based on user query
  generateCustomReport: async (
    query: string,
    metrics: Metric,
    websiteDomain: string,
    historicalData?: any,
    gaMetricsData?: any
  ): Promise<any> => {
    try {
      // Prepare additional data sections if available
      let deviceSection = "";
      let landingPageSection = "";
      let trafficSourceSection = "";
      let historicalSection = "";
      
      // Add device breakdown if available
      if (gaMetricsData && gaMetricsData.deviceBreakdown) {
        deviceSection = "\nDevice breakdown:\n" + 
          Object.entries(gaMetricsData.deviceBreakdown)
            .map(([device, count]) => `- ${device}: ${count} users`)
            .join("\n");
      }
      
      // Add landing page data if available
      if (historicalData && historicalData.landingPages && historicalData.landingPages.length > 0) {
        landingPageSection = "\nTop landing pages:\n" + 
          historicalData.landingPages.slice(0, 5).map((page: any) => 
            `- ${page.page}: ${page.visitors} visitors, ${page.bounceRate} bounce rate`
          ).join("\n");
      }
      
      // Add traffic source data if available
      if (historicalData && historicalData.trafficSources && historicalData.trafficSources.length > 0) {
        trafficSourceSection = "\nTop traffic sources:\n" + 
          historicalData.trafficSources.slice(0, 5).map((source: any) => 
            `- ${source.source}: ${source.visitors} visitors, ${source.bounceRate} bounce rate`
          ).join("\n");
      }
      
      // Add historical trend summary if available
      if (historicalData && historicalData.dailyTrends) {
        const trends = historicalData.dailyTrends;
        if (trends.length > 0) {
          // Calculate averages for the first and second half to identify trends
          const midpoint = Math.floor(trends.length / 2);
          const firstHalf = trends.slice(0, midpoint);
          const secondHalf = trends.slice(midpoint);
          
          const avgVisitorsFirstHalf = firstHalf.reduce((sum: number, day: any) => sum + day.visitors, 0) / firstHalf.length;
          const avgVisitorsSecondHalf = secondHalf.reduce((sum: number, day: any) => sum + day.visitors, 0) / secondHalf.length;
          const visitorsTrend = avgVisitorsSecondHalf > avgVisitorsFirstHalf ? "increasing" : "decreasing";
          
          // Removed conversions data analysis per client request
          
          historicalSection = `\nHistorical trends (${historicalData.periodCovered}):\n` +
            `- Visitor trend: ${visitorsTrend} (${avgVisitorsFirstHalf.toFixed(1)} to ${avgVisitorsSecondHalf.toFixed(1)} average daily visitors)`;
        }
      }

      const prompt = `
        I need a detailed analysis for the website ${websiteDomain} based on the following query:
        "${query}"
        
        Here are the current metrics:
        - Visitors: ${metrics.visitors} (${metrics.visitorsChange} change)
        - Bounce Rate: ${metrics.bounceRate} (${metrics.bounceRateChange} change)
        - Active Users: ${metrics.activeUsers || 0}
        - New Users: ${metrics.newUsers || 0}
        - Event Count: ${metrics.eventCount || 0}
        - Average Engagement Time: ${metrics.avgEngagementTime || "N/A"}
        ${deviceSection}
        ${landingPageSection}
        ${trafficSourceSection}
        ${historicalSection}
        
        Please provide a comprehensive and data-driven analysis addressing the query directly.
        Use specific metrics, percentages, and trends from the provided data to support your analysis.
        Consider user behavior, traffic patterns, engagement metrics, and opportunities.
        
        Include the following sections:
        1. An informative title for the report that directly addresses the query
        2. An executive summary of your findings (3-5 sentences) highlighting the most important insights
        3. 4-6 specific key findings with supporting data points, concrete metrics, and comparisons where relevant
        4. 2-3 most probable causes for the observed patterns/issues, with evidence from the data
        5. 4-6 specific, actionable recommendations with expected outcomes and implementation difficulty (easy/medium/hard)
        6. 2-3 immediate next steps the user should take, in priority order, with timeframes
        
        Return the report as a JSON object with the following structure:
        {
          "title": string,
          "summary": string,
          "findings": string[],
          "causes": string[],
          "recommendations": string[],
          "nextSteps": string[]
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.4, // Lower temperature for more precise analysis
        max_tokens: 10000 // Ensure we have enough tokens for comprehensive report
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }

      return JSON.parse(content);
    } catch (error: unknown) {
      console.error("Error generating custom report with OpenAI:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to generate report: ${errorMessage}`);
    }
  },

  // Generate implementation plan from insights
  generateImplementationPlan: async (
    insights: Insight[],
    websiteDomain: string
  ): Promise<GeneratedImplementationPlan> => {
    try {
      // Prepare insights data for the prompt
      const insightsData = insights.map(insight => {
        // Parse recommendations array if it's a string
        let recommendations = insight.recommendations;
        if (typeof recommendations === 'string') {
          try {
            recommendations = JSON.parse(recommendations);
          } catch (e) {
            recommendations = [];
          }
        }

        return {
          title: insight.title,
          description: insight.description,
          category: insight.category,
          impact: insight.impact,
          recommendations: recommendations
        };
      });

      const prompt = `
        I need a detailed step-by-step implementation plan for addressing multiple website insights for the domain "${websiteDomain}".
        
        Here are the insights that need to be addressed:
        ${insightsData.map((insight, index) => `
        INSIGHT ${index + 1}: ${insight.title} (${insight.category} - ${insight.impact} Impact)
        Description: ${insight.description}
        Recommendations:
        ${Array.isArray(insight.recommendations) 
          ? insight.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')
          : 'No recommendations available.'
        }
        `).join('\n')}
        
        Based on these insights, create a comprehensive implementation plan that:
        
        1. Prioritizes actions based on impact, effort required, and logical dependencies
        2. Groups related tasks where appropriate
        3. Provides clear step-by-step instructions for implementation
        4. Includes estimated time/effort for each step
        5. Identifies any dependencies between steps
        6. Suggests resources or tools that might be helpful for each step
        
        Return the implementation plan in JSON format with the following structure:
        {
          "title": "A clear title for the implementation plan",
          "summary": "A brief executive summary of the implementation plan",
          "steps": [
            {
              "stepNumber": 1,
              "title": "Step title",
              "description": "Detailed step description with clear actions",
              "priority": "High/Medium/Low",
              "effort": "Easy/Medium/Difficult",
              "estimatedTime": "Estimated completion time (e.g., '1-2 hours', '1 day')",
              "dependencies": [], // Optional array of step numbers that must be completed first
              "resources": [] // Optional array of resources, tools or references
            }
            // ...additional steps
          ]
        }
        
        Ensure the steps are logical, actionable, and tailored specifically to address the insights provided.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.4, // Lower temperature for more precise planning
        max_tokens: 12000 // Ensure we have enough tokens for comprehensive plan
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }

      return JSON.parse(content);
    } catch (error: unknown) {
      console.error("Error generating implementation plan with OpenAI:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to generate implementation plan: ${errorMessage}`);
    }
  },
};

export default openAiService;
