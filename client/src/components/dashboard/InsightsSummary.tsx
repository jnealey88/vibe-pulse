import React from 'react';
import { Insight } from '@/types/insight';
import { Metric } from '@/types/metric';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, BarChart3, TrendingUp, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface InsightsSummaryProps {
  insights: Insight[];
  metrics: Metric | null;
  isLoading: boolean;
  isGenerating: boolean;
  onGenerateSummary: () => void;
  summary: string | null;
}

const InsightsSummary = ({ 
  insights, 
  metrics, 
  isLoading, 
  isGenerating, 
  onGenerateSummary,
  summary 
}: InsightsSummaryProps) => {
  // Group insights by category
  const insightsByCategory = insights.reduce((acc, insight) => {
    const category = insight.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(insight);
    return acc;
  }, {} as Record<string, Insight[]>);

  // Group insights by impact
  const insightsByImpact = insights.reduce((acc, insight) => {
    const impact = insight.impact;
    if (!acc[impact]) {
      acc[impact] = [];
    }
    acc[impact].push(insight);
    return acc;
  }, {} as Record<string, Insight[]>);

  // Helper function to get color based on impact
  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <Skeleton className="h-6 w-48 mr-2" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2 text-primary" />
            <h3 className="text-lg font-medium">Insights Summary</h3>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onGenerateSummary}
            disabled={isGenerating || insights.length === 0}
            className="border-primary border text-primary hover:bg-primary/10"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                {summary ? 'Refresh Summary' : 'Generate Summary'}
              </>
            )}
          </Button>
        </div>

        {summary ? (
          <div className="mb-4">
            <p className="text-gray-600 dark:text-gray-300">{summary}</p>
          </div>
        ) : (
          <div className="flex items-center justify-center p-4 border border-dashed rounded-md mb-4">
            <Lightbulb className="h-5 w-5 mr-2 text-muted-foreground" />
            <p className="text-muted-foreground">Generate an AI summary of your insights to get a quick overview.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Categories breakdown */}
          <div className="border rounded-md p-4">
            <div className="flex items-center mb-3">
              <BarChart3 className="h-4 w-4 mr-2 text-primary" />
              <h4 className="font-medium">Insights by Category</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(insightsByCategory).map(([category, categoryInsights]) => (
                <Badge key={category} variant="outline" className="bg-primary/10">
                  {category}: {categoryInsights.length}
                </Badge>
              ))}
            </div>
          </div>

          {/* Impact breakdown */}
          <div className="border rounded-md p-4">
            <div className="flex items-center mb-3">
              <TrendingUp className="h-4 w-4 mr-2 text-primary" />
              <h4 className="font-medium">Insights by Impact</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(insightsByImpact).map(([impact, impactInsights]) => (
                <Badge key={impact} className={getImpactColor(impact)}>
                  {impact}: {impactInsights.length}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InsightsSummary;