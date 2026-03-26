"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import s from "./productList.module.scss";

type Currency = "USD" | "EUR" | "PLN";

export default function EditProductButton({
  product,
}: {
  product: {
    id: string;
    name: string;
    price: string;
    currency: Currency;
    quantity: number;
  };
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          price: formData.get("price"),
          currency: formData.get("currency"),
          quantity: formData.get("quantity"),
        }),
      });

      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error || "Failed to update product.");
      }

      setMessage("Product updated.");
      startTransition(() => router.refresh());
      setIsOpen(false);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to update product.",
      );
    }
  }

  return (
    <div className={s.actionStack}>
      <button
        type="button"
        className={s.editButton}
        onClick={() => {
          setMessage(null);
          setIsOpen((current) => !current);
        }}
        disabled={isPending}
      >
        {isOpen ? "Close" : "Edit"}
      </button>

      {isOpen ? (
        <form className={s.editForm} onSubmit={handleSubmit}>
          <label className={s.editField}>
            <span>Name</span>
            <input name="name" defaultValue={product.name} required />
          </label>

          <label className={s.editField}>
            <span>Price</span>
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              defaultValue={product.price}
              required
            />
          </label>

          <label className={s.editField}>
            <span>Currency</span>
            <select name="currency" defaultValue={product.currency}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="PLN">PLN</option>
            </select>
          </label>

          <label className={s.editField}>
            <span>Quantity</span>
            <input
              name="quantity"
              type="number"
              min="0"
              step="1"
              defaultValue={product.quantity}
              required
            />
          </label>

          <div className={s.editActions}>
            <button type="submit" className={s.saveButton} disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className={s.cancelButton}
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {message ? <small className={s.helperText}>{message}</small> : null}
    </div>
  );
}
