"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import styles from "./createOfferForm.module.scss";

type Currency = "USD" | "EUR" | "PLN";

type ProductOption = {
  id: string;
  name: string;
  price: string;
  currency: Currency;
};

type ClientOption = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
};

type OfferLine = {
  id: string;
  productId: string;
  quantity: number;
};

const formatters: Record<string, Intl.NumberFormat> = {};

const formatMoney = (price: string, currency: string) => {
  if (!formatters[currency]) {
    formatters[currency] = new Intl.NumberFormat("en", {
      style: "currency",
      currency,
    });
  }

  return formatters[currency].format(Number(price));
};

const createLine = (id: string): OfferLine => ({
  id,
  productId: "",
  quantity: 1,
});

export default function CreateOfferForm({
  products,
  clients,
}: {
  products: ProductOption[];
  clients: ClientOption[];
}) {
  const router = useRouter();
  const nextItemId = useRef(2);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OfferLine[]>(() => [createLine("1")]);
  const [msg, setMsg] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const usingExistingClient = Boolean(selectedClientId);

  const updateItem = (
    id: string,
    patch: Partial<Pick<OfferLine, "productId" | "quantity">>,
  ) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const addItem = () => {
    const id = String(nextItemId.current++);
    setItems((current) => [...current, createLine(id)]);
  };

  const removeItem = (id: string) => {
    setItems((current) =>
      current.length === 1 ? current : current.filter((item) => item.id !== id),
    );
  };

  const resetForm = () => {
    nextItemId.current = 2;
    setSelectedClientId("");
    setClientName("");
    setClientEmail("");
    setClientPhone("");
    setValidUntil("");
    setNotes("");
    setItems([createLine("1")]);
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMsg(null);

    const normalizedItems = items
      .filter((item) => item.productId)
      .map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

    if (!normalizedItems.length) {
      setMsg({ type: "error", text: "Add at least one offer item." });
      return;
    }

    const selectedProducts = normalizedItems
      .map((item) => products.find((product) => product.id === item.productId))
      .filter((product): product is ProductOption => Boolean(product));

    if (selectedProducts.length !== normalizedItems.length) {
      setMsg({ type: "error", text: "Please choose valid products for each item." });
      return;
    }

    const currencies = new Set(selectedProducts.map((product) => product.currency));

    if (currencies.size > 1) {
      setMsg({
        type: "error",
        text: "Use products with the same currency in a single offer.",
      });
      return;
    }

    if (
      new Set(normalizedItems.map((item) => item.productId)).size !==
      normalizedItems.length
    ) {
      setMsg({
        type: "error",
        text: "Add each product once and increase quantity instead of duplicating rows.",
      });
      return;
    }

    if (!usingExistingClient && !clientName.trim()) {
      setMsg({ type: "error", text: "Enter the recipient company name." });
      return;
    }

    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: usingExistingClient ? selectedClientId : undefined,
          clientName: usingExistingClient ? undefined : clientName,
          clientEmail: usingExistingClient ? undefined : clientEmail,
          clientPhone: usingExistingClient ? undefined : clientPhone,
          validUntil,
          notes,
          items: normalizedItems,
        }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || "Failed to create draft offer.");
      }

      resetForm();
      setMsg({ type: "success", text: "Draft offer created." });
      startTransition(() => router.refresh());
    } catch (error) {
      setMsg({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Network error. Try again.",
      });
    }
  }

  return (
    <section className={styles.card}>
      <div className={styles.heading}>
        <h2>Create draft offer</h2>
        <p>Choose a client, add products, and save a reusable quote draft.</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.clientSection}>
          <div className={styles.sectionTitle}>
            <h3>Recipient</h3>
            <p>Use an existing client or add a new company inline.</p>
          </div>

          <div className={styles.clientGrid}>
            <div className={styles.field}>
              <label htmlFor="clientId">Saved client</label>
              <select
                id="clientId"
                value={selectedClientId}
                onChange={(event) => setSelectedClientId(event.target.value)}
              >
                <option value="">Create a new client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {!usingExistingClient ? (
              <>
                <div className={styles.field}>
                  <label htmlFor="clientName">Company name</label>
                  <input
                    id="clientName"
                    value={clientName}
                    onChange={(event) => setClientName(event.target.value)}
                    placeholder="e.g. Northwind Retail"
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="clientEmail">Email</label>
                  <input
                    id="clientEmail"
                    type="email"
                    value={clientEmail}
                    onChange={(event) => setClientEmail(event.target.value)}
                    placeholder="buyer@company.com"
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="clientPhone">Phone</label>
                  <input
                    id="clientPhone"
                    value={clientPhone}
                    onChange={(event) => setClientPhone(event.target.value)}
                    placeholder="+48 555 123 456"
                  />
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div className={styles.itemSection}>
          <div className={styles.rowHeader}>
            <div className={styles.sectionTitle}>
              <h3>Offer items</h3>
              <p>Pick products from your catalog and set the requested quantity.</p>
            </div>

            <button
              type="button"
              className={styles.secondaryButton}
              onClick={addItem}
            >
              Add item
            </button>
          </div>

          <div className={styles.itemList}>
            {items.map((item, index) => {
              const selectedProduct = products.find(
                (product) => product.id === item.productId,
              );

              return (
                <div key={item.id} className={styles.itemRow}>
                  <div className={styles.field}>
                    <label htmlFor={`product-${item.id}`}>Product</label>
                    <select
                      id={`product-${item.id}`}
                      value={item.productId}
                      onChange={(event) =>
                        updateItem(item.id, { productId: event.target.value })
                      }
                    >
                      <option value="">Select product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor={`quantity-${item.id}`}>Quantity</label>
                    <input
                      id={`quantity-${item.id}`}
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(item.id, {
                          quantity: Number(event.target.value || 1),
                        })
                      }
                    />
                  </div>

                  <div className={styles.itemMeta}>
                    <span>
                      {selectedProduct
                        ? formatMoney(selectedProduct.price, selectedProduct.currency)
                        : "Choose a product"}
                    </span>
                    <span>
                      {selectedProduct ? selectedProduct.currency : `Item ${index + 1}`}
                    </span>
                  </div>

                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.metaGrid}>
          <div className={styles.field}>
            <label htmlFor="validUntil">Valid until</label>
            <input
              id="validUntil"
              type="date"
              value={validUntil}
              onChange={(event) => setValidUntil(event.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="notes">Internal notes</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional notes for your team"
              rows={4}
            />
          </div>
        </div>

        <div className={styles.actions}>
          <button type="submit" disabled={isPending}>
            {isPending ? "Saving draft..." : "Save draft offer"}
          </button>
        </div>
      </form>

      {msg ? (
        <p className={msg.type === "success" ? styles.success : styles.error}>
          {msg.text}
        </p>
      ) : null}
    </section>
  );
}
