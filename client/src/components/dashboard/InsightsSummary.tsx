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
    <Card className="mb-4 border-2 border-primary/20 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MessageSquareQuote className="h-5 w-5 mr-2 text-primary" />
            <CardTitle>Executive Insights Summary</CardTitle>
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
        <CardDescription>
          AI-powered analysis of {insights.length} insights across {Object.keys(insightsByCategory).length} categories
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {highImpactCount > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md mb-4 flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">
              <span className="font-medium">Attention required:</span> {highImpactCount} high-impact 
              {highImpactCount === 1 ? ' issue has' : ' issues have'} been identified that need immediate attention.
            </p>
          </div>
        )}

        {summary ? (
          <div className="mb-5 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center mb-2">
              <LineChart className="h-4 w-4 mr-2 text-primary" />
              <h4 className="font-medium text-sm text-primary">SUMMARY ANALYSIS</h4>
            </div>
            <div className="text-base leading-relaxed text-gray-700 dark:text-gray-200 font-light">
              <p>{summary}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-6 border border-dashed rounded-md mb-5 bg-gray-50 dark:bg-gray-800/50">
            <Lightbulb className="h-5 w-5 mr-2 text-primary" />
            <p className="text-muted-foreground">
              Generate an AI summary to get a clear, client-ready analysis of all insights.
            </p>
          </div>
        )}
        
        <Separator className="my-4" />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {/* Categories breakdown */}
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-md p-4">
            <div className="flex items-center mb-3">
              <BarChart3 className="h-4 w-4 mr-2 text-primary" />
              <h4 className="font-medium text-sm">INSIGHTS BY CATEGORY</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(insightsByCategory)
                .sort(([,a], [,b]) => b.length - a.length) // Sort by count, descending
                .map(([category, categoryInsights]) => (
                  <Badge key={category} variant="outline" className="bg-primary/10 text-xs">
                    {category}: {categoryInsights.length}
                  </Badge>
              ))}
            </div>
          </div>

          {/* Impact breakdown */}
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-md p-4">
            <div className="flex items-center mb-3">
              <TrendingUp className="h-4 w-4 mr-2 text-primary" />
              <h4 className="font-medium text-sm">INSIGHTS BY PRIORITY</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Always show impacts in order of High, Medium, Low */}
              {['High', 'Medium', 'Low'].map(impact => {
                const count = insightsByImpact[impact]?.length || 0;
                if (count === 0) return null;
                return (
                  <Badge key={impact} className={`${getImpactColor(impact)} text-xs`}>
                    {impact}: {count}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InsightsSummary;