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

export async function getComprehensiveSummary() {
  const session = await getSession();
  const repository = new MiscRepository(session.user_id);
  return await repository.getComprehensiveSummary();
}

export async function getQuickStats() {
  const session = await getSession();
  const repository = new MiscRepository(session.user_id);
  return await repository.getQuickStats();
}

export async function getUserCompanies() {
  const session = await getSession();
  const repo = new MiscRepository(session.user_id);
  return await repo.getUserCompanies();
}

export async function getCompanyFinancialSummary(companyId: number) {
  const session = await getSession();
  const repo = new MiscRepository(session.user_id);
  return await repo.getCompanyFinancialSummary(companyId);
}

export async function getAllCompaniesSummary() {
  const session = await getSession();
  const repo = new MiscRepository(session.user_id);
  return await repo.getAllCompaniesSummary();
}