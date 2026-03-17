import { db } from "@/lib/db";
import { hashEmailVerificationToken } from "@/lib/email-verification";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const redirectToLogin = (status: string) =>
    NextResponse.redirect(new URL(`/login?verified=${status}`, req.url));

  try {
    const token = new URL(req.url).searchParams.get("token");

    if (!token) {
      return redirectToLogin("missing-token");
    }

    const user = await db.user.findUnique({
      where: { emailVerificationToken: hashEmailVerificationToken(token) },
      select: {
        id: true,
        emailVerifiedAt: true,
        emailVerificationExpiresAt: true,
      },
    });

    if (!user) {
      return redirectToLogin("invalid");
    }

    const isExpired =
      !user.emailVerificationExpiresAt ||
      user.emailVerificationExpiresAt < new Date();
    const status = user.emailVerifiedAt
      ? "already"
      : isExpired
        ? "expired"
        : "success";

    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
        ...(status === "success" && { emailVerifiedAt: new Date() }),
      },
    });

    return redirectToLogin(status);
  } catch (error) {
    console.error("Verification failed", error);
    return redirectToLogin("error");
  }
}
