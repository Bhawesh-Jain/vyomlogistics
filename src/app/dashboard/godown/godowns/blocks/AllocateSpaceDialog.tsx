"use client"

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DefaultFormTextField, DefaultFormSelect, DefaultFormDatePicker } from "@/components/ui/default-form-field";
import { allocateSpace } from "@/lib/actions/warehouse";
import { getAllOrganizations } from "@/lib/actions/organizations";
import { Organization } from "@/lib/repositories/organizationRepository";
import { useEffect } from "react";

const allocationSchema = z.object({
  allocated_to_org_id: z.string().min(1, 'Select company'),
  space_name: z.string().min(1, 'Enter space name'),
  space_code: z.string().min(1, 'Enter space code'),
  allocated_area: z.string().min(1, 'Enter area').refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Must be a positive number'),
  monthly_rent: z.string().min(1, 'Enter monthly rent').refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Must be a positive number'),
  allocation_start_date: z.date(),
  allocation_end_date: z.date(),
  agreement_id: z.string().optional(),
});

type AllocationFormValues = z.infer<typeof allocationSchema>;

interface AllocateSpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  godownId: number;
  onSuccess: () => void;
}

export default function AllocateSpaceDialog({ open, onOpenChange, godownId, onSuccess }: AllocateSpaceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<{label: string; value: string}[]>([]);
  const { toast } = useToast();

  const form = useForm<AllocationFormValues>({
    resolver: zodResolver(allocationSchema),
    defaultValues: {
      space_name: '',
      space_code: '',
      allocated_area: '',
      monthly_rent: '',
      allocation_start_date: new Date(),
      allocation_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      agreement_id: '',
    },
  });

  useEffect(() => {
    if (open) {
      loadOrganizations();
    }
  }, [open]);

  const loadOrganizations = async () => {
    const orgs = await getAllOrganizations();
    if (orgs.success) {
      const formattedData = orgs.result.map((item: Organization) => ({
        label: item.org_name,
        value: item.org_id.toString(),
      }));
      setOrganizations(formattedData);
    }
  };

  async function onSubmit(data: AllocationFormValues) {
    setLoading(true);
    try {
      const result = await allocateSpace({
        ...data,
        godown_id: godownId,
      });

      if (result.success) {
        onSuccess();
        form.reset();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to allocate space",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Allocate Space</DialogTitle>
          <DialogDescription>
            Assign space in this godown to a company. The space will be tracked for utilization and billing.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DefaultFormSelect
                form={form}
                name="allocated_to_org_id"
                label="Company"
                placeholder="Select company"
                options={organizations}
              />
              <DefaultFormTextField
                form={form}
                name="space_name"
                label="Space Name"
                placeholder="e.g., Section A, Bay 1"
              />
              <DefaultFormTextField
                form={form}
                name="space_code"
                label="Space Code"
                placeholder="e.g., A1, B2"
              />
              <DefaultFormTextField
                form={form}
                name="allocated_area"
                label="Area"
                placeholder="Enter area in sqft"
              />
              <DefaultFormTextField
                form={form}
                name="monthly_rent"
                label="Monthly Rent"
                placeholder="Enter monthly rent"
              />
              <DefaultFormDatePicker
                form={form}
                name="allocation_start_date"
                label="Start Date"
              />
              <DefaultFormDatePicker
                form={form}
                name="allocation_end_date"
                label="End Date"
              />
              <DefaultFormSelect
                form={form}
                name="agreement_id"
                label="Agreement (Optional)"
                placeholder="Select agreement"
                options={[]} // You can populate this with active agreements
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Allocating..." : "Allocate Space"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}