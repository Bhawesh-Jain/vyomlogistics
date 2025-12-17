import { EmployeeFormValues } from "@/app/dashboard/employee-management/employees/blocks/AddEmployee";
import { executeQuery, QueryBuilder } from "../helpers/db-helper";
import { RepositoryBase } from "../helpers/repository-base"
import { UserRepository } from "./userRepository";

export interface Employee {
  employee_id: number;
  user_id: number;
  role: number;
  company_id: number;

  role_name: string;
  company_name: string;

  name: string;
  phone: string;
  email: string;

  account_number: string;
  ifsc: string;
  bank_name: string;
  address: string;

  status: number;

  advance: number;
  salary: number;
  joining_date: string;

  updated_by: number;
  created_on: string;
  updated_on: string;
}

export class EmployeeRepository extends RepositoryBase {
  private user_id: string;
  private company_id: string;

  constructor(user_id: string, company_id: string) {
    super()
    this.user_id = user_id;
    this.company_id = company_id;
  }

  async getAllEmployees() {
    try {
      let sql = `
        SELECT e.*,
          u.name,
          u.email,
          u.phone,
          u.role,
          u.company_id,
          r.role_name,
          cm.company_name
        FROM employees e
        LEFT JOIN users u ON e.user_id = u.id
        LEFT JOIN company_master cm ON cm.company_id = u.company_id
        LEFT JOIN roles r ON r.id = u.role
      `;

      const data = await executeQuery<Employee[]>(sql, []);

      if (data.length == 0) {
        return this.failure('No Employee Found!')
      }

      return this.success(data);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getEmployeeById(employee_id: number) {
    try {
      let sql = `
        SELECT e.*,
          u.name,
          u.email,
          u.phone,
          u.role,
          u.company_id,
          r.role_name,
          cm.company_name
        FROM employees e
        LEFT JOIN users u ON e.user_id = u.id
        LEFT JOIN company_master cm ON cm.company_id = u.company_id
        LEFT JOIN roles r ON r.id = u.role
        WHERE e.employee_id = ?
        LIMIT 1
      `;

      const data = await executeQuery<Employee[]>(sql, [employee_id]);

      if (data.length == 0) {
        return this.failure('No Employee Found!')
      }

      return this.success(data[0]);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async addEmployee(
    data: EmployeeFormValues
  ) {
    try {
      const userRepo = new UserRepository(data.company_id);

      const user = await userRepo.createUser(data, this.user_id);

      if (!user.success) {
        return user;
      }

      const res = await new QueryBuilder('employees')
        .insert({
          user_id: user.result.userId,
          salary: data.salary,
          joining_date: data.joining_date,
          advance: data.advance,
          account_number: data.account_number,
          ifsc: data.ifsc,
          bank_name: data.bank_name,
          address: data.address,
          status: data.status,
          updated_by: this.user_id
        });

      if (res <= 0) {
        return this.failure('Something Went Wront!');
      }

      return this.success('Employee Created!');
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateEmployee(employeeId: number, data: EmployeeFormValues) {
    try {
      const employee = await new QueryBuilder('employees')
        .where('employee_id = ?', employeeId)
        .selectOne() as Employee | null;

      if (!employee) {
        return this.failure('Invalid Employee');
      }

      const user = await new QueryBuilder('users')
        .where('id = ?', employee.user_id)
        .selectOne();

      if (!user) {
        return this.failure('Invalid User');
      }

      await new QueryBuilder('employees')
        .where('employee_id = ?', employeeId)
        .update({
          salary: data.salary,
          joining_date: data.joining_date,
          account_number: data.account_number,
          advance: data.advance,
          ifsc: data.ifsc,
          bank_name: data.bank_name,
          address: data.address,
          status: data.status,
          updated_by: this.user_id
        });

      let userUpdate: any = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        company_id: data.company_id,
        updated_by: this.user_id
      };

      if (data.password.length > 0) {
        userUpdate.password = data.password;
      }

      await new QueryBuilder('users')
        .where('id = ?', employee.user_id)
        .update(userUpdate);

      return this.success('Employee Updated!')
    } catch (error) {
      return this.handleError(error);
    }
  }
}

