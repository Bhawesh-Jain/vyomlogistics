// app/dashboard/blocks/expiring-items.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExpiringItem } from '@/lib/repositories/miscRepository';
import { AlertTriangle, Calendar, FileText, ShieldAlert } from 'lucide-react';

interface ExpiringItemsProps {
  items: ExpiringItem[];
}

export function ExpiringItems({ items }: ExpiringItemsProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'expired':
        return 'destructive';
      case 'expiring':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'expired':
        return <ShieldAlert className="h-4 w-4" />;
      case 'expiring':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'agreement' ? <FileText className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />;
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Expiring Items
          </CardTitle>
          <CardDescription>No expiring items in the next 60 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>All agreements and licenses are up to date</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Expiring Items
          <Badge variant="secondary" className="ml-2">
            {items.length}
          </Badge>
        </CardTitle>
        <CardDescription>
          Items expiring in the next 60 days that require attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(item.type)}
                  <div>
                    <p className="font-medium text-sm capitalize">
                      {item.type}: {item.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.organization}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {new Date(item.expiryDate).toLocaleDateString()}
                  </p>
                  <p className={`text-xs ${
                    item.daysUntilExpiry < 0 
                      ? 'text-destructive' 
                      : item.daysUntilExpiry <= 7 
                        ? 'text-orange-600' 
                        : 'text-muted-foreground'
                  }`}>
                    {item.daysUntilExpiry < 0 
                      ? `Expired ${Math.abs(item.daysUntilExpiry)} days ago` 
                      : `${item.daysUntilExpiry} days left`
                    }
                  </p>
                </div>
                <Badge variant={getStatusVariant(item.status)} className="flex items-center gap-1">
                  {getStatusIcon(item.status)}
                  {item.status === 'expired' ? 'Expired' : 'Expiring'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}