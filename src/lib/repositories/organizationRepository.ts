import { OrganizationFormValues } from "@/app/dashboard/organizations/companies/blocks/AddOrganization";
import { executeQuery, QueryBuilder } from "../helpers/db-helper";
import { RepositoryBase } from "../helpers/repository-base"
import { LicenseFormValues } from "@/app/dashboard/organizations/licenses/blocks/AddItem";
import { AgreementFormValues } from "@/app/dashboard/organizations/agreements/blocks/AddItem";
import { InvoiceUiItems } from "@/app/dashboard/organizations/companies/blocks/ManageItem";

export interface Organization {
  org_id: number;
  org_name: string;
  contact_person: string;
  contact_number: string;
  location: string;
  pincode: string;
  description: string;

  updated_by: string;

  status: number;

  signed_on: string;
  created_on: string;
  updated_on: string;

  invoice_data?: InvoiceItems[]
}

export interface InvoiceItems {
  inv_id: number;
  org_id: number;

  service_name: string;
  amount: number;
  tax: number;
  tax_amount: number;
  total: number;
  description: string;

  updated_by: number;
  status: number;

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

export interface Agreement {
  agreement_id: number;
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
  private user_id: string;

  constructor(user_id: string) {
    super()
    this.user_id = user_id;
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

  async getOrganizationById({ id, withInvoice = false }: { id: number, withInvoice?: boolean }) {
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

      const org = data[0];

      if (withInvoice) {
        const invRes = await new QueryBuilder('invoice_items')
          .where('org_id = ?', id)
          .where('status > 0')
          .select() as InvoiceItems[];

        org.invoice_data = invRes;
      }

      return this.success(org);
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
          status: 0,
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
          status: 0,
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

  async getAllAgreements() {
    try {
      let sql = `
        SELECT oa.*,
          o.org_name,
          u.name AS updated_by 
        FROM organization_agreements oa
        LEFT JOIN organizations o ON oa.org_id = o.org_id
        LEFT JOIN users u ON oa.updated_by = u.id
      `;

      const data = await executeQuery(sql) as Agreement[];

      if (data.length == 0) {
        return this.failure('No Agreements Found!')
      }

      return this.success(data);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getAgreementById(id: number) {
    try {
      let sql = `
        SELECT oa.*,
          o.org_name,
          u.name AS updated_by 
        FROM organization_agreements oa
        LEFT JOIN organizations o ON oa.org_id = o.org_id
        LEFT JOIN users u ON oa.updated_by = u.id
        WHERE oa.agreement_id = ?
        LIMIT 1
      `;

      const data = await executeQuery<Agreement[]>(sql, [id]);

      if (data.length == 0) {
        return this.failure('No Agreement Found!')
      }

      return this.success(data[0]);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async addAgreement(
    data: AgreementFormValues,
    userId: string
  ) {
    try {
      const result = await new QueryBuilder('organization_agreements')
        .insert({
          ...data,
          updated_by: userId
        });

      if (result == 0) {
        return this.failure('Request Failed!')
      }

      return this.success('Agreement Added Successfully');
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updatedAgreement(
    agreementId: number,
    data: AgreementFormValues,
    userId: string
  ) {
    try {
      const result = await new QueryBuilder('organization_agreements')
        .where('agreement_id = ?', agreementId)
        .update({
          ...data,
          updated_by: userId
        })

      if (result == 0) {
        return this.failure('Request Failed!')
      }

      return this.success('Agreement Updated Successfully');
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteAgreement(
    agreementId: number,
    userId: string,
  ) {
    try {
      const result = await new QueryBuilder('organization_agreements')
        .where('agreement_id = ?', agreementId)
        .update({
          status: 0,
          updated_by: userId
        });

      if (result == 0) {
        return this.failure('Request Failed!')
      }

      return this.success('Agreement Deleted Successfully');
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getServiceNames() {
    try {
      let sql = `
        SELECT DISTINCT service_name
        FROM invoice_items
        WHERE status > 0;
      `;

      const result = await executeQuery(sql) as any[]

      if (result.length == 0) {
        return this.failure('Request Failed!')
      }
      
      return this.success(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async saveOrganizationServices(
    orgId: number,
    services: InvoiceUiItems[],
    notes?: string
  ) {
    try {
      const orgRes = await this.getOrganizationById({ id: orgId });

      if (!orgRes.success) {
        return orgRes;
      }

      await new QueryBuilder('invoice_items')
        .where('org_id = ?', orgId)
        .update({
          'status': -1,
          'updated_by': this.user_id
        });

      for (let i = 0; i < services.length; i++) {
        const service = services[i];

        await new QueryBuilder('invoice_items')
          .insert({
            status: 1,
            org_id: orgId,
            updated_by: this.user_id,
            total: Number(service.amount) + Number(service.tax_amount),
            ...service
          })
      }

      if (notes && notes.length > 0) {
        await new QueryBuilder('organizations')
          .where('org_id = ?', orgId)
          .update({
            'description': notes,
            'updated_by': this.user_id
          });
      }

      return this.success('Agreement Deleted Successfully');
    } catch (error) {
      return this.handleError(error);
    }
  }
}

