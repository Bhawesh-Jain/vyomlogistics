'use client'

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Loading from "@/app/dashboard/loading";
import { DefaultFormTextField, DefaultFormTextArea } from "@/components/ui/default-form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Building2, MapPin, Phone, Globe, FileText } from "lucide-react";
import { zodPatterns } from "@/lib/utils/zod-patterns";
import { addCompany, updatedCompany, getCompanyById } from "@/lib/actions/settings";
import { Company } from "@/lib/repositories/companyRepository";

// Zod schema for company_master table
const formSchema = z.object({
  company_name: z.string().min(1, 'Enter company name'),
  abbr: z.string().min(1, 'Enter abbreviation').max(10, 'Abbreviation must be 10 characters or less'),
  currency: z.string().min(1, 'Enter currency'),
  currency_symbol: z.string().min(1, 'Enter currency symbol').max(1, 'Currency symbol must be 1 character'),
  phone: z.string().min(10, 'Enter valid phone number').max(15, 'Phone number too long'),
  email: z.string().email('Enter valid email address'),
  web_address: z.string().url('Enter valid URL').or(z.literal('')),
  logo_url: z.string().optional(),
  address: z.string().min(1, 'Enter address'),
  city: z.string().min(1, 'Enter city'),
  state: z.string().min(1, 'Enter state'),
  pincode: z.string().min(1, 'Enter pincode').max(8, 'Pincode must be 8 characters or less'),
  country: z.string().min(1, 'Enter country'),
  corporate_address: z.string().min(1, 'Enter corporate address'),
  corporate_phone: z.string().min(10, 'Enter valid corporate phone').max(15, 'Phone number too long'),
  company_description: z.string().optional(),
  is_active: z.enum(['1', '0']).default('1')
});

export type CompanyFormValues = z.infer<typeof formSchema>;

export default function AddCompany({
  setForm,
  setReload,
  companyId
}: {
  setForm: (form: boolean) => void,
  setReload: (reload: boolean) => void,
  companyId?: number | null
}) {

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [companyData, setCompanyData] = useState<any>(null);
  const { toast } = useToast();

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company_name: '',
      abbr: '',
      currency: 'INR',
      currency_symbol: '₹',
      phone: '',
      email: '',
      web_address: '',
      logo_url: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
      corporate_address: '',
      corporate_phone: '',
      company_description: '',
      is_active: '1'
    },
  });

  // Fetch company data if companyId is provided
  useEffect(() => {
    if (companyId) {
      (async () => {
        setDataLoading(true);
        try {
          const result = await getCompanyById(companyId);
          
          if (result.success && result.result.length > 0) {
            const company = result.result[0];
            setCompanyData(company);
            
            // Reset form with fetched data
            form.reset({
              company_name: company.company_name ?? '',
              abbr: company.abbr ?? '',
              currency: company.currency ?? 'INR',
              currency_symbol: company.currency_symbol ?? '₹',
              phone: company.phone ?? '',
              email: company.email ?? '',
              web_address: company.web_address ?? '',
              logo_url: company.logo_url ?? '',
              address: company.address ?? '',
              city: company.city ?? '',
              state: company.state ?? '',
              pincode: company.pincode ?? '',
              country: company.country ?? 'India',
              corporate_address: company.corporate_address ?? '',
              corporate_phone: company.corporate_phone ?? '',
              company_description: company.company_description ?? '',
              is_active: company.is_active?.toString() ?? '1'
            });
          } else {
            toast({
              title: "Error",
              description: result.error || "Company not found",
              variant: "destructive"
            });
          }
        } catch (error: any) {
          toast({
            title: "Error",
            description: error?.message || "Failed to fetch company data",
            variant: "destructive"
          });
        } finally {
          setDataLoading(false);
        }
      })();
    }
  }, [companyId]);

  async function onSubmit(data: CompanyFormValues) {
    setLoading(true);
    try {
      const result = companyId 
        ? await updatedCompany(companyId, data)
        : await addCompany(data);

      if (result.success) {
        toast({
          title: "Request Successful",
          description: companyId ? "Company updated successfully!" : "Company added successfully!",
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

            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" /> Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <DefaultFormTextField 
                  form={form} 
                  name="company_name" 
                  label="Company Name" 
                  placeholder="Enter company name" 
                />
                <DefaultFormTextField 
                  form={form} 
                  name="abbr" 
                  label="Abbreviation" 
                  placeholder="e.g., TPCL" 
                />
                <DefaultFormTextField 
                  form={form} 
                  name="currency" 
                  label="Currency" 
                  placeholder="e.g., INR" 
                />
                <DefaultFormTextField 
                  form={form} 
                  name="currency_symbol" 
                  label="Currency Symbol" 
                  placeholder="e.g., ₹" 
                />
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" /> Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DefaultFormTextField 
                  form={form} 
                  name="phone" 
                  label="Phone Number" 
                  placeholder="Enter phone number" 
                />
                <DefaultFormTextField 
                  form={form} 
                  name="email" 
                  label="Email Address" 
                  placeholder="Enter email address" 
                />
                <div className="md:col-span-2">
                  <DefaultFormTextField 
                    form={form} 
                    name="web_address" 
                    label="Website" 
                    placeholder="https://example.com" 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Registered Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" /> Registered Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DefaultFormTextArea 
                  form={form} 
                  name="address" 
                  label="Address" 
                  placeholder="Enter complete address" 
                  className="resize-none" 
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <DefaultFormTextField 
                    form={form} 
                    name="city" 
                    label="City" 
                    placeholder="Enter city" 
                  />
                  <DefaultFormTextField 
                    form={form} 
                    name="state" 
                    label="State" 
                    placeholder="Enter state" 
                  />
                  <DefaultFormTextField 
                    form={form} 
                    name="pincode" 
                    label="Pincode" 
                    placeholder="Enter pincode" 
                  />
                  <DefaultFormTextField 
                    form={form} 
                    name="country" 
                    label="Country" 
                    placeholder="Enter country" 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Corporate Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" /> Corporate Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DefaultFormTextArea 
                  form={form} 
                  name="corporate_address" 
                  label="Corporate Address" 
                  placeholder="Enter corporate address" 
                  className="resize-none" 
                />
                <DefaultFormTextField 
                  form={form} 
                  name="corporate_phone" 
                  label="Corporate Phone" 
                  placeholder="Enter corporate phone number" 
                />
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DefaultFormTextArea 
                  form={form} 
                  name="company_description" 
                  label="Company Description" 
                  placeholder="Enter company description (optional)" 
                  className="resize-none min-h-[100px]" 
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
                {companyId ? "Update Company" : "Add Company"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}