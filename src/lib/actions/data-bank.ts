"use server"

import { FolderFormValues } from "@/app/dashboard/data-bank/blocks/AddItem";
import { DataRepository, FolderPermissionData } from "../repositories/dataRepository";
import { getSession } from "../session";
import { FileTransfer } from "../helpers/file-helper";
import { File } from "fetch-blob/file.js";

export async function getFolderList(flat: boolean = false) {
  const session = await getSession();

  const dataRepository = new DataRepository(session.user_id);
  return await dataRepository.getFolderList(flat);
}

export async function getFolderById(folderId: number) {
  const session = await getSession();

  const dataRepository = new DataRepository(session.user_id);
  return await dataRepository.getFolderById(folderId);
}

export async function deleteDataFile(fileId: number) {
  const session = await getSession();

  const dataRepository = new DataRepository(session.user_id);
  return await dataRepository.deleteDataFile(fileId);
}

export async function addFolder(data: FolderFormValues) {
  const session = await getSession();

  const userRepository = new DataRepository(session.user_id);
  return await userRepository.addFolder(data, session.user_id);
}

export async function updateFolder(id: number, data: FolderFormValues) {
  const session = await getSession();

  const userRepository = new DataRepository(session.user_id);
  return await userRepository.updatedFolder(id, data, session.user_id);
}

export async function getFolderPermissions(folderId: number) {
  const session = await getSession();

  const userRepository = new DataRepository(session.user_id);
  return await userRepository.getFolderPermissions(folderId);
}

export async function saveFolderPermissions(folderId: number, permissions: FolderPermissionData[]) {
  const session = await getSession();

  const userRepository = new DataRepository(session.user_id);
  return await userRepository.saveFolderPermissions(folderId, permissions);
}

export async function uploadDataFile(id: number, fileData: FileTransfer) {
  const session = await getSession();
  
  if (!fileData?.arrayBuffer || !Array.isArray(fileData.arrayBuffer)) {
    throw new Error("fileData.arrayBuffer must be number[]");
  }

  // Convert number[] → Uint8Array
  const uint8 = new Uint8Array(fileData.arrayBuffer);

  // Create Blob
  const blob = new Blob([uint8], { type: fileData.type });

  // Create File
  const file = new File([blob], fileData.name, { type: fileData.type });

  const userRepository = new DataRepository(session.user_id);
  return await userRepository.uploadDataFile(id, file);
}
