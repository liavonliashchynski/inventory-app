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
  lowStockThreshold: z.coerce.number().int().min(0).max(1_000_000).default(0),
  adjustmentComment: z
    .union([z.literal(""), z.string().trim().max(500)])
    .optional(),
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
      select: {
        id: true,
        quantity: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const quantityChanged = existingProduct.quantity !== parsedBody.data.quantity;
    const normalizedComment = parsedBody.data.adjustmentComment?.trim() || null;

    if (quantityChanged && !normalizedComment) {
      return NextResponse.json(
        {
          error:
            "Add a stock adjustment comment when changing the product quantity.",
        },
        { status: 400 },
      );
    }

    const updatedProduct = await db.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id: existingProduct.id },
        data: {
          name: parsedBody.data.name,
          price: parsedBody.data.price,
          currency: parsedBody.data.currency,
          quantity: parsedBody.data.quantity,
          lowStockThreshold: parsedBody.data.lowStockThreshold,
        },
        select: {
          id: true,
          name: true,
          price: true,
          currency: true,
          quantity: true,
          lowStockThreshold: true,
        },
      });

      if (quantityChanged && normalizedComment) {
        await tx.productStockAdjustment.create({
          data: {
            productId: existingProduct.id,
            previousQuantity: existingProduct.quantity,
            newQuantity: parsedBody.data.quantity,
            delta: parsedBody.data.quantity - existingProduct.quantity,
            comment: normalizedComment,
            changedByUserId: session.userId,
          },
        });
      }

      return product;
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
