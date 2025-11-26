'use client'

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Loading from "@/app/dashboard/loading";
import { DefaultFormTextField, DefaultFormSelect, DefaultFormDatePicker } from "@/components/ui/default-form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck, Building2, Calendar, Clock } from "lucide-react";
import { addLicense, updateLicense, getLicenseById } from "@/lib/actions/organizations";
import { getAllOrganizations } from "@/lib/actions/organizations";
import { License, Organization } from "@/lib/repositories/organizationRepository";

// Zod schema for organization_licenses table
const formSchema = z.object({
  org_id: z.string().min(1, 'Select organization'),
  business_type: z.string().min(1, 'Enter business type'),
  licence_no: z.string().min(1, 'Enter licence number'),
  start_date: z.date(),
  valid_upto: z.date(),
  duration: z.string().min(1, 'Enter duration in months'),
  status: z.enum(['1', '0']).default('1')
}).refine((data) => {
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.valid_upto);
  return endDate > startDate;
}, {
  message: "Valid until date must be after start date",
  path: ["valid_upto"]
});

export type LicenseFormValues = z.infer<typeof formSchema>;

export default function AddOrganizationLicense({
  setForm,
  setReload,
  licenseId,
}: {
  setForm: (form: boolean) => void,
  setReload: (reload: boolean) => void,
  licenseId?: number | null,
}) {

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [licenseData, setLicenseData] = useState<License | null>(null);
  const [organizationsData, setOrganizationsData] = useState<Organization[]>([]);
  const { toast } = useToast();

  const form = useForm<LicenseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      org_id: '',
      business_type: '',
      licence_no: '',
      start_date: new Date(),
      valid_upto: new Date(),
      duration: '',
      status: '1'
    },
  });

  // Calculate duration when dates change
  const watchStartDate = form.watch('start_date');
  const watchValidUpto = form.watch('valid_upto');

  useEffect(() => {
    if (watchStartDate && watchValidUpto) {
      const start = new Date(watchStartDate);
      const end = new Date(watchValidUpto);

      if (end > start) {
        const months = (end.getFullYear() - start.getFullYear()) * 12 +
          (end.getMonth() - start.getMonth());
        form.setValue('duration', months.toString());
      }
    }
  }, [watchStartDate, watchValidUpto]);


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
    if (licenseId) {
      (async () => {
        setDataLoading(true);
        try {
          const result = await getLicenseById(licenseId);          

          if (result.success) {
            const license = result.result;
            setLicenseData(license);

            // Reset form with fetched data
            form.reset({
              org_id: license.org_id?.toString() ?? '',
              business_type: license.business_type ?? '',
              licence_no: license.licence_no ?? '',
              start_date: license.start_date ? new Date(license.start_date) : new Date(),
              valid_upto: license.valid_upto ? new Date(license.valid_upto) : new Date(),
              duration: license.duration?.toString() ?? '',
              status: license.status?.toString() ?? '1'
            });
          } else {
            toast({
              title: "Error",
              description: result.error || "License not found",
              variant: "destructive"
            });
          }
        } catch (error: any) {
          toast({
            title: "Error",
            description: error?.message || "Failed to fetch license data",
            variant: "destructive"
          });
        } finally {
          setDataLoading(false);
        }
      })();
    }
  }, [licenseId]);

  async function onSubmit(data: LicenseFormValues) {
    setLoading(true);
    try {
      const result = licenseId
        ? await updateLicense(licenseId, data)
        : await addLicense(data);

      if (result.success) {
        toast({
          title: "Request Successful",
          description: licenseId ? "License updated successfully!" : "License added successfully!",
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
                  <Building2 className="h-5 w-5" /> Organization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DefaultFormSelect
                  form={form}
                  name="org_id"
                  label="Select Organization"
                  placeholder="Choose an organization"
                  options={organizationsData}
                />
              </CardContent>
            </Card>

            {/* License Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" /> License Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DefaultFormTextField
                  form={form}
                  name="business_type"
                  label="License Type"
                  placeholder="e.g., Transportation, Logistics"
                />
                <DefaultFormTextField
                  form={form}
                  name="licence_no"
                  label="License Number"
                  placeholder="Enter license number"
                />
              </CardContent>
            </Card>

            {/* Validity Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" /> Validity Period
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DefaultFormDatePicker
                  form={form}
                  name="start_date"
                  label="Start Date"
                />
                <DefaultFormDatePicker
                  form={form}
                  name="valid_upto"
                  label="Valid Until"
                />
                <DefaultFormTextField
                  form={form}
                  name="duration"
                  label="Duration (Months)"
                  placeholder="Auto-calculated"
                  disabled={true}
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
                {licenseId ? "Update License" : "Add License"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}