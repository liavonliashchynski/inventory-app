import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getDashboardStats } from "@/services/dashboard";
import SignOutButton from "@/features/auth/sign-out-button/SignOutButton";
import AddProductForm from "@/features/products/add-product/AddProductForm";
import ProductList from "@/features/products/product-list/ProductList";
import CreateOfferForm from "@/features/offers/create-offer/CreateOfferForm";
import OfferList from "@/features/offers/offer-list/OfferList";
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

  const [stats, products, clients, offers] = await Promise.all([
    getDashboardStats(user.companyId),
    db.product.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        price: true,
        currency: true,
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
  ]);

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory & Sales Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track products, quotes, and won deals in one place.
          </p>
        </div>
        <SignOutButton />
      </div>

      <AddProductForm />
      <CreateOfferForm
        clients={clients}
        products={products.map((product) => ({
          ...product,
          price: product.price.toString(),
        }))}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-white rounded-lg shadow border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Total Products</h3>
          <p className="text-3xl font-bold mt-2">{stats.totalProducts}</p>
        </div>

        <div className="p-6 bg-yellow-50 rounded-lg shadow border border-yellow-200">
          <h3 className="text-yellow-700 text-sm font-medium">Open Quotes</h3>
          <p className="text-3xl font-bold text-yellow-900 mt-2">
            {stats.pendingOffers}
          </p>
        </div>

        <div className="p-6 bg-green-50 rounded-lg shadow border border-green-200">
          <h3 className="text-green-700 text-sm font-medium">Deals Won</h3>
          <p className="text-3xl font-bold text-green-900 mt-2">
            {stats.wonOffers}
          </p>
        </div>
      </div>

      <OfferList
        offers={offers.map((offer) => ({
          ...offer,
          items: offer.items.map((item) => ({
            ...item,
            price: item.price.toString(),
          })),
        }))}
      />

      <ProductList
        products={products.map((product) => ({
          ...product,
          price: product.price.toString(),
        }))}
      />
    </div>
  );
}
