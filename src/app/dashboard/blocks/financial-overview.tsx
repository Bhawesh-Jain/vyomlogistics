// app/dashboard/blocks/financial-overview.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, TrendingUp, TrendingDown, Users, Warehouse, FileText } from 'lucide-react';

interface FinancialOverviewProps {
  data: any;
}

export function FinancialOverview({ data }: FinancialOverviewProps) {
  const { financial } = data;

  const stats = [
    {
      title: 'Monthly Revenue',
      value: parseFloat(financial.total_revenue) || 0,
      prefix: '₹',
      description: `₹${(parseFloat(financial.storage_revenue) || 0).toLocaleString()} storage + ₹${(parseFloat(financial.invoice_revenue) || 0).toLocaleString()} invoices`,
      icon: IndianRupee,
      trend: 'up',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Clients',
      value: financial.total_clients || 0,
      description: `${financial.active_agreements || 0} active agreements of ${financial.total_agreements || 0}`,
      icon: Users,
      trend: 'neutral',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Space Utilization',
      value: Math.round(parseFloat(financial.utilization_rate) || 0),
      suffix: '%',
      description: `${(parseFloat(financial.allocated_space) || 0).toLocaleString()} of ${(parseFloat(financial.total_capacity) || 0).toLocaleString()} sqft allocated`,
      icon: Warehouse,
      trend: (parseFloat(financial.utilization_rate) || 0) > 80 ? 'up' : (parseFloat(financial.utilization_rate) || 0) > 50 ? 'neutral' : 'down',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Available Space',
      value: (parseFloat(financial.available_space) || 0).toLocaleString(),
      suffix: ' sqft',
      description: 'Available for subletting',
      icon: TrendingUp,
      trend: 'down',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`h-8 w-8 rounded-full ${stat.bgColor} flex items-center justify-center`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stat.prefix}{stat.value.toLocaleString()}{stat.suffix}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{stat.description}</p>
              {stat.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
              {stat.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
              {stat.trend === 'neutral' && <span className="h-4 w-4" />}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}