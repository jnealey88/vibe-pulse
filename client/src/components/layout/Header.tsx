import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Website } from "@/types/metric";
import { useMobile } from "@/hooks/use-mobile";

interface HeaderProps {
  websites: Website[];
  selectedWebsite: Website | null;
  onWebsiteChange: (websiteId: string) => void;
  dateRange: string;
  onDateRangeChange: (range: string) => void;
  onMenuToggle: () => void;
}

const Header = ({
  websites,
  selectedWebsite,
  onWebsiteChange,
  dateRange,
  onDateRangeChange,
  onMenuToggle,
}: HeaderProps) => {
  const isMobile = useMobile();

  return (
    <header className="bg-white border-b border-border py-4 px-6 flex justify-between items-center sticky top-0 z-10">
      <div className="flex items-center gap-3 lg:hidden">
        <button onClick={onMenuToggle} className="text-muted-foreground">
          <span className="material-icons">menu</span>
        </button>
        <h1 className="text-xl font-medium font-google-sans">GA4 Insights</h1>
      </div>

      {/* Website Selector */}
      <div className={`${isMobile ? 'hidden' : 'flex'} md:flex items-center gap-2`}>
        <span className="material-icons text-muted-foreground">language</span>
        <Select value={selectedWebsite?.id?.toString() || ""} onValueChange={onWebsiteChange}>
          <SelectTrigger className="bg-white border border-border rounded-md w-[200px]">
            <SelectValue placeholder="Select a website" />
          </SelectTrigger>
          <SelectContent>
            {websites.map((website) => (
              <SelectItem key={website.id} value={website.id.toString()}>
                {website.domain}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center gap-2">
        <span className="material-icons text-muted-foreground">date_range</span>
        <Select value={dateRange} onValueChange={onDateRangeChange}>
          <SelectTrigger className="bg-white border border-border rounded-md">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="custom">Custom range</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </header>
  );
};

export default Header;
