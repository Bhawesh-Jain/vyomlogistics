// app/dashboard/blocks/financial-overview.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, TrendingUp, TrendingDown, Users, Warehouse, FileText, Building2, Target } from 'lucide-react';

interface FinancialOverviewProps {
  data: any;
}

export function FinancialOverview({ data }: FinancialOverviewProps) {
  const { financial } = data;
  
  // Parse all numeric values
  const totalRevenue = parseFloat(financial.total_revenue) || 0;
  const storageRevenue = parseFloat(financial.storage_revenue) || 0;
  const invoiceRevenue = parseFloat(financial.invoice_revenue) || 0;
  const totalCapacity = parseFloat(financial.total_capacity) || 0;
  const allocatedSpace = parseFloat(financial.allocated_space) || 0;
  const availableSpace = parseFloat(financial.available_space) || 0;
  const utilizationRate = parseFloat(financial.utilization_rate) || 0;

  const stats = [
    {
      title: 'Monthly Revenue',
      value: totalRevenue,
      prefix: '₹',
      description: `₹${storageRevenue.toLocaleString()} storage + ₹${invoiceRevenue.toLocaleString()} invoices`,
      icon: IndianRupee,
      trend: 'up',
      trendValue: '+12.5%',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      meta: {
        label: 'Revenue Sources',
        items: [
          { label: 'Storage', value: `₹${storageRevenue.toLocaleString()}` },
          { label: 'Invoices', value: `₹${invoiceRevenue.toLocaleString()}` }
        ]
      }
    },
    {
      title: 'Total Clients',
      value: financial.total_clients || 0,
      description: `${financial.active_agreements || 0} active / ${financial.total_agreements || 0} total agreements`,
      icon: Users,
      trend: 'neutral',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      meta: {
        label: 'Godowns',
        value: `${financial.total_godowns || 0}`,
        icon: Building2
      }
    },
    {
      title: 'Space Utilization',
      value: Math.round(utilizationRate),
      suffix: '%',
      description: `${allocatedSpace.toLocaleString()} of ${totalCapacity.toLocaleString()} sqft`,
      icon: Warehouse,
      trend: utilizationRate > 80 ? 'up' : utilizationRate > 50 ? 'neutral' : 'down',
      trendValue: utilizationRate > 50 ? 'Good' : 'Low',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      progress: utilizationRate
    },
    {
      title: 'Available Space',
      value: availableSpace.toLocaleString(),
      suffix: ' sqft',
      description: 'For new allocations',
      icon: TrendingUp,
      trend: 'down',
      trendValue: `${Math.round((availableSpace / totalCapacity) * 100)}% free`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Mobile-first grid with responsive columns */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-all duration-200 h-full justify-between flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4 sm:p-6">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium leading-none">{stat.title}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {stat.description}
                </CardDescription>
              </div>
              <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full ${stat.bgColor} flex items-center justify-center flex-shrink-0 ml-2`}>
                <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between">
                <div className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-0">
                  {stat.prefix}{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}{stat.suffix}
                </div>
                <div className="flex items-center space-x-2">
                  {stat.trend === 'up' && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs font-medium">{stat.trendValue}</span>
                    </div>
                  )}
                  {stat.trend === 'down' && (
                    <div className="flex items-center space-x-1 text-red-600">
                      <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs font-medium">{stat.trendValue}</span>
                    </div>
                  )}
                  {stat.trend === 'neutral' && stat.trendValue && (
                    <Badge variant="outline" className="text-xs">
                      {stat.trendValue}
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Progress bar for utilization */}
              {stat.progress !== undefined && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Utilization</span>
                    <span>{Math.round(stat.progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                    <div 
                      className={`h-1.5 sm:h-2 rounded-full ${
                        stat.progress >= 80 ? 'bg-green-500' : 
                        stat.progress >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(stat.progress, 100)}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Additional metadata */}
              {stat.meta && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{stat.meta.label}</span>
                    {stat.meta.value && (
                      <div className="flex items-center space-x-1">
                        {stat.meta.icon && <stat.meta.icon className="h-3 w-3" />}
                        <span className="font-medium">{stat.meta.value}</span>
                      </div>
                    )}
                  </div>
                  {stat.meta.items && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {stat.meta.items.map((item, idx) => (
                        <div key={idx} className="text-xs">
                          <div className="text-muted-foreground">{item.label}</div>
                          <div className="font-medium">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Company Info Card for Mobile */}
      <Card className="block sm:hidden">
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span>{financial.company_name || 'Company'}</span>
            <Badge variant="outline" className="ml-auto">ID: {financial.company_id}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">Active Agreements</div>
              <div className="font-medium">{financial.active_agreements || 0}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Total Godowns</div>
              <div className="font-medium">{financial.total_godowns || 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}