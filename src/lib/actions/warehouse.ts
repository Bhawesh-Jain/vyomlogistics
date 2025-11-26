"use server"

import { AllocationFormValues } from "@/app/dashboard/godown/blocks/AllocateSpaceDialog";
import { WarehouseRepository } from "../repositories/warehouseRepository";
import { getSession } from "../session";
import { GodownFormValues } from "@/app/dashboard/godown/blocks/AddItem";

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

export async function addGodown(data: GodownFormValues) {
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

export async function getAllSpaces(godownId: number) {
  const session = await getSession();
  const repository = new WarehouseRepository(session.user_id);
  return await repository.getAllSpaces(godownId, session.user_id);
}

export async function allocateSpace(data: AllocationFormValues, godownId: number) {
  const session = await getSession();
  const repository = new WarehouseRepository(session.user_id);
  return await repository.allocateSpace(data, godownId, session.user_id);
}