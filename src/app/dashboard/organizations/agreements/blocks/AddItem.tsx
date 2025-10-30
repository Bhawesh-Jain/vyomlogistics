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
import { addAgreement, updateAgreement, getAgreementById } from "@/lib/actions/organizations";
import { getAllOrganizations } from "@/lib/actions/organizations";
import { Agreement, Organization } from "@/lib/repositories/organizationRepository";

// Zod schema for organization_agreements table
const formSchema = z.object({
  org_id: z.string().min(1, 'Select organization'),
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

export type AgreementFormValues = z.infer<typeof formSchema>;

export default function AddOrganizationAgreement({
  setForm,
  setReload,
  agreementId,
}: {
  setForm: (form: boolean) => void,
  setReload: (reload: boolean) => void,
  agreementId?: number | null,
}) {

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [agreementData, setAgreementData] = useState<Agreement | null>(null);
  const [organizationsData, setOrganizationsData] = useState<Organization[]>([]);
  const { toast } = useToast();

  const form = useForm<AgreementFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      org_id: '',
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
    if (agreementId) {
      (async () => {
        setDataLoading(true);
        try {
          const result = await getAgreementById(agreementId);          

          if (result.success) {
            const agreement = result.result;
            setAgreementData(agreement);

            // Reset form with fetched data
            form.reset({
              org_id: agreement.org_id?.toString() ?? '',
              start_date: agreement.start_date ? new Date(agreement.start_date) : new Date(),
              valid_upto: agreement.valid_upto ? new Date(agreement.valid_upto) : new Date(),
              duration: agreement.duration?.toString() ?? '',
              status: agreement.status?.toString() ?? '1'
            });
          } else {
            toast({
              title: "Error",
              description: result.error || "Agreement not found",
              variant: "destructive"
            });
          }
        } catch (error: any) {
          toast({
            title: "Error",
            description: error?.message || "Failed to fetch agreement data",
            variant: "destructive"
          });
        } finally {
          setDataLoading(false);
        }
      })();
    }
  }, [agreementId]);

  async function onSubmit(data: AgreementFormValues) {
    setLoading(true);
    try {
      const result = agreementId
        ? await updateAgreement(agreementId, data)
        : await addAgreement(data);

      if (result.success) {
        toast({
          title: "Request Successful",
          description: agreementId ? "Agreement updated successfully!" : "Agreement added successfully!",
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
                {agreementId ? "Update Agreement" : "Add Agreement"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}