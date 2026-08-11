-- CreateEnum
CREATE TYPE "AmbassadorApplicationStatus" AS ENUM ('NEW', 'CONTACTED', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "CatalogItem" ADD COLUMN     "instructorUserId" TEXT;

-- CreateTable
CREATE TABLE "AmbassadorApplication" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "profileType" TEXT NOT NULL,
    "alreadyKnowsAai" BOOLEAN NOT NULL,
    "availableForLives" BOOLEAN NOT NULL,
    "hasNetwork" BOOLEAN NOT NULL,
    "notes" TEXT,
    "status" "AmbassadorApplicationStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AmbassadorApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AmbassadorApplication_status_idx" ON "AmbassadorApplication"("status");

-- CreateIndex
CREATE INDEX "CatalogItem_instructorUserId_idx" ON "CatalogItem"("instructorUserId");

-- AddForeignKey
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_instructorUserId_fkey" FOREIGN KEY ("instructorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

