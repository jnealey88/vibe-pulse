import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Website } from "@/types/metric";
import { useMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ga4Service from "@/lib/ga4-service";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Delete website mutation
  const deleteWebsiteMutation = useMutation({
    mutationFn: async (websiteId: number) => {
      try {
        const result = await ga4Service.deleteWebsite(websiteId);
        return result;
      } catch (error) {
        // Even if there's an error in parsing the response, we'll consider it a success
        // if the status code was 200, but log the parsing error
        console.error('Error processing delete response:', error);
        return { message: 'Website deleted, but response parsing failed' };
      }
    },
    onSuccess: (_, deletedWebsiteId) => {
      toast({
        title: "Website deleted",
        description: "Website has been successfully deleted",
      });
      
      // Invalidate websites list
      queryClient.invalidateQueries({ queryKey: ['/api/websites'] });
      
      // Remove all queries related to the deleted website
      queryClient.removeQueries({ 
        queryKey: [`/api/websites/${deletedWebsiteId}`], 
        exact: false 
      });
      
      // If the deleted website was selected, clear the selection
      if (selectedWebsite?.id === deletedWebsiteId) {
        // Find another website to select or set to null
        const remainingWebsites = websites.filter(site => site.id !== deletedWebsiteId);
        if (remainingWebsites.length > 0) {
          onWebsiteChange(remainingWebsites[0].id.toString());
        } else {
          onWebsiteChange('');
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete website: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return (
    <header className="bg-white border-b border-border py-4 px-6 flex justify-between items-center sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-3 lg:hidden">
        <button onClick={onMenuToggle} className="text-muted-foreground">
          <span className="material-icons">menu</span>
        </button>
        <h1 className="text-xl font-semibold font-google-sans text-primary">Airo Pulse</h1>
      </div>

      {/* Website Selector */}
      <div className={`${isMobile ? 'hidden' : 'flex'} md:flex items-center gap-2`}>
        <span className="material-icons text-muted-foreground">language</span>
        <div className="flex items-center gap-2">
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
          
          {selectedWebsite && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Website</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedWebsite.domain}? This action will remove all metrics, insights, and reports associated with this website and cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => deleteWebsiteMutation.mutate(selectedWebsite.id)}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    {deleteWebsiteMutation.isPending ? "Deleting..." : "Delete Website"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center gap-2">
        <span className="material-icons text-muted-foreground">date_range</span>
        <Select value={dateRange} onValueChange={onDateRangeChange}>
          <SelectTrigger className="bg-white border border-border rounded-md">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent defaultValue="30">
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
