import { executeQuery } from "../helpers/db-helper";
import { RepositoryBase } from "../helpers/repository-base"

export interface DashboardStats {
  totalOrganizations: number;
  activeAgreements: number;
  expiringAgreements: number;
  activeLicenses: number;
  expiringLicenses: number;
  totalGodowns: number;
  occupiedSpaces: number;
}

export interface ExpiringItem {
  id: number;
  name: string;
  type: 'agreement' | 'license';
  expiryDate: string;
  daysUntilExpiry: number;
  organization: string;
  status: 'active' | 'expired' | 'expiring';
}

export interface RecentActivity {
  id: number;
  type: string;
  description: string;
  timestamp: string;
  user: string;
}

export class MiscRepository extends RepositoryBase {
  private userId: String;

  constructor(userId: string) {
    super();
    this.userId = userId;
  }

  async getDashboardStats() {
    try {
      const stats = await executeQuery(`
          SELECT 
            COUNT(DISTINCT o.org_id) as total_organizations,
            COUNT(DISTINCT CASE WHEN oa.status = 1 AND oa.valid_upto >= CURDATE() THEN oa.agreement_id END) as active_agreements,
            COUNT(DISTINCT CASE WHEN oa.status = 1 AND oa.valid_upto BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN oa.agreement_id END) as expiring_agreements,
            COUNT(DISTINCT CASE WHEN ol.status = 1 AND ol.valid_upto >= CURDATE() THEN ol.license_id END) as active_licenses,
            COUNT(DISTINCT CASE WHEN ol.status = 1 AND ol.valid_upto BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN ol.license_id END) as expiring_licenses,
            COUNT(DISTINCT g.godown_id) as total_godowns,
            COUNT(DISTINCT CASE WHEN gs.is_occupied = 1 THEN gs.space_id END) as occupied_spaces
          FROM organizations o
          LEFT JOIN organization_agreements oa ON o.org_id = oa.org_id
          LEFT JOIN organization_licenses ol ON o.org_id = ol.org_id
          LEFT JOIN godowns g ON o.org_id = g.org_id
          LEFT JOIN godown_spaces gs ON g.godown_id = gs.godown_id
          WHERE o.status = 1
        `, []) as any[];

      const data = {
        totalOrganizations: stats[0]?.total_organizations || 0,
        activeAgreements: stats[0]?.active_agreements || 0,
        expiringAgreements: stats[0]?.expiring_agreements || 0,
        activeLicenses: stats[0]?.active_licenses || 0,
        expiringLicenses: stats[0]?.expiring_licenses || 0,
        totalGodowns: stats[0]?.total_godowns || 0,
        occupiedSpaces: stats[0]?.occupied_spaces || 0,
      };

      return this.success(data);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getExpiringItems() {
    try {
      const agreements = await executeQuery(`
      SELECT 
        oa.agreement_id as id,
        o.org_name as name,
        'agreement' as type,
        oa.valid_upto as expiry_date,
        DATEDIFF(oa.valid_upto, CURDATE()) as days_until_expiry,
        o.org_name as organization,
        CASE 
          WHEN oa.valid_upto < CURDATE() THEN 'expired'
          WHEN DATEDIFF(oa.valid_upto, CURDATE()) <= 30 THEN 'expiring'
          ELSE 'active'
        END as status
      FROM organization_agreements oa
      INNER JOIN organizations o ON oa.org_id = o.org_id
      WHERE oa.status = 1
        AND (oa.valid_upto < CURDATE() OR DATEDIFF(oa.valid_upto, CURDATE()) <= 60)
      ORDER BY oa.valid_upto ASC
      LIMIT 10
    `, []) as any[];

      const licenses = await executeQuery(`
      SELECT 
        ol.license_id as id,
        ol.business_type as name,
        'license' as type,
        ol.valid_upto as expiry_date,
        DATEDIFF(ol.valid_upto, CURDATE()) as days_until_expiry,
        o.org_name as organization,
        CASE 
          WHEN ol.valid_upto < CURDATE() THEN 'expired'
          WHEN DATEDIFF(ol.valid_upto, CURDATE()) <= 30 THEN 'expiring'
          ELSE 'active'
        END as status
      FROM organization_licenses ol
      INNER JOIN organizations o ON ol.org_id = o.org_id
      WHERE ol.status = 1
        AND (ol.valid_upto < CURDATE() OR DATEDIFF(ol.valid_upto, CURDATE()) <= 60)
      ORDER BY ol.valid_upto ASC
      LIMIT 10
    `, []) as any[];

      const combinedItems: ExpiringItem[] = [...agreements, ...licenses].map(item => ({
        ...item,
        expiryDate: item.expiry_date,
        daysUntilExpiry: item.days_until_expiry,
      }));

      return this.success(combinedItems);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getComprehensiveSummary() {
    try {
      // Get company ID for the current user
      const userCompany = await executeQuery(`
        SELECT company_id FROM users WHERE id = ?
      `, [this.userId]) as any[];

      if (!userCompany.length) {
        return this.failure('User company not found');
      }

      const companyId = userCompany[0].company_id;

      // Combined Summary
      const combinedSummary = await executeQuery(`
        SELECT 
          -- Company Stats
          COUNT(DISTINCT cm.company_id) as total_companies,
          
          -- Organization/Client Stats
          COUNT(DISTINCT o.org_id) as total_clients,
          COUNT(DISTINCT CASE WHEN o.status = 1 THEN o.org_id END) as active_clients,
          
          -- Agreement Stats
          COUNT(DISTINCT oa.agreement_id) as total_agreements,
          COUNT(DISTINCT CASE WHEN oa.status = 1 AND oa.valid_upto >= CURDATE() THEN oa.agreement_id END) as active_agreements,
          COUNT(DISTINCT CASE WHEN oa.status = 1 AND oa.valid_upto BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN oa.agreement_id END) as expiring_agreements,
          
          -- License Stats
          COUNT(DISTINCT ol.license_id) as total_licenses,
          COUNT(DISTINCT CASE WHEN ol.status = 1 AND ol.valid_upto >= CURDATE() THEN ol.license_id END) as active_licenses,
          
          -- Godown Space Stats
          COUNT(DISTINCT g.godown_id) as total_godowns,
          SUM(g.total_capacity) as total_capacity,
          COALESCE(SUM(gsa.space_allocated), 0) as total_allocated_space,
          COUNT(DISTINCT gsa.allocation_id) as active_allocations,
          
          -- Data Bank Stats
          COUNT(DISTINCT df.folder_id) as total_folders,
          COUNT(DISTINCT fl.id) as total_files,
          COALESCE(SUM(fl.file_size), 0) as total_storage_used,
          COUNT(DISTINCT fp.user_id) as users_with_access
          
        FROM company_master cm
        LEFT JOIN organizations o ON cm.company_id = o.company_id
        LEFT JOIN organization_agreements oa ON o.org_id = oa.org_id
        LEFT JOIN organization_licenses ol ON o.org_id = ol.license_id
        LEFT JOIN godowns g ON cm.company_id = g.company_id
        LEFT JOIN godown_space_allocations gsa ON g.godown_id = gsa.godown_id AND gsa.status = 1
        LEFT JOIN data_folders df ON cm.company_id = df.org_id OR o.org_id = df.org_id
        LEFT JOIN file_log fl ON df.folder_id = fl.associated_id AND fl.associated_type = 'data_file'
        LEFT JOIN folder_permissions fp ON df.folder_id = fp.folder_id
        WHERE cm.company_id = ?
      `, [companyId]) as any[];

      // Company-wise Summary
      const companyWiseSummary = await executeQuery(`
        SELECT 
          cm.company_id,
          cm.company_name,
          cm.abbr,
          COUNT(DISTINCT o.org_id) as client_count,
          COUNT(DISTINCT oa.agreement_id) as agreement_count,
          COUNT(DISTINCT ol.license_id) as license_count,
          COUNT(DISTINCT g.godown_id) as godown_count,
          COALESCE(SUM(g.total_capacity), 0) as total_capacity,
          COALESCE(SUM(gsa.space_allocated), 0) as allocated_space,
          COUNT(DISTINCT df.folder_id) as folder_count,
          COUNT(DISTINCT fl.id) as file_count,
          COALESCE(SUM(fl.file_size), 0) as storage_used
          
        FROM company_master cm
        LEFT JOIN organizations o ON cm.company_id = o.company_id
        LEFT JOIN organization_agreements oa ON o.org_id = oa.org_id
        LEFT JOIN organization_licenses ol ON o.org_id = ol.org_id
        LEFT JOIN godowns g ON cm.company_id = g.company_id
        LEFT JOIN godown_space_allocations gsa ON g.godown_id = gsa.godown_id AND gsa.status = 1
        LEFT JOIN data_folders df ON cm.company_id = df.org_id OR o.org_id = df.org_id
        LEFT JOIN file_log fl ON df.folder_id = fl.associated_id AND fl.associated_type = 'data_file'
        WHERE cm.company_id = ?
        GROUP BY cm.company_id, cm.company_name, cm.abbr
      `, [companyId]) as any[];

      // Monthly Summary (Last 12 months)
      const monthlySummary = await executeQuery(`
        SELECT 
          DATE_FORMAT(date_range.month, '%Y-%m') as month,
          DATE_FORMAT(date_range.month, '%M %Y') as month_name,
          COUNT(DISTINCT o.org_id) as new_clients,
          COUNT(DISTINCT oa.agreement_id) as new_agreements,
          COUNT(DISTINCT gsa.allocation_id) as new_allocations,
          COALESCE(SUM(gsa.space_allocated), 0) as space_allocated,
          COALESCE(SUM(gsa.monthly_rent), 0) as monthly_rent,
          COUNT(DISTINCT fl.id) as files_uploaded,
          COALESCE(SUM(fl.file_size), 0) as storage_added
          
        FROM (
          SELECT DATE_FORMAT(CURDATE() - INTERVAL (a.a + (10 * b.a) + (100 * c.a)) MONTH, '%Y-%m-01') as month
          FROM (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS a
          CROSS JOIN (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS b
          CROSS JOIN (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS c
        ) date_range
        LEFT JOIN organizations o ON DATE_FORMAT(o.created_on, '%Y-%m') = DATE_FORMAT(date_range.month, '%Y-%m') AND o.company_id = ?
        LEFT JOIN organization_agreements oa ON DATE_FORMAT(oa.created_on, '%Y-%m') = DATE_FORMAT(date_range.month, '%Y-%m') AND oa.org_id IN (SELECT org_id FROM organizations WHERE company_id = ?)
        LEFT JOIN godown_space_allocations gsa ON DATE_FORMAT(gsa.created_on, '%Y-%m') = DATE_FORMAT(date_range.month, '%Y-%m') AND gsa.godown_id IN (SELECT godown_id FROM godowns WHERE company_id = ?)
        LEFT JOIN file_log fl ON DATE_FORMAT(fl.created_on, '%Y-%m') = DATE_FORMAT(date_range.month, '%Y-%m') AND fl.company_id = ?
        WHERE date_range.month >= DATE_FORMAT(CURDATE() - INTERVAL 11 MONTH, '%Y-%m-01')
          AND date_range.month <= DATE_FORMAT(CURDATE(), '%Y-%m-01')
        GROUP BY date_range.month
        ORDER BY date_range.month DESC
      `, [companyId, companyId, companyId, companyId]) as any[];

      // Space Utilization Details
      const spaceUtilization = await executeQuery(`
        SELECT 
          g.godown_id,
          g.godown_name,
          g.location,
          g.total_capacity,
          g.capacity_unit,
          COALESCE(SUM(gsa.space_allocated), 0) as allocated_space,
          (COALESCE(SUM(gsa.space_allocated), 0) / g.total_capacity * 100) as utilization_percentage,
          COUNT(DISTINCT gsa.org_id) as clients_allocated,
          COALESCE(SUM(gsa.monthly_rent), 0) as monthly_rent_earned
          
        FROM godowns g
        LEFT JOIN godown_space_allocations gsa ON g.godown_id = gsa.godown_id AND gsa.status = 1
        WHERE g.company_id = ?
        GROUP BY g.godown_id, g.godown_name, g.location, g.total_capacity, g.capacity_unit
        ORDER BY utilization_percentage DESC
      `, [companyId]) as any[];

      // Data Bank Usage Summary
      const dataBankSummary = await executeQuery(`
        SELECT 
          df.folder_id,
          df.folder_name,
          COALESCE(p.parent_name, 'Root') as parent_folder,
          o.org_name as organization,
          COUNT(DISTINCT fl.id) as file_count,
          COALESCE(SUM(fl.file_size), 0) as total_size,
          COUNT(DISTINCT fp.user_id) as users_with_access,
          MAX(fl.created_on) as last_upload
          
        FROM data_folders df
        LEFT JOIN data_folders p ON df.parent_id = p.folder_id
        LEFT JOIN organizations o ON df.org_id = o.org_id
        LEFT JOIN file_log fl ON df.folder_id = fl.associated_id AND fl.associated_type = 'data_file' AND fl.status = 1
        LEFT JOIN folder_permissions fp ON df.folder_id = fp.folder_id
        WHERE o.company_id = ? OR df.org_id IN (SELECT org_id FROM organizations WHERE company_id = ?)
        GROUP BY df.folder_id, df.folder_name, p.parent_name, o.org_name
        ORDER BY total_size DESC
      `, [companyId, companyId]) as any[];

      const summary = {
        combined: combinedSummary[0] || {},
        companies: companyWiseSummary,
        monthly: monthlySummary,
        spaceUtilization: spaceUtilization,
        dataBank: dataBankSummary,
        summaryDate: new Date().toISOString()
      };

      return this.success(summary);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getQuickStats() {
    try {
      const userCompany = await executeQuery(`
        SELECT company_id FROM users WHERE id = ?
      `, [this.userId]) as any[];

      if (!userCompany.length) {
        return this.failure('User company not found');
      }

      const companyId = userCompany[0].company_id;

      const quickStats = await executeQuery(`
        SELECT 
          -- Core Business Metrics
          (SELECT COUNT(*) FROM organizations WHERE company_id = ? AND status = 1) as active_clients,
          (SELECT COUNT(*) FROM organization_agreements oa 
           JOIN organizations o ON oa.org_id = o.org_id 
           WHERE o.company_id = ? AND oa.status = 1 AND oa.valid_upto >= CURDATE()) as active_agreements,
          
          -- Space Metrics
          (SELECT COALESCE(SUM(total_capacity), 0) FROM godowns WHERE company_id = ?) as total_capacity,
          (SELECT COALESCE(SUM(space_allocated), 0) FROM godown_space_allocations gsa 
           JOIN godowns g ON gsa.godown_id = g.godown_id 
           WHERE g.company_id = ? AND gsa.status = 1) as allocated_space,
          
          -- Financial Metrics
          (SELECT COALESCE(SUM(monthly_rent), 0) FROM godown_space_allocations gsa 
           JOIN godowns g ON gsa.godown_id = g.godown_id 
           WHERE g.company_id = ? AND gsa.status = 1) as monthly_revenue,
          
          -- Data Metrics
          (SELECT COUNT(*) FROM data_folders df 
           WHERE df.org_id IN (SELECT org_id FROM organizations WHERE company_id = ?)) as data_folders,
          (SELECT COALESCE(SUM(file_size), 0) FROM file_log 
           WHERE company_id = ? AND status = 1) as total_storage_used,
          
          -- Expiry Alerts
          (SELECT COUNT(*) FROM organization_agreements oa 
           JOIN organizations o ON oa.org_id = o.org_id 
           WHERE o.company_id = ? AND oa.status = 1 
           AND oa.valid_upto BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)) as agreements_expiring_soon

      `, [companyId, companyId, companyId, companyId, companyId, companyId, companyId, companyId]) as any[];

      return this.success(quickStats[0] || {});
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getUserCompanies() {
    try {
      const companies = await executeQuery(`
        SELECT DISTINCT cm.* 
        FROM company_master cm
        ORDER BY cm.company_name
      `, []) as any[];

      return this.success(companies);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getCompanyFinancialSummary(companyId: number) {
    try {
      // Company Financial Overview
      const financialSummary = await executeQuery(`
        SELECT 
          cm.company_id,
          cm.company_name,
          
          -- Client & Agreement Stats
          COUNT(DISTINCT o.org_id) as total_clients,
          COUNT(DISTINCT oa.agreement_id) as total_agreements,
          COUNT(DISTINCT CASE WHEN oa.status = 1 AND oa.valid_upto >= CURDATE() THEN oa.agreement_id END) as active_agreements,
          
          -- Godown Space & Revenue
          COUNT(DISTINCT g.godown_id) as total_godowns,
          COALESCE(SUM(g.total_capacity), 0) as total_capacity,
          COALESCE(SUM(gsa.space_allocated), 0) as allocated_space,
          (COALESCE(SUM(gsa.space_allocated), 0) / COALESCE(SUM(g.total_capacity), 1) * 100) as utilization_rate,
          COALESCE(SUM(gsa.monthly_rent), 0) as monthly_revenue,
          
          -- Available for Subletting
          (COALESCE(SUM(g.total_capacity), 0) - COALESCE(SUM(gsa.space_allocated), 0)) as available_space,
          
          -- Billing Summary
          COUNT(DISTINCT br.bill_id) as total_invoices,
          COALESCE(SUM(CASE WHEN br.status = 'paid' THEN br.grand_total ELSE 0 END), 0) as total_paid,
          COALESCE(SUM(CASE WHEN br.status IN ('generated', 'sent') THEN br.grand_total ELSE 0 END), 0) as total_pending
          
        FROM company_master cm
        LEFT JOIN organizations o ON cm.company_id = o.company_id
        LEFT JOIN organization_agreements oa ON o.org_id = oa.org_id
        LEFT JOIN godowns g ON cm.company_id = g.company_id
        LEFT JOIN godown_space_allocations gsa ON g.godown_id = gsa.godown_id AND gsa.status = 1
        LEFT JOIN billing_records br ON cm.company_id = br.org_id
        WHERE cm.company_id = ?
        GROUP BY cm.company_id, cm.company_name
      `, [companyId]) as any[];

      // Client-wise Revenue
      const clientRevenue = await executeQuery(`
        SELECT 
          o.org_id,
          o.org_name,
          o.contact_person,
          o.contact_number,
          COUNT(DISTINCT gsa.allocation_id) as space_allocations,
          COALESCE(SUM(gsa.monthly_rent), 0) as monthly_rent,
          COUNT(DISTINCT br.bill_id) as total_invoices,
          COALESCE(SUM(CASE WHEN br.status = 'paid' THEN br.grand_total ELSE 0 END), 0) as total_paid,
          COALESCE(SUM(CASE WHEN br.status IN ('generated', 'sent') THEN br.grand_total ELSE 0 END), 0) as total_pending,
          MAX(br.bill_date) as last_billing_date
          
        FROM organizations o
        LEFT JOIN godown_space_allocations gsa ON o.org_id = gsa.org_id AND gsa.status = 1
        LEFT JOIN billing_records br ON o.org_id = br.allocated_to_org_id
        WHERE o.company_id = ?
        GROUP BY o.org_id, o.org_name, o.contact_person, o.contact_number
        ORDER BY monthly_rent DESC
      `, [companyId]) as any[];

      // Godown-wise Performance
      const godownPerformance = await executeQuery(`
        SELECT 
          g.godown_id,
          g.godown_name,
          g.location,
          g.total_capacity,
          g.capacity_unit,
          g.monthly_rent as godown_rent,
          COALESCE(SUM(gsa.space_allocated), 0) as allocated_space,
          (COALESCE(SUM(gsa.space_allocated), 0) / g.total_capacity * 100) as utilization_percentage,
          COALESCE(SUM(gsa.monthly_rent), 0) as revenue_generated,
          COUNT(DISTINCT gsa.org_id) as clients_allocated,
          (g.total_capacity - COALESCE(SUM(gsa.space_allocated), 0)) as available_space,
          (COALESCE(SUM(gsa.monthly_rent), 0) - g.monthly_rent) as net_profit
          
        FROM godowns g
        LEFT JOIN godown_space_allocations gsa ON g.godown_id = gsa.godown_id AND gsa.status = 1
        WHERE g.company_id = ?
        GROUP BY g.godown_id, g.godown_name, g.location, g.total_capacity, g.capacity_unit, g.monthly_rent
        ORDER BY net_profit DESC
      `, [companyId]) as any[];

      // Monthly Revenue Trend
      const monthlyRevenue = await executeQuery(`
        SELECT 
          DATE_FORMAT(date_range.month, '%Y-%m') as month,
          DATE_FORMAT(date_range.month, '%M %Y') as month_name,
          COALESCE(SUM(gsa.monthly_rent), 0) as estimated_revenue,
          COALESCE(SUM(br.grand_total), 0) as invoiced_amount,
          COALESCE(SUM(CASE WHEN br.status = 'paid' THEN br.grand_total ELSE 0 END), 0) as collected_amount,
          COUNT(DISTINCT br.bill_id) as invoices_generated
          
        FROM (
          SELECT DATE_FORMAT(CURDATE() - INTERVAL (a.a + (10 * b.a)) MONTH, '%Y-%m-01') as month
          FROM (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS a
          CROSS JOIN (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS b
        ) date_range
        LEFT JOIN godown_space_allocations gsa ON DATE_FORMAT(gsa.created_on, '%Y-%m') <= DATE_FORMAT(date_range.month, '%Y-%m') AND gsa.status = 1
        LEFT JOIN billing_records br ON DATE_FORMAT(br.billing_period_start, '%Y-%m') = DATE_FORMAT(date_range.month, '%Y-%m') AND br.org_id = ?
        WHERE date_range.month >= DATE_FORMAT(CURDATE() - INTERVAL 11 MONTH, '%Y-%m-01')
          AND date_range.month <= DATE_FORMAT(CURDATE(), '%Y-%m-01')
        GROUP BY date_range.month
        ORDER BY date_range.month DESC
      `, [companyId]) as any[];

      // Organizations List with Details
      const organizations = await executeQuery(`
        SELECT 
          o.*,
          cm.company_name,
          COUNT(DISTINCT oa.agreement_id) as agreement_count,
          COUNT(DISTINCT ol.license_id) as license_count,
          COUNT(DISTINCT gsa.allocation_id) as space_allocations,
          COALESCE(SUM(gsa.monthly_rent), 0) as monthly_rent,
          COUNT(DISTINCT br.bill_id) as invoice_count,
          MAX(br.bill_date) as last_billing_date
          
        FROM organizations o
        LEFT JOIN company_master cm ON o.company_id = cm.company_id
        LEFT JOIN organization_agreements oa ON o.org_id = oa.org_id
        LEFT JOIN organization_licenses ol ON o.org_id = ol.org_id
        LEFT JOIN godown_space_allocations gsa ON o.org_id = gsa.org_id AND gsa.status = 1
        LEFT JOIN billing_records br ON o.org_id = br.allocated_to_org_id
        WHERE o.company_id = ?
        GROUP BY o.org_id, o.org_name, o.contact_person, o.contact_number, o.location, o.pincode, o.signed_on, o.status, cm.company_name
        ORDER BY monthly_rent DESC
      `, [companyId]) as any[];

      const summary = {
        financial: financialSummary[0] || {},
        clientRevenue,
        godownPerformance,
        monthlyRevenue,
        organizations,
        summaryDate: new Date().toISOString()
      };

      return this.success(summary);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getAllCompaniesSummary() {
    try {
      const companies = await this.getUserCompanies();
      if (!companies.success) return companies;

      const summaries = [];
      for (const company of companies.result) {
        const summary = await this.getCompanyFinancialSummary(company.company_id);
        if (summary.success) {
          summaries.push({
            company: company,
            summary: summary.result
          });
        }
      }

      return this.success(summaries);
    } catch (error) {
      return this.handleError(error);
    }
  }
}