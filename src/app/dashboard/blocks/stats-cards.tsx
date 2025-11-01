// components/dashboard/stats-cards.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardStats } from '@/lib/repositories/miscRepository';

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Organizations',
      value: stats.totalOrganizations,
      description: 'Active organizations',
      icon: '🏢',
    },
    {
      title: 'Active Agreements',
      value: stats.activeAgreements,
      description: `${stats.expiringAgreements} expiring soon`,
      icon: '📝',
      variant: stats.expiringAgreements > 0 ? 'warning' : 'default'
    },
    {
      title: 'Active Licenses',
      value: stats.activeLicenses,
      description: `${stats.expiringLicenses} expiring soon`,
      icon: '📄',
      variant: stats.expiringLicenses > 0 ? 'warning' : 'default'
    },
    {
      title: 'Godown Spaces',
      value: stats.occupiedSpaces,
      description: `of ${stats.totalGodowns} total occupied`,
      icon: '🏭',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index} className={card.variant === 'warning' ? 'border-orange-200 bg-orange-50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <span className="text-2xl">{card.icon}</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}