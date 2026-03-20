"use client";

import Script from "next/script";
import { useEffect, useId, useRef, useState } from "react";
import styles from "./register.module.scss";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

export default function TurnstileField({
  onTokenChange,
}: {
  onTokenChange: (token: string) => void;
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const hasRenderedRef = useRef(false);
  const elementId = useId();
  const [isScriptReady, setIsScriptReady] = useState(false);

  useEffect(() => {
    if (
      !siteKey ||
      !isScriptReady ||
      !window.turnstile ||
      !containerRef.current ||
      hasRenderedRef.current
    ) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme: "dark",
      callback: (token) => onTokenChange(token),
      "expired-callback": () => onTokenChange(""),
      "error-callback": () => onTokenChange(""),
    });
    hasRenderedRef.current = true;

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [isScriptReady, onTokenChange, siteKey]);

  if (!siteKey) {
    return (
      <p className={styles.helperError}>
        Registration protection is not configured yet. Add your Turnstile site
        key to continue.
      </p>
    );
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setIsScriptReady(true)}
      />
      <div
        id={elementId}
        ref={containerRef}
        className={styles.turnstileField}
      />
    </>
  );
}
