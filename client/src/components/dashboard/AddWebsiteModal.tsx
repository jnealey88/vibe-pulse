import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Website } from "@/types/metric";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof WebsiteFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
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
              />
              {errors.gaPropertyId && <p className="text-red-500 text-sm">{errors.gaPropertyId}</p>}
              <p className="text-xs text-muted-foreground">
                You can find your GA4 property ID in your Google Analytics account under Admin &gt; Property Settings.
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