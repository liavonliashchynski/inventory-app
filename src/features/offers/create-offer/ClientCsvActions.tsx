"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import styles from "./createOfferForm.module.scss";

export default function ClientCsvActions() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isImporting, startTransition] = useTransition();

  const handleExport = () => {
    window.location.href = "/api/clients?format=csv";
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

        const response = await fetch("/api/clients/import", {
          method: "POST",
          body: formData,
        });

        const body = (await response.json()) as { error?: string; message?: string };

        if (!response.ok) {
          throw new Error(body.error || "Failed to import clients.");
        }

        setMessage({
          type: "success",
          text: body.message || "Clients imported successfully.",
        });
        event.target.value = "";
        router.refresh();
      } catch (error) {
        setMessage({
          type: "error",
          text:
            error instanceof Error ? error.message : "Failed to import clients.",
        });
        event.target.value = "";
      }
    });
  };

  return (
    <div className={styles.csvTools}>
      <div className={styles.csvActions}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleExport}
          disabled={isImporting}
        >
          Export clients CSV
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleImportClick}
          disabled={isImporting}
        >
          {isImporting ? "Importing..." : "Import clients CSV"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className={styles.hiddenInput}
          onChange={handleFileChange}
        />
      </div>
      <p className={styles.csvHint}>CSV headers: `name,email,phone`</p>
      {message ? (
        <p className={message.type === "success" ? styles.success : styles.error}>
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
