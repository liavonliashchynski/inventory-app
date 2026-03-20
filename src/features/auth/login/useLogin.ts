import { useEffect, useState } from "react";

async function readResponseMessage(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = (await res.json()) as { error?: string; message?: string };
    return data.error || data.message || "";
  }

  return res.text();
}

type UseLoginParams = {
  initialEmail?: string;
  initialVerificationState?: string;
  initialVerifiedState?: string;
};

export function useLogin({
  initialEmail = "",
  initialVerificationState,
  initialVerifiedState,
}: UseLoginParams) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendTurnstileToken, setResendTurnstileToken] = useState("");

  useEffect(() => {
    if (initialEmail) {
      setEmail((currentEmail) => currentEmail || initialEmail);
    }

    if (initialVerificationState === "pending") {
      setNotice(
        "Your account was created. Check your inbox for the verification email.",
      );
      setNeedsVerification(false);
      return;
    }

    if (initialVerificationState === "needs-resend") {
      setNotice(
        "Your account was created, but email delivery is not configured yet. You can resend once SMTP is ready.",
      );
      setNeedsVerification(true);
      return;
    }

    switch (initialVerifiedState) {
      case "success":
        setNotice("Email verified. You can sign in now.");
        setNeedsVerification(false);
        break;
      case "already":
        setNotice("This email is already verified. You can sign in now.");
        setNeedsVerification(false);
        break;
      case "expired":
        setNotice(
          "That verification link expired. Enter your email to request a new one.",
        );
        setNeedsVerification(true);
        break;
      case "invalid":
        setNotice("That verification link is invalid or has already been used.");
        setNeedsVerification(true);
        break;
      case "missing-token":
        setNotice("The verification link is incomplete.");
        setNeedsVerification(true);
        break;
      case "error":
        setNotice("We couldn't verify your email right now. Please try again.");
        setNeedsVerification(true);
        break;
      default:
        setNotice("");
        setNeedsVerification(false);
    }
  }, [initialEmail, initialVerificationState, initialVerifiedState]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setNeedsVerification(false);

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ email, password }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const message = await readResponseMessage(res);
        setNeedsVerification(res.status === 403);
        setError(message || "Login failed.");
        return;
      }

      window.location.assign("/dashboard");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendVerification() {
    setError("");
    setNotice("");

    if (!email) {
      setError("Enter your email address first.");
      return;
    }

    if (!resendTurnstileToken) {
      setError("Please complete the verification challenge first.");
      return;
    }

    setIsResending(true);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email, turnstileToken: resendTurnstileToken }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const message = await readResponseMessage(res);

      if (!res.ok) {
        setError(message || "Unable to send a new verification email.");
        return;
      }

      setResendTurnstileToken("");
      setNotice(
        message ||
          "If an unverified account exists for this email, a new verification link is on the way.",
      );
    } catch {
      setError("Network error. Try again.");
    } finally {
      setIsResending(false);
    }
  }

  return {
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
  };
}
