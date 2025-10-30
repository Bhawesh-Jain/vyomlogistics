"use server"

import { OrganizationFormValues } from "@/app/dashboard/organizations/companies/blocks/AddOrganization";
import { OrganizationRepository } from "../repositories/organizationRepository";
import { getSession } from "../session";

export async function getAllCompanies() {
  const session = await getSession();

  const userRepository = new OrganizationRepository(session.user_id);
  return await userRepository.getAllOrganizations();
}

export async function getOrganizationById(id: number) {
  const session = await getSession();

  const userRepository = new OrganizationRepository(session.user_id);
  return await userRepository.getOrganizationById(id);
}

export async function addOrganization(data: OrganizationFormValues) {
  const session = await getSession();

  const userRepository = new OrganizationRepository(session.user_id);
  return await userRepository.addOrganization(data, session.user_id);
}

export async function updatedOrganization(id: number, data: OrganizationFormValues) {
  const session = await getSession();

  const userRepository = new OrganizationRepository(session.user_id);
  return await userRepository.updatedOrganization(id, data, session.user_id);
}

export async function deleteOrganization(id: number) {
  const session = await getSession();

  const userRepository = new OrganizationRepository(session.user_id);
  return await userRepository.deleteOrganization(id, session.user_id);
}
