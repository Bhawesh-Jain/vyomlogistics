"use server"

import { UserRepository } from "../repositories/userRepository";
import { getSession } from "../session";

export async function getEmployeeList() {
  const session = await getSession();
  
  const repository = new UserRepository(session.user_id);
  return await repository.getEmployeeList();
}
