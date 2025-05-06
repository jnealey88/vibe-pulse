import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ga4Service from "@/lib/ga4-service";
import { useQueryClient } from "@tanstack/react-query";

interface GenerateReportProps {
  websiteId: number | null;
}

const GenerateReport = ({ websiteId }: GenerateReportProps) => {
  const [query, setQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!websiteId) {
      toast({
        title: "No website selected",
        description: "Please select a website first",
        variant: "destructive",
      });
      return;
    }
    
    if (!query.trim()) {
      toast({
        title: "Empty query",
        description: "Please enter a question or request",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsGenerating(true);
      const result = await ga4Service.generateReport(websiteId, query);
      
      // Invalidate reports queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      
      toast({
        title: "Report generation started",
        description: "Your report is being generated and will be available soon",
      });
      
      // Reset form
      setQuery("");
    } catch (error) {
      toast({
        title: "Failed to generate report",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mt-12 bg-primary bg-opacity-5 rounded-lg p-6 border border-primary border-opacity-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h3 className="text-xl font-medium font-google-sans mb-2">Need a custom report?</h3>
          <p className="text-muted-foreground">
            Use AI to generate reports based on specific metrics or questions about your data.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="w-full md:w-auto">
          <div className="flex">
            <Input
              type="text"
              placeholder="E.g., Why is my mobile conversion rate dropping?"
              className="flex-grow rounded-r-none border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isGenerating || !websiteId}
            />
            <Button 
              type="submit" 
              className="rounded-l-none flex items-center"
              disabled={isGenerating || !websiteId}
            >
              <span className="material-icons mr-2">auto_awesome</span>
              Generate
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenerateReport;
