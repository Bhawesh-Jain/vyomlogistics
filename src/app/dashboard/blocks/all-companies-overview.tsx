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
          <div className="space-y-3 sm:space-y-4">
            {companyBreakdown.map((company: any) => {
              const netProfit = parseFloat(company.net_profit);
              const utilizationRate = parseFloat(company.utilization_rate);
              const allocatedSpace = parseFloat(company.allocated_space);
              const totalCapacity = parseFloat(company.total_capacity);
              const availableSpace = totalCapacity - allocatedSpace;

              return (
                <div
                  key={company.company_id}
                  className="flex flex-col gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  {/* Company Header */}
                  <div className="flex items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 rounded-full bg-blue-50 flex items-center justify-center">
                        <Building2 className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm sm:text-base truncate">
                            {company.company_name}
                          </p>
                          <Badge variant="outline" className="text-xs flex-shrink-0 bg-blue-50">
                            {company.abbr}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{company.client_count} clients</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Warehouse className="h-3 w-3" />
                            <span>{company.godown_count} godowns</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            <span>{company.agreement_count} agreements</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Revenue Badge - Desktop */}
                    <div className="hidden sm:flex flex-col items-end">
                      <span className="text-xs text-muted-foreground">Total Revenue</span>
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-green-600" />
                        <span className="font-bold text-lg">
                          {MoneyHelper.formatRupees(company.total_revenue)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Revenue Mobile */}
                  <div className="sm:hidden border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Total Revenue</span>
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-green-600" />
                        <span className="font-bold">
                          {MoneyHelper.formatRupees(company.total_revenue)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 sm:pt-0 border-t sm:border-t-0">
                    {/* Net Profit */}
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Net Profit</span>
                      <div className={`px-3 py-2 rounded-lg ${getProfitColor(netProfit)}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm sm:text-base">
                            {MoneyHelper.formatRupees(company.net_profit)}
                          </span>
                          {netProfit > 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : netProfit < 0 ? (
                            <TrendingDown className="h-4 w-4" />
                          ) : null}
                        </div>
                        <div className="text-xs mt-1 opacity-80">
                          Rent: {MoneyHelper.formatRupees(company.godown_rent)}
                        </div>
                      </div>
                    </div>

                    {/* Space Utilization */}
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Space Utilization</span>
                      <div className="px-3 py-2 bg-orange-50 text-orange-800 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm sm:text-base">{Math.round(utilizationRate)}%</span>
                          <Warehouse className="h-4 w-4" />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-orange-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${getUtilizationColor(utilizationRate)}`}
                              style={{ width: `${Math.min(utilizationRate, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs">
                            {allocatedSpace.toLocaleString()}/{totalCapacity.toLocaleString()} sqft
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Revenue Breakdown */}
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Revenue Breakdown</span>
                      <div className="px-3 py-2 bg-green-50 text-green-800 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">Storage</span>
                          <span className="font-semibold">{MoneyHelper.formatRupees(company.storage_revenue)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">Invoices</span>
                          <span className="font-semibold">{MoneyHelper.formatRupees(company.invoice_revenue)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Additional Info</span>
                      <div className="px-3 py-2 bg-blue-50 text-blue-800 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">Available Space</span>
                          <span className="font-semibold">{availableSpace.toLocaleString()} sqft</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">Salary Cost</span>
                          <span className="font-semibold">{MoneyHelper.formatRupees(company.salary_cost)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {companyBreakdown.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No company data available</p>
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