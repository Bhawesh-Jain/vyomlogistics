// app/dashboard/blocks/company-selector.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, TrendingUp, Users, Warehouse } from 'lucide-react';
import { getUserCompanies } from '@/lib/actions/dashboard';

interface Company {
  company_id: number;
  company_name: string;
  abbr: string;
  currency_symbol: string;
}

interface CompanySelectorProps {
  onCompanyChange: (companyId: number) => void;
  selectedCompany: number | null;
}

export function CompanySelector({ onCompanyChange, selectedCompany }: CompanySelectorProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCompanies() {
      try {
        const result = await getUserCompanies();
        if (result.success && result.result.length > 0) {
          setCompanies(result.result);
          // Auto-select first company if none selected
          if (!selectedCompany && result.result[0]) {
            onCompanyChange(result.result[0].company_id);
          }
        }
      } catch (error) {
        console.error('Failed to load companies:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCompanies();
  }, [selectedCompany, onCompanyChange]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Company</CardTitle>
          <CardDescription>Loading companies...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Company Overview
        </CardTitle>
        <CardDescription>Select a company to view detailed analytics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Select
            value={selectedCompany?.toString() || ''}
            onValueChange={(value) => onCompanyChange(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a company" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.company_id} value={company.company_id.toString()}>
                  {company.company_name} ({company.abbr})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {companies.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {companies.map((company) => (
                <button
                  key={company.company_id}
                  onClick={() => onCompanyChange(company.company_id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedCompany === company.company_id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {company.abbr}
                </button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}