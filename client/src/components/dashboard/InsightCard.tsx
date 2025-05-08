import { Insight } from "@/types/insight";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getRelativeTime } from "@/lib/utils/date-utils";
import { ChevronRight, Calendar, Tag } from "lucide-react";

interface InsightCardProps {
  insight: Insight;
  onViewDetails: (insightId: number) => void;
}

const InsightCard = ({ insight, onViewDetails }: InsightCardProps) => {
  // Color mapping for impact levels
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "High":
        return {
          bg: "bg-destructive bg-opacity-10",
          text: "text-destructive",
        };
      case "Medium":
        return {
          bg: "bg-accent bg-opacity-10",
          text: "text-accent",
        };
      case "Low":
        return {
          bg: "bg-secondary bg-opacity-10",
          text: "text-secondary",
        };
      default:
        return {
          bg: "bg-primary bg-opacity-10",
          text: "text-primary",
        };
    }
  };

  // Parse recommendations from JSON string if needed
  const getRecommendations = () => {
    if (!insight.recommendations) {
      return [];
    }
    
    if (typeof insight.recommendations === "string") {
      try {
        return JSON.parse(insight.recommendations);
      } catch (e) {
        return [];
      }
    }
    return insight.recommendations;
  };

  const recommendations = getRecommendations() || [];
  const impactColors = getImpactColor(insight.impact);

  return (
    <Card className="insight-card overflow-hidden hover:shadow-md transition-all duration-300 border-0 shadow-sm">
      {/* Colored top border based on impact */}
      <div className={`h-1 w-full ${impactColors.text} bg-current`}></div>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className={`${impactColors.bg} rounded-full p-2 flex items-center justify-center`}>
              <span className={`material-icons ${impactColors.text} text-base`}>{insight.icon}</span>
            </div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">{insight.title}</h3>
          </div>
          <Badge variant="outline" className={`${impactColors.bg} ${impactColors.text} font-normal`}>
            {insight.impact} Impact
          </Badge>
        </div>
        
        <p className="mb-6 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{insight.description}</p>
        
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mb-6 border border-slate-100 dark:border-slate-700/50">
          <h4 className="font-medium mb-3 text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <span className="material-icons text-primary text-sm">lightbulb</span>
            Recommended Actions
          </h4>
          <ul className="space-y-2">
            {recommendations.map((recommendation: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                <div className="rounded-full bg-primary/10 p-1 mt-0.5 flex-shrink-0">
                  <ChevronRight className="h-3 w-3 text-primary" />
                </div>
                <span className="leading-tight">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Tag className="h-3 w-3" />
            <span>{insight.category}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{getRelativeTime(insight.detectedAt)}</span>
          </div>
        </div>
      </div>
      <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-3 flex justify-between items-center border-t border-slate-100 dark:border-slate-700/50">
        <div className="flex items-center">
          <span className="material-icons text-primary mr-2 text-sm">assessment</span>
          <span className="text-xs text-gray-600 dark:text-gray-300">View analysis</span>
        </div>
        <Button 
          size="sm" 
          onClick={() => onViewDetails(insight.id)}
          className="bg-primary hover:bg-primary/90 text-white rounded-full px-4"
        >
          Take Action
        </Button>
      </div>
    </Card>
  );
};

export default InsightCard;
