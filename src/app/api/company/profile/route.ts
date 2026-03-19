import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.union([z.literal(""), z.string().trim().email().max(255)]),
  phone: z.union([z.literal(""), z.string().trim().max(40)]),
  website: z.union([z.literal(""), z.string().trim().max(255)]),
  address: z.union([z.literal(""), z.string().trim().max(500)]),
});

function normalizeOptionalText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeWebsite(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(normalized);
    return url.toString();
  } catch {
    return "invalid";
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = schema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid company profile." },
        { status: 400 },
      );
    }

    const website = normalizeWebsite(parsed.data.website);

    if (website === "invalid") {
      return NextResponse.json(
        { error: "Please enter a valid website URL." },
        { status: 400 },
      );
    }

    const company = await db.company.update({
      where: { id: session.companyId },
      data: {
        name: parsed.data.name.trim(),
        email: normalizeOptionalText(parsed.data.email),
        phone: normalizeOptionalText(parsed.data.phone),
        website,
        address: normalizeOptionalText(parsed.data.address),
      },
      select: {
        id: true,
      },
    });

    revalidatePath("/dashboard");

    return NextResponse.json(company, { status: 200 });
  } catch (error) {
    console.error("PATCH_COMPANY_PROFILE_ERROR:", error);
    return NextResponse.json(
      { error: "Failed to update company profile." },
      { status: 500 },
    );
  }
}
