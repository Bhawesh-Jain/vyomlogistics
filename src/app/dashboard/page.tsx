'use client';

import { useEffect, useState } from 'react';
import { ExpiringItems } from './blocks/expiring-items';
import { QuickActions } from './blocks/quick-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Calendar, Building2 } from 'lucide-react';
import { getDashboardData, getCompanyFinancialSummary, getExpiringItems } from '@/lib/actions/dashboard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CompanySelector } from './blocks/company-selector';
import { GodownPerformance } from './blocks/godown-performance';
import { ClientRevenue } from './blocks/client-revenue';
import { FinancialOverview } from './blocks/financial-overview';
import { AllCompaniesOverview } from './blocks/all-companies-overview';

export default function DashboardPage() {
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [allCompanyData, setAllCompanyData] = useState<any>(null);
  const [expiringItems, setExpiringItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCompanyData() {
      if (!selectedCompany) return;

      try {
        setLoading(true);
        const [companyData, expiringData, allCompanyData] = await Promise.all([
          getCompanyFinancialSummary(selectedCompany),
          getExpiringItems(),
          getDashboardData()
        ]);

        if (companyData.success) {
          setCompanyData(companyData.result);
        }
        if (expiringData.success) {
          setExpiringItems(expiringData.result);
        }
        if (allCompanyData.success) {
          setAllCompanyData(allCompanyData.result);
        }
      } catch (error) {
        console.error('Failed to load company data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCompanyData();
  }, [selectedCompany]);

  const criticalExpiring = expiringItems.filter(item =>
    item.status === 'expired' || (item.status === 'expiring' && item.daysUntilExpiry <= 7)
  );

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center justify-between">
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

      {!loading && <AllCompaniesOverview data={allCompanyData} />}

      {/* Company Selector */}
      <CompanySelector
        selectedCompany={selectedCompany}
        onCompanyChange={setSelectedCompany}
      />

      {/* Critical Alerts */}
      {criticalExpiring.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {criticalExpiring.length} items that have expired or are expiring within 7 days.
          </AlertDescription>
        </Alert>
      )}

      {loading && selectedCompany && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading company data...</p>
        </div>
      )}

      {companyData && !loading && (
        <>
          {/* Financial Overview */}
          <FinancialOverview data={companyData} />

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {/* Client Revenue - Takes 1 column */}
            <div className="xl:col-span-1">
              <ClientRevenue clients={companyData.clientRevenue} />
            </div>

            {/* Godown Performance - Takes 1 column */}
            <div className="xl:col-span-1">
              <GodownPerformance godowns={companyData.godownPerformance} />
            </div>

            {/* Right Sidebar - Takes 1 column */}
            <div className="space-y-4 xl:col-span-1">
              <ExpiringItems items={expiringItems} />

              {/* Quick Stats Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Organizations:</span>
                      <span className="font-medium">{companyData.organizations.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Agreements:</span>
                      <span className="font-medium">{companyData.financial.active_agreements}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Space Utilization:</span>
                      <span className="font-medium">{Math.round(companyData.financial.utilization_rate || 0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending Invoices:</span>
                      <span className="font-medium text-red-600">₹{companyData.financial.total_pending.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {!selectedCompany && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">Select a Company</h3>
              <p className="text-muted-foreground">
                Choose a company from the dropdown above to view detailed analytics and financial data.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}