import { GodownFormValues } from "@/app/dashboard/godown/blocks/AddItem";
import { executeQuery, QueryBuilder, withTransaction } from "../helpers/db-helper";
import { RepositoryBase } from "../helpers/repository-base"
import mysql from 'mysql2/promise';

export interface Godown {
  godown_id: number;
  org_id: number;
  godown_name: string;
  location: string;
  pincode: string;
  total_capacity: number;
  available_capacity: number;
  capacity_unit: string;
  monthly_rent: number;
  currency: string;
  currency_symbol: string;
  description?: string;
  is_active: boolean;
  allocated_companies_count: number;
  created_on: string;
  updated_on: string;
}

export interface SpaceAllocation {
  allocation_id: number;
  space_id: number;
  godown_id: number;
  org_id: number;
  allocated_to_org_id: number;
  company_name: string;
  space_name: string;
  space_code: string;
  allocated_area: number;
  utilized_area: number;
  available_area: number;
  capacity_unit: string;
  monthly_rent: number;
  currency: string;
  allocation_start_date: string;
  allocation_end_date: string;
  agreement_id?: number;
  status: string;
  billing_cycle: string;
}

export interface GodownSpace {
  space_id: number;
  godown_id: number;
  org_id: number;
  space_name: string;
  space_code: string;
  total_area: number;
  available_area: number;
  monthly_rent_per_unit: number;
  is_occupied: boolean;
  agreement_id?: number;
  allocated_to_org_id?: number;
  allocation_start_date?: string;
  allocation_end_date?: string;
  status: string;
  created_on: string;
  updated_on: string;
}

export interface SpaceAllocationData {
  godown_id: number;
  allocated_to_org_id: string;
  space_name: string;
  space_code: string;
  allocated_area: string;
  monthly_rent: string;
  allocation_start_date: Date;
  allocation_end_date: Date;
  agreement_id?: string;
}

export class WarehouseRepository extends RepositoryBase {
  constructor(userId: string) {
    super();
  }

