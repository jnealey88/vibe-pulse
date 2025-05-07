import { useState } from 'react';
import { InsightImplementationPlan, InsightImplementationStep } from '@/types/insight';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  ChevronRight, 
  ChevronDown, 
  ChevronLeft,
  Clock, 
  ArrowDown, 
  BarChart, 
  Link, 
  Download,
  CheckCircle2,
  Printer
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface ImplementationPlanDetailProps {
  plan: InsightImplementationPlan;
  onBack: () => void;
}

const ImplementationPlanDetail = ({ plan, onBack }: ImplementationPlanDetailProps) => {
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (stepNumber: number) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepNumber]: !prev[stepNumber]
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
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

  const getEffortColor = (effort: string) => {
    switch (effort.toLowerCase()) {
      case 'difficult':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  const handleExport = () => {
    // Create a printable version of the plan
    const planContent = `
# ${plan.title}

## Summary
${plan.summary}

## Implementation Steps

${plan.steps.map(step => `
### Step ${step.stepNumber}: ${step.title}
- Priority: ${step.priority}
- Effort: ${step.effort}
- Estimated Time: ${step.estimatedTime}
- Dependencies: ${step.dependencies ? step.dependencies.map(d => `Step ${d}`).join(', ') : 'None'}

${step.description}

${step.resources && step.resources.length > 0 ? 
  `Resources:\n${step.resources.map(r => `- ${r}`).join('\n')}` : 
  ''
}
`).join('\n')}
    `;

    // Create blob and download
    const blob = new Blob([planContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plan.title.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Plans
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{plan.title}</CardTitle>
          <CardDescription className="mt-2">{plan.summary}</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="steps" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="steps">Implementation Steps</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="steps" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <ScrollArea className="h-[70vh] pr-4">
                <div className="space-y-4">
                  {plan.steps.map((step) => (
                    <Collapsible
                      key={step.stepNumber}
                      open={expandedSteps[step.stepNumber]}
                      onOpenChange={() => toggleStep(step.stepNumber)}
                      className="border rounded-lg"
                    >
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg">
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium mr-3">
                            {step.stepNumber}
                          </div>
                          <div className="text-left">
                            <div className="font-medium">{step.title}</div>
                            <div className="flex gap-2 mt-1">
                              <Badge className={getPriorityColor(step.priority)}>
                                {step.priority} Priority
                              </Badge>
                              <Badge className={getEffortColor(step.effort)}>
                                {step.effort} Effort
                              </Badge>
                              <Badge variant="outline">
                                <Clock className="h-3 w-3 mr-1" /> {step.estimatedTime}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {expandedSteps[step.stepNumber] ? (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-4 pt-0 border-t">
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
                          {step.description}
                        </p>
                        
                        {step.dependencies && step.dependencies.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2">Dependencies</h4>
                            <div className="flex flex-wrap gap-2">
                              {step.dependencies.map((depId) => (
                                <Badge key={depId} variant="outline" className="cursor-pointer"
                                  onClick={() => {
                                    setExpandedSteps(prev => ({
                                      ...prev,
                                      [depId]: true
                                    }));
                                    // Scroll to dependency
                                    document.getElementById(`step-${depId}`)?.scrollIntoView({
                                      behavior: 'smooth',
                                      block: 'center'
                                    });
                                  }}
                                >
                                  <ArrowDown className="h-3 w-3 mr-1" /> Step {depId}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {step.resources && step.resources.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2">Resources</h4>
                            <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300 space-y-1">
                              {step.resources.map((resource, idx) => (
                                <li key={idx} className="flex items-start">
                                  <Link className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                                  <span>{resource}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="mt-4 pt-3 border-t flex justify-end">
                          <Button variant="outline" size="sm">
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Mark as Complete
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Implementation Overview</h3>
              <Table>
                <TableCaption>Complete implementation plan breakdown for {plan.title}</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">#</TableHead>
                    <TableHead>Step</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Effort</TableHead>
                    <TableHead>Est. Time</TableHead>
                    <TableHead>Dependencies</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plan.steps.map((step) => (
                    <TableRow 
                      key={step.stepNumber}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                      onClick={() => {
                        toggleStep(step.stepNumber);
                        // Switch to steps tab
                        const stepsTab = document.querySelector('[data-value="steps"]') as HTMLElement;
                        if (stepsTab) stepsTab.click();
                      }}
                    >
                      <TableCell className="font-medium">{step.stepNumber}</TableCell>
                      <TableCell>{step.title}</TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(step.priority)}>
                          {step.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getEffortColor(step.effort)}>
                          {step.effort}
                        </Badge>
                      </TableCell>
                      <TableCell>{step.estimatedTime}</TableCell>
                      <TableCell>
                        {step.dependencies && step.dependencies.length > 0
                          ? step.dependencies.map(d => `Step ${d}`).join(', ')
                          : 'None'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImplementationPlanDetail;