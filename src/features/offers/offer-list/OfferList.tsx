import Link from "next/link";
import s from "./offerList.module.scss";
import SendOfferButton from "./SendOfferButton";

type OfferItem = {
  id: string;
  productName: string;
  quantity: number;
  price: string;
  currency: "USD" | "EUR" | "PLN";
};

type Offer = {
  id: string;
  offerNumber: string | null;
  status: "DRAFT" | "SENT" | "SEEN" | "ACCEPTED" | "REJECTED";
  clientName: string | null;
  clientEmail: string | null;
  publicToken: string | null;
  createdAt: Date;
  validUntil: Date | null;
  sentAt: Date | null;
  seenAt: Date | null;
  items: OfferItem[];
};

const formatters: Record<string, Intl.NumberFormat> = {};

const formatMoney = (amount: number, currency: string) => {
  if (!formatters[currency]) {
    formatters[currency] = new Intl.NumberFormat("en", {
      style: "currency",
      currency,
    });
  }

  return formatters[currency].format(amount);
};

const getOfferTotal = (items: OfferItem[]) => {
  if (!items.length) {
    return "-";
  }

  const currencies = [...new Set(items.map((item) => item.currency))];

  if (currencies.length !== 1) {
    return "Mixed currencies";
  }

  const total = items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );

  return formatMoney(total, currencies[0]);
};

export default function OfferList({ offers }: { offers: Offer[] }) {
  return (
    <section className={s.card}>
      <div className={s.header}>
        <h2>Recent offers</h2>
        <p>{offers.length} saved offers ready for review, sending, or follow-up.</p>
      </div>

      {!offers.length ? (
        <div className={s.emptyState}>
          <p>No offers yet.</p>
        </div>
      ) : (
        <div className={s.tableWrapper}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Offer</th>
                <th>Client</th>
                <th>Status</th>
                <th>Total</th>
                <th>Valid Until</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer.id}>
                  <td>
                    <div className={s.primaryCell}>
                      <span>{offer.offerNumber || "Draft"}</span>
                      <small>{offer.items.length} item(s)</small>
                    </div>
                  </td>
                  <td>
                    <div className={s.primaryCell}>
                      <span>{offer.clientName || "Unknown client"}</span>
                      <small>{offer.clientEmail || "No email saved"}</small>
                    </div>
                  </td>
                  <td>
                    <span className={`${s.badge} ${s[offer.status.toLowerCase()]}`}>
                      {offer.status}
                    </span>
                    {offer.seenAt ? (
                      <div className={s.metaText}>
                        Seen {offer.seenAt.toLocaleDateString()}
                      </div>
                    ) : offer.sentAt ? (
                      <div className={s.metaText}>
                        Sent {offer.sentAt.toLocaleDateString()}
                      </div>
                    ) : null}
                  </td>
                  <td>{getOfferTotal(offer.items)}</td>
                  <td>
                    {offer.validUntil
                      ? offer.validUntil.toLocaleDateString()
                      : "No deadline"}
                  </td>
                  <td>{offer.createdAt.toLocaleDateString()}</td>
                  <td>
                    <div className={s.actionGroup}>
                      <SendOfferButton
                        offerId={offer.id}
                        status={offer.status}
                        clientEmail={offer.clientEmail}
                      />
                      {offer.publicToken ? (
                        <Link
                          href={`/offers/${offer.publicToken}`}
                          className={s.linkAction}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open page
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
