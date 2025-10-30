"use server"

import { OrganizationFormValues } from "@/app/dashboard/organizations/companies/blocks/AddOrganization";
import { OrganizationRepository } from "../repositories/organizationRepository";
import { getSession } from "../session";
import { LicenseFormValues } from "@/app/dashboard/organizations/licenses/blocks/AddItem";
import { AgreementFormValues } from "@/app/dashboard/organizations/agreements/blocks/AddItem";

export async function getAllOrganizations() {
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

export async function getAllLicenses() {
  const session = await getSession();

  const userRepository = new OrganizationRepository(session.user_id);
  return await userRepository.getAllLicenses();
}

export async function getLicenseById(id: number) {
  const session = await getSession();

  const userRepository = new OrganizationRepository(session.user_id);
  return await userRepository.getLicenseById(id);
}

export async function addLicense(data: LicenseFormValues) {
  const session = await getSession();

  const userRepository = new OrganizationRepository(session.user_id);
  return await userRepository.addLicense(data, session.user_id);
}

export async function updateLicense(id: number, data: LicenseFormValues) {
  const session = await getSession();

  const userRepository = new OrganizationRepository(session.user_id);
  return await userRepository.updatedLicense(id, data, session.user_id);
}

export async function deleteLicense(id: number) {
  const session = await getSession();

  const userRepository = new OrganizationRepository(session.user_id);
  return await userRepository.deleteLicense(id, session.user_id);
}

export async function getAllAgreements() {
  const session = await getSession();

  const userRepository = new OrganizationRepository(session.user_id);
  return await userRepository.getAllAgreements();
}

export async function getAgreementById(id: number) {
  const session = await getSession();

  const userRepository = new OrganizationRepository(session.user_id);
  return await userRepository.getAgreementById(id);
}

export async function addAgreement(data: AgreementFormValues) {
  const session = await getSession();

  const userRepository = new OrganizationRepository(session.user_id);
  return await userRepository.addAgreement(data, session.user_id);
}

export async function updateAgreement(id: number, data: AgreementFormValues) {
  const session = await getSession();

  const userRepository = new OrganizationRepository(session.user_id);
  return await userRepository.updatedAgreement(id, data, session.user_id);
}

export async function deleteAgreement(id: number) {
  const session = await getSession();

  const userRepository = new OrganizationRepository(session.user_id);
  return await userRepository.deleteAgreement(id, session.user_id);
}
