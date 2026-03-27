import s from "./productList.module.scss";
import EditProductButton from "./EditProductButton";
import DeleteProductButton from "./DeleteProductButton";

type Item = {
  id: string;
  name: string;
  price: string;
  currency: "USD" | "EUR" | "PLN";
  quantity: number;
  lowStockThreshold: number;
  createdAt: Date;
  stockAdjustments: {
    id: string;
    previousQuantity: number;
    newQuantity: number;
    delta: number;
    comment: string;
    createdAt: Date;
    changedByUser: {
      name: string | null;
      email: string;
    } | null;
  }[];
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

const getAdjustmentUserLabel = (name: string | null, email: string | undefined) =>
  name || email || "Unknown user";

const getStockStatus = (product: Item) => {
  if (product.lowStockThreshold > 0 && product.quantity <= product.lowStockThreshold) {
    return {
      label: "Low stock",
      detail: `${product.quantity} left, alert at ${product.lowStockThreshold}`,
      className: s.lowStockBadge,
    };
  }

  if (product.quantity === 0) {
    return {
      label: "Out of stock",
      detail: "No units available",
      className: s.outOfStockBadge,
    };
  }

  if (product.lowStockThreshold > 0) {
    return {
      label: "Tracked",
      detail: `Alert below ${product.lowStockThreshold}`,
      className: s.trackedBadge,
    };
  }

  return {
    label: "Alerts off",
    detail: "Threshold disabled",
    className: s.neutralBadge,
  };
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
            {p.map((product) => {
              const stockStatus = getStockStatus(product);

              return (
                <article key={product.id} className={s.mobileCard}>
                  <div className={s.mobileCardHeader}>
                    <div className={s.mobileCardTitle}>
                      <h3>{product.name}</h3>
                    <span className={s.mobileCurrency}>{product.currency}</span>
                  </div>
                  <div className={s.actionGroup}>
                    <EditProductButton product={product} />
                    <DeleteProductButton
                      productId={product.id}
                      productName={product.name}
                    />
                  </div>
                </div>
                <div className={s.stockBanner}>
                  <span className={`${s.stockBadge} ${stockStatus.className}`}>
                    {stockStatus.label}
                  </span>
                  <span className={s.stockDetail}>{stockStatus.detail}</span>
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
                    <span className={s.metaLabel}>Alert At</span>
                    <strong>{product.lowStockThreshold}</strong>
                  </div>
                  <div className={s.mobileMetaBlock}>
                    <span className={s.metaLabel}>Created</span>
                    <strong>{dateFormatter.format(new Date(product.createdAt))}</strong>
                  </div>
                </div>
                {product.stockAdjustments.length ? (
                  <div className={s.historyBlock}>
                    <p className={s.historyTitle}>Recent stock history</p>
                    <div className={s.historyList}>
                      {product.stockAdjustments.map((entry) => (
                        <article key={entry.id} className={s.historyItem}>
                          <div className={s.historyTopRow}>
                            <span
                              className={`${s.deltaBadge} ${
                                entry.delta >= 0 ? s.deltaPositive : s.deltaNegative
                              }`}
                            >
                              {entry.delta >= 0 ? `+${entry.delta}` : entry.delta}
                            </span>
                            <span className={s.historyDate}>
                              {dateFormatter.format(new Date(entry.createdAt))}
                            </span>
                          </div>
                          <p className={s.historyComment}>{entry.comment}</p>
                          <p className={s.historyMeta}>
                            {entry.previousQuantity} to {entry.newQuantity}
                            {" by "}
                            {getAdjustmentUserLabel(
                              entry.changedByUser?.name ?? null,
                              entry.changedByUser?.email,
                            )}
                          </p>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className={s.noHistory}>No stock changes yet</p>
                )}
                </article>
              );
            })}
          </div>

          <div className={s.desktopTable}>
            <div className={s.tableWrapper}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Alert At</th>
                    <th>Currency</th>
                    <th>Created</th>
                    <th>Stock History</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {p.map((x) => {
                    const stockStatus = getStockStatus(x);

                    return (
                      <tr key={x.id}>
                      <td>{x.name}</td>
                      <td>{formatMoney(x.price, x.currency)}</td>
                      <td>
                        <div className={s.quantityCell}>
                          <strong>{x.quantity}</strong>
                          <span className={`${s.stockBadge} ${stockStatus.className}`}>
                            {stockStatus.label}
                          </span>
                          <small className={s.stockDetail}>{stockStatus.detail}</small>
                        </div>
                      </td>
                      <td>{x.lowStockThreshold}</td>
                      <td>{x.currency}</td>
                      <td>{dateFormatter.format(new Date(x.createdAt))}</td>
                      <td>
                        {x.stockAdjustments.length ? (
                          <div className={s.historyList}>
                            {x.stockAdjustments.map((entry) => (
                              <article key={entry.id} className={s.historyItem}>
                                <div className={s.historyTopRow}>
                                  <span
                                    className={`${s.deltaBadge} ${
                                      entry.delta >= 0 ? s.deltaPositive : s.deltaNegative
                                    }`}
                                  >
                                    {entry.delta >= 0 ? `+${entry.delta}` : entry.delta}
                                  </span>
                                  <span className={s.historyDate}>
                                    {dateFormatter.format(new Date(entry.createdAt))}
                                  </span>
                                </div>
                                <p className={s.historyComment}>{entry.comment}</p>
                                <p className={s.historyMeta}>
                                  {entry.previousQuantity} to {entry.newQuantity}
                                  {" by "}
                                  {getAdjustmentUserLabel(
                                    entry.changedByUser?.name ?? null,
                                    entry.changedByUser?.email,
                                  )}
                                </p>
                              </article>
                            ))}
                          </div>
                        ) : (
                          <span className={s.noHistory}>No stock changes yet</span>
                        )}
                      </td>
                      <td>
                        <div className={s.actionGroup}>
                          <EditProductButton product={x} />
                          <DeleteProductButton
                            productId={x.id}
                            productName={x.name}
                          />
                        </div>
                      </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
