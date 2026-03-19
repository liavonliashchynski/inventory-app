-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Offer"
ADD COLUMN "clientId" TEXT,
ADD COLUMN "clientName" TEXT,
ADD COLUMN "clientEmail" TEXT,
ADD COLUMN "offerNumber" TEXT,
ADD COLUMN "notes" TEXT,
ADD COLUMN "validUntil" TIMESTAMP(3),
ADD COLUMN "sentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "OfferItem"
ADD COLUMN "currency" "Currency",
ADD COLUMN "productName" TEXT;

-- Backfill existing offer items from the source products
UPDATE "OfferItem" AS oi
SET "currency" = p."currency",
    "productName" = p."name"
FROM "Product" AS p
WHERE oi."productId" = p."id";

-- Enforce snapshots for all future offer items
ALTER TABLE "OfferItem"
ALTER COLUMN "currency" SET NOT NULL,
ALTER COLUMN "productName" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Client_companyId_idx" ON "Client"("companyId");

-- CreateIndex
CREATE INDEX "Client_name_idx" ON "Client"("name");

-- CreateIndex
CREATE INDEX "Offer_clientId_idx" ON "Offer"("clientId");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
