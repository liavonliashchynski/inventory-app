import { db } from "@/lib/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return new Response("Server auth misconfigured", { status: 500 });
  }

  const { email, password } = await req.json();
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return new Response("Invalid credentials", { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return new Response("Invalid credentials", { status: 401 });
  }

  if (!user.emailVerifiedAt) {
    return new Response(
      "Please verify your email before signing in.",
      { status: 403 },
    );
  }

  const token = jwt.sign(
    {
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
    },
    jwtSecret,
    { expiresIn: "7d" },
  );

  const res = NextResponse.json({ success: true });
  res.cookies.set("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
