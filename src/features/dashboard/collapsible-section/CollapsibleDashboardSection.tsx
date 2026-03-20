"use client";

import { useState, type ReactNode } from "react";
import styles from "./collapsibleDashboardSection.module.scss";

export default function CollapsibleDashboardSection({
  title,
  description,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  description: string;
  badge?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className={styles.panel}>
      <button
        type="button"
        className={styles.summary}
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-label={`${isOpen ? "Hide" : "Show"} ${title}`}
      >
        <div className={styles.copy}>
          {badge ? <span className={styles.badge}>{badge}</span> : null}
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <span className={styles.toggle}>
          <span>{isOpen ? "Hide" : "Show"}</span>
          <span
            aria-hidden="true"
            className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
          />
        </span>
      </button>

      {isOpen ? <div className={styles.body}>{children}</div> : null}
    </section>
  );
}
