import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { InsightFilters } from "@/types/insight";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MetricsOverview from "@/components/dashboard/MetricsOverview";
import InsightCard from "@/components/dashboard/InsightCard";
import InsightsFilter from "@/components/dashboard/InsightsFilter";

import AddWebsiteModal from "@/components/dashboard/AddWebsiteModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ga4Service from "@/lib/ga4-service";
import { Website, Metric } from "@/types/metric";

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("30"); // Default to 30 days
  const [filters, setFilters] = useState<InsightFilters>({
    category: "All Categories",
    impact: "All Impacts",
  });
  const [insightPage, setInsightPage] = useState(1);
  const [isAddWebsiteModalOpen, setIsAddWebsiteModalOpen] = useState(false);
  
  const { isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  // Fetch user's websites
  const {
    data: websites = [] as Website[],
    isLoading: isLoadingWebsites,
  } = useQuery<Website[]>({
    queryKey: ['/api/websites'],
    enabled: isAuthenticated,
  });

  // Select first website by default when websites load
  useEffect(() => {
    if (websites?.length > 0 && !selectedWebsiteId) {
      setSelectedWebsiteId(websites[0].id.toString());
    }
  }, [websites, selectedWebsiteId]);

  // Fetch metrics for selected website
  const {
    data: metrics,
    isLoading: isLoadingMetrics,
    refetch: refetchMetrics,
    error: metricsError,
  } = useQuery<Metric | null>({
    queryKey: [`/api/websites/${selectedWebsiteId}/metrics`],
    enabled: !!selectedWebsiteId
  });

  // Fetch insights for selected website
  const {
    data: insights = [] as any[],
    isLoading: isLoadingInsights,
    refetch: refetchInsights,
  } = useQuery<any[]>({
    queryKey: [`/api/websites/${selectedWebsiteId}/insights?category=${filters.category}&impact=${filters.impact}`],
    enabled: !!selectedWebsiteId,
  });

  // Sync metrics mutation
  const syncMetricsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedWebsiteId) return null;
      const days = parseInt(dateRange);
      return await ga4Service.syncMetrics(parseInt(selectedWebsiteId), days);
    },
    onSuccess: () => {
      toast({
        title: "Metrics synced",
        description: "Latest metrics have been fetched from Google Analytics 4",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/websites/${selectedWebsiteId}/metrics`] });
    },
    onError: (error) => {
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Failed to sync metrics",
        variant: "destructive",
      });
    },
  });

  // Generate insights mutation
  const generateInsightsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedWebsiteId) return null;
      return await ga4Service.generateInsights(parseInt(selectedWebsiteId));
    },
    onSuccess: () => {
      toast({
        title: "Insights generated",
        description: "New insights have been generated based on your data",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/websites/${selectedWebsiteId}/insights?category=${filters.category}&impact=${filters.impact}`] });
    },
    onError: (error) => {
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate insights",
        variant: "destructive",
      });
    },
  });

  const handleWebsiteChange = (websiteId: string) => {
    setSelectedWebsiteId(websiteId);
  };

  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
  };

  const handleFilterChange = (name: keyof InsightFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setInsightPage(1); // Reset pagination when filters change
  };

  const handleViewInsightDetails = (insightId: number) => {
    // This would navigate to a detailed view of the insight
    toast({
      title: "Feature in development",
      description: `Detailed view for insight #${insightId} is coming soon`,
    });
  };

  const handleLoadMoreInsights = () => {
    setInsightPage((prev) => prev + 1);
  };

  const selectedWebsite = websites?.find(
    (site: Website) => site.id.toString() === selectedWebsiteId
  ) || null;

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 lg:ml-64">
        <Header
          websites={websites || []}
          selectedWebsite={selectedWebsite}
          onWebsiteChange={handleWebsiteChange}
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          onMenuToggle={() => setSidebarOpen(true)}
        />
        
        <main className="py-6 px-6">
          {/* Dashboard Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-medium font-google-sans mb-2">Dashboard</h2>
            <p className="text-muted-foreground">AI-powered insights from your Google Analytics 4 data</p>
          </div>
          
          {/* Connection Status */}
          {selectedWebsite ? (
            <div className="mb-8 bg-white rounded-lg border border-border shadow-sm p-4">
              <div className="flex items-center justify-between flex-wrap md:flex-nowrap gap-4">
                <div className="flex items-center gap-3">
                  <span className="material-icons text-secondary">check_circle</span>
                  <div>
                    <h3 className="font-google-sans font-medium">Connected to Google Analytics 4</h3>
                    <p className="text-sm text-muted-foreground">
                      {metrics && metrics.updatedAt ? (
                        `Last synced: ${new Date(metrics.updatedAt).toLocaleString()}`
                      ) : (
                        "Not synced yet"
                      )}
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => syncMetricsMutation.mutate()} 
                  disabled={syncMetricsMutation.isPending}
                  className="w-full md:w-auto"
                >
                  <span className="material-icons text-sm mr-2">refresh</span>
                  {syncMetricsMutation.isPending ? "Syncing..." : "Sync Now"}
                </Button>
              </div>
            </div>
          ) : isLoadingWebsites ? (
            <Card className="mb-8">
              <CardContent className="p-4">
                <Skeleton className="h-12 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-8">
              <CardContent className="p-6 text-center">
                <span className="material-icons text-3xl text-muted-foreground mb-2">info</span>
                <h3 className="font-google-sans font-medium text-lg mb-2">No Website Connected</h3>
                <p className="text-muted-foreground mb-4">Connect a website to get started with analytics and insights</p>
                <Button onClick={() => setIsAddWebsiteModalOpen(true)}>Add Website</Button>
              </CardContent>
            </Card>
          )}
          
          {/* Metrics Overview */}
          <MetricsOverview 
            metrics={metrics || null} 
            isLoading={isLoadingMetrics || syncMetricsMutation.isPending} 
          />
          
          {/* AI Insights */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
              <div className="flex items-center justify-between w-full md:w-auto">
                <h3 className="text-xl font-medium font-google-sans">AI-Powered Insights</h3>
                {selectedWebsite && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="md:ml-4 md:hidden"
                    onClick={() => generateInsightsMutation.mutate()}
                    disabled={generateInsightsMutation.isPending}
                  >
                    <span className="material-icons text-sm mr-2">auto_awesome</span>
                    {generateInsightsMutation.isPending ? "Generating..." : "Generate Insights"}
                  </Button>
                )}
              </div>
              
              <div className="flex gap-3 w-full md:w-auto items-center">
                {selectedWebsite && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="hidden md:flex"
                    onClick={() => generateInsightsMutation.mutate()}
                    disabled={generateInsightsMutation.isPending}
                  >
                    <span className="material-icons text-sm mr-2">auto_awesome</span>
                    {generateInsightsMutation.isPending ? "Generating..." : "Generate Insights"}
                  </Button>
                )}
                <InsightsFilter filters={filters} onFilterChange={handleFilterChange} />
              </div>
            </div>
            
            {/* Insight Cards */}
            {isLoadingInsights || generateInsightsMutation.isPending ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                      </div>
                      <Skeleton className="h-24 w-full mb-4" />
                      <Skeleton className="h-32 w-full mb-4" />
                      <div className="flex gap-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                    <div className="bg-muted px-5 py-3 flex justify-between items-center">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : insights.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {insights.map((insight) => (
                  <InsightCard 
                    key={insight.id} 
                    insight={insight} 
                    onViewDetails={handleViewInsightDetails} 
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <span className="material-icons text-4xl text-muted-foreground mb-3">psychology</span>
                  <h4 className="text-lg font-google-sans font-medium mb-2">No insights yet</h4>
                  <p className="text-muted-foreground mb-6">
                    {selectedWebsite 
                      ? "Generate your first insights by clicking the button above"
                      : "Select a website to generate insights"}
                  </p>
                  {selectedWebsite && (
                    <Button 
                      onClick={() => generateInsightsMutation.mutate()}
                      disabled={generateInsightsMutation.isPending}
                    >
                      <span className="material-icons mr-2">auto_awesome</span>
                      Generate First Insights
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
            
            {insights.length > 0 && (
              <div className="flex justify-center mt-8">
                <Button 
                  variant="outline" 
                  onClick={handleLoadMoreInsights}
                  className="border-border"
                >
                  <span className="material-icons mr-2">add</span>
                  Load More Insights
                </Button>
              </div>
            )}
          </div>
          

          
          {/* Add Website Modal */}
          <AddWebsiteModal 
            isOpen={isAddWebsiteModalOpen} 
            onClose={() => setIsAddWebsiteModalOpen(false)} 
          />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
