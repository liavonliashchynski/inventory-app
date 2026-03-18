import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";

const metrics = [
  { value: "1 dashboard", label: "for products, quotes, and closed deals" },
  { value: "100%", label: "company-scoped data separation" },
  { value: "Minutes", label: "to onboard a new team" },
];

export default async function HomePage() {
  const token = (await cookies()).get("token")?.value;
  const secret = process.env.JWT_SECRET;

  if (token && secret) {
    const isValid = await jwtVerify(token, new TextEncoder().encode(secret))
      .then(() => true)
      .catch(() => false);

    if (isValid) {
      redirect("/dashboard");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.2),_transparent_36%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(45,212,191,0.16),_transparent_32%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur">
          <div>
            <p className="text-sm font-bold uppercase text-slate-100">
              Inventory App
            </p>
            <p className="text-xs text-slate-300">
              Inventory and sales visibility for modern teams
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-sky-300/60 hover:bg-white/8"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
            >
              Create account
            </Link>
          </div>
        </header>

        <section className="flex flex-1 items-center justify-center py-14 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Stop managing inventory from scattered notes and stale
              spreadsheets.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              One dashboard for products, pricing, quotes, and closed deals —
              so your team always works from a single source of truth.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                Start free
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-teal-300/60 hover:bg-white/10"
              >
                I already have an account
              </Link>
            </div>

            <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
                >
                  <p className="text-2xl font-semibold text-white">
                    {metric.value}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
