import { executeQuery, QueryBuilder, withTransaction } from "../helpers/db-helper";
import { RepositoryBase } from "../helpers/repository-base"
import { FolderFormValues } from "@/app/dashboard/data-bank/blocks/AddItem";
import { File } from "fetch-blob/file.js";
import { deleteFileFromIdentifier, saveFile } from "../helpers/file-helper";
import { customLog } from "../utils";

export interface Folder {
  folder_id: number;
  folder_name: string;

  parent_id: number;

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

export interface FolderPermissionData {
  userId: string;
  permissions: {
    can_create_subfolder: boolean;
    can_upload_file: boolean;
    can_download_file: boolean;
    can_rename: boolean;
    can_delete: boolean;
  };
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
      let sql = `
        SELECT df.*
        FROM data_folders df
        WHERE df.status = 1
        ORDER BY df.folder_id ASC
      `;
      if (this.userId != '501' && this.userId != '502') {
        sql = `
          SELECT df.*
          FROM data_folders df
          JOIN folder_permissions fp ON fp.folder_id = df.folder_id
          WHERE df.status = 1
            AND fp.user_id = ${this.userId}
          ORDER BY df.folder_id ASC
        `;
      }


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
          .selectOne(['can_create_subfolder', 'can_upload_file', 'can_download_file', 'can_rename', 'can_delete']) as any;

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
        } else {
          permissions = {
            can_create_subfolder: Boolean(permissions.can_create_subfolder),
            can_upload_file: Boolean(permissions.can_upload_file),
            can_download_file: Boolean(permissions.can_download_file),
            can_rename: Boolean(permissions.can_rename),
            can_delete: Boolean(permissions.can_delete),
          };
        }

