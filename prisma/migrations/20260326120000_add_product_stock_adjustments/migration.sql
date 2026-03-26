-- CreateTable
CREATE TABLE "ProductStockAdjustment" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "previousQuantity" INTEGER NOT NULL,
    "newQuantity" INTEGER NOT NULL,
    "delta" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "changedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductStockAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductStockAdjustment_productId_createdAt_idx" ON "ProductStockAdjustment"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "ProductStockAdjustment_changedByUserId_idx" ON "ProductStockAdjustment"("changedByUserId");

-- AddForeignKey
ALTER TABLE "ProductStockAdjustment" ADD CONSTRAINT "ProductStockAdjustment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStockAdjustment" ADD CONSTRAINT "ProductStockAdjustment_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
