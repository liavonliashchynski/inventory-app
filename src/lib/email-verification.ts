import crypto from "node:crypto";

import { sendMail } from "@/lib/email";

const EMAIL_VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24;

export function createEmailVerificationToken() {
  const token = crypto.randomBytes(32).toString("hex");

  return {
    token,
    tokenHash: hashEmailVerificationToken(token),
    expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
  };
}

export function hashEmailVerificationToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getAppUrl(requestUrl: string) {
  return process.env.APP_URL?.trim() || new URL(requestUrl).origin;
}

export async function sendVerificationEmail({
  to,
  token,
  requestUrl,
}: {
  to: string;
  token: string;
  requestUrl: string;
}) {
  const verificationUrl = new URL("/api/auth/verify-email", getAppUrl(requestUrl));
  verificationUrl.searchParams.set("token", token);

  const subject = "Verify your email";
  const text = [
    "Welcome to Inventory App.",
    "",
    "Please verify your email to finish setting up your account:",
    verificationUrl.toString(),
    "",
    "This link expires in 24 hours.",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;">
      <h1 style="margin-bottom:12px;">Verify your email</h1>
      <p style="margin:0 0 16px;">Welcome to Inventory App. Confirm your email to finish setting up your account.</p>
      <p style="margin:0 0 20px;">
        <a
          href="${verificationUrl.toString()}"
          style="display:inline-block;padding:12px 18px;border-radius:8px;background:#300453;color:#ffffff;text-decoration:none;font-weight:600;"
        >
          Verify email
        </a>
      </p>
      <p style="margin:0 0 8px;">Or copy and paste this link into your browser:</p>
      <p style="margin:0 0 16px;word-break:break-all;">${verificationUrl.toString()}</p>
      <p style="margin:0;color:#475569;">This link expires in 24 hours.</p>
    </div>
  `;

  await sendMail({
    to,
    subject,
    html,
    text,
  });
}
