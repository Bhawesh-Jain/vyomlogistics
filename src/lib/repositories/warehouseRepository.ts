import { GodownFormValues } from "@/app/dashboard/godown/blocks/AddItem";
import { executeQuery, QueryBuilder, withTransaction } from "../helpers/db-helper";
import { RepositoryBase } from "../helpers/repository-base"
import mysql from 'mysql2/promise';
import { AllocationFormValues } from "@/app/dashboard/godown/blocks/AllocateSpaceDialog";

export interface Godown {
  godown_id: number;
  company_id: number;

  godown_name: string;
  location: string;
  pincode: string;
  total_capacity: number;
  capacity_unit: string;
  monthly_rent: number;
  currency: string;
  description?: string;
  is_active: boolean;

  organization_count: number;
  total_space_allocated: number;
  total_rent_collected: number;

  updated_by: number;

  created_on: string;
  updated_on: string;
}

export interface GodownSpaceAllocation {
  allocation_id: number;
  godown_id: number;
  agreement_id: number | null;
  space_allocated: number;
  monthly_rent: number;
  status: number;

  org_id: number;
  org_name: string;
  contact_person: string;
  contact_number: string;

  updated_by: number;

  valid_upto: string | null;

  created_on: string;
  updated_on: string;
}

export class WarehouseRepository extends RepositoryBase {
  constructor(userId: string) {
    super();
  }

  async getAllGodowns(companyId?: number) {
    try {
      let sql = `
        SELECT 
          g.*,

          COUNT(DISTINCT a.org_id) AS organization_count,
          COALESCE(SUM(a.space_allocated), 0) AS total_space_allocated,
          COALESCE(SUM(a.monthly_rent), 0) AS total_rent_collected

        FROM godowns g
        LEFT JOIN godown_space_allocations a 
          ON g.godown_id = a.godown_id 
          AND a.status = 1

        WHERE 1 = 1
          ${companyId ? 'AND g.company_id = ?' : ''}

        GROUP BY g.godown_id
        ORDER BY g.godown_name ASC
      `;

      const params = companyId ? [companyId] : [];
      const godowns = await executeQuery(sql, params);
      console.log(godowns);

      return this.success(godowns);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getGodownById(godownId: number) {
    try {
      let sql = `
        SELECT 
          g.*,
          COUNT(DISTINCT a.org_id) AS organization_count,
          COALESCE(SUM(a.space_allocated), 0) AS total_space_allocated,
          COALESCE(SUM(a.monthly_rent), 0) AS total_rent_collected
        FROM godowns g
        LEFT JOIN godown_space_allocations a 
          ON g.godown_id = a.godown_id 
          AND a.status = 1
        WHERE g.godown_id = ?
        GROUP BY g.godown_id
        ORDER BY g.godown_name ASC
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

  async getAllSpaces(godownId: number, userId: string) {
    try {
      let sql = `
        SELECT gsa.*,
          o.org_name,
          o.contact_person,
          o.contact_number,
          oa.valid_upto
        FROM godown_space_allocations gsa
        LEFT JOIN organizations o ON gsa.org_id = o.org_id
        LEFT JOIN organization_agreements oa 
          ON oa.agreement_id = gsa.agreement_id 
          AND oa.status > 0 
          AND CURDATE() BETWEEN oa.start_date AND oa.valid_upto
        WHERE gsa.godown_id = ?
          AND gsa.status > 0
          AND (oa.agreement_id IS NULL OR oa.org_id = gsa.org_id)
        ORDER BY gsa.created_on DESC
      `;

      const result = await executeQuery(sql, [godownId]) as GodownSpaceAllocation[];

      if (result.length === 0) {
        return this.failure('No spaces found');
      }

      return this.success(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async allocateSpace(data: AllocationFormValues, godownId: number, userId: string) {
    try {
      const result = await new QueryBuilder('godown_space_allocations')
        .insert({
          ...data,
          godown_id: godownId,
          status: 1,
          updated_by: userId
        });

      if (result === 0) {
        return this.failure('Failed to allocate space');
      }

      return this.success('Space allocated successfully');
    } catch (error) {
      return this.handleError(error);
    }
  }
}