  // Godown Management
  async getAllGodowns(orgId?: number) {
    try {
      let sql = `
        SELECT g.*, 
               cm.currency_symbol,
               COUNT(DISTINCT sa.allocated_to_org_id) as allocated_companies_count,
               (SELECT COALESCE(SUM(g.total_capacity - gs.available_area), 0) 
                FROM godown_spaces gs 
                WHERE gs.godown_id = g.godown_id AND gs.is_occupied = 1) as utilized_capacity,
               (g.total_capacity - (SELECT COALESCE(SUM(gs.total_area - gs.available_area), 0) 
                                   FROM godown_spaces gs 
                                   WHERE gs.godown_id = g.godown_id AND gs.is_occupied = 1)) as available_capacity
        FROM godowns g
        LEFT JOIN organizations o ON g.org_id = o.org_id
        LEFT JOIN company_master cm ON o.company_id = cm.company_id
        LEFT JOIN space_allocations sa ON g.godown_id = sa.godown_id AND sa.status = 'active'
        WHERE g.is_active = 1
        ${orgId ? 'AND g.org_id = ?' : ''}
        GROUP BY g.godown_id
        ORDER BY g.created_on DESC
      `;
      
      const params = orgId ? [orgId] : [];
      const godowns = await executeQuery(sql, params) as Godown[];

      return this.success(godowns);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getGodownById(godownId: number) {
    try {
      let sql = `
        SELECT g.*, 
               cm.currency_symbol,
               COUNT(DISTINCT sa.allocated_to_org_id) as allocated_companies_count,
               (SELECT COALESCE(SUM(gs.total_area - gs.available_area), 0) 
                FROM godown_spaces gs 
                WHERE gs.godown_id = g.godown_id AND gs.is_occupied = 1) as utilized_capacity,
               (g.total_capacity - (SELECT COALESCE(SUM(gs.total_area - gs.available_area), 0) 
                                   FROM godown_spaces gs 
                                   WHERE gs.godown_id = g.godown_id AND gs.is_occupied = 1)) as available_capacity
        FROM godowns g
        LEFT JOIN organizations o ON g.org_id = o.org_id
        LEFT JOIN company_master cm ON o.company_id = cm.company_id
        LEFT JOIN space_allocations sa ON g.godown_id = sa.godown_id AND sa.status = 'active'
        WHERE g.godown_id = ?
        GROUP BY g.godown_id
      `;

      const godowns = await executeQuery(sql, [godownId]) as Godown[];

      if (godowns.length === 0) {
        return this.failure('Godown not found');
      }

      return this.success(godowns[0]);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async addGodown(data: GodownFormValues, userId: string) {
    try {
      const result = await new QueryBuilder('godowns')
        .insert({
          ...data,
          updated_by: userId
        });

      if (result === 0) {
        return this.failure('Failed to add godown');
      }

      return this.success('Godown added successfully');
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateGodown(godownId: number, data: any, userId: string) {
    try {
      const result = await new QueryBuilder('godowns')
        .where('godown_id = ?', godownId)
        .update({
          org_id: parseInt(data.org_id),
          godown_name: data.godown_name,
          location: data.location,
          pincode: data.pincode,
          total_capacity: parseFloat(data.total_capacity),
          capacity_unit: data.capacity_unit,
          monthly_rent: parseFloat(data.monthly_rent),
          currency: data.currency,
          description: data.description,
          is_active: data.is_active === '1' ? 1 : 0,
          updated_by: userId
        });

      if (result === 0) {
        return this.failure('Failed to update godown');
      }

      return this.success('Godown updated successfully');
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteGodown(godownId: number, userId: string) {
    try {
      const result = await new QueryBuilder('godowns')
        .where('godown_id = ?', godownId)
        .update({
          is_active: 0,
          updated_by: userId
        });

      if (result === 0) {
        return this.failure('Failed to delete godown');
      }

      return this.success('Godown deleted successfully');
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Space Management
  async getAllSpaces(godownId?: number) {
    try {
      let sql = `
        SELECT sa.*,
               gs.space_name,
               gs.space_code,
               gs.available_area,
               (gs.total_area - gs.available_area) as utilized_area,
               g.capacity_unit,
               o.org_name as company_name,
               oa.agreement_id
        FROM space_allocations sa
        JOIN godown_spaces gs ON sa.space_id = gs.space_id
        JOIN organizations o ON sa.allocated_to_org_id = o.org_id
        LEFT JOIN organization_agreements oa ON sa.agreement_id = oa.agreement_id
        LEFT JOIN godowns g ON g.godown_id = gs.godown_id
        WHERE sa.status = 'active'
        ${godownId ? 'AND sa.godown_id = ?' : ''}
        ORDER BY sa.allocation_end_date ASC
      `;

      const params = godownId ? [godownId] : [];
      const spaces = await executeQuery(sql, params) as SpaceAllocation[];

      return this.success(spaces);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getGodownSpaces(godownId: number) {
    try {
      let sql = `
        SELECT gs.*,
               o.org_name as allocated_company_name,
               oa.agreement_number
        FROM godown_spaces gs
        LEFT JOIN organizations o ON gs.allocated_to_org_id = o.org_id
        LEFT JOIN organization_agreements oa ON gs.agreement_id = oa.agreement_id
        WHERE gs.godown_id = ?
        ORDER BY gs.space_name
      `;

      const spaces = await executeQuery(sql, [godownId]) as GodownSpace[];

      return this.success(spaces);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async allocateSpace(data: SpaceAllocationData, userId: string) {
    try {
      return withTransaction(async (connection) => {
        const orgId = await this.getOrgIdByGodown(data.godown_id, connection);
        const spaceData = {
          godown_id: data.godown_id,
          org_id: orgId,
          space_name: data.space_name,
          space_code: data.space_code,
          total_area: parseFloat(data.allocated_area),
          available_area: parseFloat(data.allocated_area), // Initially all area is available
          monthly_rent_per_unit: parseFloat(data.monthly_rent) / parseFloat(data.allocated_area),
          is_occupied: 1,
          allocated_to_org_id: parseInt(data.allocated_to_org_id),
          agreement_id: data.agreement_id ? parseInt(data.agreement_id) : null,
          allocation_start_date: data.allocation_start_date,
          allocation_end_date: data.allocation_end_date,
          status: 'occupied',
          updated_by: userId
        };

        const spaceResult = await new QueryBuilder('godown_spaces')
          .setConnection(connection)
          .insert(spaceData);

        const allocationData = {
          space_id: spaceResult,
          godown_id: data.godown_id,
          org_id: orgId,
          allocated_to_org_id: parseInt(data.allocated_to_org_id),
          agreement_id: data.agreement_id ? parseInt(data.agreement_id) : null,
          allocated_area: parseFloat(data.allocated_area),
          monthly_rent: parseFloat(data.monthly_rent),
          rent_currency: 'INR',
          allocation_start_date: data.allocation_start_date,
          allocation_end_date: data.allocation_end_date,
          status: 'active',
          billing_cycle: 'monthly',
          updated_by: userId
        };

        const allocationResult = await new QueryBuilder('space_allocations')
          .setConnection(connection)
          .insert(allocationData);

        return this.success('Space allocated successfully');
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateSpaceUtilization(spaceId: number, utilizedArea: number, userId: string) {
    try {
      // Get current space details
      const space = await new QueryBuilder('godown_spaces')
        .where('space_id = ?', spaceId)
        .selectOne(['total_area', 'available_area']) as GodownSpace;

      if (!space) {
        return this.failure('Space not found');
      }

      const newAvailableArea = space.total_area - utilizedArea;

      if (newAvailableArea < 0) {
        return this.failure('Utilized area cannot exceed total area');
      }

      await new QueryBuilder('godown_spaces')
        .where('space_id = ?', spaceId)
        .update({
          available_area: newAvailableArea,
          updated_by: userId
        });

      await new QueryBuilder('space_utilization_logs')
        .insert({
          space_id: spaceId,
          godown_id: await this.getGodownIdBySpace(spaceId),
          allocation_id: await this.getAllocationIdBySpace(spaceId),
          utilized_area: utilizedArea,
          available_area: newAvailableArea,
          log_date: new Date(),
          logged_by: userId
        });

      return this.success('Space utilization updated successfully');
    } catch (error) {
      return this.handleError(error);
    }
  }

  async terminateAllocation(allocationId: number, userId: string) {
    try {
      await withTransaction(async (connection) => {
        const allocation = await new QueryBuilder('space_allocations')
          .setConnection(connection)
          .where('allocation_id = ?', allocationId)
          .selectOne(['space_id']) as SpaceAllocation;

        if (!allocation) {
          return this.failure('Allocation not found');
        }

        await new QueryBuilder('space_allocations')
          .setConnection(connection)
          .where('allocation_id = ?', allocationId)
          .update({
            status: 'terminated',
            actual_end_date: new Date(),
            updated_by: userId
          });

        await new QueryBuilder('godown_spaces')
          .setConnection(connection)
          .where('space_id = ?', allocation.space_id)
          .update({
            is_occupied: 0,
            allocated_to_org_id: null,
            agreement_id: null,
            allocation_start_date: null,
            allocation_end_date: null,
            status: 'available',
            available_area: await this.getTotalAreaBySpace(allocation.space_id),
            updated_by: userId
          });

        return this.success('Allocation terminated successfully');
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Analytics and Reports
  async getGodownUtilization(godownId?: number) {
    try {
      let sql = `
        SELECT 
          g.godown_id,
          g.godown_name,
          g.total_capacity,
          g.available_capacity,
          (g.total_capacity - g.available_capacity) as utilized_capacity,
          ((g.total_capacity - g.available_capacity) / g.total_capacity * 100) as utilization_percentage,
          g.monthly_rent,
          COUNT(DISTINCT sa.allocated_to_org_id) as active_companies,
          SUM(sa.monthly_rent) as total_monthly_revenue
        FROM godowns g
        LEFT JOIN space_allocations sa ON g.godown_id = sa.godown_id AND sa.status = 'active'
        WHERE g.is_active = 1
        ${godownId ? 'AND g.godown_id = ?' : ''}
        GROUP BY g.godown_id
        ORDER BY utilization_percentage DESC
      `;

      const params = godownId ? [godownId] : [];
      const utilization = await executeQuery(sql, params);

      return this.success(utilization);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getCompanySpaceUsage(companyId: number) {
    try {
      let sql = `
        SELECT 
          sa.allocated_to_org_id,
          o.org_name as company_name,
          COUNT(sa.allocation_id) as total_allocations,
          SUM(sa.allocated_area) as total_allocated_area,
          SUM(sa.monthly_rent) as total_monthly_rent,
          AVG((gs.total_area - gs.available_area) / gs.total_area * 100) as avg_utilization
        FROM space_allocations sa
        JOIN organizations o ON sa.allocated_to_org_id = o.org_id
        JOIN godown_spaces gs ON sa.space_id = gs.space_id
        WHERE sa.allocated_to_org_id = ? AND sa.status = 'active'
        GROUP BY sa.allocated_to_org_id
      `;

      const usage = await executeQuery(sql, [companyId]) as any[];

      return this.success(usage.length > 0 ? usage[0] : null);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getExpiringAllocations(daysThreshold: number = 30) {
    try {
      let sql = `
        SELECT 
          sa.*,
          o.org_name as company_name,
          g.godown_name,
          gs.space_name,
          DATEDIFF(sa.allocation_end_date, CURDATE()) as days_until_expiry
        FROM space_allocations sa
        JOIN organizations o ON sa.allocated_to_org_id = o.org_id
        JOIN godowns g ON sa.godown_id = g.godown_id
        JOIN godown_spaces gs ON sa.space_id = gs.space_id
        WHERE sa.status = 'active'
          AND sa.allocation_end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
        ORDER BY sa.allocation_end_date ASC
      `;

      const expiring = await executeQuery(sql, [daysThreshold]);

      return this.success(expiring);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Helper methods
  private async getOrgIdByGodown(godownId: number, transaction?: mysql.Connection): Promise<number> {
    const result = await new QueryBuilder('godowns')
      .where('godown_id = ?', godownId)
      .selectOne(['org_id']) as Godown;

    return result?.org_id || 0;
  }

  private async getGodownIdBySpace(spaceId: number): Promise<number> {
    const result = await new QueryBuilder('godown_spaces')
      .where('space_id = ?', spaceId)
      .selectOne(['godown_id']) as Godown;

    return result?.godown_id || 0;
  }

  private async getAllocationIdBySpace(spaceId: number): Promise<number> {
    const result = await new QueryBuilder('space_allocations')
      .where('space_id = ?', spaceId)
      .where('status = ?', 'active')
      .selectOne(['allocation_id']) as SpaceAllocation;

    return result?.allocation_id || 0;
  }

  private async getTotalAreaBySpace(spaceId: number): Promise<number> {
    const result = await new QueryBuilder('godown_spaces')
      .where('space_id = ?', spaceId)
      .selectOne(['total_area']) as GodownSpace;

    return result?.total_area || 0;
  }

  // Agreement integration
  async getActiveAgreements() {
    try {
      const agreements = await new QueryBuilder('organization_agreements')
        .where('status = ?', 1)
        .where('valid_upto >= ?', new Date())
        .select(['agreement_id', 'org_id', 'start_date', 'valid_upto']);

      return this.success(agreements);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getAgreementSpaces(agreementId: number) {
    try {
      let sql = `
        SELECT 
          sa.*,
          gs.space_name,
          gs.space_code,
          g.godown_name,
          o.org_name as company_name
        FROM space_allocations sa
        JOIN godown_spaces gs ON sa.space_id = gs.space_id
        JOIN godowns g ON sa.godown_id = g.godown_id
        JOIN organizations o ON sa.allocated_to_org_id = o.org_id
        WHERE sa.agreement_id = ? AND sa.status = 'active'
      `;

      const spaces = await executeQuery(sql, [agreementId]);

      return this.success(spaces);
    } catch (error) {
      return this.handleError(error);
    }
  }
}