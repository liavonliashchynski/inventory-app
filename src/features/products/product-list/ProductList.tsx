import s from "./productList.module.scss";

type Item = {
  id: string;
  name: string;
  price: string;
  currency: "USD" | "EUR" | "PLN";
  quantity: number;
  createdAt: Date;
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
});

const formatters: Record<string, Intl.NumberFormat> = {};

const formatMoney = (price: string, currency: string) => {
  if (!formatters[currency]) {
    formatters[currency] = new Intl.NumberFormat("en", {
      style: "currency",
      currency,
    });
  }
  return formatters[currency].format(+price);
};

export default function ProductList({ products: p }: { products: Item[] }) {
  return (
    <section className={s.card}>
      <div className={s.header}>
        <h2>Your products</h2>
        <p>{p.length} items in your inventory.</p>
      </div>
      {!p.length ? (
        <div className={s.emptyState}>
          <p>No products yet.</p>
        </div>
      ) : (
        <>
          <div className={s.mobileList}>
            {p.map((product) => (
              <article key={product.id} className={s.mobileCard}>
                <div className={s.mobileCardHeader}>
                  <h3>{product.name}</h3>
                  <span className={s.mobileCurrency}>{product.currency}</span>
                </div>
                <div className={s.mobileMetaGrid}>
                  <div className={s.mobileMetaBlock}>
                    <span className={s.metaLabel}>Price</span>
                    <strong>{formatMoney(product.price, product.currency)}</strong>
                  </div>
                  <div className={s.mobileMetaBlock}>
                    <span className={s.metaLabel}>Quantity</span>
                    <strong>{product.quantity}</strong>
                  </div>
                  <div className={s.mobileMetaBlock}>
                    <span className={s.metaLabel}>Created</span>
                    <strong>{dateFormatter.format(new Date(product.createdAt))}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className={s.desktopTable}>
            <div className={s.tableWrapper}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Currency</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {p.map((x) => (
                    <tr key={x.id}>
                      <td>{x.name}</td>
                      <td>{formatMoney(x.price, x.currency)}</td>
                      <td>{x.quantity}</td>
                      <td>{x.currency}</td>
                      <td>{dateFormatter.format(new Date(x.createdAt))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
