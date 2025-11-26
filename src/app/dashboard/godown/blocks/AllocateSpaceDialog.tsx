"use client"

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DefaultFormTextField, DefaultFormSelect, DefaultFormDatePicker, SpinnerItem } from "@/components/ui/default-form-field";
import { getActiveAgreements, getAllOrganizations } from "@/lib/actions/organizations";
import { Agreement, Organization } from "@/lib/repositories/organizationRepository";
import { useEffect } from "react";
import { allocateSpace } from "@/lib/actions/warehouse";
import formatDate from "@/lib/utils/date";

const allocationSchema = z.object({
  org_id: z.string().min(1, 'Select company'),
  space_allocated: z.string().min(1, 'Enter area').refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Must be a positive number'),
  monthly_rent: z.string().min(1, 'Enter monthly rent').refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Must be a positive number'),
  agreement_id: z.string().optional(),
});

export type AllocationFormValues = z.infer<typeof allocationSchema>;

interface AllocateSpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  godownId: number;
  onSuccess: () => void;
}

export default function AllocateSpaceDialog({ open, onOpenChange, godownId, onSuccess }: AllocateSpaceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<SpinnerItem[]>([]);
  const [agreements, setAgreements] = useState<SpinnerItem[]>([]);
  const { toast } = useToast();

  const form = useForm<AllocationFormValues>({
    resolver: zodResolver(allocationSchema),
    defaultValues: {
      org_id: '',
      space_allocated: '',
      monthly_rent: '',
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
    const agreementRes = await getActiveAgreements();
    if (orgs.success) {
      const formattedData = orgs.result.map((item: Organization) => ({
        label: item.org_name,
        value: item.org_id.toString(),
      }));
      setOrganizations(formattedData);
    }
    if (agreementRes.success) {
      const formattedData = agreementRes.result.map((item: Agreement) => ({
        label: item.org_name + " " + formatDate(item.created_on),
        value: item.agreement_id.toString(),
      }));
      setAgreements(formattedData);
    }
  };

  async function onSubmit(data: AllocationFormValues) {
    setLoading(true);
    try {
      const result = await allocateSpace(data, godownId);

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

        <Form {...form} >
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DefaultFormSelect
                form={form}
                name="org_id"
                label="Company"
                placeholder="Select company"
                options={organizations}
              />
              <DefaultFormTextField
                form={form}
                name="space_allocated"
                label="Area"
                placeholder="Enter area in sqft"
              />
              <DefaultFormTextField
                form={form}
                name="monthly_rent"
                label="Monthly Rent"
                placeholder="Enter monthly rent"
              />
              <DefaultFormSelect
                form={form}
                name="agreement_id"
                label="Agreement (Optional)"
                placeholder="Select agreement"
                options={agreements}
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