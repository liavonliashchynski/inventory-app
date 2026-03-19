"use client";

import { useState, useTransition } from "react";

export default function OfferResponseForm({
  token,
  isClosed,
  currentStatus,
}: {
  token: string;
  isClosed: boolean;
  currentStatus: "DRAFT" | "SENT" | "SEEN" | "ACCEPTED" | "REJECTED";
}) {
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  const closed = isClosed || status === "ACCEPTED" || status === "REJECTED";

  async function submitResponse(response: "ACCEPTED" | "REJECTED") {
    setMessage(null);

    try {
      const result = await fetch("/api/offers/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, response, note }),
      });

      const body = (await result.json()) as { error?: string; status?: typeof response };

      if (!result.ok) {
        throw new Error(body.error || "Failed to save your response.");
      }

      setStatus(body.status || response);
      setMessage(
        response === "ACCEPTED"
          ? "Thank you. This offer has been accepted."
          : "Your response was saved. Thank you for the update.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to save your response.",
      );
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
        Respond
      </p>

      {closed ? (
        <p className="mt-3 text-sm text-slate-600">
          This offer has already been marked as {status.toLowerCase()}.
        </p>
      ) : (
        <>
          <p className="mt-3 text-sm text-slate-600">
            Review the offer details and let the company know whether you accept it.
          </p>

          <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="responseNote">
            Note for the company
          </label>
          <textarea
            id="responseNote"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            maxLength={1000}
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            placeholder="Optional message, especially helpful when rejecting the offer."
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => void submitResponse("ACCEPTED"))}
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isPending ? "Saving..." : "Accept offer"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => void submitResponse("REJECTED"))}
              className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
            >
              {isPending ? "Saving..." : "Reject offer"}
            </button>
          </div>
        </>
      )}

      {message ? <p className="mt-4 text-sm text-slate-600">{message}</p> : null}
    </section>
  );
}
