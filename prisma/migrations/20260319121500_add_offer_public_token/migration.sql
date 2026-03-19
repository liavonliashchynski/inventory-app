ALTER TABLE "Offer"
ADD COLUMN "publicToken" TEXT;

CREATE UNIQUE INDEX "Offer_publicToken_key" ON "Offer"("publicToken");
