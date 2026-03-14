import { db } from "@/lib/db";

export const getDashboardStats = async (companyId: string) => {
  const [totalProducts, pendingOffers, wonOffers] = await Promise.all([
    db.product.count({ where: { companyId } }),
    db.offer.count({ where: { companyId, status: "SENT" } }),
    db.offer.count({ where: { companyId, status: "ACCEPTED" } }),
  ]);

  return { totalProducts, pendingOffers, wonOffers };
};
