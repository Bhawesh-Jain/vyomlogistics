import { QueryBuilder } from "../helpers/db-helper";
import { RepositoryBase } from "../helpers/repository-base"

export interface Company {
  company_id: number;
  company_name: string;
  abbr: string;
  currency_symbol: string;
  currency: string;
}

export class CompanyRepository extends RepositoryBase {

  constructor(user_id: string) {
    super()
  }

  async getAllCompanies() {
    try {
      const data = await new QueryBuilder('company_master')
        .where('is_active = 1')
        .select(['company_id', 'company_name', 'abbr', 'currency_symbol', 'currency'])

      if (data.length == 0) {
        return this.failure('No Company Found!')
      }

      return this.success(data);
    } catch (error) {
      return this.handleError(error);
    }
  }

}

