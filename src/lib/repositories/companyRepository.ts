import { CompanyFormValues } from "@/app/dashboard/settings/company-management/blocks/AddCompany";
import { QueryBuilder } from "../helpers/db-helper";
import { RepositoryBase } from "../helpers/repository-base"

export interface Company {
  company_id: number;
  company_name: string;
  abbr: string;
  currency_symbol: string;
  currency: string;
  phone: string;
  email: string;
}

export class CompanyRepository extends RepositoryBase {

  constructor(user_id: string) {
    super()
  }

  async getAllCompanies() {
    try {
      const data = await new QueryBuilder('company_master')
        .where('is_active = 1')
        .select(['company_id', 'company_name', 'abbr', 'currency_symbol', 'currency', 'phone', 'email'])

      if (data.length == 0) {
        return this.failure('No Company Found!')
      }

      return this.success(data);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getCompanyById(id: number) {
    try {
      const data = await new QueryBuilder('company_master')
        .where('company_id = ?', id)
        .limit(1)
        .select()

      if (data.length == 0) {
        return this.failure('No Company Found!')
      }

      return this.success(data);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async addCompany(
    data: CompanyFormValues,
    userId: string
  ) {
    try {
      const result = await new QueryBuilder('company_master')
        .insert({
          ...data,
          updated_by: userId
        })

      if (result == 0) {
        return this.failure('Request Failed!')
      }

      return this.success('Company Added Successfully');
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updatedCompany(
    companyId: number,
    data: CompanyFormValues,
    userId: string
  ) {
    try {
      const result = await new QueryBuilder('company_master')
        .where('company_id = ?', companyId)
        .update({
          ...data,
          updated_by: userId
        })

      if (result == 0) {
        return this.failure('Request Failed!')
      }

      return this.success('Company Updated Successfully');
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteCompany(
    companyId: number,
    userId: string
  ) {
    try {
      const result = await new QueryBuilder('company_master')
        .where('company_id = ?', companyId)
        .update({
          is_active: 0,
          updated_by: userId
        })

      if (result == 0) {
        return this.failure('Request Failed!')
      }

      return this.success('Company Deleted Successfully');
    } catch (error) {
      return this.handleError(error);
    }
  }

}

