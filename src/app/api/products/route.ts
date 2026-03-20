import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";

const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  price: z.coerce.number().positive(),
  currency: z.enum(["USD", "EUR", "PLN"]).default("USD"),
  quantity: z.coerce.number().int().min(0).max(1_000_000).default(0),
});

export async function GET() {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const products = await db.product.findMany({
      where: { companyId: session.companyId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error("GET_PRODUCTS_ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid product payload" },
        { status: 400 },
      );
    }

    const newProduct = await db.product.create({
      data: {
        name: parsed.data.name,
        price: parsed.data.price,
        currency: parsed.data.currency,
        quantity: parsed.data.quantity,
        companyId: session.companyId,
      },
    });
    revalidatePath("/dashboard");

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("POST_PRODUCT_ERROR:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
