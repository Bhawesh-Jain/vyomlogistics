'use client'

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Loading from "@/app/dashboard/loading";
import { DefaultFormTextField, DefaultFormSelect, DefaultFormDatePicker, SpinnerItem, DefaultFormTextArea } from "@/components/ui/default-form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Calendar, User, Shield, CreditCard } from "lucide-react";
import { addEmployee, updateEmployee, getEmployeeById } from "@/lib/actions/employee";
import { Employee } from "@/lib/repositories/employeeRepository";
import { zodPatterns } from "@/lib/utils/zod-patterns";
import { Role } from "@/lib/repositories/accessRepository";
import { Company } from "@/lib/repositories/companyRepository";
import { getAllCompanies, getRoles } from "@/lib/actions/settings";

const formSchema = z.object({
  company_id: z.string().min(1, 'Select Firm'),
  name: z.string().min(2, "Add a name").max(255, "Name must be less than 255 characters"),
  password: z.string().min(4, "Password must be at least 4 characters long").or(z.literal("")),
  email: zodPatterns.emailOptional.schema(),
  phone: zodPatterns.phone.schema(),
  joining_date: z.date(),
  salary: zodPatterns.numberString.schema().min(1, 'Enter Salary'),
  advance: zodPatterns.numberString.schema(),
  role: z.string().min(1, "Please select a role"),
  account_number: z.string().min(1, 'Account number is required'),
  bank_name: z.string().min(1, 'Bank name is required'),
  ifsc: z.string().min(1, 'IFSC code is required'),
  address: z.string().min(1, 'Address is required'),
  status: z.enum(['1', '0']).default('1')
});

export type EmployeeFormValues = z.infer<typeof formSchema>;

export default function AddOrganizationEmployee({
  setForm,
  setReload,
  employeeId,
}: {
  setForm: (form: boolean) => void,
  setReload: (reload: boolean) => void,
  employeeId?: number | null,
}) {
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [employeeData, setEmployeeData] = useState<Employee | null>(null);
  const [roles, setRoles] = useState<SpinnerItem[]>([]);
  const [companiesData, setCompaniesData] = useState<SpinnerItem[]>([]);
  const { toast } = useToast();

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company_id: '',
      name: '',
      password: '',
      email: '',
      phone: '',
      joining_date: new Date(),
      role: '',
      account_number: '',
      bank_name: '',
      ifsc: '',
      address: '',
      status: '1'
    },
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [companiesResponse, rolesResponse] = await Promise.all([
          getAllCompanies(),
          getRoles()
        ]);

        if (companiesResponse.success) {
          const formattedCompanies = companiesResponse.result.map((company: Company) => ({
            label: company.company_name,
            value: company.company_id.toString(),
          }));
          setCompaniesData(formattedCompanies);
        } else {
          toast({
            title: "Error",
            description: companiesResponse.error || "Failed to load companies",
            variant: "destructive"
          });
        }

        if (rolesResponse.success) {
          const formattedRoles = rolesResponse.result.map((role: Role) => ({
            label: role.role_name,
            value: role.id.toString(),
          }));
          setRoles(formattedRoles);
        } else {
          toast({
            title: "Error",
            description: rolesResponse.error || "Failed to load roles",
            variant: "destructive"
          });
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error?.message || "Failed to load initial data",
          variant: "destructive"
        });
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (employeeId) {
        setDataLoading(true);
        try {
          const result = await getEmployeeById(employeeId);

          if (result.success && result.result) {
            const employee = result.result;
            setEmployeeData(employee);

            // Reset form with fetched employee data - including new fields
            form.reset({
              company_id: employee.company_id?.toString() ?? '',
              name: employee.name ?? '',
              password: employee.password ?? '',
              email: employee.email ?? '',
              phone: employee.phone ?? '',
              joining_date: employee.joining_date ? new Date(employee.joining_date) : new Date(),
              salary: employee.salary?.toString() ?? '',
              role: employee.role?.toString() ?? '',
              account_number: employee.account_number ?? '', // Added
              bank_name: employee.bank_name ?? '', // Added
              ifsc: employee.ifsc ?? '', // Added
              address: employee.address ?? '', // Added
              status: employee.status?.toString() ?? '1'
            });
          } else {
            toast({
              title: "Error",
              description: result.error || "Employee not found",
              variant: "destructive"
            });
          }
        } catch (error: any) {
          toast({
            title: "Error",
            description: error?.message || "Failed to fetch employee data",
            variant: "destructive"
          });
        } finally {
          setDataLoading(false);
        }
      }
    };

    fetchEmployeeData();
  }, [employeeId, form]);

  async function onSubmit(data: EmployeeFormValues) {
    setLoading(true);
    try {
      const result = employeeId && employeeData
        ? await updateEmployee(employeeId, data)
        : await addEmployee(data);

      if (result.success) {
        toast({
          title: "Success",
          description: employeeId ? "Employee updated successfully!" : "Employee added successfully!",
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
                  <Building2 className="h-5 w-5" /> Firm
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DefaultFormSelect
                  form={form}
                  name="company_id"
                  label="Select Firm"
                  placeholder="Choose a firm"
                  options={companiesData}
                />
              </CardContent>
            </Card>

            {/* Employee Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" /> Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DefaultFormTextField
                  form={form}
                  name="name"
                  label="Full Name"
                  placeholder="Enter employee name"
                />
                <DefaultFormTextField
                  form={form}
                  name="password"
                  label="Password"
                  placeholder="Enter password"
                />
                <DefaultFormTextField
                  form={form}
                  name="email"
                  label="Email Address"
                  placeholder="Enter email address"
                />
                <DefaultFormTextField
                  form={form}
                  name="phone"
                  label="Phone Number"
                  placeholder="Enter phone number"
                />
                <DefaultFormTextArea
                  form={form}
                  name="address"
                  label="Address"
                  placeholder="Enter full address"
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* Employee Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" /> Employment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DefaultFormDatePicker
                  form={form}
                  name="joining_date"
                  label="Joining Date"
                />
                <DefaultFormSelect
                  form={form}
                  name="role"
                  label="Role"
                  placeholder="Select a role"
                  options={roles}
                />
                <DefaultFormTextField
                  form={form}
                  name="salary"
                  label="Salary"
                  placeholder="Enter salary amount"
                />
                <DefaultFormTextField
                  form={form}
                  name="advance"
                  label="Advance"
                  placeholder="Enter advance amount"
                />
              </CardContent>
            </Card>

            {/* Bank Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" /> Bank Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DefaultFormTextField
                  form={form}
                  name="bank_name"
                  label="Bank Name"
                  placeholder="Enter bank name"
                />
                <DefaultFormTextField
                  form={form}
                  name="account_number"
                  label="Account Number"
                  placeholder="Enter account number"
                />
                <DefaultFormTextField
                  form={form}
                  name="ifsc"
                  label="IFSC Code"
                  placeholder="Enter IFSC code"
                />
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" /> Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DefaultFormSelect
                  form={form}
                  name="status"
                  label="Employee Status"
                  options={[
                    { label: 'Active', value: '1' },
                    { label: 'Inactive', value: '0' }
                  ]}
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
              <Button type="submit">
                {employeeId ? "Update Employee" : "Add Employee"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}