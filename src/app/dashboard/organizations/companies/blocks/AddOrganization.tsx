'use client'

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Loading from "@/app/dashboard/loading";
import { DefaultFormTextField, DefaultFormTextArea, DefaultFormDatePicker, DefaultFormSelect } from "@/components/ui/default-form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, MapPin, Phone, User, Calendar } from "lucide-react";
import { addOrganization, updatedOrganization, getOrganizationById } from "@/lib/actions/organizations";
import { getAllCompanies } from "@/lib/actions/settings";
import { Company } from "@/lib/repositories/companyRepository";

// Zod schema for organizations table
const formSchema = z.object({
  org_name: z.string().min(1, 'Enter organization name'),
  company_id: z.string().min(1, 'Select a company'),
  contact_person: z.string().min(1, 'Enter contact person name'),
  contact_number: z.string().min(10, 'Enter valid contact number').max(15, 'Contact number too long'),
  location: z.string().min(1, 'Enter location'),
  pincode: z.string().min(1, 'Enter pincode').max(8, 'Pincode must be 8 characters or less'),
  signed_on: z.date(),
  status: z.enum(['1', '0']).default('1')
});

export type OrganizationFormValues = z.infer<typeof formSchema>;

export default function AddOrganization({
  setForm,
  setReload,
  organizationId
}: {
  setForm: (form: boolean) => void,
  setReload: (reload: boolean) => void,
  organizationId?: number | null
}) {

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [companyData, setCompanyData] = useState<Company[]>([]);
  const [organizationData, setOrganizationData] = useState<any>(null);
  const { toast } = useToast();

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      org_name: '',
      contact_person: '',
      company_id: '',
      contact_number: '',
      location: '',
      pincode: '',
      signed_on: new Date(),
      status: '1'
    },
  });

  useEffect(() => {
    (async () => {
      const companies = await getAllCompanies();

      if (companies.success) {
        const formattedData = companies.result.map((item: Company) => ({
          label: item.company_name,
          value: item.company_id.toString(),
        }));

        setCompanyData(formattedData);
      }
    })();
    if (organizationId) {
      (async () => {
        setDataLoading(true);
        try {
          const result = await getOrganizationById({ id: organizationId });


          if (result.success) {
            const organization = result.result;
            setOrganizationData(organization);

            // Reset form with fetched data
            form.reset({
              org_name: organization.org_name ?? '',
              company_id: organization.company_id?.toString() ?? '',
              contact_person: organization.contact_person ?? '',
              contact_number: organization.contact_number ?? '',
              location: organization.location ?? '',
              pincode: organization.pincode ?? '',
              signed_on: organization.signed_on ? new Date(organization.signed_on) : new Date(),
              status: organization.status?.toString() ?? '1'
            });
          } else {
            toast({
              title: "Error",
              description: result.error || "Organization not found",
              variant: "destructive"
            });
          }
        } catch (error: any) {
          toast({
            title: "Error",
            description: error?.message || "Failed to fetch organization data",
            variant: "destructive"
          });
        } finally {
          setDataLoading(false);
        }
      })();
    }
  }, [organizationId]);

  async function onSubmit(data: OrganizationFormValues) {
    setLoading(true);
    try {
      const result = organizationId
        ? await updatedOrganization(organizationId, data)
        : await addOrganization(data);

      if (result.success) {
        toast({
          title: "Request Successful",
          description: organizationId ? "Organization updated successfully!" : "Organization added successfully!",
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

            {/* Organization Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" /> Organization Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <DefaultFormTextField
                    form={form}
                    name="org_name"
                    label="Organization Name"
                    placeholder="Enter organization name"
                  />
                </div>
                <div className="md:col-span-2">
                  <DefaultFormSelect
                    form={form}
                    name="company_id"
                    label="Company"
                    placeholder="Select a company"
                    options={companyData}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" /> Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DefaultFormTextField
                  form={form}
                  name="contact_person"
                  label="Contact Person"
                  placeholder="Enter contact person name"
                />
                <DefaultFormTextField
                  form={form}
                  name="contact_number"
                  label="Contact Number"
                  placeholder="Enter contact number"
                />
              </CardContent>
            </Card>

            {/* Location Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" /> Location Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DefaultFormTextArea
                  form={form}
                  name="location"
                  label="Location"
                  placeholder="Enter complete location/address"
                  className="resize-none"
                />
                <DefaultFormTextField
                  form={form}
                  name="pincode"
                  label="Pincode"
                  placeholder="Enter pincode"
                />
              </CardContent>
            </Card>

            {/* Agreement Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" /> Agreement Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DefaultFormDatePicker
                  form={form}
                  name="signed_on"
                  label="Signing Date"
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
                {organizationId ? "Update Organization" : "Add Organization"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}