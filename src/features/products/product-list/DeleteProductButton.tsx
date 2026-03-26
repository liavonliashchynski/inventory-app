"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import s from "./productList.module.scss";

export default function DeleteProductButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${productName}" from your catalog?`,
    );

    if (!confirmed) {
      return;
    }

    setMessage(null);

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error || "Failed to delete product.");
      }

      setMessage("Product deleted.");
      startTransition(() => router.refresh());
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to delete product.",
      );
    }
  }

  return (
    <div className={s.actionStack}>
      <button
        type="button"
        className={s.deleteButton}
        onClick={handleDelete}
        disabled={isPending}
      >
        {isPending ? "Deleting..." : "Delete"}
      </button>
      {message ? <small className={s.helperText}>{message}</small> : null}
    </div>
  );
}
