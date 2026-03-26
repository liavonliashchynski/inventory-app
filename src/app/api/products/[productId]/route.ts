import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const paramsSchema = z.object({
  productId: z.string().uuid(),
});

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
