import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Website } from "@/types/metric";
import ga4Service from "@/lib/ga4-service";
import { Loader2 } from "lucide-react";

// Type for GA4 properties
interface GA4Property {
  accountName: string;
  propertyName: string;
  propertyId: string;
  domain: string;
}

// Validation schema
const websiteSchema = z.object({
  name: z.string().min(1, "Website name is required"),
  domain: z.string().min(1, "Domain is required"),
  gaPropertyId: z.string().min(1, "GA4 Property ID is required"),
});

type WebsiteFormData = z.infer<typeof websiteSchema>;

interface AddWebsiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddWebsiteModal = ({ isOpen, onClose }: AddWebsiteModalProps) => {
  const [formData, setFormData] = useState<WebsiteFormData>({
    name: "",
    domain: "",
    gaPropertyId: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof WebsiteFormData, string>>>({});
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch GA4 properties when modal is opened
  const {
    data: ga4Properties = [],
    isLoading: isLoadingProperties,
    isError: isErrorProperties,
    error: propertiesError
  } = useQuery<GA4Property[]>({
    queryKey: ['/api/ga4-properties'],
    queryFn: ga4Service.getAvailableGa4Properties,
    enabled: isOpen,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const addWebsiteMutation = useMutation<Website, Error, WebsiteFormData>({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", "/api/websites", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Website added",
        description: "Your website has been successfully added",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/websites'] });
      resetForm();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to add website",
        description: error.message || "Something went wrong, please try again",
        variant: "destructive",
      });
    },
  });

  // When a property is selected, update the form
  useEffect(() => {
    if (selectedProperty) {
      const property = ga4Properties.find(prop => prop.propertyId === selectedProperty);
      if (property) {
        setFormData(prev => ({
          ...prev,
          name: prev.name || property.propertyName,
          domain: prev.domain || property.domain,
          gaPropertyId: property.propertyId
        }));
        
        // Clear errors for fields that are now filled
        setErrors(prev => ({
          ...prev,
          name: undefined,
          domain: undefined,
          gaPropertyId: undefined
        }));
      }
    }
  }, [selectedProperty, ga4Properties]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof WebsiteFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };
  
  const handlePropertyChange = (value: string) => {
    setSelectedProperty(value);
  };

  const validateForm = (): boolean => {
    try {
      websiteSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof WebsiteFormData, string>> = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof WebsiteFormData;
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      addWebsiteMutation.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      domain: "",
      gaPropertyId: "",
    });
    setErrors({});
    setSelectedProperty(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-google-sans text-xl">Add Website</DialogTitle>
          <DialogDescription>
            Enter your website details and Google Analytics 4 property ID to start tracking.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {/* GA4 Properties Dropdown */}
            <div className="grid gap-2">
              <Label htmlFor="ga4Property">Select Google Analytics 4 Property</Label>
              {isLoadingProperties ? (
                <div className="flex items-center space-x-2 h-9 px-3 py-2 border rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading properties...</span>
                </div>
              ) : isErrorProperties ? (
                <div className="text-red-500 text-sm p-2 border border-red-300 rounded-md bg-red-50">
                  Error loading GA4 properties: {propertiesError?.message || "Please try again"}
                </div>
              ) : ga4Properties.length === 0 ? (
                <div className="text-amber-500 text-sm p-2 border border-amber-300 rounded-md bg-amber-50">
                  No GA4 properties found. Make sure you have granted access to Google Analytics.
                </div>
              ) : (
                <Select value={selectedProperty || ""} onValueChange={handlePropertyChange}>
                  <SelectTrigger id="ga4Property" className={errors.gaPropertyId ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select a GA4 property" />
                  </SelectTrigger>
                  <SelectContent>
                    {ga4Properties.map((property) => (
                      <SelectItem key={property.propertyId} value={property.propertyId}>
                        {property.propertyName} ({property.accountName}) - {property.domain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-muted-foreground">
                Choose from your available GA4 properties. This will automatically fill in the details below.
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="name">Website Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="My Website"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                placeholder="example.com"
                className={errors.domain ? "border-red-500" : ""}
              />
              {errors.domain && <p className="text-red-500 text-sm">{errors.domain}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gaPropertyId">Google Analytics 4 Property ID</Label>
              <Input
                id="gaPropertyId"
                name="gaPropertyId"
                value={formData.gaPropertyId}
                onChange={handleChange}
                placeholder="G-XXXXXXXXXX"
                className={errors.gaPropertyId ? "border-red-500" : ""}
                readOnly={!!selectedProperty}
              />
              {errors.gaPropertyId && <p className="text-red-500 text-sm">{errors.gaPropertyId}</p>}
              <p className="text-xs text-muted-foreground">
                This ID uniquely identifies your GA4 property and is used to fetch analytics data.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={addWebsiteMutation.isPending}>
              {addWebsiteMutation.isPending ? "Adding..." : "Add Website"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddWebsiteModal;