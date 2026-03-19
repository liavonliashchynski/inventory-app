import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isMailerConfigured } from "@/lib/email";
import { sendOfferResponseEmail } from "@/lib/offer-response-email";

const schema = z.object({
  token: z.string().min(1),
  response: z.enum(["ACCEPTED", "REJECTED"]),
  note: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((value) => value || null),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid response payload." },
        { status: 400 },
      );
    }

    const offer = await db.offer.findFirst({
      where: { publicToken: parsed.data.token },
      select: {
        id: true,
        publicToken: true,
        status: true,
        clientName: true,
        clientEmail: true,
        offerNumber: true,
        company: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!offer) {
      return NextResponse.json({ error: "Offer not found." }, { status: 404 });
    }

    if (offer.status === "ACCEPTED" || offer.status === "REJECTED") {
      return NextResponse.json(
        { error: "This offer has already been answered." },
        { status: 409 },
      );
    }

    if (offer.status !== "SENT" && offer.status !== "SEEN") {
      return NextResponse.json(
        { error: "This offer is not open for response yet." },
        { status: 409 },
      );
    }

    const now = new Date();

    await db.offer.update({
      where: { id: offer.id },
      data: {
        status: parsed.data.response,
        acceptedAt: parsed.data.response === "ACCEPTED" ? now : null,
        rejectedAt: parsed.data.response === "REJECTED" ? now : null,
        responseNote: parsed.data.note,
      },
    });

    if (isMailerConfigured() && offer.publicToken) {
      await sendOfferResponseEmail({
        requestUrl: request.url,
        companyName: offer.company.name,
        offerNumber: offer.offerNumber,
        clientName: offer.clientName,
        clientEmail: offer.clientEmail,
        response: parsed.data.response,
        responseNote: parsed.data.note,
        publicToken: offer.publicToken,
      });
    }

    return NextResponse.json(
      {
        ok: true,
        status: parsed.data.response,
        respondedAt: now.toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("RESPOND_TO_OFFER_ERROR:", error);
    return NextResponse.json(
      { error: "Failed to save the offer response." },
      { status: 500 },
    );
  }
}
