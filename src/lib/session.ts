import { SessionOptions, getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";

export const sessionOptions: SessionOptions = {
  password: process.env.SECRET_KEY!,
  cookieName: "vyomlogistics",
  cookieOptions: {
    httpOnly: true,
    maxAge: 24 * 60 * 60,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    secure: process.env.NODE_ENV === "production",
  },
};

export interface SessionData {
  user_id: string;
  user_phone: string;
  user_email: string;
  user_avatar: string;
  user_name: string;
  company_name: string;
  company_id: string;
  company_abbr: string;
  role: string;

  // 🔐 AUTHORIZATION DATA
  permissionsVersion?: number;
  allowedRoutes?: string[];

  isLoggedIn: boolean;
}

export type ValidatedSession = Required<SessionData>;

export const defaultSession: SessionData = {
  user_id: "",
  user_phone: "",
  user_email: "",
  user_avatar: "",
  user_name: "",
  company_name: "",
  company_id: "",
  company_abbr: "",
  role: "",
  permissionsVersion: undefined,
  allowedRoutes: undefined,
  isLoggedIn: false,
};

export class SessionError extends Error {
  constructor(message: string = "Invalid session") {
    super(message);
    this.name = "SessionError";
  }
}

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(cookies(), sessionOptions);
}

export async function validateSession(): Promise<ValidatedSession> {
  const session = await getSession();

  if (
    !session.isLoggedIn ||
    !session.user_id ||
    !session.company_id
  ) {
    throw new SessionError("User not authenticated");
  }

  return session as ValidatedSession;
}
