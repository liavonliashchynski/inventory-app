import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const paramsSchema = z.object({
  productId: z.string().uuid(),
});

const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  price: z.coerce.number().positive(),
  currency: z.enum(["USD", "EUR", "PLN"]).default("USD"),
  quantity: z.coerce.number().int().min(0).max(1_000_000).default(0),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsedParams = paramsSchema.safeParse(await context.params);

    if (!parsedParams.success) {
      return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
    }

    const parsedBody = productSchema.safeParse(await request.json());

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.issues[0]?.message || "Invalid product payload" },
        { status: 400 },
      );
    }

    const existingProduct = await db.product.findFirst({
      where: {
        id: parsedParams.data.productId,
        companyId: session.companyId,
      },
      select: { id: true },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const updatedProduct = await db.product.update({
      where: { id: existingProduct.id },
      data: {
        name: parsedBody.data.name,
        price: parsedBody.data.price,
        currency: parsedBody.data.currency,
        quantity: parsedBody.data.quantity,
      },
      select: {
        id: true,
        name: true,
        price: true,
        currency: true,
        quantity: true,
      },
    });

    revalidatePath("/dashboard");

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    console.error("PATCH_PRODUCT_ERROR:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsedParams = paramsSchema.safeParse(await context.params);

    if (!parsedParams.success) {
      return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
    }

    const product = await db.product.findFirst({
      where: {
        id: parsedParams.data.productId,
        companyId: session.companyId,
      },
      select: {
        id: true,
        offerItems: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    if (product.offerItems.length > 0) {
      return NextResponse.json(
        {
          error:
            "This product is used in at least one offer and cannot be deleted.",
        },
        { status: 409 },
      );
    }

    await db.product.delete({
      where: { id: product.id },
    });

    revalidatePath("/dashboard");

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE_PRODUCT_ERROR:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 },
    );
  }
}
