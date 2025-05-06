import { InsightFilters } from "@/types/insight";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface InsightsFilterProps {
  filters: InsightFilters;
  onFilterChange: (name: keyof InsightFilters, value: string) => void;
}

const InsightsFilter = ({ filters, onFilterChange }: InsightsFilterProps) => {
  return (
    <div className="flex gap-3 flex-wrap sm:flex-nowrap">
      <div className="relative w-full sm:w-auto">
        <Select
          value={filters.category}
          onValueChange={(value) => onFilterChange("category", value)}
        >
          <SelectTrigger className="bg-white border border-border rounded-md w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Categories">All Categories</SelectItem>
            <SelectItem value="Traffic">Traffic</SelectItem>
            <SelectItem value="Conversion">Conversion</SelectItem>
            <SelectItem value="Performance">Performance</SelectItem>
            <SelectItem value="Content">Content</SelectItem>
            <SelectItem value="User Experience">User Experience</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="relative w-full sm:w-auto">
        <Select
          value={filters.impact}
          onValueChange={(value) => onFilterChange("impact", value)}
        >
          <SelectTrigger className="bg-white border border-border rounded-md w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by impact" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Impacts">All Impacts</SelectItem>
            <SelectItem value="High">High Impact</SelectItem>
            <SelectItem value="Medium">Medium Impact</SelectItem>
            <SelectItem value="Low">Low Impact</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default InsightsFilter;
