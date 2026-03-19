import type { Role } from "@prisma/client";
import { cookies } from "next/headers";
import { jwtVerify, type JWTPayload } from "jose";

type SessionPayload = JWTPayload & {
  id?: string;
  userId?: string;
  companyId?: string;
  role?: Role;
};

export type SessionUser = {
  userId: string;
  companyId: string;
  role: Role | null;
};

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    return null;
  }

  return new TextEncoder().encode(process.env.JWT_SECRET);
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get("token")?.value;
  const secret = getJwtSecret();

  if (!token || !secret) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const sessionPayload = payload as SessionPayload;
    const userId = sessionPayload.userId ?? sessionPayload.id ?? sessionPayload.sub;
    const companyId = sessionPayload.companyId;
    const role =
      typeof sessionPayload.role === "string"
        ? (sessionPayload.role as Role)
        : null;

    if (typeof userId !== "string" || typeof companyId !== "string") {
      return null;
    }

    return { userId, companyId, role };
  } catch {
    return null;
  }
}
