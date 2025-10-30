import { OrganizationFormValues } from "@/app/dashboard/organizations/companies/blocks/AddOrganization";
import { executeQuery, QueryBuilder } from "../helpers/db-helper";
import { RepositoryBase } from "../helpers/repository-base"
import { LicenseFormValues } from "@/app/dashboard/organizations/licenses/blocks/AddItem";

export interface Organization {
  org_id: number;
  org_name: string;
  contact_person: string;
  contact_number: string;
  location: string;
  pincode: string;
  
  updated_by: string;

  status: number;

  signed_on: string;
  created_on: string;
  updated_on: string;
}

export interface License {
  license_id: number;
  business_type: string;
  licence_no: string;
  start_date: string;
  valid_upto: string;
  duration: number;
  
  org_id: number;
  org_name: string;

  updated_by: string;

  status: number;

  created_on: string;
  updated_on: string;
}

export class OrganizationRepository extends RepositoryBase {

  constructor(user_id: string) {
    super()
  }

  async getAllOrganizations() {
    try {
      let sql = `
        SELECT o.*,
          u.name AS updated_by 
        FROM organizations o
        LEFT JOIN users u ON o.updated_by = u.id
      `;

      const data = await executeQuery(sql) as Organization[];

      if (data.length == 0) {
        return this.failure('No Organization Found!')
      }

      return this.success(data);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getOrganizationById(id: number) {
    try {
      let sql = `
        SELECT o.*,
          u.name AS updated_by 
        FROM organizations o
        LEFT JOIN users u ON o.updated_by = u.id
        WHERE o.org_id = ?
        LIMIT 1
      `;

      const data = await executeQuery<Organization[]>(sql, [id]);
      
      if (data.length == 0) {
        return this.failure('No Organization Found!')
      }

      return this.success(data[0]);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async addOrganization(
    data: OrganizationFormValues,
    userId: string
  ) {
    try {
      const result = await new QueryBuilder('organizations')
        .insert({
          ...data,
          updated_by: userId
        })

      if (result == 0) {
        return this.failure('Request Failed!')
      }

      return this.success('Organization Added Successfully');
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updatedOrganization(
    organizationId: number,
    data: OrganizationFormValues,
    userId: string
  ) {
    try {
      const result = await new QueryBuilder('organizations')
        .where('org_id = ?', organizationId)
        .update({
          ...data,
          updated_by: userId
        })

      if (result == 0) {
        return this.failure('Request Failed!')
      }

      return this.success('Organization Updated Successfully');
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteOrganization(
    organizationId: number,
    userId: string
  ) {
    try {
      const result = await new QueryBuilder('organizations')
        .where('org_id = ?', organizationId)
        .update({
          is_active: 0,
          updated_by: userId
        })

      if (result == 0) {
        return this.failure('Request Failed!')
      }

      return this.success('Organization Deleted Successfully');
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getAllLicenses() {
    try {
      let sql = `
        SELECT l.*,
          o.org_name,
          u.name AS updated_by 
        FROM organization_licenses l
        LEFT JOIN organizations o ON l.org_id = o.org_id
        LEFT JOIN users u ON l.updated_by = u.id
      `;

      const data = await executeQuery(sql) as Organization[];

      if (data.length == 0) {
        return this.failure('No Licenses Found!')
      }

      return this.success(data);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getLicenseById(id: number) {
    try {
      let sql = `
        SELECT l.*,
          o.org_name,
          u.name AS updated_by 
        FROM organization_licenses l
        LEFT JOIN organizations o ON l.org_id = o.org_id
        LEFT JOIN users u ON l.updated_by = u.id
        WHERE l.license_id = ?
        LIMIT 1
      `;

      const data = await executeQuery<License[]>(sql, [id]);
      
      if (data.length == 0) {
        return this.failure('No License Found!')
      }

      return this.success(data[0]);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async addLicense(
    data: LicenseFormValues,
    userId: string
  ) {
    try {
      const result = await new QueryBuilder('organization_licenses')
        .insert({
          ...data,
          updated_by: userId
        })

        console.log(data);
        

      if (result == 0) {
        return this.failure('Request Failed!')
      }

      return this.success('License Added Successfully');
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updatedLicense(
    licenseId: number,
    data: LicenseFormValues,
    userId: string
  ) {
    try {
      const result = await new QueryBuilder('organization_licenses')
        .where('license_id = ?', licenseId)
        .update({
          ...data,
          updated_by: userId
        })

      if (result == 0) {
        return this.failure('Request Failed!')
      }

      return this.success('Organization Updated Successfully');
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteLicense(
    licenseId: number,
    userId: string
  ) {
    try {
      const result = await new QueryBuilder('organization_licenses')
        .where('license_id = ?', licenseId)
        .update({
          is_active: 0,
          updated_by: userId
        })

      if (result == 0) {
        return this.failure('Request Failed!')
      }

      return this.success('Organization Deleted Successfully');
    } catch (error) {
      return this.handleError(error);
    }
  }

}

