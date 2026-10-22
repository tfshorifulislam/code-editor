import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/passwords";
import { signSessionToken } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { settings: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const isValid = await verifyPassword(String(password), user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const userProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      createdAt: user.createdAt,
      settings: user.settings,
    };

    const response = NextResponse.json({
      success: true,
      user: userProfile,
      message: "Logged in successfully.",
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "An error occurred during sign in." }, { status: 500 });
  }
}
