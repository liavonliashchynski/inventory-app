import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getDashboardStats = async (companyId: string) => {
  const [totalProducts, pendingOffers, wonOffers] = await Promise.all([
    prisma.product.count({ where: { companyId } }),
    prisma.offer.count({ where: { companyId, status: "SENT" } }),
    prisma.offer.count({ where: { companyId, status: "ACCEPTED" } }),
  ]);

  return { totalProducts, pendingOffers, wonOffers };
};
