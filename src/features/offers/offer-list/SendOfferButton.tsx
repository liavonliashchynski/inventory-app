"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import s from "./offerList.module.scss";

export default function SendOfferButton({
  offerId,
  status,
  clientEmail,
}: {
  offerId: string;
  status: "DRAFT" | "SENT" | "SEEN" | "ACCEPTED" | "REJECTED";
  clientEmail: string | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isClosed = status === "ACCEPTED" || status === "REJECTED";
  const isDisabled = !clientEmail || isClosed || isPending;
  const buttonLabel =
    isPending ? "Sending..." : status === "SENT" || status === "SEEN" ? "Resend" : "Send";

  async function handleSend() {
    setMessage(null);

    try {
      const response = await fetch(`/api/offers/${offerId}/send`, {
        method: "POST",
      });

      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error || "Failed to send the offer.");
      }

      setMessage(`Sent to ${clientEmail}.`);
      startTransition(() => router.refresh());
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to send the offer.",
      );
    }
  }

  return (
    <div className={s.actionStack}>
      <button
        type="button"
        className={s.sendButton}
        onClick={handleSend}
        disabled={isDisabled}
      >
        {clientEmail ? (isClosed ? "Closed" : buttonLabel) : "No email"}
      </button>
      {message ? <small className={s.helperText}>{message}</small> : null}
    </div>
  );
}
