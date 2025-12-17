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

  const getProfitColor = (profit: number) => {
    if (profit > 50000) return 'text-green-600 bg-green-50';
    if (profit > 10000) return 'text-blue-600 bg-blue-50';
    if (profit > 0) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

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

      {/* Company Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Performance Breakdown
          </CardTitle>
          <CardDescription>Performance metrics across all your companies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {companyBreakdown.map((company: any) => (
              <div
                key={company.company_id}
                className="flex flex-col gap-2 lg:flex-row lg:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{company.company_name}</p>
                      <Badge variant="outline">{company.abbr}</Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{company.client_count} clients</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Warehouse className="h-3 w-3" />
                        <span>{company.godown_count} godowns</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Target className="h-3 w-3" />
                        <span>{company.agreement_count} agreements</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <div className="flex items-center lg:justify-end space-x-2">
                    <p className="font-bold text-lg">{MoneyHelper.formatRupees(company.total_revenue)}</p>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className={`px-2 py-1 rounded-full ${getProfitColor(parseFloat(company.net_profit))}`}>
                      <span className="font-medium">
                        {MoneyHelper.formatRupees(company.net_profit)} net profit
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Warehouse className="h-3 w-3 text-muted-foreground" />
                      <span>{Math.round(parseFloat(company.utilization_rate))}% utilized</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {companyBreakdown.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No company data available</p>
            </div>
          )}
        </CardContent>
      </Card>

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