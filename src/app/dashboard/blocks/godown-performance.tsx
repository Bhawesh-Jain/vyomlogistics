// app/dashboard/blocks/godown-performance.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Warehouse, MapPin, Users, TrendingUp, TrendingDown } from 'lucide-react';

interface GodownPerformanceProps {
  godowns: any[];
}

export function GodownPerformance({ godowns }: GodownPerformanceProps) {
  const getProfitColor = (profit: number) => {
    if (profit > 0) return 'text-green-600';
    if (profit < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Warehouse className="h-5 w-5" />
          Godown Performance
        </CardTitle>
        <CardDescription>Space utilization and revenue by godown</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {godowns.map((godown) => {
            const netProfit = parseFloat(godown.net_profit) || 0;
            const utilizationPercentage = parseFloat(godown.utilization_percentage) || 0;
            const revenueGenerated = parseFloat(godown.revenue_generated) || 0;
            const godownRent = parseFloat(godown.godown_rent) || 0;
            
            return (
              <div
                key={godown.godown_id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                      <Warehouse className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{godown.godown_name}</p>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{godown.location}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={netProfit > 0 ? 'default' : 'destructive'}>
                    {netProfit > 0 ? 'Profitable' : netProfit < 0 ? 'Loss' : 'Break-even'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Capacity</p>
                    <p className="font-medium">{(parseFloat(godown.total_capacity) || 0).toLocaleString()} {godown.capacity_unit}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Utilization</p>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getUtilizationColor(utilizationPercentage)}`}
                          style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                        ></div>
                      </div>
                      <span className="font-medium">{Math.round(utilizationPercentage)}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Revenue</p>
                    <p className="font-medium text-green-600">₹{revenueGenerated.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Rent: ₹{godownRent.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Net Profit</p>
                    <p className={`font-medium ${getProfitColor(netProfit)}`}>
                      {netProfit >= 0 ? '₹' : '-₹'}{Math.abs(netProfit).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>{godown.clients_allocated || 0} clients</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Warehouse className="h-3 w-3" />
                      <span>{(parseFloat(godown.available_space) || 0).toLocaleString()} {godown.capacity_unit} available</span>
                    </div>
                  </div>
                  {netProfit > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : netProfit < 0 ? (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {godowns.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Warehouse className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No godown performance data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}