import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getDashboardStats } from "@/services/dashboard";
import SignOutButton from "@/features/auth/sign-out-button/SignOutButton";
import AddProductForm from "@/features/products/add-product/AddProductForm";
import ProductList from "@/features/products/product-list/ProductList";
import CreateOfferForm from "@/features/offers/create-offer/CreateOfferForm";
import OfferList from "@/features/offers/offer-list/OfferList";
import CompanyProfileForm from "@/features/company/profile/CompanyProfileForm";
import CollapsibleDashboardSection from "@/features/dashboard/collapsible-section/CollapsibleDashboardSection";
import { getSessionUser } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getSessionUser();

  if (!session) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { companyId: true },
  });

  if (!user || user.companyId !== session.companyId) {
    redirect("/login");
  }

  const [stats, products, clients, offers, company] = await Promise.all([
    getDashboardStats(user.companyId),
    db.product.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        price: true,
        currency: true,
        quantity: true,
        createdAt: true,
      },
    }),
    db.client.findMany({
      where: { companyId: user.companyId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    }),
    db.offer.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        offerNumber: true,
        status: true,
        clientName: true,
        clientEmail: true,
        publicToken: true,
        createdAt: true,
        validUntil: true,
        sentAt: true,
        seenAt: true,
        acceptedAt: true,
        rejectedAt: true,
        responseNote: true,
        items: {
          select: {
            id: true,
            productName: true,
            quantity: true,
            price: true,
            currency: true,
          },
        },
      },
    }),
    db.company.findUnique({
      where: { id: user.companyId },
      select: {
        name: true,
        email: true,
        phone: true,
        website: true,
        address: true,
      },
    }),
  ]);

  const productOptions = products.map((product) => ({
    ...product,
    price: product.price.toString(),
  }));

  const dashboardOffers = offers.map((offer) => ({
    ...offer,
    items: offer.items.map((item) => ({
      ...item,
      price: item.price.toString(),
    })),
  }));

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_34%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(45,212,191,0.14),_transparent_30%)]" />
      <div className="relative z-10 mx-auto flex w-full max-w-[1760px] flex-col gap-6 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 2xl:px-10">
        <div className="relative rounded-[1.35rem] border border-white/10 bg-white/5 px-5 py-5 shadow-[0_20px_45px_rgba(2,6,23,0.32)] backdrop-blur sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex rounded-full bg-sky-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
                Sales workspace
              </span>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Inventory & Sales Dashboard
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Build offers on the left, track delivery in the middle, and keep
                your catalog close by on the right when you need it.
              </p>
            </div>

            <SignOutButton />
          </div>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(420px,1.2fr)_minmax(0,1.8fr)]">
          <div className="space-y-5">
            {company ? (
              <CollapsibleDashboardSection
                title="Company profile"
                description="Keep your seller details polished for public offers, PDFs, and outgoing emails."
                badge="Brand"
              >
                <CompanyProfileForm company={company} />
              </CollapsibleDashboardSection>
            ) : null}

            <CollapsibleDashboardSection
              title="Add product"
              description="Drop new products into your catalog without stretching the main workflow."
              badge="Catalog"
            >
              <AddProductForm />
            </CollapsibleDashboardSection>

            <CollapsibleDashboardSection
              title="Create draft offer"
              description="Open this when you are ready to build a quote and keep the dashboard lighter the rest of the time."
              badge="Sales"
            >
              <CreateOfferForm clients={clients} products={productOptions} />
            </CollapsibleDashboardSection>
          </div>

          <div className="grid items-start gap-6 xl:grid-cols-2">
            <section className="self-start rounded-[1.2rem] border border-white/10 bg-white/5 p-4 shadow-[0_18px_40px_rgba(2,6,23,0.28)] backdrop-blur sm:p-5 xl:col-span-2 xl:min-h-[298px]">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Performance snapshot
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                    Keep the pipeline moving
                  </h2>
                </div>
                <p className="max-w-xl text-sm leading-6 text-slate-300">
                  Open quotes and won deals stay visible here, so you can spot
                  what needs follow-up before you dive into the offer table.
                </p>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3 xl:mt-8">
                <div className="rounded-[1rem] border border-white/10 bg-slate-950/45 p-5">
                  <p className="text-sm font-medium text-slate-400">
                    Total Products
                  </p>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-white">
                    {stats.totalProducts}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    Ready to use in new offers.
                  </p>
                </div>

                <div className="rounded-[1rem] border border-amber-300/30 bg-amber-400/10 p-5">
                  <p className="text-sm font-medium text-amber-200">
                    Open Quotes
                  </p>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-amber-50">
                    {stats.pendingOffers}
                  </p>
                  <p className="mt-2 text-sm text-amber-100/80">
                    Draft, sent, and seen offers awaiting a decision.
                  </p>
                </div>

                <div className="rounded-[1rem] border border-emerald-300/30 bg-emerald-400/10 p-5">
                  <p className="text-sm font-medium text-emerald-200">
                    Deals Won
                  </p>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-emerald-50">
                    {stats.wonOffers}
                  </p>
                  <p className="mt-2 text-sm text-emerald-100/80">
                    Accepted offers ready for delivery or invoicing.
                  </p>
                </div>
              </div>
            </section>

            <CollapsibleDashboardSection
              title="Recent offers"
              description="Filter the pipeline, resend emails, jump into details, or export the public PDF view."
              badge="Pipeline"
            >
              <OfferList offers={dashboardOffers} />
            </CollapsibleDashboardSection>

            <CollapsibleDashboardSection
              title="Product catalog"
              description="Keep the full catalog nearby for pricing reference without forcing it to stay on screen all the time."
              badge="Reference"
            >
              <ProductList products={productOptions} />
            </CollapsibleDashboardSection>
          </div>
        </div>
      </div>
    </div>
  );
}
