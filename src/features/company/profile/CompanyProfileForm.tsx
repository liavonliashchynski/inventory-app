"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import s from "./companyProfileForm.module.scss";

type CompanyProfile = {
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
};

export default function CompanyProfileForm({
  company,
}: {
  company: CompanyProfile;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: company.name,
    email: company.email ?? "",
    phone: company.phone ?? "",
    website: company.website ?? "",
    address: company.address ?? "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    try {
      const response = await fetch("/api/company/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error || "Failed to save company profile.");
      }

      setMessage("Company profile updated.");
      startTransition(() => router.refresh());
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to save company profile.",
      );
    }
  }

  return (
    <section className={s.card}>
      <div className={s.header}>
        <h2>Company profile</h2>
        <p>Use these details on public offers, PDFs, and outgoing offer emails.</p>
      </div>

      <form className={s.form} onSubmit={handleSubmit}>
        <div className={s.grid}>
          <div className={s.field}>
            <label htmlFor="companyName">Company name</label>
            <input
              id="companyName"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Your company name"
            />
          </div>

          <div className={s.field}>
            <label htmlFor="companyEmail">Contact email</label>
            <input
              id="companyEmail"
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="sales@company.com"
            />
          </div>

          <div className={s.field}>
            <label htmlFor="companyPhone">Phone</label>
            <input
              id="companyPhone"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              placeholder="+48 555 123 456"
            />
          </div>

          <div className={s.field}>
            <label htmlFor="companyWebsite">Website</label>
            <input
              id="companyWebsite"
              value={form.website}
              onChange={(event) => updateField("website", event.target.value)}
              placeholder="example.com"
            />
          </div>
        </div>

        <div className={s.field}>
          <label htmlFor="companyAddress">Address</label>
          <textarea
            id="companyAddress"
            value={form.address}
            onChange={(event) => updateField("address", event.target.value)}
            placeholder={"Street and city\nPostal code, country"}
          />
        </div>

        <div className={s.actions}>
          <button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save company profile"}
          </button>
          {message ? <span className={s.message}>{message}</span> : null}
        </div>
      </form>
    </section>
  );
}
