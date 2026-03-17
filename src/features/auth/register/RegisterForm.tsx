"use client";

import styles from "./register.module.scss";
import { useRegister } from "./useRegister";
import Link from "next/link";

export default function RegisterForm() {
  const { isLoading, error, handleRegister } = useRegister();

  return (
    <div className={styles.page}>
      <form className={styles.form} onSubmit={handleRegister}>
        <h1>Register</h1>
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

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Signing up..." : "Register"}
        </button>
        <p className={styles.helperText}>
          We&apos;ll send a verification link before you can sign in.
        </p>
        <Link href="/login" className={styles.secondaryAction}>
          Sign in
        </Link>
      </form>
    </div>
  );
}
