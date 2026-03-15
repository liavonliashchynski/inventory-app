"use client";

import { useState } from "react";
import styles from "./signOutButton.module.scss";

export default function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignOut() {
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const message = await res.text();
        setError(message || "Sign out failed.");
        return;
      }

      window.location.assign("/login");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.button}
        onClick={handleSignOut}
        disabled={isLoading}
      >
        {isLoading ? "Signing out..." : "Sign out"}
      </button>

      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}
