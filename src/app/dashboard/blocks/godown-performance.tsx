// app/dashboard/blocks/godown-performance.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Warehouse, MapPin, Users, TrendingUp, TrendingDown, DollarSign, IndianRupee, Home, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface GodownPerformanceProps {
  godowns: any[];
}

export function GodownPerformance({ godowns }: GodownPerformanceProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return 'text-green-600';
    if (profit < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getProfitBgColor = (profit: number) => {
    if (profit > 0) return 'bg-green-50';
    if (profit < 0) return 'bg-red-50';
    return 'bg-gray-50';
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (godowns.length === 0) {
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
          <div className="text-center py-8 text-muted-foreground">
            <Warehouse className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No godown performance data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Warehouse className="h-5 w-5 sm:h-6 sm:w-6" />
              Godown Performance
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {godowns.length} godown{godowns.length !== 1 ? 's' : ''} • Total: ₹{godowns.reduce((sum, g) => sum + (parseFloat(g.revenue_generated) || 0), 0).toLocaleString()} revenue
            </CardDescription>
          </div>
          <Badge variant="outline" className="mt-2 sm:mt-0 self-start sm:self-auto">
            {godowns.filter(g => (parseFloat(g.net_profit) || 0) > 0).length} profitable
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="space-y-3 sm:space-y-4">
          {godowns.map((godown) => {
            const netProfit = parseFloat(godown.net_profit) || 0;
            const utilizationPercentage = parseFloat(godown.utilization_percentage) || 0;
            const revenueGenerated = parseFloat(godown.revenue_generated) || 0;
            const godownRent = parseFloat(godown.godown_rent) || 0;
            const totalCapacity = parseFloat(godown.total_capacity) || 0;
            const allocatedSpace = parseFloat(godown.allocated_space) || 0;
            const availableSpace = parseFloat(godown.available_space) || 0;
            const isExpanded = expandedId === godown.godown_id;
            const profitMargin = revenueGenerated > 0 ? (netProfit / revenueGenerated) * 100 : 0;

            return (
              <div
                key={godown.godown_id}
                className="border-b last:border-0 sm:border sm:rounded-lg sm:hover:bg-muted/50 transition-colors"
              >
                {/* Mobile Header */}
                <div 
                  className="p-4 sm:p-6 cursor-pointer sm:cursor-default flex items-center justify-between"
                  onClick={() => toggleExpand(godown.godown_id)}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Warehouse className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium truncate">{godown.godown_name}</p>
                        <Badge 
                          variant={netProfit > 0 ? 'default' : 'destructive'}
                          className="hidden sm:inline-flex"
                        >
                          {netProfit > 0 ? 'Profit' : netProfit < 0 ? 'Loss' : 'Break-even'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{godown.location}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mobile only expand icon and profit indicator */}
                  <div className="sm:hidden flex items-center space-x-3">
                    <div className={`text-right ${getProfitColor(netProfit)}`}>
                      <div className="font-bold text-lg">
                        {netProfit >= 0 ? '₹' : '-₹'}{Math.abs(netProfit).toLocaleString()}
                      </div>
                    </div>
                    <div className="transform transition-transform duration-200">
                      <svg 
                        className={`h-5 w-5 text-gray-400 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Main Content - Always visible on desktop, expandable on mobile */}
                <div className={`${isExpanded ? 'block' : 'hidden'} sm:block px-4 pb-4 sm:px-6 sm:pb-6`}>
                  {/* Top Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm text-muted-foreground">Capacity</p>
                      <div className="flex items-center space-x-1">
                        <Home className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                        <p className="font-medium text-sm sm:text-base">
                          {totalCapacity.toLocaleString()} {godown.capacity_unit}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm text-muted-foreground">Utilization</p>
                      <div className="flex items-center space-x-2">
                        <div className="w-12 sm:w-16 bg-gray-200 rounded-full h-1.5 sm:h-2">
                          <div 
                            className={`h-1.5 sm:h-2 rounded-full ${getUtilizationColor(utilizationPercentage)}`}
                            style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                          />
                        </div>
                        <span className="font-medium text-sm sm:text-base">{Math.round(utilizationPercentage)}%</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm text-muted-foreground">Revenue</p>
                      <div className="flex items-center space-x-1">
                        <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                        <p className="font-medium text-sm sm:text-base text-green-600">
                          ₹{revenueGenerated.toLocaleString()}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">Rent: ₹{godownRent.toLocaleString()}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm text-muted-foreground">Net Profit</p>
                      <div className={`flex items-center space-x-1 ${getProfitColor(netProfit)}`}>
                        <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                        <p className="font-medium text-sm sm:text-base">
                          {netProfit >= 0 ? '₹' : '-₹'}{Math.abs(netProfit).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {profitMargin > 0 ? '+' : ''}{profitMargin.toFixed(1)}% margin
                      </p>
                    </div>
                  </div>

                  {/* Space Allocation Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                    <div className="space-y-2 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Allocated Space</span>
                        <span className="font-medium">{allocatedSpace.toLocaleString()} {godown.capacity_unit}</span>
                      </div>
                      <div className="w-full bg-blue-100 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(allocatedSpace / totalCapacity) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2 p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Available Space</span>
                        <span className="font-medium">{availableSpace.toLocaleString()} {godown.capacity_unit}</span>
                      </div>
                      <div className="w-full bg-green-100 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(availableSpace / totalCapacity) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bottom Info Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 sm:pt-4 border-t text-xs sm:text-sm">
                    <div className="flex flex-wrap gap-3 mb-2 sm:mb-0">
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{godown.clients_allocated || 0} client{godown.clients_allocated !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <Warehouse className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{availableSpace.toLocaleString()} {godown.capacity_unit} available</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {netProfit > 0 ? (
                        <div className="flex items-center space-x-1 text-green-600">
                          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="font-medium">Profitable</span>
                        </div>
                      ) : netProfit < 0 ? (
                        <div className="flex items-center space-x-1 text-red-600">
                          <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="font-medium">At loss</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-gray-600">
                          <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Break-even</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}