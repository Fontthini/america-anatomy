-- CreateEnum
CREATE TYPE "FunnelStage" AS ENUM ('NEW', 'FIRST_CONTACT', 'AWAITING_RESPONSE', 'INTERESTED', 'PAYMENT_LINK_SENT', 'CUSTOMER', 'LOST');

-- CreateEnum
CREATE TYPE "ReviewAction" AS ENUM ('APPROVE', 'REJECT');

-- CreateEnum
CREATE TYPE "ReferralType" AS ENUM ('PATIENT', 'DOCTOR');

-- CreateEnum
CREATE TYPE "ReferralPatientStatus" AS ENUM ('IN_PROGRESS', 'NEGOTIATION', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReferralDoctorStatus" AS ENUM ('NEW', 'CONTACTED', 'CONVERTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FinancialEntryType" AS ENUM ('INCOME', 'EXPENSE');

-- AlterEnum
ALTER TYPE "ApprovalStatus" ADD VALUE 'IN_REVIEW';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'LEAD_ASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE 'LEAD_REVIEW_REQUESTED';

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('DOCTOR', 'SALES_REP', 'MANAGER', 'ADMIN');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'DOCTOR';
COMMIT;

-- AlterTable
ALTER TABLE "DoctorProfile" ADD COLUMN     "assignedSalesRepId" TEXT,
ADD COLUMN     "funnelStage" "FunnelStage" NOT NULL DEFAULT 'NEW',
ADD COLUMN     "lossReason" TEXT,
ADD COLUMN     "reviewRequestedAction" "ReviewAction";

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referringDoctorProfileId" TEXT NOT NULL,
    "type" "ReferralType" NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "crm" TEXT,
    "patientStatus" "ReferralPatientStatus",
    "doctorStatus" "ReferralDoctorStatus",
    "notes" TEXT,
    "commissionAmount" DECIMAL(10,2),
    "commissionPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialEntry" (
    "id" TEXT NOT NULL,
    "type" "FinancialEntryType" NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "receiptUrl" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorLabel" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Referral_type_idx" ON "Referral"("type");

-- CreateIndex
CREATE INDEX "Referral_referringDoctorProfileId_idx" ON "Referral"("referringDoctorProfileId");

-- CreateIndex
CREATE INDEX "FinancialEntry_type_idx" ON "FinancialEntry"("type");

-- CreateIndex
CREATE INDEX "FinancialEntry_entryDate_idx" ON "FinancialEntry"("entryDate");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialCategory_name_key" ON "FinancialCategory"("name");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "DoctorProfile_funnelStage_idx" ON "DoctorProfile"("funnelStage");

-- CreateIndex
CREATE INDEX "DoctorProfile_assignedSalesRepId_idx" ON "DoctorProfile"("assignedSalesRepId");

-- AddForeignKey
ALTER TABLE "DoctorProfile" ADD CONSTRAINT "DoctorProfile_assignedSalesRepId_fkey" FOREIGN KEY ("assignedSalesRepId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referringDoctorProfileId_fkey" FOREIGN KEY ("referringDoctorProfileId") REFERENCES "DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialEntry" ADD CONSTRAINT "FinancialEntry_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

