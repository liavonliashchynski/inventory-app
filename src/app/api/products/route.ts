import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Missing companyId parameter" },
        { status: 400 },
      );
    }

    const products = await db.product.findMany({
      where: { companyId },
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
    const body = await request.json();
    const { name, price, companyId, currency } = body;

    if (!name || !price || !companyId) {
      return NextResponse.json(
        { error: "Name, price, and companyId are required" },
        { status: 400 },
      );
    }

    const newProduct = await db.product.create({
      data: {
        name,
        price: parseFloat(price),
        currency: currency || "USD",
        companyId,
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
