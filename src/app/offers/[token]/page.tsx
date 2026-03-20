import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import OfferResponseForm from "./OfferResponseForm";
import PrintActions from "./PrintActions";

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
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ print?: string }>;
}) {
  const { token } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const printMode = resolvedSearchParams?.print === "1";

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
          email: true,
          phone: true,
          website: true,
          address: true,
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
              email: true,
              phone: true,
              website: true,
              address: true,
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
    <main
      className={`min-h-screen px-4 py-10 text-slate-900 ${
        printMode ? "bg-white print:p-0" : "bg-slate-100"
      }`}
    >
      <div
        className={`mx-auto max-w-4xl bg-white ${
          printMode
            ? "rounded-none border-0 shadow-none"
            : "rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/60"
        }`}
      >
        <section
          className={`border-b px-5 py-8 sm:px-8 sm:py-10 ${
            printMode
              ? "border-slate-200 bg-white text-slate-900"
              : "border-slate-200 bg-[linear-gradient(135deg,#0f766e,#115e59)] text-white"
          }`}
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <p
                className={`text-sm uppercase tracking-[0.24em] ${
                  printMode ? "text-slate-500" : "text-teal-100"
                }`}
              >
                Offer from {offer.company.name}
              </p>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {offer.offerNumber || "Offer"}
                </h1>
                <p className={`mt-2 ${printMode ? "text-slate-600" : "text-teal-50"}`}>
                  Prepared for {offer.clientName || "your team"}.
                </p>
              </div>

              {(offer.company.email || offer.company.phone || offer.company.website) ? (
                <div
                  className={`rounded-2xl border px-4 py-3 ${
                    printMode
                      ? "border-slate-200 bg-slate-50 text-slate-700"
                      : "border-white/10 bg-white/10 text-teal-50"
                  }`}
                >
                  {offer.company.email ? <p className="break-words">{offer.company.email}</p> : null}
                  {offer.company.phone ? <p>{offer.company.phone}</p> : null}
                  {offer.company.website ? <p className="break-words">{offer.company.website}</p> : null}
                </div>
              ) : null}
            </div>

            <div className={`space-y-3 text-sm ${printMode ? "text-slate-600" : "text-teal-50"}`}>
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

          <div className="mt-6">
            <PrintActions autoPrint={printMode} />
          </div>
        </section>

        <section className="px-5 py-6 sm:px-8 sm:py-8">
          <div
            className={`grid gap-6 ${
              printMode ? "md:grid-cols-[minmax(0,1fr)_220px]" : "md:grid-cols-[minmax(0,1fr)_240px]"
            }`}
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="space-y-3 p-4 md:hidden">
                {offer.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{item.productName}</p>
                        <p className="mt-1 text-sm text-slate-500">Qty {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium text-slate-600">
                        {formatMoney(Number(item.price), item.currency)} each
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                      <span className="text-sm text-slate-500">Line total</span>
                      <span className="font-semibold text-slate-900">
                        {formatMoney(Number(item.price) * item.quantity, item.currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <table className="hidden w-full border-collapse md:table">
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
              {!printMode ? (
                <OfferResponseForm
                  token={offer.publicToken!}
                  currentStatus={offer.status}
                  isClosed={offer.status === "ACCEPTED" || offer.status === "REJECTED"}
                />
              ) : null}

              <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
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

                {(offer.company.email || offer.company.phone || offer.company.website || offer.company.address) ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">Seller details</p>
                    {offer.company.email ? (
                      <p className="mt-2 text-sm text-slate-600">{offer.company.email}</p>
                    ) : null}
                    {offer.company.phone ? (
                      <p className="mt-1 text-sm text-slate-600">{offer.company.phone}</p>
                    ) : null}
                    {offer.company.website ? (
                      <a
                        href={offer.company.website}
                        className="mt-1 block break-words text-sm text-teal-700 underline decoration-transparent transition hover:decoration-current"
                        target="_blank"
                        rel="noreferrer"
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
                ) : null}
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
