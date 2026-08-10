-- CreateEnum
CREATE TYPE "CourseRegistrationStatus" AS ENUM ('NEW', 'CONTACTED', 'CONFIRMED', 'DECLINED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'NEW_COURSE_REGISTRATION';

-- CreateTable
CREATE TABLE "CourseRegistration" (
    "id" TEXT NOT NULL,
    "catalogItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "crm" TEXT,
    "whatsapp" TEXT NOT NULL,
    "notes" TEXT,
    "status" "CourseRegistrationStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseRegistration_catalogItemId_idx" ON "CourseRegistration"("catalogItemId");

-- CreateIndex
CREATE INDEX "CourseRegistration_status_idx" ON "CourseRegistration"("status");

-- AddForeignKey
ALTER TABLE "CourseRegistration" ADD CONSTRAINT "CourseRegistration_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

