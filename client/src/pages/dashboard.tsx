import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { InsightFilters, InsightImplementationPlan, Insight } from "@/types/insight";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MetricsOverview from "@/components/dashboard/MetricsOverview";
import WebsiteActivityMetrics from "@/components/dashboard/WebsiteActivityMetrics";
import InsightCard from "@/components/dashboard/InsightCard";
import InsightsFilter from "@/components/dashboard/InsightsFilter";
import GenerateImplementationPlanModal from "@/components/dashboard/GenerateImplementationPlanModal";
import ImplementationPlanDetail from "@/components/dashboard/ImplementationPlanDetail";
import InsightsSummary from "@/components/dashboard/InsightsSummary";

import AddWebsiteModal from "@/components/dashboard/AddWebsiteModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, ListChecks, Lightbulb } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("insights");
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<InsightImplementationPlan | null>(null);
  const [insightsSummary, setInsightsSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  
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

  // Select first website by default when websites load or clear selection when all websites are deleted
  useEffect(() => {
    if (websites?.length > 0 && !selectedWebsiteId) {
      // Select first website when loading initially
      setSelectedWebsiteId(websites[0].id.toString());
    } else if (websites?.length === 0 && selectedWebsiteId) {
      // Clear selected website when all websites are deleted
      setSelectedWebsiteId(null);
      // Clear any cached metrics and insights data
      queryClient.removeQueries({ queryKey: ['/api/websites'] });
      queryClient.removeQueries({ queryKey: ['/api/websites/', { exact: false }] });
    }
  }, [websites, selectedWebsiteId, queryClient]);

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
    data: insights = [] as Insight[],
    isLoading: isLoadingInsights,
    refetch: refetchInsights,
  } = useQuery<Insight[]>({
    queryKey: [`/api/websites/${selectedWebsiteId}/insights?category=${filters.category}&impact=${filters.impact}`],
    enabled: !!selectedWebsiteId,
  });
  
  // Fetch implementation plans for selected website
  const {
    data: implementationPlans = [] as InsightImplementationPlan[],
    isLoading: isLoadingPlans,
    refetch: refetchPlans,
  } = useQuery<InsightImplementationPlan[]>({
    queryKey: [`/api/websites/${selectedWebsiteId}/implementation-plans`],
    enabled: !!selectedWebsiteId && activeTab === 'plans',
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
  
  // Generate implementation plan mutation
  const generateImplementationPlanMutation = useMutation({
    mutationFn: async (insightIds: number[]) => {
      if (!selectedWebsiteId) return null;
      return await ga4Service.generateImplementationPlan(parseInt(selectedWebsiteId), insightIds);
    },
    onSuccess: (data) => {
      if (data) {
        toast({
          title: "Implementation plan generated",
          description: "Your plan has been created successfully",
        });
        queryClient.invalidateQueries({ queryKey: [`/api/websites/${selectedWebsiteId}/implementation-plans`] });
        setSelectedPlan(data);
      }
    },
    onError: (error) => {
      toast({
        title: "Plan generation failed",
        description: error instanceof Error ? error.message : "Failed to generate implementation plan",
        variant: "destructive",
      });
    },
  });
  
  // Delete implementation plan mutation
  const deleteImplementationPlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      return await ga4Service.deleteImplementationPlan(planId);
    },
    onSuccess: () => {
      toast({
        title: "Plan deleted",
        description: "Implementation plan has been deleted successfully",
      });
      setSelectedPlan(null);
      queryClient.invalidateQueries({ queryKey: [`/api/websites/${selectedWebsiteId}/implementation-plans`] });
    },
    onError: (error) => {
      toast({
        title: "Deletion failed",
        description: error instanceof Error ? error.message : "Failed to delete implementation plan",
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
    if (selectedWebsiteId) {
      generateInsightsMutation.mutate();
      toast({
        title: "Generating new insights",
        description: "We're analyzing your data to create fresh insights",
      });
    } else {
      toast({
        title: "No website selected",
        description: "Please select a website to generate insights",
        variant: "destructive",
      });
    }
  };
  
  const handleOpenPlanModal = () => {
    if (insights.length === 0) {
      toast({
        title: "No insights available",
        description: "Generate insights first to create an implementation plan",
        variant: "destructive",
      });
      return;
    }
    setIsPlanModalOpen(true);
  };

  const handleClosePlanModal = () => {
    setIsPlanModalOpen(false);
  };

  const handlePlanGenerated = (plan: InsightImplementationPlan) => {
    setActiveTab("plans");
    setSelectedPlan(plan);
  };

  const handleDeletePlan = (planId: number) => {
    if (confirm("Are you sure you want to delete this implementation plan?")) {
      deleteImplementationPlanMutation.mutate(planId);
    }
  };

  const handleBackFromPlan = () => {
    setSelectedPlan(null);
  };

  // Generate insights summary function
  const handleGenerateInsightsSummary = async () => {
    if (!selectedWebsiteId || insights.length === 0) {
      toast({
        title: "Cannot generate summary",
        description: "Please select a website with insights to generate a summary",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingSummary(true);
    try {
      const summaryResponse = await ga4Service.generateInsightsSummary(
        parseInt(selectedWebsiteId),
        insights,
        metrics || null
      );
      setInsightsSummary(summaryResponse.summary);
      toast({
        title: "Summary generated",
        description: "AI summary of your insights has been created",
      });
    } catch (error) {
      console.error("Error generating insights summary:", error);
      toast({
        title: "Summary generation failed",
        description: error instanceof Error ? error.message : "Failed to generate insights summary",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSummary(false);
    }
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
            <h2 className="text-2xl font-semibold font-google-sans mb-2 text-foreground">Website Performance</h2>
            <p className="text-muted-foreground">AI-powered insights and analytics from Airo Pulse</p>
          </div>
          
          {/* Connection Status */}
          {selectedWebsite ? (
            <div className="mb-8 bg-white rounded-lg border border-border shadow-sm p-5">
              <div className="flex items-center justify-between flex-wrap md:flex-nowrap gap-4">
                <div className="flex items-center gap-3">
                  <span className="material-icons text-primary">signal_cellular_alt</span>
                  <div>
                    <h3 className="font-google-sans font-semibold">Analytics Connection</h3>
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
                  <span className="material-icons text-sm mr-2">update</span>
                  {syncMetricsMutation.isPending ? "Syncing..." : "Refresh Data"}
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
          
          {/* Website Activity Metrics - Just the cards with data */}
          <div className="mb-8">
            <WebsiteActivityMetrics
              metrics={metrics || null}
              isLoading={isLoadingMetrics || syncMetricsMutation.isPending}
            />
          </div>
          
          {/* Smart Insights - Right below Website Activity Metrics cards */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
              <div className="flex items-center justify-between w-full md:w-auto">
                <h3 className="text-xl font-semibold font-google-sans text-foreground mb-0">Smart Insights</h3>
                {selectedWebsite && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="md:ml-4 md:hidden border-primary border-2 text-primary hover:bg-primary/10 font-medium"
                    onClick={() => generateInsightsMutation.mutate()}
                    disabled={generateInsightsMutation.isPending}
                  >
                    <span className="material-icons text-sm mr-2">{generateInsightsMutation.isPending ? "hourglass_empty" : "auto_awesome"}</span>
                    {generateInsightsMutation.isPending ? "Generating..." : "Generate Insights"}
                  </Button>
                )}
              </div>
              
              <div className="flex gap-3 w-full md:w-auto items-center">
                {selectedWebsite && insights.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-primary border-2 text-primary hover:bg-primary/10 font-medium"
                    onClick={handleOpenPlanModal}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Implementation Plan
                  </Button>
                )}
                
                {selectedWebsite && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="hidden md:flex border-primary border-2 text-primary hover:bg-primary/10 font-medium"
                    onClick={() => generateInsightsMutation.mutate()}
                    disabled={generateInsightsMutation.isPending}
                  >
                    <span className="material-icons text-sm mr-2">{generateInsightsMutation.isPending ? "hourglass_empty" : "auto_awesome"}</span>
                    {generateInsightsMutation.isPending ? "Generating..." : "Generate Insights"}
                  </Button>
                )}
                <InsightsFilter filters={filters} onFilterChange={handleFilterChange} />
              </div>
            </div>
            
            {selectedPlan ? (
              <ImplementationPlanDetail 
                plan={selectedPlan}
                onBack={handleBackFromPlan}
              />
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="insights">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Insights
                  </TabsTrigger>
                  <TabsTrigger value="plans">
                    <ListChecks className="h-4 w-4 mr-2" />
                    Implementation Plans
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="insights" className="space-y-4">
                  {/* Insights Summary */}
                  {(insights.length > 0 && selectedWebsite) && (
                    <InsightsSummary
                      insights={insights}
                      metrics={metrics || null}
                      isLoading={isLoadingInsights}
                      isGenerating={isGeneratingSummary}
                      onGenerateSummary={handleGenerateInsightsSummary}
                      summary={insightsSummary}
                    />
                  )}
                  
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
                            className="border-primary border text-white bg-primary hover:bg-primary/90 font-medium"
                          >
                            <span className="material-icons mr-2">{generateInsightsMutation.isPending ? "hourglass_empty" : "auto_awesome"}</span>
                            {generateInsightsMutation.isPending ? "Generating..." : "Generate First Insights"}
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
                        className="border-primary border-2 text-primary hover:bg-primary/10 font-medium"
                        disabled={generateInsightsMutation.isPending}
                      >
                        <span className="material-icons mr-2">{generateInsightsMutation.isPending ? "hourglass_empty" : "auto_awesome"}</span>
                        {generateInsightsMutation.isPending ? "Generating..." : "Load More Insights"}
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="plans" className="space-y-4">
                  {isLoadingPlans ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1, 2].map((i) => (
                        <Card key={i} className="p-4">
                          <Skeleton className="h-8 w-3/4 mb-3" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-3/4" />
                        </Card>
                      ))}
                    </div>
                  ) : implementationPlans.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {implementationPlans.map((plan) => (
                        <Card key={plan.id} className="overflow-hidden">
                          <CardContent className="p-6">
                            <h4 className="text-lg font-medium mb-2 font-google-sans">{plan.title}</h4>
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                              {plan.summary.length > 120 
                                ? `${plan.summary.substring(0, 120)}...` 
                                : plan.summary}
                            </p>
                            <div className="flex flex-wrap gap-2 mb-4">
                              <Badge variant="outline" className="bg-primary/10">
                                {plan.steps.length} Steps
                              </Badge>
                              <Badge variant="outline" className="bg-primary/10">
                                {new Date(plan.createdAt).toLocaleDateString()}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedPlan(plan)}
                              >
                                View Plan
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDeletePlan(plan.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <ListChecks className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h4 className="text-lg font-google-sans font-medium mb-2">No Implementation Plans</h4>
                        <p className="text-muted-foreground mb-6">
                          Create your first implementation plan to organize insights into actionable steps
                        </p>
                        {insights.length > 0 && (
                          <Button 
                            onClick={handleOpenPlanModal}
                            className="border-primary border text-white bg-primary hover:bg-primary/90 font-medium"
                          >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Create First Implementation Plan
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
          
          {/* Additional metrics overview - will show after Smart Insights */}
          <div className="mb-8">
            <MetricsOverview 
              metrics={metrics || null} 
              isLoading={isLoadingMetrics || syncMetricsMutation.isPending} 
            />
          </div>
          
          {/* Modals */}
          <AddWebsiteModal 
            isOpen={isAddWebsiteModalOpen} 
            onClose={() => setIsAddWebsiteModalOpen(false)} 
          />
          
          <GenerateImplementationPlanModal
            isOpen={isPlanModalOpen}
            onClose={handleClosePlanModal}
            websiteId={selectedWebsiteId ? parseInt(selectedWebsiteId) : 0}
            insights={insights}
            onPlanGenerated={handlePlanGenerated}
          />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
