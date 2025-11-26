'use client'

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, FileText, Plus, Trash2, Printer, DollarSign, Check, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/combo-box";
import { getOrganizationById, getServiceNames, saveOrganizationServices } from "@/lib/actions/organizations";
import { InvoiceItems, Organization } from "@/lib/repositories/organizationRepository";
import { SpinnerItem } from "@/components/ui/default-form-field";
import Loading from "@/app/dashboard/loading";
import formatDate from "@/lib/utils/date";

// Table components
const Table = ({ children, className = "" }: any) => (
  <div className={`w-full ${className}`}>
    <table className="w-full border-collapse">{children}</table>
  </div>
);

const TableHeader = ({ children }: any) => <thead className="bg-muted">{children}</thead>;
const TableBody = ({ children }: any) => <tbody>{children}</tbody>;
const TableRow = ({ children, className = "" }: any) => (
  <tr className={`border-b ${className}`}>{children}</tr>
);
const TableHead = ({ children, className = "" }: any) => (
  <th className={`px-4 py-3 text-left font-medium ${className}`}>{children}</th>
);
const TableCell = ({ children, className = "" }: any) => (
  <td className={`px-4 py-3 ${className}`}>{children}</td>
);

export interface InvoiceUiItems {
  service_name: string,
  description: string,
  amount: string | number
  tax: string | number
  tax_amount: string | number
}

