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
      WHERE o.company_id = (SELECT company_id FROM users WHERE id = ?)
        AND ol.status = 1
        AND (ol.valid_upto < CURDATE() OR DATEDIFF(ol.valid_upto, CURDATE()) <= 60)
      ORDER BY ol.valid_upto ASC
      LIMIT 10
    `, [this.userId]) as any[];

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
}