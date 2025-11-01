'use client'

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Loading from "@/app/dashboard/loading";
import { DefaultFormTextField, DefaultFormSelect, DefaultFormTextArea } from "@/components/ui/default-form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Warehouse, MapPin, DollarSign, Ruler } from "lucide-react";
import { addGodown, updateGodown, getGodownById } from "@/lib/actions/warehouse";
import { getAllOrganizations } from "@/lib/actions/organizations";
import { Organization } from "@/lib/repositories/organizationRepository";

const formSchema = z.object({
  org_id: z.string().min(1, 'Select organization'),
  godown_name: z.string().min(1, 'Enter godown name'),
  location: z.string().min(1, 'Enter location'),
  pincode: z.string().min(1, 'Enter pincode'),
  total_capacity: z.string().min(1, 'Enter total capacity').refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Must be a positive number'),
  capacity_unit: z.enum(['sqft', 'sqm']).default('sqft'),
  monthly_rent: z.string().min(1, 'Enter monthly rent').refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, 'Must be a non-negative number'),
  currency: z.string().min(1, 'Enter currency').default('INR'),
  description: z.string().optional(),
  is_active: z.enum(['1', '0']).default('1')
});

export type GodownFormValues = z.infer<typeof formSchema>;

export default function AddGodown({
  setForm,
  setReload,
  godownId,
}: {
  setForm: (form: boolean) => void,
  setReload: (reload: boolean) => void,
  godownId?: number | null,
}) {
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [godownData, setGodownData] = useState<any>(null);
  const [organizationsData, setOrganizationsData] = useState<Organization[]>([]);
  const { toast } = useToast();

  const form = useForm<GodownFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      org_id: '',
      godown_name: '',
      location: '',
      pincode: '',
      total_capacity: '',
      capacity_unit: 'sqft',
      monthly_rent: '',
      currency: 'INR',
      description: '',
      is_active: '1'
    },
  });

  useEffect(() => {
    (async () => {
      const organizations = await getAllOrganizations();
      if (organizations.success) {
        const formattedData = organizations.result.map((item: Organization) => ({
          label: item.org_name,
          value: item.org_id.toString(),
        }));
        setOrganizationsData(formattedData);
      }
    })();

    if (godownId) {
      (async () => {
        setDataLoading(true);
        try {
          const result = await getGodownById(godownId);          
          if (result.success) {
            const godown = result.result;
            setGodownData(godown);

            form.reset({
              org_id: godown.org_id?.toString() ?? '',
              godown_name: godown.godown_name ?? '',
              location: godown.location ?? '',
              pincode: godown.pincode ?? '',
              total_capacity: godown.total_capacity?.toString() ?? '',
              capacity_unit: godown.capacity_unit as 'sqft' | 'sqm' ?? 'sqft',
              monthly_rent: godown.monthly_rent?.toString() ?? '',
              currency: godown.currency ?? 'INR',
              description: godown.description ?? '',
              is_active: godown.is_active?.toString() as '1' | '0' ?? '1'
            });
          } else {
            toast({
              title: "Error",
              description: result.error || "Godown not found",
              variant: "destructive"
            });
          }
        } catch (error: any) {
          toast({
            title: "Error",
            description: error?.message || "Failed to fetch godown data",
            variant: "destructive"
          });
        } finally {
          setDataLoading(false);
        }
      })();
    }
  }, [godownId]);

  async function onSubmit(data: GodownFormValues) {
    setLoading(true);
    try {
      const result = godownId
        ? await updateGodown(godownId, data)
        : await addGodown(data);

      if (result.success) {
        toast({
          title: "Request Successful",
          description: godownId ? "Godown updated successfully!" : "Godown added successfully!",
        });
        form.reset();
        setForm(false);
        setReload(true);
      } else {
        toast({
          title: "Error",
          description: result.error || "Operation failed",
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
    <div>
      {loading || dataLoading ? (
        <Loading />
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Organization Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Warehouse className="h-5 w-5" /> Godown Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DefaultFormSelect
                  form={form}
                  name="org_id"
                  label="Organization"
                  placeholder="Select organization"
                  options={organizationsData}
                />
                <DefaultFormTextField
                  form={form}
                  name="godown_name"
                  label="Godown Name"
                  placeholder="Enter godown name"
                />
                <DefaultFormTextField
                  form={form}
                  name="location"
                  label="Location"
                  placeholder="Enter location"
                />
                <DefaultFormTextField
                  form={form}
                  name="pincode"
                  label="Pincode"
                  placeholder="Enter pincode"
                />
              </CardContent>
            </Card>

            {/* Capacity & Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="h-5 w-5" /> Capacity & Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DefaultFormTextField
                  form={form}
                  name="total_capacity"
                  label="Total Capacity"
                  placeholder="Enter total capacity"
                />
                <DefaultFormSelect
                  form={form}
                  name="capacity_unit"
                  label="Capacity Unit"
                  options={[
                    { label: 'Square Feet', value: 'sqft' },
                    { label: 'Square Meters', value: 'sqm' }
                  ]}
                />
                <DefaultFormTextField
                  form={form}
                  name="monthly_rent"
                  label="Monthly Rent"
                  placeholder="Enter monthly rent"
                />
                <DefaultFormTextField
                  form={form}
                  name="currency"
                  label="Currency"
                  placeholder="e.g., INR, USD"
                />
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" /> Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DefaultFormTextArea
                  form={form}
                  name="description"
                  label="Description"
                  placeholder="Enter any additional details about the godown..."
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="lg">
                {godownId ? "Update Godown" : "Add Godown"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}