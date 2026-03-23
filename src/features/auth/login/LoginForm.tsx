"use client";

import Link from "next/link";
import s from "./login.module.scss";
import { useLogin } from "./useLogin";
import TurnstileField from "@/features/auth/shared/TurnstileField";

export default function LoginForm(p: {
  initialEmail?: string;
  initialVerificationState?: string;
  initialVerifiedState?: string;
}) {
  const h = useLogin(p);

  return (
    <div className={s.page}>
      <div className={s.shell}>
        <div className={s.brandPanel}>
          <Link href="/" className={s.brandLink}>
            Inventory App
          </Link>
          <p className={s.brandText}>
            Inventory and sales visibility for modern teams.
          </p>
        </div>

        <form className={s.form} onSubmit={h.handleLogin}>
          <span className={s.badge}>Sales workspace</span>
          <h1>Welcome back</h1>
          <p className={s.lead}>
            Sign in to manage products, pricing, offers, and follow-ups from one
            place.
          </p>

          <input
            type="email"
            placeholder="Email"
            value={h.email}
            onChange={(e) => h.setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={h.password}
            onChange={(e) => h.setPassword(e.target.value)}
          />

          {h.notice && <p className={s.notice}>{h.notice}</p>}
          {h.error && <p className={s.error}>{h.error}</p>}

          <button type="submit" disabled={h.isLoading}>
            {h.isLoading ? "Signing in..." : "Login"}
          </button>

          {h.needsVerification && (
            <>
              <TurnstileField
                onTokenChange={h.setResendTurnstileToken}
                className={s.turnstileField}
              />
              <button
                type="button"
                className={s.secondaryButton}
                disabled={h.isResending}
                onClick={h.handleResendVerification}
              >
                {h.isResending ? "Sending..." : "Resend verification email"}
              </button>
            </>
          )}

          <p className={s.helperText}>
            New here? Create a workspace and we&apos;ll send a verification link
            before first sign-in.
          </p>
          <Link href="/register" className={s.secondaryAction}>
            Create an account
          </Link>
        </form>
      </div>
    </div>
  );
}
