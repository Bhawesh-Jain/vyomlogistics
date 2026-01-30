// app/dashboard/blocks/all-companies-overview.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Warehouse, IndianRupee, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { MoneyHelper } from '@/lib/helpers/money-helper';
import { NumberHelper } from '@/lib/helpers/number-helper';

interface AllCompaniesOverviewProps {
  data: any;
}

export function AllCompaniesOverview({ data }: AllCompaniesOverviewProps) {
  const {
    totalMonthlyRevenue,
    totalInvoiceAmount,
    totalMonthlySalary,
    netMonthlyProfit,
    totalClients,
    totalGodownRent,
    totalGodownSpace,
    totalSpaceAllocated,
    totalRentCollected,
    totalSpaceUtilizaton,
    companyBreakdown
  } = data;

  // Calculate derived values
  const totalAvailableSpace = totalGodownSpace - totalSpaceAllocated;
  const overallUtilizationRate = totalSpaceUtilizaton;
  const activeClients = totalClients; // Assuming all clients are active

  const mainStats = [
    {
      title: 'Total Monthly Revenue',
      value: totalMonthlyRevenue,
      prefix: '₹',
      description: 'Across all companies',
      icon: IndianRupee,
      trend: 'up',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Net Profit',
      value: netMonthlyProfit,
      prefix: '₹',
      description: `After ${MoneyHelper.formatRupees(totalGodownRent)} rent`,
      icon: TrendingUp,
      trend: netMonthlyProfit > 0 ? 'up' : 'down',
      color: netMonthlyProfit > 0 ? 'text-green-600' : 'text-red-600',
      bgColor: netMonthlyProfit > 0 ? 'bg-green-50' : 'bg-red-50'
    },
    {
      title: 'Total Clients',
      value: totalClients,
      description: `${activeClients} active`,
      icon: Users,
      trend: 'neutral',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Space Utilization',
      value: Math.round(overallUtilizationRate || 0),
      suffix: '%',
      description: `${NumberHelper.format(totalSpaceAllocated)} of ${NumberHelper.format(totalGodownSpace)} sqft used`,
      icon: Warehouse,
      trend: overallUtilizationRate > 80 ? 'up' : overallUtilizationRate > 50 ? 'neutral' : 'down',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mainStats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`h-8 w-8 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.prefix}{NumberHelper.formatFixed(stat.value)}{stat.suffix}
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

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Space</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{NumberHelper.format(totalAvailableSpace)} sqft</div>
            <p className="text-xs text-muted-foreground">For subletting across all companies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Invoices</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {MoneyHelper.formatRupees(totalInvoiceAmount)}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Salary Expenses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{MoneyHelper.formatRupees(totalMonthlySalary)}</div>
            <p className="text-xs text-muted-foreground">Monthly salary cost</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}