import { Insight } from "@/types/insight";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getRelativeTime } from "@/lib/utils/date-utils";

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
    <Card className="insight-card border border-border shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <span className={`material-icons ${impactColors.text}`}>{insight.icon}</span>
            <span className="font-google-sans font-medium">{insight.title}</span>
          </div>
          <div className={`${impactColors.bg} ${impactColors.text} px-3 py-1 rounded-full text-xs font-google-sans`}>
            {insight.impact} Impact
          </div>
        </div>
        
        <p className="mb-4 text-foreground">{insight.description}</p>
        
        <div className="bg-muted rounded-md p-3 mb-4">
          <h4 className="font-google-sans font-medium mb-2 flex items-center gap-1">
            <span className="material-icons text-primary text-sm">lightbulb</span>
            Recommended Actions
          </h4>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {recommendations.map((recommendation: string, index: number) => (
              <li key={index}>{recommendation}</li>
            ))}
          </ul>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Category: {insight.category}</span>
          <span className="text-sm text-muted-foreground">Detected: {getRelativeTime(insight.detectedAt)}</span>
        </div>
      </div>
      <div className="bg-muted px-5 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <span className="material-icons text-muted-foreground mr-2 text-sm">assessment</span>
          <span className="text-sm text-muted-foreground">View detailed analysis</span>
        </div>
        <Button size="sm" onClick={() => onViewDetails(insight.id)}>Take Action</Button>
      </div>
    </Card>
  );
};

export default InsightCard;
