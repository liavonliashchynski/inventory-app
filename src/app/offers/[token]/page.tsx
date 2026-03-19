import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import OfferResponseForm from "./OfferResponseForm";

const currencyFormatters: Record<string, Intl.NumberFormat> = {};

function formatMoney(amount: number, currency: string) {
  if (!currencyFormatters[currency]) {
    currencyFormatters[currency] = new Intl.NumberFormat("en", {
      style: "currency",
      currency,
    });
  }

  return currencyFormatters[currency].format(amount);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(value);
}

function getStatusClasses(
  status: "DRAFT" | "SENT" | "SEEN" | "ACCEPTED" | "REJECTED",
) {
  switch (status) {
    case "ACCEPTED":
      return "bg-emerald-100 text-emerald-800";
    case "REJECTED":
      return "bg-rose-100 text-rose-800";
    case "SEEN":
      return "bg-cyan-100 text-cyan-800";
    case "SENT":
      return "bg-sky-100 text-sky-800";
    default:
      return "bg-amber-100 text-amber-800";
  }
}

export default async function PublicOfferPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const initialOffer = await db.offer.findFirst({
    where: { publicToken: token },
    select: {
      id: true,
      offerNumber: true,
      publicToken: true,
      clientName: true,
      clientEmail: true,
      status: true,
      validUntil: true,
      notes: true,
      createdAt: true,
      sentAt: true,
      seenAt: true,
      acceptedAt: true,
      rejectedAt: true,
      responseNote: true,
      items: {
        select: {
          id: true,
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
        },
      },
    },
  });

  if (!initialOffer) {
    notFound();
  }

  const shouldMarkSeen =
    !initialOffer.seenAt &&
    (initialOffer.status === "SENT" || initialOffer.status === "SEEN");

  const offer = shouldMarkSeen
    ? await db.offer.update({
        where: { id: initialOffer.id },
        data: {
          seenAt: new Date(),
          status: initialOffer.status === "SENT" ? "SEEN" : "SEEN",
        },
        select: {
          id: true,
          offerNumber: true,
          publicToken: true,
          clientName: true,
          clientEmail: true,
          status: true,
          validUntil: true,
          notes: true,
          createdAt: true,
          sentAt: true,
          seenAt: true,
          acceptedAt: true,
          rejectedAt: true,
          responseNote: true,
          items: {
            select: {
              id: true,
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
            },
          },
        },
      })
    : initialOffer;

  const total = offer.items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );
  const currency = offer.items[0]?.currency;
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
        <section className="border-b border-slate-200 bg-[linear-gradient(135deg,#0f766e,#115e59)] px-8 py-10 text-white">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.24em] text-teal-100">
                Offer from {offer.company.name}
              </p>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                  {offer.offerNumber || "Offer"}
                </h1>
                <p className="mt-2 text-teal-50">
                  Prepared for {offer.clientName || "your team"}.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-teal-50">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-[0.18em] ${getStatusClasses(
                  offer.status,
                )}`}
              >
                {offer.status}
              </span>
              <p>Created {formatDate(offer.createdAt)}</p>
              <p>{offer.sentAt ? `Sent ${formatDate(offer.sentAt)}` : "Not sent yet"}</p>
              <p>{offer.seenAt ? `Seen ${formatDate(offer.seenAt)}` : "Not viewed yet"}</p>
              <p>
                {offer.validUntil
                  ? `Valid until ${formatDate(offer.validUntil)}`
                  : "No expiration date"}
              </p>
            </div>
          </div>
        </section>

        <section className="px-8 py-8">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_240px]">
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full border-collapse">
                <thead className="bg-slate-50 text-left text-sm uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Item</th>
                    <th className="px-4 py-3 text-right font-semibold">Qty</th>
                    <th className="px-4 py-3 text-right font-semibold">Unit price</th>
                    <th className="px-4 py-3 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {offer.items.map((item) => (
                    <tr key={item.id} className="border-t border-slate-200">
                      <td className="px-4 py-4 font-medium text-slate-800">
                        {item.productName}
                      </td>
                      <td className="px-4 py-4 text-right text-slate-600">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-4 text-right text-slate-600">
                        {formatMoney(Number(item.price), item.currency)}
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-slate-800">
                        {formatMoney(
                          Number(item.price) * item.quantity,
                          item.currency,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <aside className="space-y-4">
              <OfferResponseForm
                token={offer.publicToken!}
                currentStatus={offer.status}
                isClosed={offer.status === "ACCEPTED" || offer.status === "REJECTED"}
              />

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-500">
                    Summary
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">
                    {currency ? formatMoney(total, currency) : "-"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {offer.items.length} line item{offer.items.length === 1 ? "" : "s"}
                  </p>
                </div>

                {offer.acceptedAt ? (
                  <p className="text-sm text-emerald-700">
                    Accepted {formatDate(offer.acceptedAt)}
                  </p>
                ) : null}

                {offer.rejectedAt ? (
                  <p className="text-sm text-rose-700">
                    Rejected {formatDate(offer.rejectedAt)}
                  </p>
                ) : null}

                {offer.responseNote ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">Response note</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                      {offer.responseNote}
                    </p>
                  </div>
                ) : null}

                {offer.notes ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">Notes</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                      {offer.notes}
                    </p>
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
