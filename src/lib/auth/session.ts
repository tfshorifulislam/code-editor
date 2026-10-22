import { cookies } from "next/headers";
import { verifySessionToken, SessionPayload } from "./jwt";
import prisma from "@/lib/db/prisma";

export const SESSION_COOKIE_NAME = "code_editor_session";

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 30 * 24 * 60 * 60, // 30 days
};

export async function getSessionPayload(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getSessionUser() {
  const payload = await getSessionPayload();
  if (!payload) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
        settings: true,
      },
    });
    return user;
  } catch (error) {
    console.error("Failed to query session user:", error);
    return null;
  }
}
