import React from 'react';
import { Insight } from '@/types/insight';
import { Metric } from '@/types/metric';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, BarChart3, TrendingUp, RefreshCw, MessageSquareQuote, AlertTriangle, LineChart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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
      <Card className="mb-4 border-2 border-primary/20 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-4 w-80 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-28 w-full mb-4" />
          <Separator className="my-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-md">
              <Skeleton className="h-6 w-40 mb-3" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-28" />
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-md">
              <Skeleton className="h-6 w-40 mb-3" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return null;
  }

  // Count high impact insights
  const highImpactCount = insightsByImpact['High']?.length || 0;

  return (
    <Card className="mb-4 border-0 shadow-sm">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MessageSquareQuote className="h-5 w-5 mr-2 text-primary" />
            <CardTitle>Client-Friendly Summary</CardTitle>
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
                {summary ? 'Refresh' : 'Generate Summary'}
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        {highImpactCount > 0 && summary && (
          <div className="mb-2 flex justify-end">
            <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {highImpactCount} high-priority {highImpactCount === 1 ? 'issue' : 'issues'}
            </Badge>
          </div>
        )}

        {summary ? (
          <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-6 mb-5 border-l-4 border-primary">
            <div className="text-lg md:text-xl leading-relaxed text-gray-700 dark:text-gray-100 font-medium">
              <p>{summary}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-6 border border-dashed rounded-md mb-5 bg-gray-50 dark:bg-gray-800/50">
            <Lightbulb className="h-5 w-5 mr-2 text-primary" />
            <p className="text-muted-foreground">
              Generate a simple summary for your client.
            </p>
          </div>
        )}
        
        {summary && (
          <div className="mt-3 mb-1 flex flex-wrap gap-2 justify-center">
            {Object.entries(insightsByCategory)
              .sort(([,a], [,b]) => b.length - a.length) // Sort by count, descending
              .slice(0, 3) // Show only top 3 categories
              .map(([category, categoryInsights]) => (
                <Badge key={category} variant="outline" className="bg-primary/5 text-xs">
                  {category}: {categoryInsights.length}
                </Badge>
            ))}
            
            {/* Show only High and Medium impacts if they exist */}
            {['High', 'Medium'].map(impact => {
              const count = insightsByImpact[impact]?.length || 0;
              if (count === 0) return null;
              return (
                <Badge key={impact} className={`${getImpactColor(impact)} text-xs`}>
                  {impact} priority: {count}
                </Badge>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InsightsSummary;