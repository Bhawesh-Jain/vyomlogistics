"use server"
import { getSession } from "../session";
import { UserAuthRepository } from "../repositories/userAuthRepository";
import { cookies } from "next/headers";
import { customLog } from "../utils";
import { SidebarRepository } from "../repositories/sidebarRepository";
import { extractAllowedRoutes } from "../helpers/permission-helper";
import { AccessRepository } from "../repositories/accessRepository";

export type UserData = {
  user_id: string;
  user_phone: string;
  user_email: string;
  user_avatar: string;
  user_name: string;
  company_name: string;
  company_id: string;
  company_abbr: string;
  role: string;
};


export async function handleLoginForm(formData: FormData) {
  const formObject = Object.fromEntries(formData.entries());
  const ip = cookies().get("client-ip")?.value || "undefined";

  const { username, password } = formObject;

  try {
    const authService = new UserAuthRepository();
    const result = await authService.login(
      username.toString().trim(),
      password.toString(),
      ip.toString(),
      10
    );

    if (!result.success || !result.user) {
      return {
        success: false,
        message: result.error ?? "Invalid credentials",
      };
    }

    const sidebarRepo = new SidebarRepository(
      result.user.user_id,
      result.user.company_id
    );

    const sidebarData = await sidebarRepo.getSidebarData();

    if (!sidebarData.success) {
      throw new Error("Permission load failed");
    }

    const allowedRoutes = extractAllowedRoutes(
      sidebarData.result.menu
    );

    const permissionsVersion = await new AccessRepository(result.user.company_id).getRolePermissionVersion(
      result.user.role
    );
    await login(
      result.user,
      allowedRoutes,
      permissionsVersion
    );

    return {
      success: true,
      message: "Login Successful",
      menu: sidebarData.result.menu,
    };
  } catch (error) {
    customLog("auth.ts", error);
    return {
      success: false,
      message: "Login Request Not Processed!",
    };
  }
}


export async function login(
  userData: UserData,
  allowedRoutes: string[],
  permissionsVersion: number
) {
  const session = await getSession();

  Object.assign(session, {
    ...userData,
    allowedRoutes,
    permissionsVersion,
    isLoggedIn: true,
  });

  await session.save();
}


export async function logout() {
  const session = await getSession();
  session.destroy();
}
