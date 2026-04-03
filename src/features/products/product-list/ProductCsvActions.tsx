"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import s from "./productList.module.scss";

export default function ProductCsvActions() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isImporting, startTransition] = useTransition();

  const handleExport = () => {
    window.location.href = "/api/products?format=csv";
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setMessage(null);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("file", file);

        const response = await fetch("/api/products/import", {
          method: "POST",
          body: formData,
        });

        const body = (await response.json()) as { error?: string; message?: string };

        if (!response.ok) {
          throw new Error(body.error || "Failed to import products.");
        }

        setMessage({
          type: "success",
          text: body.message || "Products imported successfully.",
        });
        event.target.value = "";
        router.refresh();
      } catch (error) {
        setMessage({
          type: "error",
          text:
            error instanceof Error ? error.message : "Failed to import products.",
        });
        event.target.value = "";
      }
    });
  };

  return (
    <div className={s.csvTools}>
      <div className={s.csvActions}>
        <button
          type="button"
          className={s.exportButton}
          onClick={handleExport}
          disabled={isImporting}
        >
          Export CSV
        </button>
        <button
          type="button"
          className={s.importButton}
          onClick={handleImportClick}
          disabled={isImporting}
        >
          {isImporting ? "Importing..." : "Import CSV"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className={s.hiddenInput}
          onChange={handleFileChange}
        />
      </div>
      <p className={s.csvHint}>
        CSV headers: `name,price,currency,quantity,lowStockThreshold`
      </p>
      {message ? (
        <p className={message.type === "success" ? s.csvSuccess : s.csvError}>
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
