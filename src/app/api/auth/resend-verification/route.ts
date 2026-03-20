import { db } from "@/lib/db";
import { isMailerConfigured, shouldAwaitEmailDelivery } from "@/lib/email";
import {
  createEmailVerificationToken,
  sendVerificationEmail,
} from "@/lib/email-verification";
import { getRequestIp } from "@/lib/request-ip";
import { isTurnstileConfigured, verifyTurnstileToken } from "@/lib/turnstile";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email(),
  turnstileToken: z
    .string()
    .trim()
    .min(1, "Please complete the verification challenge."),
});
const message =
  "If an unverified account exists for this email, a new verification link is on the way.";

export async function POST(req: Request) {
  try {
    const { email, turnstileToken } = schema.parse(await req.json());
    const normalizedEmail = email.toLowerCase();
    const requestIp = getRequestIp(req);

    if (!isTurnstileConfigured()) {
      return Response.json(
        { error: "Verification protection is not configured yet." },
        { status: 500 },
      );
    }

    const turnstileResult = await verifyTurnstileToken({
      token: turnstileToken,
      ip: requestIp,
    });

    if (!turnstileResult.success) {
      return Response.json(
        { error: "Verification failed. Please try the challenge again." },
        { status: 403 },
      );
    }

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
