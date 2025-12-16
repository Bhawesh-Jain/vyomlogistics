"use server"

import { EmployeeRepository } from "../repositories/employeeRepository";
import { getSession } from "../session";

export async function getEmployeeById(employeeId: number) {
  const session = await getSession();

  const repository = new EmployeeRepository(session.user_id);
  return await repository.getEmployeeById(employeeId);
}
