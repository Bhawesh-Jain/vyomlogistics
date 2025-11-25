import { executeQuery, QueryBuilder } from "../helpers/db-helper";
import { RepositoryBase } from "../helpers/repository-base"
import { FolderFormValues } from "@/app/dashboard/data-bank/blocks/AddItem";
import { File } from "fetch-blob/file.js";
import { saveFile } from "../helpers/file-helper";
import { customLog } from "../utils";

export interface Folder {
  folder_id: number;
  folder_name: string;

  parent_id: number;

  company_id: number;
  company_name: string;
  abbr: string;

  org_id: number;
  org_name: string;

  status: number;

  updated_by: number;
  created_on: string;
  updated_on: string;

  sub_folders: Folder[]

  permissions?: FolderPermissions;

  files: DataFile[];
}

export interface FolderPermissions {
  can_create_subfolder: boolean;
  can_upload_file: boolean;
  can_download_file: boolean;
  can_rename: boolean;
  can_delete: boolean;
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
  private userId: string;

  constructor(userId: string) {
    super();
    this.userId = userId;
  }

  async getFolderList(flat: boolean = false) {
    try {
      const sql = `
      SELECT df.*,
        cm.company_name, cm.abbr,
        o.org_name
      FROM data_folders df
      LEFT JOIN organizations o ON o.org_id = df.org_id
      LEFT JOIN company_master cm ON o.company_id = cm.company_id
      WHERE df.status = 1
      ORDER BY df.folder_id ASC
    `;

      const flatFolders = await executeQuery(sql) as Folder[];

      if (flatFolders.length === 0) {
        return this.failure("No Folders Found!");
      }
      if (flat) {
        return this.success(flatFolders);
      }

      const folderMap = new Map<number, Folder>();

      flatFolders.forEach(f => {
        folderMap.set(f.folder_id, { ...f, sub_folders: [], files: [] });
      });

      const rootFolders: Folder[] = [];

      folderMap.forEach(folder => {
        if (folder.parent_id && folder.parent_id !== 0) {
          const parent = folderMap.get(folder.parent_id);
          if (parent) {
            parent.sub_folders!.push(folder);
          }
        } else {
          rootFolders.push(folder);
        }
      });

      for (const folder of Array.from(folderMap.values())) {
        const files = await new QueryBuilder("file_log")
          .where("associated_type = 'data_file'")
          .where("status = '1'")
          .where("associated_id = ?", folder.folder_id)
          .orderBy("id", "DESC")
          .select([
            "id",
            "identifier",
            "file_type",
            "file_name",
            "file_size",
            "file_mime",
            "created_on",
          ]);

        folder.files = files as DataFile[];

        let permissions = await new QueryBuilder('folder_permissions')
          .where('folder_id = ?', folder.folder_id)
          .where('user_id = ?', this.userId)
          .selectOne(['permission_array']) as FolderPermissions;

        if (permissions == null) {
          if (this.userId == '501' || this.userId == '502') {
            permissions = {
              can_create_subfolder: true,
              can_upload_file: true,
              can_download_file: true,
              can_rename: true,
              can_delete: true,
            };
          } else {
            permissions = {
              can_create_subfolder: false,
              can_upload_file: false,
              can_download_file: false,
              can_rename: false,
              can_delete: false,
            };
          }
        }

        folder.permissions = permissions;
      }

      return this.success(rootFolders);
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