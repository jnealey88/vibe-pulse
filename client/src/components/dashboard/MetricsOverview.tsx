import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Metric } from "@/types/metric";
import DistributionChart from "./DistributionChart";
import DataTable from "./DataTable";
import CountryMap from "./CountryMap";

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

  // Second row - additional metrics requested by user
  const additionalMetricCards = [
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
  
  // Prepare data for distribution charts
  
  // 1. Sessions by Channel
  const sessionsByChannelData = metrics.sessionsByChannel ? 
    Object.entries(metrics.sessionsByChannel).map(([name, value]) => ({ name, value })) : 
    [];
  
  // 2. Sessions by Source
  const sessionsBySourceData = metrics.sessionsBySource ? 
    Object.entries(metrics.sessionsBySource).map(([name, value]) => ({ name, value })) : 
    [];
  
  // 3. Views by Page
  const viewsByPageData = metrics.viewsByPage ?
    Object.entries(metrics.viewsByPage).map(([name, value]) => ({ name, value })) :
    [];
  
  // 4. Users by Country
  const usersByCountryData = metrics.usersByCountry ?
    Object.entries(metrics.usersByCountry).map(([code, value]) => ({ 
      code, 
      name: getCountryName(code), 
      value 
    })) :
    [];
    
  return (
    <div className="space-y-8">
      {/* User Activity Metrics section */}
      <div>
        <h3 className="text-xl font-medium font-google-sans mb-4">Website Activity Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
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
      
      {/* Traffic Sources Section */}
      <div>
        <h3 className="text-xl font-medium font-google-sans mb-4">Traffic Sources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DistributionChart 
            title="Sessions by Channel" 
            data={sessionsByChannelData}
            description="Distribution of sessions by primary channel group"
          />
          <DistributionChart 
            title="Sessions by Source" 
            data={sessionsBySourceData}
            description="Distribution of sessions by traffic source"
          />
        </div>
      </div>
      
      {/* Content Performance Section */}
      <div>
        <h3 className="text-xl font-medium font-google-sans mb-4">Content Performance</h3>
        <div className="grid grid-cols-1 gap-6">
          <DataTable 
            title="Views by Page Title"
            data={viewsByPageData}
            columns={[
              { name: 'Page Title', key: 'name' },
              { 
                name: 'Views', 
                key: 'value',
                formatter: (value) => value.toLocaleString()
              },
              { 
                name: 'Share', 
                key: 'value',
                formatter: (value) => {
                  const total = viewsByPageData.reduce((sum, item) => sum + item.value, 0);
                  return total > 0 ? `${Math.round((value / total) * 100)}%` : '0%';
                }
              }
            ]}
          />
        </div>
      </div>
      
      {/* Geographic Distribution Section */}
      <div>
        <h3 className="text-xl font-medium font-google-sans mb-4">Geographic Distribution</h3>
        <div className="grid grid-cols-1 gap-6">
          <CountryMap 
            title="Users by Country"
            data={usersByCountryData}
            description="Geographic distribution of your users"
          />
        </div>
      </div>
    </div>
  );
};

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

// Helper function to get country name from country code
function getCountryName(countryCode: string): string {
  // This would ideally use a proper country code library
  // For now, we'll return a simplified version
  const countryMap: {[key: string]: string} = {
    'US': 'United States',
    'GB': 'United Kingdom',
    'CA': 'Canada',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'IN': 'India',
    'JP': 'Japan',
    'BR': 'Brazil',
    'MX': 'Mexico',
    // Add more as needed
  };
  
  return countryMap[countryCode] || countryCode;
}

export default MetricsOverview;
