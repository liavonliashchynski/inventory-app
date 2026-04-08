import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { parseClientsCsv } from "@/lib/client-csv";
import { db } from "@/lib/db";

const getClientKey = (row: { name: string; email: string | null }) =>
  `${row.name.trim().toLocaleLowerCase()}::${(row.email || "").trim().toLocaleLowerCase()}`;

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
    const rows = parseClientsCsv(csvText);

    const existingClients = await db.client.findMany({
      where: { companyId: session.companyId },
      select: {
        name: true,
        email: true,
      },
    });

    const existingKeys = new Set(existingClients.map((client) => getClientKey(client)));
    const conflictingRow = rows.find((row) => existingKeys.has(getClientKey(row)));

    if (conflictingRow) {
      return NextResponse.json(
        {
          error: `A client named "${conflictingRow.name}" with the same email already exists.`,
        },
        { status: 409 },
      );
    }

    await db.client.createMany({
      data: rows.map((row) => ({
        ...row,
        companyId: session.companyId,
      })),
    });

    revalidatePath("/dashboard");

    return NextResponse.json(
      { importedCount: rows.length, message: `Imported ${rows.length} clients.` },
      { status: 201 },
    );
  } catch (error) {
    console.error("IMPORT_CLIENTS_ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to import clients.",
      },
      { status: 400 },
    );
  }
}
