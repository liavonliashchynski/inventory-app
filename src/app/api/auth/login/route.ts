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

  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user) {
    return new Response("Invalid credentials", { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return new Response("Invalid credentials", { status: 401 });
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
