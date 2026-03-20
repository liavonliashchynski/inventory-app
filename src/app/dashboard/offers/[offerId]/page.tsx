import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import SendOfferButton from "@/features/offers/offer-list/SendOfferButton";

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

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
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

export default async function DashboardOfferPage({
  params,
}: {
  params: Promise<{ offerId: string }>;
}) {
  const session = await getSessionUser();

  if (!session) {
    redirect("/login");
  }

  const { offerId } = await params;

  const offer = await db.offer.findFirst({
    where: {
      id: offerId,
      companyId: session.companyId,
    },
    select: {
      id: true,
      offerNumber: true,
      status: true,
      clientName: true,
      clientEmail: true,
      publicToken: true,
      notes: true,
      validUntil: true,
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
          email: true,
          phone: true,
          website: true,
          address: true,
        },
      },
    },
  });

  if (!offer) {
    notFound();
  }

  const total = offer.items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );
  const currency = offer.items[0]?.currency;
  const timeline = [
    { label: "Draft created", value: offer.createdAt, tone: "text-slate-700" },
    offer.sentAt
      ? { label: "Sent to client", value: offer.sentAt, tone: "text-sky-700" }
      : null,
    offer.seenAt
      ? {
          label: "Viewed by client",
          value: offer.seenAt,
          tone: "text-cyan-700",
        }
      : null,
    offer.acceptedAt
      ? { label: "Accepted", value: offer.acceptedAt, tone: "text-emerald-700" }
      : null,
    offer.rejectedAt
      ? { label: "Rejected", value: offer.rejectedAt, tone: "text-rose-700" }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: Date; tone: string }>;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-slate-500 underline decoration-transparent transition hover:decoration-current"
            >
              Back to dashboard
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              {offer.offerNumber || "Offer details"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Timeline, client details, and quick actions for this offer.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:min-w-60">
            <span
              className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold tracking-[0.18em] ${getStatusClasses(
                offer.status,
              )}`}
            >
              {offer.status}
            </span>
            <div className="w-full max-w-52">
              <SendOfferButton
                offerId={offer.id}
                status={offer.status}
                clientEmail={offer.clientEmail}
              />
            </div>
            {offer.publicToken ? (
              <Link
                href={`/offers/${offer.publicToken}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-teal-700 underline decoration-transparent transition hover:decoration-current"
              >
                Open public page
              </Link>
            ) : null}
            {offer.publicToken ? (
              <Link
                href={`/offers/${offer.publicToken}?print=1`}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-teal-700 underline decoration-transparent transition hover:decoration-current"
              >
                Export PDF
              </Link>
            ) : null}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.85fr)]">
          <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Client
                </p>
                <p className="mt-3 text-lg font-semibold text-slate-900">
                  {offer.clientName || "Unknown client"}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {offer.clientEmail || "No email saved"}
                </p>
                <p className="mt-3 text-sm text-slate-500">
                  Valid until{" "}
                  {offer.validUntil
                    ? formatDate(offer.validUntil)
                    : "no deadline"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Seller
                </p>
                <p className="mt-3 text-lg font-semibold text-slate-900">
                  {offer.company.name}
                </p>
                {offer.company.email ? (
                  <p className="mt-2 text-sm text-slate-600">
                    {offer.company.email}
                  </p>
                ) : null}
                {offer.company.phone ? (
                  <p className="mt-1 text-sm text-slate-600">
                    {offer.company.phone}
                  </p>
                ) : null}
                {offer.company.website ? (
                  <a
                    href={offer.company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block text-sm text-teal-700 underline decoration-transparent transition hover:decoration-current"
                  >
                    {offer.company.website}
                  </a>
                ) : null}
                {offer.company.address ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                    {offer.company.address}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Items
                </p>
              </div>
              <table className="w-full border-collapse">
                <thead className="bg-slate-50 text-left text-sm uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Item</th>
                    <th className="px-4 py-3 text-right font-semibold">Qty</th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Unit price
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Total
                    </th>
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
              <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 text-right">
                <p className="text-sm uppercase tracking-[0.16em] text-slate-500">
                  Offer total
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {currency ? formatMoney(total, currency) : "-"}
                </p>
              </div>
            </div>

            {offer.notes ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Internal notes
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                  {offer.notes}
                </p>
              </div>
            ) : null}

            {offer.responseNote ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Client response note
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                  {offer.responseNote}
                </p>
              </div>
            ) : null}
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Timeline
              </p>
              <div className="mt-4 space-y-4">
                {timeline.map((event, index) => (
                  <div key={`${event.label}-${index}`} className="flex gap-3">
                    <div className="mt-1 h-3 w-3 rounded-full bg-teal-600" />
                    <div>
                      <p className={`text-sm font-semibold ${event.tone}`}>
                        {event.label}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDateTime(event.value)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Snapshot
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>Created {formatDate(offer.createdAt)}</p>
                <p>
                  Valid until{" "}
                  {offer.validUntil
                    ? formatDate(offer.validUntil)
                    : "no deadline"}
                </p>
                <p>
                  Public page{" "}
                  {offer.publicToken ? "available" : "not generated yet"}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
