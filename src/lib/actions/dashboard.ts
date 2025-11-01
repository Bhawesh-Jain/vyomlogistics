"use server"

import { MiscRepository } from "../repositories/miscRepository";
import { getSession } from "../session";

export async function getDashboardStats() {
  const session = await getSession();
  const repository = new MiscRepository(session.user_id);
  return await repository.getDashboardStats();
}

export async function getExpiringItems() {
  const session = await getSession();
  const repository = new MiscRepository(session.user_id);
  return await repository.getExpiringItems();
}
