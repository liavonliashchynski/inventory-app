import s from "./productList.module.scss";

type Item = {
  id: string;
  name: string;
  price: string;
  currency: "USD" | "EUR" | "PLN";
  createdAt: Date;
};

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
        <div className={s.tableWrapper}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Currency</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {p.map((x) => (
                <tr key={x.id}>
                  <td>{x.name}</td>
                  <td>{formatMoney(x.price, x.currency)}</td>
                  <td>{x.currency}</td>
                  <td>{x.createdAt.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
