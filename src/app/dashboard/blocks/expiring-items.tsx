// app/dashboard/blocks/expiring-items.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExpiringItem } from '@/lib/repositories/miscRepository';
import { AlertTriangle, Calendar, FileText, ShieldAlert, RefreshCw, ChevronDown, ChevronUp, Clock, Building2, User } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import formatDate from '@/lib/utils/date';
import { Container } from '@/components/ui/container';

interface ExpiringItemsProps {
  items: ExpiringItem[];
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function ExpiringItems({ items, onRefresh, refreshing = false }: ExpiringItemsProps) {
  const [expanded, setExpanded] = useState(false);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'expired':
        return 'destructive';
      case 'expiring':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string, daysUntilExpiry: number) => {
    if (status === 'expired') return 'text-destructive';
    if (daysUntilExpiry <= 7) return 'text-orange-600';
    if (daysUntilExpiry <= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'expired':
        return <ShieldAlert className="h-3 w-3 sm:h-4 sm:w-4" />;
      case 'expiring':
        return <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />;
      default:
        return <Clock className="h-3 w-3 sm:h-4 sm:w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'agreement' ? (
      <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
    ) : (
      <ShieldAlert className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
    );
  };

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant="outline" className="text-xs capitalize">
        {type}
      </Badge>
    );
  };

  const getDaysText = (daysUntilExpiry: number, status: string) => {
    if (status === 'expired') {
      return `${Math.abs(daysUntilExpiry)}d ago`;
    }
    return `${daysUntilExpiry}d`;
  };

  // Filter items for critical status
  const criticalItems = items.filter(item => 
    item.status === 'expired' || item.daysUntilExpiry <= 7
  );

  // Sort items: expired first, then by days until expiry
  const sortedItems = [...items].sort((a, b) => {
    if (a.status === 'expired' && b.status !== 'expired') return -1;
    if (b.status === 'expired' && a.status !== 'expired') return 1;
    return a.daysUntilExpiry - b.daysUntilExpiry;
  });

  // Show limited items when not expanded
  const displayedItems = expanded ? sortedItems : sortedItems.slice(0, 3);

  if (items.length === 0 && !refreshing) {
    return (
      <Card className="w-full overflow-hidden">
        <CardHeader className="px-4 sm:px-6 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Expiring Items</CardTitle>
            </div>
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={refreshing}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
          <CardDescription>No expiring items in the next 60 days</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">All up to date!</p>
            <p className="text-sm mt-1">No agreements or licenses expiring soon</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Container className="w-full overflow-hidden">
      <CardHeader className="px-4 sm:px-6 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Expiring Items</CardTitle>
            {criticalItems.length > 0 && (
              <Badge variant="destructive" className="h-5">
                {criticalItems.length} critical
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={refreshing}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="sr-only">Refresh</span>
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center justify-between">
          <CardDescription>
            {items.length} item{items.length !== 1 ? 's' : ''} expiring in the next 60 days
          </CardDescription>
          {criticalItems.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-destructive font-medium">
              <AlertTriangle className="h-3 w-3" />
              <span>{criticalItems.length} require attention</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="px-0 sm:px-6">
        {refreshing ? (
          <div className="space-y-3 px-4 sm:px-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-2 sm:space-y-3 px-4 sm:px-0">
              {displayedItems.map((item) => {
                const isCritical = item.status === 'expired' || item.daysUntilExpiry <= 7;
                
                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className={`p-3 sm:p-4 border rounded-lg transition-all hover:shadow-sm ${
                      isCritical 
                        ? 'border-destructive/20 bg-destructive/5' 
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center md:flex-shrink-0 ${
                          isCritical ? 'bg-destructive/10' : 'bg-blue-50'
                        }`}>
                          {getTypeIcon(item.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-1">
                            <div className="min-w-0">
                              <p className="font-medium text-sm sm:text-base truncate">
                                {item.name}
                              </p>
                              <div className="flex flex-col md:flex-row md:items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs capitalize w-fit">
                                  {item.type}
                                </Badge>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Building2 className="h-3 w-3" />
                                  <span className="truncate">{item.organization}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Additional details on mobile */}
                          <div className="sm:hidden mt-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  {formatDate(item.expiryDate)}
                                </span>
                              </div>
                              <Badge 
                                variant={getStatusVariant(item.status)} 
                                className={`flex items-center gap-1 text-xs ${
                                  isCritical ? 'animate-pulse' : ''
                                }`}
                              >
                                {getStatusIcon(item.status)}
                                {getDaysText(item.daysUntilExpiry, item.status)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Desktop view */}
                      <div className="hidden sm:flex flex-col items-end gap-2">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatDate(item.expiryDate)}
                          </p>
                          <p className={`text-xs font-medium ${getStatusColor(item.status, item.daysUntilExpiry)}`}>
                            {item.daysUntilExpiry < 0 
                              ? `Expired ${Math.abs(item.daysUntilExpiry)} days ago` 
                              : `${item.daysUntilExpiry} days left`
                            }
                          </p>
                        </div>
                        <Badge 
                          variant={getStatusVariant(item.status)} 
                          className={`flex items-center gap-1 ${
                            isCritical ? 'animate-pulse' : ''
                          }`}
                        >
                          {getStatusIcon(item.status)}
                          {item.status === 'expired' ? 'Expired' : 'Expiring'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Show More/Less button */}
            {items.length > 3 && (
              <div className="mt-4 px-4 sm:px-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                  className="w-full text-sm"
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Show {items.length - 3} More
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Summary Stats */}
            <div className="mt-6 pt-4 border-t mx-4 sm:mx-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="text-lg font-bold">{items.length}</div>
                </div>
                <div className="text-center p-2 bg-destructive/10 rounded-lg">
                  <div className="text-xs text-destructive">Expired</div>
                  <div className="text-lg font-bold text-destructive">
                    {items.filter(i => i.status === 'expired').length}
                  </div>
                </div>
                <div className="text-center p-2 bg-orange-50 rounded-lg">
                  <div className="text-xs text-orange-600">Within 7 Days</div>
                  <div className="text-lg font-bold text-orange-600">
                    {items.filter(i => i.status !== 'expired' && i.daysUntilExpiry <= 7).length}
                  </div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <div className="text-xs text-green-600">30+ Days</div>
                  <div className="text-lg font-bold text-green-600">
                    {items.filter(i => i.daysUntilExpiry > 30).length}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Container>
  );
}