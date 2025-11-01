// components/dashboard/expiring-items.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExpiringItem } from '@/lib/repositories/miscRepository';

interface ExpiringItemsProps {
  items: ExpiringItem[];
}

export function ExpiringItems({ items }: ExpiringItemsProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'expired':
        return 'destructive';
      case 'expiring':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string, days: number) => {
    switch (status) {
      case 'expired':
        return 'Expired';
      case 'expiring':
        return `Expires in ${days} days`;
      default:
        return 'Active';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expiring Items</CardTitle>
        <CardDescription>
          Agreements and licenses expiring in the next 60 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No expiring items found
            </p>
          ) : (
            items.map((item) => (
              <div key={`${item.type}-${item.id}`} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={item.type === 'agreement' ? 'text-blue-600' : 'text-green-600'}>
                      {item.type === 'agreement' ? '📝' : '📄'}
                    </span>
                    <p className="text-sm font-medium">{item.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.organization} • Expires: {new Date(item.expiryDate).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={getStatusVariant(item.status) as any}>
                  {getStatusText(item.status, item.daysUntilExpiry)}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}