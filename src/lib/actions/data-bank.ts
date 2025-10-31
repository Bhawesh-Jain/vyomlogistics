"use server"

import { FolderFormValues } from "@/app/dashboard/data-bank/blocks/AddItem";
import { DataRepository } from "../repositories/dataRepository";
import { getSession } from "../session";
import { FileTransfer } from "../helpers/file-helper";
import { File } from "fetch-blob/file.js";

export async function getFolderList() {
  const session = await getSession();

  const dataRepository = new DataRepository(session.user_id);
  return await dataRepository.getFolderList();
}

export async function getFolderById(folderId: number) {
  const session = await getSession();

  const dataRepository = new DataRepository(session.user_id);
  return await dataRepository.getFolderById(folderId);
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

export async function uploadDataFile(id: number, fileData: FileTransfer) {
  const session = await getSession();

  var file: File | undefined;
  if (fileData) {
    const uint8Array = new Uint8Array(fileData.arrayBuffer);
    const blob = new Blob([uint8Array], { type: fileData.type });
    file = new File([blob], fileData.name, { type: fileData.type });
  }

  const userRepository = new DataRepository(session.user_id);
  return await userRepository.uploadDataFile(id, file);
}