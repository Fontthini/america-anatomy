-- AlterEnum
ALTER TYPE "FunnelStage" ADD VALUE 'INFO_RECEIVED';
ALTER TYPE "FunnelStage" ADD VALUE 'WITHDRAWN';

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'GOOGLE', 'LINKEDIN', 'SITE', 'INDICACAO', 'CONGRESSO', 'EVENTO', 'WHATSAPP_UNINGA', 'EX_ALUNO', 'OUTRO');

-- CreateEnum
CREATE TYPE "LeadActivityType" AS ENUM ('CALL', 'WHATSAPP', 'EMAIL', 'NOTE', 'PAYMENT_METHOD');

-- AlterTable
ALTER TABLE "DoctorProfile" ADD COLUMN     "profession" TEXT,
ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "leadSource" "LeadSource";

-- CreateTable
CREATE TABLE "LeadActivity" (
    "id" TEXT NOT NULL,
    "doctorProfileId" TEXT NOT NULL,
    "type" "LeadActivityType" NOT NULL,
    "note" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadReminder" (
    "id" TEXT NOT NULL,
    "doctorProfileId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadActivity_doctorProfileId_idx" ON "LeadActivity"("doctorProfileId");

-- CreateIndex
CREATE INDEX "LeadReminder_doctorProfileId_idx" ON "LeadReminder"("doctorProfileId");

-- CreateIndex
CREATE INDEX "LeadReminder_dueAt_idx" ON "LeadReminder"("dueAt");

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadReminder" ADD CONSTRAINT "LeadReminder_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadReminder" ADD CONSTRAINT "LeadReminder_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
