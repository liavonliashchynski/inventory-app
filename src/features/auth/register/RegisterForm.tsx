"use client";

import styles from "./register.module.scss";
import { useRegister } from "./useRegister";
import Link from "next/link";
import TurnstileField from "@/features/auth/shared/TurnstileField";

export default function RegisterForm() {
  const { isLoading, error, handleRegister, setTurnstileToken } = useRegister();

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.brandPanel}>
          <Link href="/" className={styles.brandLink}>
            Inventory App
          </Link>
          <p className={styles.brandText}>
            One workspace for inventory, quotes, and closed deals.
          </p>
        </div>

        <form className={styles.form} onSubmit={handleRegister}>
          <span className={styles.badge}>Get started</span>
          <h1>Create your workspace</h1>
          <p className={styles.lead}>
            Set up your company account and start sending polished offers from
            the same dashboard.
          </p>

          <input name="email" type="email" placeholder="Email" required />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
          />
          <input
            name="companyName"
            type="text"
            placeholder="Company Name"
            required
          />
          <TurnstileField
            onTokenChange={setTurnstileToken}
            className={styles.turnstileField}
          />

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Signing up..." : "Create account"}
          </button>
          <p className={styles.helperText}>
            We&apos;ll send a verification link before you can sign in.
          </p>
          <Link href="/login" className={styles.secondaryAction}>
            Sign in
          </Link>
        </form>
      </div>
    </div>
  );
}
