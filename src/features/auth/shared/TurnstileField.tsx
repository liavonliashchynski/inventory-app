"use client";

import Script from "next/script";
import { useEffect, useId, useRef, useState } from "react";

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
  className,
  theme = "dark",
}: {
  onTokenChange: (token: string) => void;
  className?: string;
  theme?: "light" | "dark" | "auto";
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
      theme,
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
  }, [className, isScriptReady, onTokenChange, siteKey, theme]);

  if (!siteKey) {
    return null;
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setIsScriptReady(true)}
      />
      <div id={elementId} ref={containerRef} className={className} />
    </>
  );
}
