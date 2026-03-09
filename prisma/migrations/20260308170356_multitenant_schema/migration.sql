/*
  Warnings:

  - Added the required column `price` to the `OfferItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OfferItem" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "price" DECIMAL(10,2) NOT NULL;
