// app/dashboard/blocks/stats-cards.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardStats } from '@/lib/repositories/miscRepository';
import { 
  Building2, 
  FileCheck, 
  FileWarning, 
  Warehouse, 
  SquareStack,
  AlertTriangle,
  Calendar
} from 'lucide-react';

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const statCards = [
    {
      title: 'Total Organizations',
      value: stats.totalOrganizations,
      icon: Building2,
      description: 'Active clients',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Agreements',
      value: stats.activeAgreements,
      icon: FileCheck,
      description: `${stats.expiringAgreements} expiring soon`,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Active Licenses',
      value: stats.activeLicenses,
      icon: FileCheck,
      description: `${stats.expiringLicenses} expiring soon`,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Godown Spaces',
      value: stats.totalGodowns,
      icon: Warehouse,
      description: `${stats.occupiedSpaces} occupied`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <div className={`h-8 w-8 rounded-full ${card.bgColor} flex items-center justify-center`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
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