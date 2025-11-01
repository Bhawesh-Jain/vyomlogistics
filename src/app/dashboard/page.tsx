// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { StatsCards } from './blocks/stats-cards';
import { ExpiringItems } from './blocks/expiring-items';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Calendar } from 'lucide-react';
import { DashboardStats, ExpiringItem, RecentActivity } from '@/lib/repositories/miscRepository';
import { getDashboardStats, getExpiringItems } from '@/lib/actions/dashboard';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [expiringItems, setExpiringItems] = useState<ExpiringItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [statsData, expiringData] = await Promise.all([
          getDashboardStats(),
          getExpiringItems(),
        ]);

        setStats(statsData.result);
        setExpiringItems(expiringData.result);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const criticalExpiring = expiringItems.filter(item => 
    item.status === 'expired' || (item.status === 'expiring' && item.daysUntilExpiry <= 7)
  );

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalExpiring.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {criticalExpiring.length} items that have expired or are expiring within 7 days.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      {stats && <StatsCards stats={stats} />}

      <div className="grid gap-4">
        {/* Expiring Items */}
        <div className="col-span-4">
          <ExpiringItems items={expiringItems} />
        </div>

      </div>
    </div>
  );
}