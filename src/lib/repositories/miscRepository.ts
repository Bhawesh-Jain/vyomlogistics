import { executeQuery } from "../helpers/db-helper";
import { RepositoryBase } from "../helpers/repository-base"
import { Company } from "./companyRepository";

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

  async getUserCompanies() {
    try {
      const companies = await executeQuery(`
        SELECT DISTINCT cm.* 
        FROM company_master cm
        WHERE cm.is_active = 1
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

  async getDashboardData() {
    try {
      let sql = `
        SELECT SUM(it.total) as total_invoice_amount
        FROM invoice_items it
        LEFT JOIN organizations o ON o.org_id = it.org_id
        WHERE o.status = 1
          AND it.status = 1
      `;
      const totalInvoiceAmount = Number((await executeQuery(sql) as any[])[0].total_invoice_amount);

      sql = `
        SELECT COALESCE(SUM(a.space_allocated), 0) AS total_space_allocated,
          COALESCE(SUM(a.monthly_rent), 0) AS total_rent_collected
        FROM godowns g
        LEFT JOIN godown_space_allocations a 
          ON g.godown_id = a.godown_id 
          AND a.status = 1
        LEFT JOIN organization_agreements oa 
          ON oa.agreement_id = a.agreement_id 
          AND oa.status > 0 
          AND CURDATE() BETWEEN oa.start_date AND oa.valid_upto
        WHERE g.is_active = 1
          AND a.status = 1
          AND (oa.agreement_id IS NULL OR oa.org_id = a.org_id)
        GROUP BY g.godown_id
        ORDER BY g.godown_name ASC
      `;
      const godownSummary = (await executeQuery(sql) as any[]);
      const totalSpaceAllocated = godownSummary.reduce((accumulator, currentValue) => Number(accumulator) + Number(currentValue.total_space_allocated), 0)
      const totalRentCollected = godownSummary.reduce((accumulator, currentValue) => Number(accumulator) + Number(currentValue.total_rent_collected), 0)

      const totalMonthlyRevenue = Number(totalInvoiceAmount) + Number(totalRentCollected);

      sql = `
        SELECT COUNT(*) as total_clients
        FROM organizations
        WHERE status = 1
      `;
      const totalClients = Number((await executeQuery(sql) as any[])[0].total_clients);

      sql = `
        SELECT SUM(monthly_rent) as monthly_rent,
          SUM(total_capacity) as total_capacity
        FROM godowns
        WHERE is_active = 1
      `;
      const godownTotals = (await executeQuery(sql) as any[])[0];
      const totalGodownRent = Number(godownTotals.monthly_rent);
      const totalGodownSpace = Number(godownTotals.total_capacity);

      const totalSpaceUtilizaton = Number(((totalSpaceAllocated / totalGodownSpace) * 100).toFixed(2));

      sql = `
        SELECT SUM(e.salary) as monthly_salary
        FROM employees e
        LEFT JOIN users u ON e.user_id = u.id
        WHERE e.status = 1
          AND u.status = 1
      `;
      const totalMonthlySalary = Number((await executeQuery(sql) as any[])[0].monthly_salary);

      const netMonthlyProfit = Number(totalMonthlyRevenue) - Number(totalGodownRent) - Number(totalMonthlySalary);

      sql = `
        SELECT
          cm.company_id,
          cm.company_name,
          cm.abbr,
          cm.currency_symbol,

          COALESCE(c.client_count, 0) AS client_count,
          COALESCE(a.agreement_count, 0) AS agreement_count,
          COALESCE(g.godown_count, 0) AS godown_count,

          COALESCE(g.total_capacity, 0) AS total_capacity,
          COALESCE(sa.allocated_space, 0) AS allocated_space,

          /* Revenues */
          COALESCE(inv.invoice_revenue, 0) AS invoice_revenue,
          COALESCE(sa.storage_revenue, 0) AS storage_revenue,
          (COALESCE(inv.invoice_revenue, 0) + COALESCE(sa.storage_revenue, 0)) AS total_revenue,

          /* Costs */
          COALESCE(g.total_godown_rent, 0) AS godown_rent,
          COALESCE(s.salary_cost, 0) AS salary_cost,

          /* Net profit */
          (
            COALESCE(inv.invoice_revenue, 0)
            + COALESCE(sa.storage_revenue, 0)
            - COALESCE(g.total_godown_rent, 0)
            - COALESCE(s.salary_cost, 0)
          ) AS net_profit,

          /* Utilization */
          (
            COALESCE(sa.allocated_space, 0)
            / COALESCE(g.total_capacity, 1) * 100
          ) AS utilization_rate

        FROM company_master cm

        LEFT JOIN (
          SELECT company_id, COUNT(*) AS client_count
          FROM organizations
          WHERE status = 1
          GROUP BY company_id
        ) c ON cm.company_id = c.company_id

        LEFT JOIN (
          SELECT o.company_id, COUNT(*) AS agreement_count
          FROM organization_agreements oa
          JOIN organizations o ON oa.org_id = o.org_id
          WHERE oa.status = 1
            AND CURDATE() BETWEEN oa.start_date AND oa.valid_upto
          GROUP BY o.company_id
        ) a ON cm.company_id = a.company_id

        LEFT JOIN (
          SELECT
            company_id,
            COUNT(*) AS godown_count,
            SUM(total_capacity) AS total_capacity,
            SUM(monthly_rent) AS total_godown_rent
          FROM godowns
          WHERE is_active = 1
          GROUP BY company_id
        ) g ON cm.company_id = g.company_id

        LEFT JOIN (
          SELECT
            g.company_id,
            SUM(gsa.space_allocated) AS allocated_space,
            SUM(gsa.monthly_rent) AS storage_revenue
          FROM godown_space_allocations gsa
          JOIN godowns g ON gsa.godown_id = g.godown_id
          WHERE gsa.status = 1
          GROUP BY g.company_id
        ) sa ON cm.company_id = sa.company_id

        LEFT JOIN (
          SELECT
            o.company_id,
            SUM(ii.total) AS invoice_revenue
          FROM invoice_items ii
          JOIN organizations o ON ii.org_id = o.org_id
          WHERE ii.status = 1
            AND o.status = 1
          GROUP BY o.company_id
        ) inv ON cm.company_id = inv.company_id

        LEFT JOIN (
          SELECT
            e.company_id,
            SUM(e.salary) AS salary_cost
          FROM employees e
          JOIN users u ON e.user_id = u.id
          WHERE e.status = 1
            AND u.status = 1
          GROUP BY e.company_id
        ) s ON cm.company_id = s.company_id

        WHERE cm.is_active = 1
        ORDER BY total_revenue DESC
      `;
      const companyBreakdown = await executeQuery(sql, []) as any[];


      const resp = {
        totalMonthlyRevenue,
        totalInvoiceAmount,
        totalMonthlySalary,
        netMonthlyProfit,
        totalClients,
        totalGodownRent,
        totalGodownSpace,
        totalSpaceAllocated,
        totalRentCollected,
        totalSpaceUtilizaton,
        companyBreakdown
      };
      return this.success(resp)
    } catch (error) {
      return this.handleError(error);
    }
  }
}