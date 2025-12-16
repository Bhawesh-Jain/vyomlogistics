import { executeQuery, QueryBuilder } from "../helpers/db-helper";
import { RepositoryBase } from "../helpers/repository-base"
import { UserRepository } from "./userRepository";

export interface Employee {
  
}

export class EmployeeRepository extends RepositoryBase {
  private user_id: string;
  private company_id: string;

  constructor(user_id: string, company_id: string) {
    super()
    this.user_id = user_id;
  }

  async getEmployeeById(employee_id: number) {
    try {
      let sql = ``;

      const data = await executeQuery<Employee[]>(sql, [employee_id]);

      if (data.length == 0) {
        return this.failure('No Company Found!')
      }

      return this.success(data);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createEmployee() {
    try {
      const userRepo = new UserRepository(this.company_id);
    } catch (error) {
      return this.handleError(error);
    }
  }
}

