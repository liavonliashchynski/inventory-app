"use client";

import Link from "next/link";
import styles from "./login.module.scss";
import { useLogin } from "./useLogin";

type LoginFormProps = {
  initialEmail?: string;
  initialVerificationState?: string;
  initialVerifiedState?: string;
};

export default function LoginForm({
  initialEmail,
  initialVerificationState,
  initialVerifiedState,
}: LoginFormProps) {
  const {
    email,
    password,
    isLoading,
    isResending,
    error,
    notice,
    needsVerification,
    setEmail,
    setPassword,
    handleLogin,
    handleResendVerification,
  } = useLogin({
    initialEmail,
    initialVerificationState,
    initialVerifiedState,
  });

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

        {notice ? <p className={styles.notice}>{notice}</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Login"}
        </button>

        {needsVerification ? (
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={isResending}
            onClick={handleResendVerification}
          >
            {isResending ? "Sending..." : "Resend verification email"}
          </button>
        ) : null}

        <Link href="/register" className={styles.secondaryAction}>
          Create an account
        </Link>
      </form>
    </div>
  );
}
