import s from "./offerList.module.scss";

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
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";
  clientName: string | null;
  clientEmail: string | null;
  createdAt: Date;
  validUntil: Date | null;
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
        <h2>Recent draft offers</h2>
        <p>{offers.length} saved offers ready for review or sending later.</p>
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
                  </td>
                  <td>{getOfferTotal(offer.items)}</td>
                  <td>
                    {offer.validUntil
                      ? offer.validUntil.toLocaleDateString()
                      : "No deadline"}
                  </td>
                  <td>{offer.createdAt.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
