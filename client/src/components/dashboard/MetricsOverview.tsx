import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Metric } from "@/types/metric";

interface MetricsOverviewProps {
  metrics: Metric | null;
  isLoading: boolean;
}

const MetricsOverview = ({ metrics, isLoading }: MetricsOverviewProps) => {
  if (isLoading) {
    return (
      <div className="mb-8">
        <h3 className="text-xl font-medium font-google-sans mb-4">Website Activity Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
                <div className="flex items-end gap-2">
                  <Skeleton className="h-8 w-28" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="mb-8">
        <h3 className="text-xl font-medium font-google-sans mb-4">Website Activity Metrics</h3>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No metrics data available. Try syncing with Google Analytics.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // We're not using core metrics anymore as per request
  
  // Second row - additional metrics requested by user
  const additionalMetricCards = [
    {
      label: "Active Users",
      value: metrics.activeUsers ? metrics.activeUsers.toLocaleString() : "0",
      icon: "group",
      iconColor: "text-blue-500",
    },
    {
      label: "New Users",
      value: metrics.newUsers ? metrics.newUsers.toLocaleString() : "0",
      icon: "person_add",
      iconColor: "text-green-500",
    },
    {
      label: "Event Count",
      value: metrics.eventCount ? metrics.eventCount.toLocaleString() : "0",
      icon: "touch_app",
      iconColor: "text-purple-500",
    },
    {
      label: "Avg. Engagement",
      value: metrics.avgEngagementTime || "0s",
      icon: "timer",
      iconColor: "text-orange-500",
    },
    {
      label: "Views",
      value: metrics.viewsCount ? metrics.viewsCount.toLocaleString() : "0",
      icon: "visibility",
      iconColor: "text-cyan-500",
    },
  ];

  const isTrendUp = (change: string) => {
    return change.includes('+');
  };

  return (
    <div className="space-y-8">
      {/* User Activity Metrics section */}
      <div>
        <h3 className="text-xl font-medium font-google-sans mb-4">Website Activity Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {additionalMetricCards.map((card: any, index: number) => (
            <Card key={index} className="border border-border shadow-sm">
              <CardContent className="pt-5">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-muted-foreground font-google-sans">{card.label}</span>
                  <span className={`material-icons ${card.iconColor}`}>{card.icon}</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-medium font-google-sans">{card.value}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* TODO: Add distribution charts section for channels, sources, pages, countries */}
      {/* These will be charts built using the "sessionsByChannel", "sessionsBySource", */}
      {/* "viewsByPage" and "usersByCountry" data */}
    </div>
  );
};

export default MetricsOverview;
