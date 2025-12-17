// app/dashboard/blocks/client-revenue.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, User, Phone, Calendar, Warehouse } from 'lucide-react';

interface ClientRevenueProps {
  clients: any[];
}

export function ClientRevenue({ clients }: ClientRevenueProps) {
  const getRevenueColor = (amount: number) => {
    if (amount >= 50000) return 'text-green-600 bg-green-50';
    if (amount >= 20000) return 'text-blue-600 bg-blue-50';
    if (amount >= 10000) return 'text-orange-600 bg-orange-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getRevenueSources = (client: any) => {
    const storageRent = parseFloat(client.monthly_rent) || 0;
    const invoiceRevenue = parseFloat(client.invoice_revenue) || 0;
    const totalInvoices = client.total_invoices || 0;
    
    const sources = [];
    if (storageRent > 0) sources.push(`₹${storageRent.toLocaleString()} storage`);
    if (invoiceRevenue > 0) sources.push(`₹${invoiceRevenue.toLocaleString()} from ${totalInvoices} invoices`);
    
    return sources.length > 0 ? sources.join(' + ') : 'No revenue';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Client Revenue
        </CardTitle>
        <CardDescription>Monthly revenue from each client</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {clients.map((client) => {
            const monthlyRent = parseFloat(client.monthly_rent) || 0;
            const invoiceRevenue = parseFloat(client.invoice_revenue) || 0;
            const totalRevenue = monthlyRent + invoiceRevenue;
            
            return (
              <div
                key={client.org_id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getRevenueColor(totalRevenue)}`}>
                    <IndianRupee className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{client.org_name}</p>
                      {client.space_allocations > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {client.space_allocations} allocation{client.space_allocations > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{client.contact_person || 'No contact'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Phone className="h-3 w-3" />
                        <span>{client.contact_number || 'No phone'}</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {getRevenueSources(client)}
                    </div>
                  </div>
                </div>
                
                <div className="text-right space-y-1">
                  <div className="flex items-center justify-end space-x-2">
                    <IndianRupee className="h-4 w-4 text-green-600" />
                    <p className="font-bold text-lg">{totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {client.total_invoices > 0 
                      ? `${client.total_invoices} invoice${client.total_invoices > 1 ? 's' : ''}`
                      : 'No invoices'
                    }
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {clients.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No clients with revenue data</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}