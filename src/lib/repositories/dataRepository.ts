import { executeQuery, QueryBuilder } from "../helpers/db-helper";
import { RepositoryBase } from "../helpers/repository-base"
import { FolderFormValues } from "@/app/dashboard/data-bank/blocks/AddItem";
import { File } from "fetch-blob/file.js";
import { saveFile } from "../helpers/file-helper";

export interface Folder {
  folder_id: number;
  folder_name: string;

  company_id: number;
  company_name: string;
  abbr: string;

  org_id: number;
  org_name: string;

  status: number;

  updated_by: number;
  created_on: string;
  updated_on: string;

  files: DataFile[];
}

export interface DataFile {
  id: number;
  identifier: string;
  file_type: string;
  file_name: string;
  file_size: string;
  file_mime: string;

  created_on: string;
}

export class DataRepository extends RepositoryBase {
  constructor(userId: string) {
    super();
  }

  async getFolderList() {
    try {
      let sql = `
        SELECT df.*,
          cm.company_name, cm.abbr,
          o.org_name
        FROM data_folders df
        LEFT JOIN organizations o ON o.org_id = df.org_id
        LEFT JOIN company_master cm ON o.company_id = cm.company_id
        WHERE df.status = 1
      `;

      const folders = await executeQuery(sql) as Folder[];

      if (folders.length == 0) {
        return this.failure('No Folders Found!');
      }

      for (let i = 0; i < folders.length; i++) {
        const element = folders[i];

        const files = await new QueryBuilder('file_log')
          .where("associated_type = 'data_file'")
          .where("status = '1'")
          .where("associated_id = ?", element.folder_id)
          .orderBy('id', 'DESC')
          .select(['id', 'identifier', 'file_type', 'file_name', 'file_size', 'file_mime', 'created_on']);

        element.files = files as DataFile[];
      }

      return this.success(folders);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getFolderById(folderId: number) {
    try {
      let sql = `
        SELECT df.*,
          cm.company_name, cm.abbr, cm.company_id,
          o.org_name
        FROM data_folders df
        LEFT JOIN organizations o ON o.org_id = df.org_id
        LEFT JOIN company_master cm ON o.company_id = cm.company_id
        WHERE df.status = 1
          AND df.folder_id = ?
        LIMIT 1
      `;

      const folders = await executeQuery(sql, [folderId]) as Folder[];

      if (folders.length == 0) {
        return this.failure('No Folders Found!');
      }

      const element = folders[0];

      const files = await new QueryBuilder('file_log')
        .where("associated_type = 'data_file'")
        .where("status = '1'")
        .where("associated_id = ?", element.folder_id)
        .orderBy('id', 'DESC')
        .select(['id', 'identifier', 'file_type', 'file_name', 'file_size', 'file_mime', 'created_on']);

      element.files = files as DataFile[];


      return this.success(element);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async addFolder(
    data: FolderFormValues,
    userId: string
  ) {
    try {
      const result = await new QueryBuilder('data_folders')
        .insert({
          ...data,
          updated_by: userId
        });

      if (result == 0) {
        return this.failure('Request Failed!')
      }

      return this.success('Folder Added Successfully');
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updatedFolder(
    folderId: number,
    data: FolderFormValues,
    userId: string
  ) {
    try {
      const result = await new QueryBuilder('data_folders')
        .where('folder_id = ?', folderId)
        .update({
          ...data,
          updated_by: userId
        })

      if (result == 0) {
        return this.failure('Request Failed!')
      }

      return this.success('Folder Updated Successfully');
    } catch (error) {
      return this.handleError(error);
    }
  }

  async uploadDataFile(
    folderId: number,
    file: File | undefined
  ) {
    try {
      if (!file) {
        return this.failure('No File Provided');
      }

      await saveFile(file, file.name, folderId.toString(), 'data_file', './uploads/data-bank/', 'user-web-upload')

      return this.success('File Uploaded Successfully');
    } catch (error) {
      return this.handleError(error);
    }
  }
}