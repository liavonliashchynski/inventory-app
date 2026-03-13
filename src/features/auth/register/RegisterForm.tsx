"use client";

import styles from "./register.module.scss";
import { useRegister } from "./useRegister";

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
      </form>
    </div>
  );
}
