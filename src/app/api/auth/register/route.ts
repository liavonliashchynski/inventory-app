import { db } from "@/lib/db";
import { isMailerConfigured, shouldAwaitEmailDelivery } from "@/lib/email";
import {
  createEmailVerificationToken,
  sendVerificationEmail,
} from "@/lib/email-verification";
import bcrypt from "bcrypt";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
  companyName: z.string().trim().min(2),
});

const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

export async function POST(req: Request) {
  try {
    const data = schema.parse(await req.json());
    const email = data.email.toLowerCase();

    const existingUser = await db.user.findUnique({
      where: { email },
      select: { emailVerifiedAt: true },
    });

    if (existingUser) {
      return Response.json(
        {
          error: existingUser.emailVerifiedAt
            ? "User already exists."
            : "Account already exists but the email is not verified yet. Please use the resend option on the login page.",
        },
        { status: 400 },
      );
    }

    const baseSlug = generateSlug(data.companyName);
    let slug = baseSlug;
    let counter = 1;

    // Condense the slug uniqueness check
    while (await db.company.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const { token, tokenHash, expiresAt } = createEmailVerificationToken();

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "ADMIN",
        emailVerificationToken: tokenHash,
        emailVerificationExpiresAt: expiresAt,
        company: {
          create: { name: data.companyName, slug },
        },
      },
      select: { id: true, email: true, role: true, companyId: true },
    });

    let verificationEmailQueued = isMailerConfigured();

    if (verificationEmailQueued) {
      if (shouldAwaitEmailDelivery()) {
        try {
          await sendVerificationEmail({
            to: email,
            token,
            requestUrl: req.url,
          });
        } catch (error) {
          verificationEmailQueued = false;
          console.error(
            "Failed to send verification email after registration",
            error,
          );
        }
      } else {
        void sendVerificationEmail({
          to: email,
          token,
          requestUrl: req.url,
        }).catch((error) => {
          console.error(
            "Failed to send verification email after registration",
            error,
          );
        });
      }
    }

    return Response.json({ user, verificationEmailQueued }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError)
      return Response.json({ error: error.issues }, { status: 400 });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
