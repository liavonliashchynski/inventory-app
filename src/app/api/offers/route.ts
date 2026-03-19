import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const offerItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(10000),
});

const offerSchema = z
  .object({
    clientId: z.string().uuid().optional(),
    clientName: z.string().trim().min(2).max(160).optional(),
    clientEmail: z
      .union([z.literal(""), z.string().trim().email().max(255)])
      .optional(),
    clientPhone: z.union([z.literal(""), z.string().trim().max(40)]).optional(),
    validUntil: z.union([z.literal(""), z.string().trim()]).optional(),
    notes: z.union([z.literal(""), z.string().trim().max(2000)]).optional(),
    items: z.array(offerItemSchema).min(1).max(20),
  })
  .superRefine((value, ctx) => {
    if (!value.clientId && !value.clientName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["clientName"],
        message: "Select an existing client or enter a company name.",
      });
    }
  });

const normalizeOptionalText = (value?: string) => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const parseValidUntil = (value?: string) => {
  const normalized = normalizeOptionalText(value);

  if (!normalized) {
    return null;
  }

  const parsed = new Date(`${normalized}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? "invalid" : parsed;
};

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = offerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid offer payload" },
        { status: 400 },
      );
    }

    const validUntil = parseValidUntil(parsed.data.validUntil);

    if (validUntil === "invalid") {
      return NextResponse.json(
        { error: "Please provide a valid offer expiration date." },
        { status: 400 },
      );
    }

    const productIds = parsed.data.items.map((item) => item.productId);
    const uniqueProductIds = [...new Set(productIds)];

    if (uniqueProductIds.length !== productIds.length) {
      return NextResponse.json(
        { error: "Add each product only once per offer and adjust quantity instead." },
        { status: 400 },
      );
    }

    const [company, products] = await Promise.all([
      db.company.findUnique({
        where: { id: session.companyId },
        select: { id: true, slug: true },
      }),
      db.product.findMany({
        where: {
          companyId: session.companyId,
          id: { in: uniqueProductIds },
        },
        select: {
          id: true,
          name: true,
          price: true,
          currency: true,
        },
      }),
    ]);

    if (!company) {
      return NextResponse.json(
        { error: "Your company could not be found." },
        { status: 404 },
      );
    }

    if (products.length !== uniqueProductIds.length) {
      return NextResponse.json(
        { error: "One or more selected products are unavailable." },
        { status: 400 },
      );
    }

    const currencies = new Set(products.map((product) => product.currency));

    if (currencies.size > 1) {
      return NextResponse.json(
        { error: "All items in an offer must use the same currency." },
        { status: 400 },
      );
    }

    const productMap = new Map(products.map((product) => [product.id, product]));
    const clientEmail = normalizeOptionalText(parsed.data.clientEmail);
    const clientPhone = normalizeOptionalText(parsed.data.clientPhone);
    const clientName = normalizeOptionalText(parsed.data.clientName);
    const notes = normalizeOptionalText(parsed.data.notes);

    const offer = await db.$transaction(async (tx) => {
      const client = parsed.data.clientId
        ? await tx.client.findFirst({
            where: {
              id: parsed.data.clientId,
              companyId: session.companyId,
            },
            select: {
              id: true,
              name: true,
              email: true,
            },
          })
        : await tx.client.create({
            data: {
              name: clientName!,
              email: clientEmail,
              phone: clientPhone,
              companyId: session.companyId,
            },
            select: {
              id: true,
              name: true,
              email: true,
            },
          });

      if (!client) {
        throw new Error("CLIENT_NOT_FOUND");
      }

      const offerCount = await tx.offer.count({
        where: { companyId: session.companyId },
      });

      return tx.offer.create({
        data: {
          companyId: session.companyId,
          clientId: client.id,
          clientName: client.name,
          clientEmail: client.email,
          offerNumber: `${company.slug.toUpperCase()}-${String(
            offerCount + 1,
          ).padStart(4, "0")}`,
          notes,
          validUntil: validUntil || null,
          status: "DRAFT",
          items: {
            create: parsed.data.items.map((item) => {
              const product = productMap.get(item.productId);

              if (!product) {
                throw new Error("PRODUCT_NOT_FOUND");
              }

              return {
                productId: product.id,
                productName: product.name,
                quantity: item.quantity,
                price: product.price,
                currency: product.currency,
              };
            }),
          },
        },
        select: {
          id: true,
          offerNumber: true,
          status: true,
        },
      });
    });

    revalidatePath("/dashboard");

    return NextResponse.json(offer, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "CLIENT_NOT_FOUND") {
      return NextResponse.json(
        { error: "The selected client no longer exists." },
        { status: 404 },
      );
    }

    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") {
      return NextResponse.json(
        { error: "One or more selected products are unavailable." },
        { status: 400 },
      );
    }

    console.error("POST_OFFER_ERROR:", error);
    return NextResponse.json(
      { error: "Failed to create draft offer" },
      { status: 500 },
    );
  }
}
