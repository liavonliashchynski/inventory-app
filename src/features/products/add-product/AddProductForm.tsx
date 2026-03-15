"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import styles from "./addProductForm.module.scss";

export default function AddProductForm({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, companyId }),
      });

      if (!res.ok)
        throw new Error((await res.json()).error || "Failed to create.");

      form.reset();
      setMsg("Product added.");
      startTransition(() => router.refresh());
    } catch (err: any) {
      setMsg(err.message || "Network error. Try again.");
    }
  }

  return (
    <section className={styles.card}>
      <div className={styles.heading}>
        <h2>Add product</h2>
        <p>Create a product for your inventory catalog.</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label>
            Name <input name="name" required placeholder="e.g. Office Chair" />
          </label>
        </div>

        <div className={styles.field}>
          <label>
            Price{" "}
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="0.00"
            />
          </label>
        </div>

        <div className={styles.field}>
          <label>
            Currency
            <select name="currency" defaultValue="USD">
              <option>USD</option>
              <option>EUR</option>
              <option>PLN</option>
            </select>
          </label>
        </div>

        <button disabled={isPending}>
          {isPending ? "Adding..." : "Add product"}
        </button>
      </form>

      {msg && (
        <p className={msg === "Product added." ? styles.success : styles.error}>
          {msg}
        </p>
      )}
    </section>
  );
}