export default function ManageCompanyItem({
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
  const [monthYear, setMonthYear] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [serviceItems, setServiceItems] = useState<InvoiceUiItems[]>([
    { service_name: '', description: '', amount: 0, tax: 0, tax_amount: 0 }
  ]);
  const [orgDetails, setOrgDetails] = useState<Organization | null>(null);
  const [services, setServices] = useState<SpinnerItem[]>([]);
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (organizationId) {
      (async () => {
        setDataLoading(true);
        try {
          const serviceRes = await getServiceNames();

          if (serviceRes.success) {
            const formattedData: SpinnerItem[] = serviceRes.result.map((item: any) => ({
              label: item.service_name,
              value: item.service_name,
            }));

            setServices(formattedData);
          }

          const details = await getOrganizationById({ id: organizationId, withInvoice: true });
          if (details.success) {
            const org: Organization = details.result;
            setOrgDetails(org);
            setNotes(org.description);

            if (org.invoice_data && org.invoice_data?.length > 0) {
              const formattedData: InvoiceUiItems[] = org.invoice_data.map((item: InvoiceItems) => ({
                amount: item.amount,
                description: item.description,
                service_name: item.service_name,
                tax: item.tax,
                tax_amount: item.tax_amount
              }));

              setServiceItems(formattedData);
            }
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

  const addServiceItem = () => {
    setServiceItems([...serviceItems, { service_name: '', description: '', amount: 0, tax: 0, tax_amount: 0 }]);
  };

  const removeServiceItem = (index: number) => {
    if (serviceItems.length > 1) {
      const newItems = serviceItems.filter((_, i) => i !== index);
      setServiceItems(newItems);
    }
  };

  const updateServiceItem = (index: number, field: string, value: any) => {
    const newItems = [...serviceItems];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'tax' || field === 'amount') {
      const amount = field === 'amount' ? parseFloat(value) || 0 : newItems[index].amount;
      const taxPercentage = field === 'tax' ? parseFloat(value) || 0 : newItems[index].tax;
      newItems[index].tax_amount = (Number(amount) * Number(taxPercentage)) / 100;
    }

    setServiceItems(newItems);
  };

  const calculateSubtotal = () => {
    return serviceItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  };

  const calculateTotalTax = () => {
    return serviceItems.reduce((sum, item) => sum + (Number(item.tax_amount) || 0), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTotalTax();
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Monthly Fees - ${orgDetails?.org_name} - ${formatMonthYear(monthYear)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0 0 10px 0; font-size: 28px; color: #333; }
            .header p { margin: 5px 0; color: #666; font-size: 14px; }
            .company-details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .company-details h2 { margin: 0 0 15px 0; font-size: 18px; color: #333; }
            .detail-row { display: flex; margin-bottom: 8px; }
            .detail-label { font-weight: bold; width: 150px; color: #666; }
            .detail-value { color: #333; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #333; color: white; font-weight: bold; }
            tbody tr:nth-child(even) { background-color: #f9f9f9; }
            .totals { margin-top: 30px; float: right; width: 300px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }
            .total-row.grand { font-weight: bold; font-size: 18px; border-top: 2px solid #333; border-bottom: 2px solid #333; margin-top: 10px; padding: 12px 0; }
            .notes { margin-top: 30px; padding: 20px; background: #f9f9f9; border-radius: 8px; clear: both; }
            .notes h3 { margin: 0 0 10px 0; font-size: 16px; }
            .footer { margin-top: 50px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
            @media print {
              body { padding: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <div class="footer">
            <p>This is a monthly fees record for internal tracking purposes only.</p>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      if (isInput) return;

      if (e.key === "+") {
        e.preventDefault();
        addServiceItem();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [serviceItems]);

  const handleSave = async () => {
    if (!organizationId) {
      toast({
        title: "Validation Error",
        description: "Something went wrong. Please cancel and try again!",
        variant: "destructive"
      });
      return;
    }
    if (!serviceItems.some(item => item.service_name)) {
      toast({
        title: "Validation Error",
        description: "Please add at least one service",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const services = serviceItems.filter(item => item.service_name);


      const res = await saveOrganizationServices(organizationId, services, notes);

      if (res.success) {
        toast({
          title: "Success",
          description: res.result,
        });

        setForm(false);
        setReload(true);
      } else {
        toast({
          title: "Error",
          description: res.error,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to save monthly fees record",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!organizationId) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">No organization selected</p>
        </CardContent>
      </Card>
    );
  }

  if (dataLoading || loading) {
    return (
      <div>
        <Loading />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Print Preview Section (Hidden) */}
      <div ref={printRef} style={{ display: 'none' }}>
        <div className="header">
          <h1>MONTHLY FEES LEDGER</h1>
          <p><strong>Period:</strong> {formatMonthYear(monthYear)}</p>
          <p><strong>Record Date:</strong> {formatDate(new Date().toISOString())}</p>
        </div>

        {orgDetails && (
          <div className="company-details">
            <h2>Organization Details</h2>
            <div className="detail-row">
              <span className="detail-label">Organization:</span>
              <span className="detail-value">{orgDetails.org_name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Contact Person:</span>
              <span className="detail-value">{orgDetails.contact_person}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Phone:</span>
              <span className="detail-value">{orgDetails.contact_number}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Location:</span>
              <span className="detail-value">{orgDetails.location}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Pincode:</span>
              <span className="detail-value">{orgDetails.pincode}</span>
            </div>
          </div>
        )}

        <table>
          <thead>
            <tr>
              <th style={{ width: '5%' }}>#</th>
              <th style={{ width: '25%' }}>Service</th>
              <th style={{ width: '30%' }}>Description</th>
              <th style={{ width: '15%' }}>Amount (₹)</th>
              <th style={{ width: '10%' }}>Tax %</th>
              <th style={{ width: '15%' }}>Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {serviceItems.filter(item => item.service_name).map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{services.find(s => s.value === item.service_name)?.label || '-'}</td>
                <td>{item.description || '-'}</td>
                <td>₹{Number(item.amount || 0).toFixed(2)}</td>
                <td>{item.tax ? `${item.tax}%` : '-'}</td>
                <td>₹{(Number(item.amount || 0) + Number(item.tax_amount || 0)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="totals">
          <div className="total-row">
            <span>Subtotal:</span>
            <span>₹{calculateSubtotal().toFixed(2)}</span>
          </div>
          <div className="total-row">
            <span>Total Tax:</span>
            <span>₹{calculateTotalTax().toFixed(2)}</span>
          </div>
          <div className="total-row grand">
            <span>Grand Total:</span>
            <span>₹{calculateTotal().toFixed(2)}</span>
          </div>
        </div>

        {notes && (
          <div className="notes">
            <h3>Notes</h3>
            <p>{notes}</p>
          </div>
        )}
      </div>

      {/* Organization Details Display */}
      {orgDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" /> Organization Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Organization Name</p>
                <p className="font-medium">{orgDetails.org_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contact Person</p>
                <p className="font-medium">{orgDetails.contact_person}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{orgDetails.contact_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pincode</p>
                <p className="font-medium">{orgDetails.pincode}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{orgDetails.location}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Monthly Fees Record
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="text-sm font-medium">Month & Year</label>
            <Input
              type="month"
              value={monthYear.toISOString().slice(0, 7)}
              onChange={(e) => setMonthYear(new Date(e.target.value))}
              className="max-w-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" /> Monthly Services & Fees
            </CardTitle>
            <Button type="button" onClick={addServiceItem} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" /> Add Service
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Service</TableHead>
                  <TableHead className="w-[250px]">Description</TableHead>
                  <TableHead className="w-[120px]">Amount (₹)</TableHead>
                  <TableHead className="w-[100px]">Tax (%) *</TableHead>
                  <TableHead className="w-[120px]">Tax Amount</TableHead>
                  <TableHead className="w-[120px]">Total</TableHead>
                  <TableHead className="w-[80px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Combobox
                        options={services}
                        value={item.service_name}
                        onChange={(value) => updateServiceItem(index, 'service_name', value)}
                        placeholder="Select or type service..."
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        onFocus={(e) => e.target.select()}
                        value={item.description}
                        onChange={(e) => updateServiceItem(index, 'description', e.target.value)}
                        placeholder="Optional description"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        onFocus={(e) => e.target.select()}
                        step="0.01"
                        value={item.amount}
                        onChange={(e) => updateServiceItem(index, 'amount', e.target.value)}
                        placeholder="0.00"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        onFocus={(e) => e.target.select()}
                        step="0.01"
                        value={item.tax}
                        onChange={(e) => updateServiceItem(index, 'tax', e.target.value)}
                        placeholder="Optional"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        ₹{Number(item.tax_amount || 0).toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        ₹{((Number(item.amount) || 0) + (Number(item.tax_amount) || 0)).toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeServiceItem(index)}
                        disabled={serviceItems.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="text-sm text-muted-foreground mt-2">* Tax field is optional | Press &rdquo;+&rdquo; to add a new service</p>

          {/* Totals Section */}
          <div className="mt-6 border-t pt-4">
            <div className="flex flex-col items-end space-y-2">
              <div className="flex justify-between w-64">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">₹{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between w-64">
                <span className="text-muted-foreground">Total Tax:</span>
                <span className="font-medium">₹{calculateTotalTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between w-64 text-lg font-bold border-t pt-2">
                <span>Grand Total:</span>
                <span>₹{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full min-h-[100px] px-3 py-2 border rounded-md resize-none"
            placeholder="Add any additional notes or remarks..."
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setForm(false)}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handlePrint}
          disabled={!orgDetails || !serviceItems.some(item => item.service_name)}
        >
          <Printer className="h-4 w-4 mr-2" /> Print Breakdown
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Record"}
        </Button>
      </div>
    </div>
  );
}