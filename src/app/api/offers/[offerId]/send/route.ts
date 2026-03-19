import crypto from "node:crypto";

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isMailerConfigured } from "@/lib/email";
import { getSessionUser } from "@/lib/auth";
import { sendOfferEmail } from "@/lib/offer-email";

const paramsSchema = z.object({
  offerId: z.string().uuid(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ offerId: string }> },
) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isMailerConfigured()) {
      return NextResponse.json(
        { error: "SMTP is not configured yet. Add mail settings before sending offers." },
        { status: 500 },
      );
    }

    const parsedParams = paramsSchema.safeParse(await context.params);

    if (!parsedParams.success) {
      return NextResponse.json({ error: "Invalid offer id." }, { status: 400 });
    }

    const offer = await db.offer.findFirst({
      where: {
        id: parsedParams.data.offerId,
        companyId: session.companyId,
      },
      select: {
        id: true,
        status: true,
        clientName: true,
        clientEmail: true,
        publicToken: true,
        offerNumber: true,
        validUntil: true,
        notes: true,
        items: {
          select: {
            productName: true,
            quantity: true,
            price: true,
            currency: true,
          },
          orderBy: { createdAt: "asc" },
        },
        company: {
          select: {
            name: true,
            email: true,
            phone: true,
            website: true,
            address: true,
          },
        },
      },
    });

    if (!offer) {
      return NextResponse.json({ error: "Offer not found." }, { status: 404 });
    }

    if (offer.status === "ACCEPTED" || offer.status === "REJECTED") {
      return NextResponse.json(
        { error: "Closed offers cannot be sent again." },
        { status: 400 },
      );
    }

    if (!offer.clientEmail) {
      return NextResponse.json(
        { error: "This offer does not have a client email yet." },
        { status: 400 },
      );
    }

    if (!offer.items.length) {
      return NextResponse.json(
        { error: "Add at least one item before sending the offer." },
        { status: 400 },
      );
    }

    const publicToken = offer.publicToken ?? crypto.randomBytes(24).toString("hex");

    await sendOfferEmail({
      to: offer.clientEmail,
      requestUrl: request.url,
      publicToken,
      companyName: offer.company.name,
      companyEmail: offer.company.email,
      companyPhone: offer.company.phone,
      companyWebsite: offer.company.website,
      companyAddress: offer.company.address,
      clientName: offer.clientName,
      offerNumber: offer.offerNumber,
      validUntil: offer.validUntil,
      notes: offer.notes,
      items: offer.items.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        price: item.price.toString(),
        currency: item.currency,
      })),
    });

    const sentAt = new Date();

    await db.offer.update({
      where: { id: offer.id },
      data: {
        publicToken,
        status: "SENT",
        sentAt,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/offers/${publicToken}`);

    return NextResponse.json(
      {
        ok: true,
        publicToken,
        sentAt: sentAt.toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("SEND_OFFER_ERROR:", error);

    return NextResponse.json(
      { error: "Failed to send the offer email." },
      { status: 500 },
    );
  }
}