        folder.permissions = permissions as FolderPermissions;
      }

      return this.success(rootFolders);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getFolderById(folderId: number) {
    try {
      let sql = `
      SELECT df.*
      FROM data_folders df
      WHERE df.status = 1
        AND df.folder_id = ?
      LIMIT 1
    `;

      const folders = await executeQuery(sql, [folderId]) as Folder[];

      if (folders.length == 0) {
        return this.failure('No Folders Found!');
      }

      const element = folders[0];

      let subFoldersSql = `
        SELECT df.*
        FROM data_folders df
        WHERE df.status = 1
          AND df.parent_id = ?
        ORDER BY df.folder_id ASC
      `;

      if (this.userId != '501' && this.userId != '502') {
        subFoldersSql = `
          SELECT df.*
          FROM data_folders df
          JOIN folder_permissions fp ON fp.folder_id = df.folder_id
          WHERE fp.user_id = ${this.userId}
            AND df.status = 1
            AND df.parent_id = ?
          ORDER BY df.folder_id ASC
        `;
      }

      const subFolders = await executeQuery(subFoldersSql, [folderId]) as Folder[];

      for (const subFolder of subFolders) {
        const files = await new QueryBuilder('file_log')
          .where("associated_type = 'data_file'")
          .where("status = '1'")
          .where("associated_id = ?", subFolder.folder_id)
          .orderBy('id', 'DESC')
          .select(['id', 'identifier', 'file_type', 'file_name', 'file_size', 'file_mime', 'created_on']);

        subFolder.files = files as DataFile[];

        let permissions = await new QueryBuilder('folder_permissions')
          .where('folder_id = ?', subFolder.folder_id)
          .where('user_id = ?', this.userId)
          .selectOne(['can_create_subfolder', 'can_upload_file', 'can_download_file', 'can_rename', 'can_delete']) as any;

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
        } else {
          permissions = {
            can_create_subfolder: Boolean(permissions.can_create_subfolder),
            can_upload_file: Boolean(permissions.can_upload_file),
            can_download_file: Boolean(permissions.can_download_file),
            can_rename: Boolean(permissions.can_rename),
            can_delete: Boolean(permissions.can_delete),
          };
        }

        subFolder.permissions = permissions as FolderPermissions;
      }

      element.sub_folders = subFolders;

      const files = await new QueryBuilder('file_log')
        .where("associated_type = 'data_file'")
        .where("status = '1'")
        .where("associated_id = ?", element.folder_id)
        .orderBy('id', 'DESC')
        .select(['id', 'identifier', 'file_type', 'file_name', 'file_size', 'file_mime', 'created_on']);

      element.files = files as DataFile[];

      let permissions = await new QueryBuilder('folder_permissions')
        .where('folder_id = ?', folderId)
        .where('user_id = ?', this.userId)
        .selectOne(['can_create_subfolder', 'can_upload_file', 'can_download_file', 'can_rename', 'can_delete']) as any;

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
      } else {
        permissions = {
          can_create_subfolder: Boolean(permissions.can_create_subfolder),
          can_upload_file: Boolean(permissions.can_upload_file),
          can_download_file: Boolean(permissions.can_download_file),
          can_rename: Boolean(permissions.can_rename),
          can_delete: Boolean(permissions.can_delete),
        };
      }

      element.permissions = permissions as FolderPermissions;

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

      await new QueryBuilder('folder_permissions')
        .insert({
          folder_id: result,
          user_id: userId,
          can_create_subfolder: 1,
          can_upload_file: 1,
          can_download_file: 1,
          can_rename: 1,
          can_delete: 1,
        });

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
      customLog(file);



      await saveFile(file, file.name, folderId.toString(), this.userId, 'data_file', './uploads/data-bank/', 'user-web-upload');

      return this.success('File Uploaded Successfully');
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteDataFile(
    fileId: number
  ) {
    try {
      const res = await deleteFileFromIdentifier(fileId.toString(), this.userId);

      if (!res.success) {
        return this.failure(res.error || 'File Deletion Failed');
      }

      return this.success('File Deleted Successfully');
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getFolderPermissions(
    folderId: number
  ) {
    try {
      let sql = `
        SELECT u.name as userName, u.email as userEmail,
          fp.user_id as userId,
          fp.can_create_subfolder,
          fp.can_upload_file,
          fp.can_download_file,
          fp.can_rename,
          fp.can_delete
          FROM folder_permissions fp
          JOIN users u ON u.id = fp.user_id
          WHERE fp.folder_id = ?
            AND u.status = 1
      `;

      const permissions = await executeQuery<any[]>(sql, [folderId]);

      if (permissions.length == 0) {
        return this.failure('No Permissions Found!');
      }

      const formattedPermissions = permissions.map(p => ({
        userId: p.userId.toString(),
        userName: p.userName,
        userEmail: p.userEmail,
        permissions: {
          can_create_subfolder: Boolean(p.can_create_subfolder),
          can_upload_file: Boolean(p.can_upload_file),
          can_download_file: Boolean(p.can_download_file),
          can_rename: Boolean(p.can_rename),
          can_delete: Boolean(p.can_delete),
        }
      }));

      return this.success(formattedPermissions);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async saveFolderPermissions(folderId: number, permissions: FolderPermissionData[]) {
    try {
      return withTransaction(async (connection) => {
        try {
          await new QueryBuilder('folder_permissions')
            .setConnection(connection)
            .where('folder_id = ?', folderId)
            .delete();

          for (const perm of permissions) {
            await new QueryBuilder('folder_permissions')
              .setConnection(connection)
              .insert({
                folder_id: folderId,
                user_id: perm.userId,
                can_create_subfolder: perm.permissions.can_create_subfolder ? 1 : 0,
                can_upload_file: perm.permissions.can_upload_file ? 1 : 0,
                can_download_file: perm.permissions.can_download_file ? 1 : 0,
                can_rename: perm.permissions.can_rename ? 1 : 0,
                can_delete: perm.permissions.can_delete ? 1 : 0,
                updated_by: this.userId,
              });
          }

          return this.success('Permissions saved successfully');
        } catch (error) {
          return this.handleError(error);
        }
      });
    } catch (error) {
      return this.handleError(error);
    }
  }
}