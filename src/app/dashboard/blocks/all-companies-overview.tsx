// app/dashboard/blocks/all-companies-overview.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Warehouse, IndianRupee, TrendingUp, TrendingDown, Target } from 'lucide-react';

interface AllCompaniesOverviewProps {
  data: any;
}

export function AllCompaniesOverview({ data }: AllCompaniesOverviewProps) {
  const { overview, companyBreakdown } = data;

  const mainStats = [
    {
      title: 'Total Monthly Revenue',
      value: overview.total_monthly_revenue,
      prefix: '₹',
      description: 'Across all companies',
      icon: IndianRupee,
      trend: 'up',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Net Profit',
      value: overview.total_net_profit,
      prefix: '₹',
      description: 'After godown rent',
      icon: TrendingUp,
      trend: overview.total_net_profit > 0 ? 'up' : 'down',
      color: overview.total_net_profit > 0 ? 'text-green-600' : 'text-red-600',
      bgColor: overview.total_net_profit > 0 ? 'bg-green-50' : 'bg-red-50'
    },
    {
      title: 'Total Clients',
      value: overview.total_clients,
      description: `${overview.active_clients} active`,
      icon: Users,
      trend: 'neutral',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Space Utilization',
      value: Math.round(overview.overall_utilization_rate || 0),
      suffix: '%',
      description: `${overview.total_allocated_space} of ${overview.total_capacity} used`,
      icon: Warehouse,
      trend: overview.overall_utilization_rate > 80 ? 'up' : overview.overall_utilization_rate > 50 ? 'neutral' : 'down',
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
                {stat.prefix}{stat.value?.toLocaleString()}{stat.suffix}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{stat.description}</p>
                {stat.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                {stat.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
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
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
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
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <div className="flex items-center justify-end space-x-2">
                    <IndianRupee className="h-4 w-4 text-green-600" />
                    <p className="font-bold text-lg">{company.monthly_revenue.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className={`px-2 py-1 rounded-full ${getProfitColor(company.net_profit)}`}>
                      <span className="font-medium">
                        {company.net_profit >= 0 ? '₹' : '-₹'}{Math.abs(company.net_profit).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Target className="h-3 w-3 text-muted-foreground" />
                      <span>{Math.round(company.utilization_rate)}%</span>
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
            <div className="text-2xl font-bold">{overview.total_available_space?.toLocaleString()} sqft</div>
            <p className="text-xs text-muted-foreground">For subletting across all companies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₹{overview.total_pending?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agreements</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.active_agreements}</div>
            <p className="text-xs text-muted-foreground">{overview.expiring_agreements} expiring soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}