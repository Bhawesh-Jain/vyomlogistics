"use server"

import { WarehouseRepository } from "../repositories/warehouseRepository";
import { getSession } from "../session";
import { SpaceAllocationData } from "../repositories/warehouseRepository";

export async function getAllGodowns(orgId?: number) {
  const session = await getSession();
  const repository = new WarehouseRepository(session.user_id);
  return await repository.getAllGodowns(orgId);
}

export async function getGodownById(id: number) {
  const session = await getSession();
  const repository = new WarehouseRepository(session.user_id);
  return await repository.getGodownById(id);
}

export async function addGodown(data: any) {
  const session = await getSession();
  const repository = new WarehouseRepository(session.user_id);
  return await repository.addGodown(data, session.user_id);
}

export async function updateGodown(id: number, data: any) {
  const session = await getSession();
  const repository = new WarehouseRepository(session.user_id);
  return await repository.updateGodown(id, data, session.user_id);
}

export async function deleteGodown(id: number) {
  const session = await getSession();
  const repository = new WarehouseRepository(session.user_id);
  return await repository.deleteGodown(id, session.user_id);
}

export async function getAllSpaces(godownId?: number) {
  const session = await getSession();
  const repository = new WarehouseRepository(session.user_id);
  return await repository.getAllSpaces(godownId);
}

export async function getGodownSpaces(godownId: number) {
  const session = await getSession();
  const repository = new WarehouseRepository(session.user_id);
  return await repository.getGodownSpaces(godownId);
}

export async function allocateSpace(data: SpaceAllocationData) {
  const session = await getSession();
  const repository = new WarehouseRepository(session.user_id);
  return await repository.allocateSpace(data, session.user_id);
}

export async function updateSpaceUtilization(spaceId: number, utilizedArea: number) {
  const session = await getSession();
  const repository = new WarehouseRepository(session.user_id);
  return await repository.updateSpaceUtilization(spaceId, utilizedArea, session.user_id);
}

export async function terminateAllocation(allocationId: number) {
  const session = await getSession();
  const repository = new WarehouseRepository(session.user_id);
  return await repository.terminateAllocation(allocationId, session.user_id);
}

export async function getGodownUtilization(godownId?: number) {
  const session = await getSession();
  const repository = new WarehouseRepository(session.user_id);
  return await repository.getGodownUtilization(godownId);
}

export async function getCompanySpaceUsage(companyId: number) {
  const session = await getSession();
  const repository = new WarehouseRepository(session.user_id);
  return await repository.getCompanySpaceUsage(companyId);
}

export async function getExpiringAllocations(daysThreshold: number = 30) {
  const session = await getSession();
  const repository = new WarehouseRepository(session.user_id);
  return await repository.getExpiringAllocations(daysThreshold);
}

export async function getActiveAgreements() {
  const session = await getSession();
  const repository = new WarehouseRepository(session.user_id);
  return await repository.getActiveAgreements();
}

export async function getAgreementSpaces(agreementId: number) {
  const session = await getSession();
  const repository = new WarehouseRepository(session.user_id);
  return await repository.getAgreementSpaces(agreementId);
}