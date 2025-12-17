'use client';

import { useEffect, useState } from 'react';
import { ExpiringItems } from './blocks/expiring-items';
import { QuickActions } from './blocks/quick-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Calendar, Building2, Loader2, RefreshCw } from 'lucide-react';
import { getDashboardData, getCompanyFinancialSummary, getExpiringItems } from '@/lib/actions/dashboard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CompanySelector } from './blocks/company-selector';
import { GodownPerformance } from './blocks/godown-performance';
import { ClientRevenue } from './blocks/client-revenue';
import { FinancialOverview } from './blocks/financial-overview';
import { AllCompaniesOverview } from './blocks/all-companies-overview';
import { MoneyHelper } from '@/lib/helpers/money-helper';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [allCompanyData, setAllCompanyData] = useState<any>(null);
  const [expiringItems, setExpiringItems] = useState<any[]>([]);
  const [loadingStates, setLoadingStates] = useState({
    allCompanies: false,
    companyData: false,
    expiringItems: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Load all companies data (only once)
  useEffect(() => {
    loadAllCompaniesData();
    loadExpiringItems();
  }, []);

  // Load company-specific data when company changes
  useEffect(() => {
    if (selectedCompany) {
      loadCompanyData(selectedCompany);
    } else {
      setCompanyData(null);
    }
  }, [selectedCompany]);

  const loadAllCompaniesData = async () => {
    setLoadingStates(prev => ({ ...prev, allCompanies: true }));
    setError(null);
    try {
      const result = await getDashboardData();
      if (result.success) {
        setAllCompanyData(result.result);
      } else {
        setError(result.error || 'Failed to load companies data');
      }
    } catch (error) {
      console.error('Failed to load companies data:', error);
      setError('Failed to load companies data');
    } finally {
      setLoadingStates(prev => ({ ...prev, allCompanies: false }));
    }
  };

  const loadCompanyData = async (companyId: number) => {
    setLoadingStates(prev => ({ ...prev, companyData: true }));
    setError(null);
    try {
      const result = await getCompanyFinancialSummary(companyId);
      if (result.success) {
        setCompanyData(result.result);
        setLastUpdated(new Date());
      } else {
        setError(result.error || 'Failed to load company data');
      }
    } catch (error) {
      console.error('Failed to load company data:', error);
      setError('Failed to load company data');
    } finally {
      setLoadingStates(prev => ({ ...prev, companyData: false }));
    }
  };

  const loadExpiringItems = async () => {
    setLoadingStates(prev => ({ ...prev, expiringItems: true }));
    try {
      const result = await getExpiringItems();
      if (result.success) {
        setExpiringItems(result.result);
      }
    } catch (error) {
      console.error('Failed to load expiring items:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, expiringItems: false }));
    }
  };

  const handleRefreshCompanyData = () => {
    if (selectedCompany) {
      loadCompanyData(selectedCompany);
    }
  };

  const handleRefreshAll = () => {
    loadAllCompaniesData();
    loadExpiringItems();
    if (selectedCompany) {
      loadCompanyData(selectedCompany);
    }
  };

  const criticalExpiring = expiringItems.filter(item =>
    item.status === 'expired' || (item.status === 'expiring' && item.daysUntilExpiry <= 7)
  );

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header Section */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={loadingStates.allCompanies}
            className="h-8"
          >
            <RefreshCw className={`h-3 w-3 mr-2 ${loadingStates.allCompanies ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
        </div>

        <div className="flex items-center space-x-4">
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
          {companyData && (
            <div className="text-xs text-muted-foreground">
              Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex justify-between items-center">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* All Companies Overview - Always shown */}
      {loadingStates.allCompanies ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : allCompanyData ? (
        <AllCompaniesOverview data={allCompanyData} />
      ) : null}

      {/* Company Selector */}
      <CompanySelector
        selectedCompany={selectedCompany}
        onCompanyChange={setSelectedCompany}
      />

      {/* Critical Alerts */}
      {criticalExpiring.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex justify-between items-center">
            <span>
              You have {criticalExpiring.length} item{criticalExpiring.length !== 1 ? 's' : ''} that
              {criticalExpiring.length === 1 ? ' has' : ' have'} expired or {criticalExpiring.length === 1 ? 'is' : 'are'} expiring within 7 days.
            </span>
            <Button variant="outline" size="sm" onClick={loadExpiringItems}>
              Refresh
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Company Details Section */}
      {selectedCompany && (
        <div className="space-y-4">
          {/* Refresh button for company data */}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshCompanyData}
              disabled={loadingStates.companyData}
              className="text-sm"
            >
              <RefreshCw className={`h-3 w-3 mr-2 ${loadingStates.companyData ? 'animate-spin' : ''}`} />
              Refresh Company Data
            </Button>
          </div>

          {loadingStates.companyData ? (
            <CompanyDataSkeleton />
          ) : companyData ? (
            <>
              {/* Financial Overview */}
              <FinancialOverview data={companyData} />

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="xl:col-span-6 gap-4 grid grid-cols-2">
                  {/* Expiring Items with refresh button */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Expiring Items</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadExpiringItems}
                        disabled={loadingStates.expiringItems}
                        className="h-6 w-6 p-0"
                      >
                        <RefreshCw className={`h-3 w-3 ${loadingStates.expiringItems ? 'animate-spin' : ''}`} />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {loadingStates.expiringItems ? (
                        <div className="space-y-2">
                          {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                          ))}
                        </div>
                      ) : (
                        <ExpiringItems items={expiringItems} />
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick Stats Card */}
                  <QuickStatsCard data={companyData} />
                </div>
                {/* Client Revenue */}
                <div className="xl:col-span-1">
                  <ClientRevenue clients={companyData.clientRevenue} />
                </div>

                {/* Godown Performance */}
                <div className="xl:col-span-1">
                  <GodownPerformance godowns={companyData.godownPerformance} />
                </div>
              </div>
            </>
          ) : (
            <NoCompanyDataMessage />
          )}
        </div>
      )}

      {!selectedCompany && !loadingStates.companyData && (
        <NoCompanySelectedMessage />
      )}
    </div>
  );
}

// Skeleton component for loading state
function CompanyDataSkeleton() {
  return (
    <div className="space-y-4">
      {/* Financial Overview Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="h-96">
            <CardHeader>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} className="h-20 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Quick Stats Card Component
function QuickStatsCard({ data }: { data: any }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
        <Building2 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Organizations:</span>
            <span className="font-medium">{data.financial.total_clients || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Active Agreements:</span>
            <div className="flex items-center space-x-2">
              <span className="font-medium">{data.financial.active_agreements || 0}</span>
              <span className="text-xs text-muted-foreground">
                / {data.financial.total_agreements || 0} total
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Space Utilization:</span>
            <div className="flex items-center space-x-2">
              <span className="font-medium">{Math.round(parseFloat(data.financial.utilization_rate) || 0)}%</span>
              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-blue-500"
                  style={{ width: `${Math.min(parseFloat(data.financial.utilization_rate) || 0, 100)}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Monthly Revenue:</span>
            <span className="font-medium text-green-600">
              {MoneyHelper.formatRupees(parseFloat(data.financial.total_revenue) || 0)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Godowns:</span>
            <span className="font-medium">{data.financial.total_godowns || 0}</span>
          </div>
          <div className="pt-3 border-t">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Available Space:</span>
              <span>{(parseFloat(data.financial.available_space) || 0).toLocaleString()} sqft</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// No Company Selected Message
function NoCompanySelectedMessage() {
  return (
    <Card className="border-dashed">
      <CardContent className="pt-6">
        <div className="text-center py-12">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">Select a Company</h3>
          <p className="text-muted-foreground mb-4">
            Choose a company from the dropdown above to view detailed analytics and financial data.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span>You can still see overall statistics in the All Companies section above</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// No Company Data Message
function NoCompanyDataMessage() {
  return (
    <Card className="border-dashed border-yellow-200 bg-yellow-50">
      <CardContent className="pt-6">
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
          <h3 className="text-lg font-medium mb-2">No Data Available</h3>
          <p className="text-muted-foreground mb-4">
            Could not load data for the selected company. Please try refreshing or select another company.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}