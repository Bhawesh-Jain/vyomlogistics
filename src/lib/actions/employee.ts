"use server"

import { EmployeeFormValues } from "@/app/dashboard/employee-management/employees/blocks/AddEmployee";
import { EmployeeRepository } from "../repositories/employeeRepository";
import { getSession } from "../session";

export async function getAllEmployees() {
  const session = await getSession();

  const repository = new EmployeeRepository(session.user_id, session.company_id);
  return await repository.getAllEmployees();
}

export async function getEmployeeById(employeeId: number) {
  const session = await getSession();

  const repository = new EmployeeRepository(session.user_id, session.company_id);
  return await repository.getEmployeeById(employeeId);
}

export async function addEmployee(data: EmployeeFormValues) {
  const session = await getSession();

  const repository = new EmployeeRepository(session.user_id, session.company_id);
  return await repository.addEmployee(data);
}

export async function updateEmployee(employeeId: number, data: EmployeeFormValues) {
  const session = await getSession();

  const repository = new EmployeeRepository(session.user_id, session.company_id);
  return await repository.updateEmployee(employeeId, data);
}
