// app/dashboard/blocks/client-revenue.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, User, Phone, Calendar, Warehouse, FileText, TrendingUp, AlertCircle, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { MoneyHelper } from '@/lib/helpers/money-helper';

interface ClientRevenueProps {
  clients: any[];
}

export function ClientRevenue({ clients }: ClientRevenueProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getRevenueColor = (amount: number) => {
    if (amount >= 50000) return 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100';
    if (amount >= 20000) return 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100';
    if (amount >= 10000) return 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100';
    return 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-100';
  };

  const getRevenueLevel = (amount: number) => {
    if (amount >= 50000) return { label: 'High Value', color: 'text-green-700 bg-green-100' };
    if (amount >= 20000) return { label: 'Medium', color: 'text-blue-700 bg-blue-100' };
    if (amount >= 10000) return { label: 'Standard', color: 'text-orange-700 bg-orange-100' };
    return { label: 'Low', color: 'text-gray-700 bg-gray-100' };
  };

  const calculateTotalRevenue = () => {
    return clients.reduce((sum, client) => {
      const storageRent = parseFloat(client.monthly_rent) || 0;
      const invoiceRevenue = parseFloat(client.invoice_revenue) || 0;
      return sum + storageRent + invoiceRevenue;
    }, 0);
  };

  const calculateAvgRevenue = () => {
    const total = calculateTotalRevenue();
    return clients.length > 0 ? total / clients.length : 0;
  };

  if (clients.length === 0) {
    return (
      <Card className="w-full overflow-hidden">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Client Revenue
          </CardTitle>
          <CardDescription>Monthly revenue from each client</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No clients with revenue data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalRevenue = calculateTotalRevenue();
  const avgRevenue = calculateAvgRevenue();

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl truncate">
              <User className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
              <span className="truncate">Client Revenue</span>
            </CardTitle>
            <CardDescription className="text-sm sm:text-base truncate">
              {clients.length} client{clients.length !== 1 ? 's' : ''} • Total: ₹{totalRevenue.toLocaleString()} • Avg: ₹{avgRevenue.toLocaleString()}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2 mt-2 sm:mt-0 self-start sm:self-auto">
            <Badge variant="outline" className="text-xs whitespace-nowrap">
              {clients.filter(c => (parseFloat(c.monthly_rent) || 0) > 0).length} with storage
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="space-y-3 sm:space-y-4">
          {clients.map((client) => {
            const monthlyRent = parseFloat(client.monthly_rent) || 0;
            const invoiceRevenue = parseFloat(client.invoice_revenue) || 0;
            const totalRevenue = monthlyRent + invoiceRevenue;
            const revenueLevel = getRevenueLevel(totalRevenue);
            const isExpanded = expandedId === client.org_id;
            const hasStorage = monthlyRent > 0;
            const hasInvoices = invoiceRevenue > 0;

            return (
              <div
                key={client.org_id}
                className={`border-b last:border-0 sm:border sm:rounded-xl transition-all duration-200 ${getRevenueColor(totalRevenue)} border md:mx-4 sm:mx-0`}
              >
                <div 
                  className="p-4 sm:p-6 cursor-pointer sm:cursor-default"
                  onClick={() => toggleExpand(client.org_id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Client Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-3">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white border flex items-center justify-center flex-shrink-0">
                            <div className={`h-6 w-6 sm:h-8 sm:w-8 rounded-full flex items-center justify-center ${
                              totalRevenue >= 50000 ? 'bg-green-100' :
                              totalRevenue >= 20000 ? 'bg-blue-100' :
                              totalRevenue >= 10000 ? 'bg-orange-100' : 'bg-gray-100'
                            }`}>
                              <User className={`h-3 w-3 sm:h-4 sm:w-4 ${
                                totalRevenue >= 50000 ? 'text-green-600' :
                                totalRevenue >= 20000 ? 'text-blue-600' :
                                totalRevenue >= 10000 ? 'text-orange-600' : 'text-gray-600'
                              }`} />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 mb-1">
                              <h3 className="font-semibold text-base sm:text-lg truncate">{client.org_name}</h3>
                              <Badge className={`self-start sm:self-auto ${revenueLevel.color} text-xs`}>
                                {revenueLevel.label}
                              </Badge>
                            </div>
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1 truncate">
                                <User className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{client.contact_person || 'No contact'}</span>
                              </div>
                              <div className="flex items-center space-x-1 truncate">
                                <Phone className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{client.contact_number || 'No phone'}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Revenue - Always visible */}
                        <div className="flex items-end flex-col min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                            <span className="text-xl sm:text-3xl font-bold truncate">{totalRevenue.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {hasStorage && (
                              <Badge variant="outline" className="text-xs whitespace-nowrap">
                                <Warehouse className="h-3 w-3 mr-1 flex-shrink-0" />
                                Storage
                              </Badge>
                            )}
                            {hasInvoices && (
                              <Badge variant="outline" className="text-xs whitespace-nowrap">
                                <FileText className="h-3 w-3 mr-1 flex-shrink-0" />
                                {client.total_invoices} invoice{client.total_invoices !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Revenue Breakdown - Visible on desktop, expandable on mobile */}
                      <div className={`${isExpanded ? 'block' : 'hidden'} sm:block`}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4">
                          {/* Storage Revenue */}
                          {hasStorage && (
                            <div className="p-3 bg-white/50 rounded-lg border">
                              <div className="flex items-center justify-between mb-2 gap-2">
                                <div className="flex items-center space-x-2 min-w-0">
                                  <Warehouse className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                  <span className="font-medium truncate">Storage Revenue</span>
                                </div>
                                <span className="font-bold text-green-600 whitespace-nowrap">₹{monthlyRent.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                                <span className="text-muted-foreground truncate">Space Allocations</span>
                                <Badge variant="outline" className="whitespace-nowrap">
                                  {client.space_allocations || 0} location{client.space_allocations !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                            </div>
                          )}

                          {/* Invoice Revenue */}
                          {hasInvoices && (
                            <div className="p-3 bg-white/50 rounded-lg border">
                              <div className="flex items-center justify-between mb-2 gap-2">
                                <div className="flex items-center space-x-2 min-w-0">
                                  <FileText className="h-4 w-4 text-purple-500 flex-shrink-0" />
                                  <span className="font-medium truncate">Invoice Revenue</span>
                                </div>
                                <span className="font-bold text-green-600 whitespace-nowrap">₹{invoiceRevenue.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                                <span className="text-muted-foreground truncate">Total Invoices</span>
                                <Badge variant="outline" className="whitespace-nowrap">{client.total_invoices || 0}</Badge>
                              </div>
                            </div>
                          )}

                          {/* No Revenue Warning */}
                          {!hasStorage && !hasInvoices && (
                            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 col-span-full">
                              <div className="flex items-center space-x-2 text-yellow-700">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <span className="font-medium">No active revenue sources</span>
                              </div>
                              <p className="text-xs sm:text-sm text-yellow-600 mt-1">
                                This client has no active storage allocations or invoices
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Client Status */}
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
                            <div className="flex items-center space-x-1">
                              <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span>ID: {client.org_id}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-muted-foreground">Status:</span>
                              <Badge variant={
                                totalRevenue > 0 ? 'default' : 
                                hasStorage || hasInvoices ? 'secondary' : 'outline'
                              } className="whitespace-nowrap">
                                {totalRevenue > 0 ? 'Active Revenue' : 
                                 hasStorage || hasInvoices ? 'Potential Revenue' : 'Inactive'}
                              </Badge>
                            </div>
                            {monthlyRent > 0 && (
                              <div className="flex items-center space-x-1 ml-auto">
                                <TrendingUp className="h-3 w-3 text-green-500 flex-shrink-0" />
                                <span className="text-green-600 font-medium whitespace-nowrap">Recurring revenue</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mobile expand indicator */}
                    <div className="sm:hidden flex-shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Quick Summary for Mobile */}
                  <div className="sm:hidden mt-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3 flex-wrap">
                        {hasStorage && (
                          <div className="flex items-center space-x-1">
                            <Warehouse className="h-3 w-3 text-blue-500 flex-shrink-0" />
                            <span className="whitespace-nowrap">₹{monthlyRent.toLocaleString()}</span>
                          </div>
                        )}
                        {hasInvoices && (
                          <div className="flex items-center space-x-1">
                            <FileText className="h-3 w-3 text-purple-500 flex-shrink-0" />
                            <span className="whitespace-nowrap">₹{invoiceRevenue.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                      {client.space_allocations > 0 && (
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          {client.space_allocations} space{client.space_allocations !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Footer */}
        <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-slate-50 border-t sm:border sm:rounded-lg md:mx-4 sm:mx-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xs sm:text-sm text-muted-foreground">Total Clients</div>
              <div className="text-lg sm:text-xl font-bold">{clients.length}</div>
            </div>
            <div className="text-center">
              <div className="text-xs sm:text-sm text-muted-foreground">Total Revenue</div>
              <div className="text-lg sm:text-xl font-bold text-green-600">{MoneyHelper.formatRupees(calculateTotalRevenue())}</div>
            </div>
            <div className="text-center">
              <div className="text-xs sm:text-sm text-muted-foreground">Avg. Per Client</div>
              <div className="text-lg sm:text-xl font-bold">{MoneyHelper.formatRupees(calculateAvgRevenue())}</div>
            </div>
            <div className="text-center">
              <div className="text-xs sm:text-sm text-muted-foreground">Storage Clients</div>
              <div className="text-lg sm:text-xl font-bold text-blue-600">
                {clients.filter(c => (parseFloat(c.monthly_rent) || 0) > 0).length}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}