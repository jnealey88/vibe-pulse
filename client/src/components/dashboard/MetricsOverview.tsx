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
        <h3 className="text-xl font-medium font-google-sans mb-4">Key Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
                <div className="flex items-end gap-2">
                  <Skeleton className="h-8 w-28" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-3 w-36 mt-2" />
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
        <h3 className="text-xl font-medium font-google-sans mb-4">Key Metrics</h3>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No metrics data available. Try syncing with Google Analytics.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const metricCards = [
    {
      label: "Visitors",
      value: metrics.visitors ? metrics.visitors.toLocaleString() : "0",
      change: metrics.visitorsChange || "0%",
      icon: "person",
      iconColor: "text-primary",
    },
    {
      label: "Conversions",
      value: metrics.conversions ? metrics.conversions.toLocaleString() : "0",
      change: metrics.conversionsChange || "0%",
      icon: "done_all",
      iconColor: "text-secondary",
    },
    {
      label: "Bounce Rate",
      value: metrics.bounceRate || "0%",
      change: metrics.bounceRateChange || "0%",
      icon: "sync_problem",
      iconColor: "text-accent",
    },
    {
      label: "Avg. Page Speed",
      value: metrics.pageSpeed || "0s",
      change: metrics.pageSpeedChange || "0%",
      icon: "speed",
      iconColor: "text-primary",
    },
  ];

  const isTrendUp = (change: string) => {
    return change.includes('+');
  };

  return (
    <div className="mb-8">
      <h3 className="text-xl font-medium font-google-sans mb-4">Key Metrics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((card, index) => (
          <Card key={index} className="border border-border shadow-sm">
            <CardContent className="pt-5">
              <div className="flex justify-between items-start mb-3">
                <span className="text-muted-foreground font-google-sans">{card.label}</span>
                <span className={`material-icons ${card.iconColor}`}>{card.icon}</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-medium font-google-sans">{card.value}</span>
                <span className={isTrendUp(card.change) ? "metric-trend-up" : "metric-trend-down"}>
                  <span className="material-icons text-sm">
                    {isTrendUp(card.change) ? "arrow_upward" : "arrow_downward"}
                  </span>
                  {card.change.replace('+', '')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">vs previous period</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MetricsOverview;
