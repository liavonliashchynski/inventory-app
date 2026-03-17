import { db } from "@/lib/db";
import { isMailerConfigured, shouldAwaitEmailDelivery } from "@/lib/email";
import {
  createEmailVerificationToken,
  sendVerificationEmail,
} from "@/lib/email-verification";
import { z } from "zod";

const schema = z.object({ email: z.string().trim().email() });
const message =
  "If an unverified account exists for this email, a new verification link is on the way.";

export async function POST(req: Request) {
  try {
    const { email } = schema.parse(await req.json());
    const normalizedEmail = email.toLowerCase();
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, emailVerifiedAt: true },
    });

    if (!user || user.emailVerifiedAt) {
      return Response.json({ message });
    }

    if (!isMailerConfigured()) {
      return Response.json(
        { error: "Email delivery is not configured yet." },
        { status: 500 },
      );
    }

    const { token, tokenHash, expiresAt } = createEmailVerificationToken();

    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: tokenHash,
        emailVerificationExpiresAt: expiresAt,
      },
    });

    if (shouldAwaitEmailDelivery()) {
      await sendVerificationEmail({
        to: user.email,
        token,
        requestUrl: req.url,
      });
    } else {
      void sendVerificationEmail({
        to: user.email,
        token,
        requestUrl: req.url,
      }).catch((error) => {
        console.error("Failed to resend verification email", error);
      });
    }

    return Response.json({ message });
  } catch (error) {
    console.error("Resend verification failed", error);
    const isZodError = error instanceof z.ZodError;
    return Response.json(
      {
        error: isZodError
          ? "Enter a valid email address."
          : "Try again later.",
      },
      { status: isZodError ? 400 : 500 },
    );
  }
}
