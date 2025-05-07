import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Insight, InsightImplementationPlan } from '@/types/insight';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import ga4Service from '@/lib/ga4-service';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GenerateImplementationPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  websiteId: number;
  insights: Insight[];
  onPlanGenerated: (plan: InsightImplementationPlan) => void;
}

const GenerateImplementationPlanModal = ({
  isOpen,
  onClose,
  websiteId,
  insights,
  onPlanGenerated,
}: GenerateImplementationPlanModalProps) => {
  const [selectedInsightIds, setSelectedInsightIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInsightToggle = (insightId: number) => {
    setSelectedInsightIds((prev) => {
      if (prev.includes(insightId)) {
        return prev.filter((id) => id !== insightId);
      } else {
        return [...prev, insightId];
      }
    });
  };

  const handleGeneratePlan = async () => {
    if (selectedInsightIds.length === 0) {
      toast({
        title: 'No insights selected',
        description: 'Please select at least one insight to generate an implementation plan.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const plan = await ga4Service.generateImplementationPlan(websiteId, selectedInsightIds);
      toast({
        title: 'Implementation plan generated',
        description: 'Your implementation plan has been successfully created.',
      });
      onPlanGenerated(plan);
      onClose();
    } catch (error) {
      console.error('Error generating implementation plan:', error);
      toast({
        title: 'Failed to generate plan',
        description: 'There was an error generating the implementation plan. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Generate Implementation Plan</DialogTitle>
          <DialogDescription>
            Select insights to include in your implementation plan. AI will generate a step-by-step 
            action plan with priorities, effort estimates, and dependencies.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden mt-4">
          <ScrollArea className="h-[50vh]">
            <div className="space-y-4 pr-4">
              {insights.length > 0 ? (
                insights.map((insight) => (
                  <div
                    key={insight.id}
                    className={cn(
                      "p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors",
                      selectedInsightIds.includes(insight.id) && "border-primary"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={`insight-${insight.id}`}
                        checked={selectedInsightIds.includes(insight.id)}
                        onCheckedChange={() => handleInsightToggle(insight.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor={`insight-${insight.id}`}
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            {insight.title}
                          </label>
                          <div className="flex gap-2">
                            <Badge variant="outline">{insight.category}</Badge>
                            <Badge className={getImpactColor(insight.impact)}>{insight.impact} Impact</Badge>
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-6">
                  <p className="text-gray-500 dark:text-gray-400">
                    No insights available. Generate insights first to create an implementation plan.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <Separator className="my-4" />

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {selectedInsightIds.length} insights selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleGeneratePlan} disabled={selectedInsightIds.length === 0 || isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Plan...
                  </>
                ) : (
                  'Generate Implementation Plan'
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateImplementationPlanModal;