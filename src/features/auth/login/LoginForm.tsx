"use client";

import Link from "next/link";
import styles from "./login.module.scss";
import { useLogin } from "./useLogin";

export default function LoginForm() {
  const {
    email,
    password,
    isLoading,
    error,
    setEmail,
    setPassword,
    handleLogin,
  } = useLogin();

  return (
    <div className={styles.page}>
      <form className={styles.form} onSubmit={handleLogin}>
        <h1>Login</h1>

        <input
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error ? <p className={styles.error}>{error}</p> : null}

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Login"}
        </button>

        <Link href="/register" className={styles.secondaryAction}>
          Create an account
        </Link>
      </form>
    </div>
  );
}
