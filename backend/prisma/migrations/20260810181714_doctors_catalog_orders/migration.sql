/*
  Warnings:

  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('DOCTOR', 'STAFF', 'ADMIN');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CatalogItemType" AS ENUM ('PRODUCT', 'COURSE', 'SEMINAR');

-- CreateEnum
CREATE TYPE "CatalogItemStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'DOCTOR_REGISTRATION_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE 'NEW_DOCTOR_PENDING';
ALTER TYPE "NotificationType" ADD VALUE 'DOCTOR_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'DOCTOR_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'ORDER_CREATED';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'DOCTOR';

-- CreateTable
CREATE TABLE "DoctorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "crm" TEXT,
    "specialty" TEXT,
    "phone" TEXT,
    "clinicName" TEXT,
    "city" TEXT,
    "state" TEXT,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "approvedByUserId" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" TEXT NOT NULL,
    "type" "CatalogItemType" NOT NULL,
    "status" "CatalogItemStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "price" DECIMAL(10,2),
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "location" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "capacity" INTEGER,
    "sku" TEXT,
    "stockQty" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "doctorProfileId" TEXT NOT NULL,
    "catalogItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "OrderStatus" NOT NULL DEFAULT 'CONFIRMED',
    "unitPrice" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DoctorProfile_userId_key" ON "DoctorProfile"("userId");

-- CreateIndex
CREATE INDEX "DoctorProfile_approvalStatus_idx" ON "DoctorProfile"("approvalStatus");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogItem_slug_key" ON "CatalogItem"("slug");

-- CreateIndex
CREATE INDEX "CatalogItem_type_status_idx" ON "CatalogItem"("type", "status");

-- CreateIndex
CREATE INDEX "Order_catalogItemId_idx" ON "Order"("catalogItemId");

-- CreateIndex
CREATE INDEX "Order_doctorProfileId_idx" ON "Order"("doctorProfileId");

-- AddForeignKey
ALTER TABLE "DoctorProfile" ADD CONSTRAINT "DoctorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorProfile" ADD CONSTRAINT "DoctorProfile_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
