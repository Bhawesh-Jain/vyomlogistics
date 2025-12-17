'use client'

import { UserData, logout as logoutAction } from "@/lib/actions/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SessionData } from "@/lib/session";

interface UserContextType {
  user: UserData;
  allowedRoutes: string[];
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({
  children,
  user,
}: {
  children: React.ReactNode;
  user: UserData;
}) {
  const [allowedRoutes, setAllowedRoutes] = useState<string[]>(user.allowedRoutes ?? []);
  const router = useRouter();
  const pathname = usePathname();

  const logout = () => {
    logoutAction(); 
    router.replace("/login");
  };

  useEffect(() => {
    if (!pathname) return;

    const isAllowed = allowedRoutes.some(
      (route) => pathname === route || pathname.startsWith(route + "/")
    );

    if (!isAllowed) {
      logout();
    }
  }, [pathname, allowedRoutes]);

  return (
    <UserContext.Provider value={{ user, allowedRoutes, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
