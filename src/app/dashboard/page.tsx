import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { db } from "@/lib/db";
import { getDashboardStats } from "@/services/dashboard";
import SignOutButton from "@/features/auth/sign-out-button/SignOutButton";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  let userId: string | null = null;

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      redirect("/login");
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );

    userId = (payload.id || payload.userId || payload.sub) as string;
  } catch (error) {
    redirect("/login");
  }

  if (!userId) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });

  if (!user) {
    redirect("/login");
  }

  const stats = await getDashboardStats(user.companyId);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Inventory & Sales Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-white rounded-lg shadow border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Total Products</h3>
          <p className="text-3xl font-bold mt-2">{stats.totalProducts}</p>
        </div>

        <div className="p-6 bg-yellow-50 rounded-lg shadow border border-yellow-200">
          <h3 className="text-yellow-700 text-sm font-medium">
            Pending Quotes
          </h3>
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
        <SignOutButton />
      </div>
    </div>
  );
}
