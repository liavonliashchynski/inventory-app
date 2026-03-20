"use client";

import Link from "next/link";
import styles from "./login.module.scss";
import { useLogin } from "./useLogin";
import TurnstileField from "@/features/auth/shared/TurnstileField";

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
    setResendTurnstileToken,
  } = useLogin({
    initialEmail,
    initialVerificationState,
    initialVerifiedState,
  });

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.brandPanel}>
          <Link href="/" className={styles.brandLink}>
            Inventory App
          </Link>
          <p className={styles.brandText}>
            Inventory and sales visibility for modern teams.
          </p>
        </div>

        <form className={styles.form} onSubmit={handleLogin}>
          <span className={styles.badge}>Sales workspace</span>
          <h1>Welcome back</h1>
          <p className={styles.lead}>
            Sign in to manage products, pricing, offers, and follow-ups from
            one place.
          </p>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {notice ? <p className={styles.notice}>{notice}</p> : null}
          {error ? <p className={styles.error}>{error}</p> : null}

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Login"}
          </button>

          {needsVerification ? (
            <>
              <TurnstileField
                onTokenChange={setResendTurnstileToken}
                className={styles.turnstileField}
              />
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={isResending}
                onClick={handleResendVerification}
              >
                {isResending ? "Sending..." : "Resend verification email"}
              </button>
            </>
          ) : null}

          <p className={styles.helperText}>
            New here? Create a workspace and we&apos;ll send a verification
            link before first sign-in.
          </p>

          <Link href="/register" className={styles.secondaryAction}>
            Create an account
          </Link>
        </form>
      </div>
    </div>
  );
}
