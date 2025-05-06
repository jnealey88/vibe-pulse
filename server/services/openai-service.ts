import OpenAI from "openai";
import { Metric } from "@shared/schema";

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

export const openAiService = {
  // Generate insights based on metrics data
  generateInsights: async (
    currentMetrics: Metric,
    historicalData: any,
    websiteDomain: string
  ): Promise<GeneratedInsight[]> => {
    try {
      const prompt = `
        I have the following metrics for the website ${websiteDomain}:
        
        Current metrics:
        - Visitors: ${currentMetrics.visitors} (${currentMetrics.visitorsChange} change)
        - Conversions: ${currentMetrics.conversions} (${currentMetrics.conversionsChange} change)
        - Bounce Rate: ${currentMetrics.bounceRate} (${currentMetrics.bounceRateChange} change)
        - Page Speed: ${currentMetrics.pageSpeed} (${currentMetrics.pageSpeedChange} change)
        
        Historical context:
        ${JSON.stringify(historicalData)}
        
        Based on this data, generate 2-4 actionable insights. For each insight, provide:
        1. A concise title
        2. A detailed description of the issue or opportunity
        3. The category (Traffic, Conversion, Performance, Content, User Experience)
        4. Impact level (High, Medium, Low)
        5. An appropriate Material icon name (e.g., trending_up, priority_high, speed, schedule)
        6. 2-3 specific recommendations to address the insight
        
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
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }

      const parsedContent = JSON.parse(content);
      return parsedContent.insights || [];
    } catch (error) {
      console.error("Error generating insights with OpenAI:", error);
      throw new Error(`Failed to generate insights: ${error.message}`);
    }
  },

  // Generate custom report based on user query
  generateCustomReport: async (
    query: string,
    metrics: Metric,
    websiteDomain: string
  ): Promise<any> => {
    try {
      const prompt = `
        I need a detailed analysis for the website ${websiteDomain} based on the following query:
        "${query}"
        
        Here are the current metrics:
        - Visitors: ${metrics.visitors} (${metrics.visitorsChange} change)
        - Conversions: ${metrics.conversions} (${metrics.conversionsChange} change)
        - Bounce Rate: ${metrics.bounceRate} (${metrics.bounceRateChange} change)
        - Page Speed: ${metrics.pageSpeed} (${metrics.pageSpeedChange} change)
        
        Please provide a comprehensive analysis addressing the query directly, including:
        1. Key findings
        2. Possible causes
        3. Data-driven recommendations
        4. Actionable next steps
        
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
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }

      return JSON.parse(content);
    } catch (error) {
      console.error("Error generating custom report with OpenAI:", error);
      throw new Error(`Failed to generate report: ${error.message}`);
    }
  },
};

export default openAiService;
