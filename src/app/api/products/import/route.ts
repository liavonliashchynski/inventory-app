import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { parseProductsCsv } from "@/lib/product-csv";

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Upload a CSV file in the file field." },
        { status: 400 },
      );
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json(
        { error: "Only CSV files are supported." },
        { status: 400 },
      );
    }

    const csvText = await file.text();
    const rows = parseProductsCsv(csvText);

    const existingProducts = await db.product.findMany({
      where: { companyId: session.companyId },
      select: { name: true },
    });

    const existingNames = new Set(
      existingProducts.map((product) => product.name.trim().toLocaleLowerCase()),
    );

    const conflictingRow = rows.find((row) =>
      existingNames.has(row.name.trim().toLocaleLowerCase()),
    );

    if (conflictingRow) {
      return NextResponse.json(
        {
          error: `A product named "${conflictingRow.name}" already exists. Remove duplicates before importing.`,
        },
        { status: 409 },
      );
    }

    await db.product.createMany({
      data: rows.map((row) => ({
        ...row,
        companyId: session.companyId,
      })),
    });

    revalidatePath("/dashboard");

    return NextResponse.json(
      { importedCount: rows.length, message: `Imported ${rows.length} products.` },
      { status: 201 },
    );
  } catch (error) {
    console.error("IMPORT_PRODUCTS_ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to import products.",
      },
      { status: 400 },
    );
  }
}
