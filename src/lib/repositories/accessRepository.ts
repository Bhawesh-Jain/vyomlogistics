import { executeQuery, QueryBuilder } from "../helpers/db-helper";
import { buildTree, PermissionItem } from "../helpers/permission-helper";
import { RepositoryBase } from "../helpers/repository-base"

export interface Role {
  id: string;
  role_name: string;
  user_count: number;
  permissions_version: number;
  permissions: string;
  department: string;
}

export class AccessRepository extends RepositoryBase {
  private roleBuilder: QueryBuilder;
  private moduleBuilder: QueryBuilder;
  private companyId: string;

  constructor(companyId: string) {
    super()
    this.roleBuilder = new QueryBuilder('roles');
    this.moduleBuilder = new QueryBuilder('modules');
    this.companyId = companyId;
  }


  async getRoles(
    role: string
  ) {
    try {
      const query = this.roleBuilder
        .where('status = ?', 1);

      if (role != '1') {
        query.where('id != 1')
      }

      const result = await query
        .select(['id', 'role_name', 'user_count', 'permissions', 'department'])

      return this.success(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getAllPermissions() {
    try {
      const result = await this.moduleBuilder
        .where('status = ?', 1)
        .select(['id', 'parent_id', 'url', 'title', 'menu_order'])

      const permissions = buildTree(result as PermissionItem[]);

      return this.success(permissions);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateRolePermissions(roleId: string, permissions: number[]) {
    try {
      const role = await new QueryBuilder('roles')
        .where('id = ?', roleId)
        .selectOne() as Role;

      if (!role) {
        return this.handleError('Invalid Role!');
      }

      await new QueryBuilder('roles').where('id = ?', roleId).update({ permissions: permissions.join(','), permissions_version: role.permissions_version + 1 });
      return this.success(true);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createRole(
    name: string,
    department: string,
    userId: string
  ) {
    try {
      const insert = await this.roleBuilder.insert({
        role_name: name,
        company_id: this.companyId,
        department: department,
        status: 1,
        created_by: userId
      });

      if (insert) {
        return this.success(insert);
      } else {
        return this.failure('Failed to create role');
      }
    } catch (error) {
      return this.handleError(error);
    }
  }



  async getRolePermissionVersion(roleId: string): Promise<number> {
    const result = await executeQuery<{ permissions_version: number }[]>(
      "SELECT permissions_version FROM roles WHERE id = ?",
      [roleId]
    );

    return result[0]?.permissions_version ?? 0;
  }

}

