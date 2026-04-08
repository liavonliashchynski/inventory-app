import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildClientsCsv, clientCsvHeaders } from "@/lib/client-csv";

export async function GET(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const format = new URL(request.url).searchParams.get("format");

    const clients = await db.client.findMany({
      where: { companyId: session.companyId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    if (format === "csv") {
      const csv = buildClientsCsv(clients);

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="clients.csv"',
          "Cache-Control": "no-store",
        },
      });
    }

    return NextResponse.json(
      {
        clients,
        csvTemplateHeaders: clientCsvHeaders,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET_CLIENTS_ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 },
    );
  }
}
