import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Metric } from "@/types/metric";

interface WebsiteActivityMetricsProps {
  metrics: Metric | null;
  isLoading: boolean;
}

// Helper function to format engagement time from seconds to "Xm Ys" format
function formatEngagementTime(timeValue: string): string {
  // If the time already has a format like "Xm Ys", return it as is
  if (timeValue.includes('m') && timeValue.includes('s')) {
    return timeValue;
  }
  
  // Try to parse the value as a number (seconds)
  const seconds = parseInt(timeValue, 10);
  if (isNaN(seconds)) {
    return timeValue; // If parsing fails, return the original value
  }
  
  // Convert seconds to minutes and seconds format
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

const WebsiteActivityMetrics = ({ metrics, isLoading }: WebsiteActivityMetricsProps) => {
  if (isLoading) {
    return (
      <div>
        <h3 className="text-xl font-medium font-google-sans mb-4">Website Activity Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
      <div>
        <h3 className="text-xl font-medium font-google-sans mb-4">Website Activity Metrics</h3>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No metrics data available. Try syncing with Google Analytics.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Metrics for User Activity section
  const activityMetricCards = [
    {
      label: "Active Users",
      value: metrics.activeUsers ? metrics.activeUsers.toLocaleString() : "-",
      icon: "group",
      iconColor: "text-blue-500",
    },
    {
      label: "New Users",
      value: metrics.newUsers ? metrics.newUsers.toLocaleString() : "-",
      icon: "person_add",
      iconColor: "text-green-500",
    },
    {
      label: "Bounce Rate",
      value: metrics.bounceRate || "-", 
      icon: "sync_problem",
      iconColor: "text-amber-500",
    },
    {
      label: "Event Count",
      value: metrics.eventCount ? metrics.eventCount.toLocaleString() : "-",
      icon: "touch_app",
      iconColor: "text-purple-500",
    },
    {
      label: "Avg. Engagement",
      value: metrics.avgEngagementTime ? formatEngagementTime(metrics.avgEngagementTime) : "-",
      icon: "timer",
      iconColor: "text-orange-500",
    },
    {
      label: "Views",
      value: metrics.viewsCount ? metrics.viewsCount.toLocaleString() : "-",
      icon: "visibility",
      iconColor: "text-cyan-500",
    },
  ];

  return (
    <div>
      <h3 className="text-xl font-medium font-google-sans mb-4">Website Activity Metrics</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
        {activityMetricCards.map((card, index) => (
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
  );
};

export default WebsiteActivityMetrics;