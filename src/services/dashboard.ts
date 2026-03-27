import { db } from "@/lib/db";

export const getDashboardStats = async (companyId: string) => {
  const [totalProducts, pendingOffers, wonOffers, lowStockProducts] = await Promise.all([
    db.product.count({ where: { companyId } }),
    db.offer.count({ where: { companyId, status: { in: ["DRAFT", "SENT"] } } }),
    db.offer.count({ where: { companyId, status: "ACCEPTED" } }),
    db.product.count({
      where: {
        companyId,
        lowStockThreshold: { gt: 0 },
        quantity: { lte: db.product.fields.lowStockThreshold },
      },
    }),
  ]);

  return { totalProducts, pendingOffers, wonOffers, lowStockProducts };
};
