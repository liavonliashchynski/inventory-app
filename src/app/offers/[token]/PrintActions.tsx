"use client";

import { useEffect } from "react";

export default function PrintActions({
  autoPrint,
}: {
  autoPrint: boolean;
}) {
  useEffect(() => {
    if (!autoPrint) {
      return;
    }

    const timer = window.setTimeout(() => {
      window.print();
    }, 150);

    return () => window.clearTimeout(timer);
  }, [autoPrint]);

  return (
    <div className="flex flex-wrap gap-3 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        Save as PDF
      </button>
    </div>
  );
}
