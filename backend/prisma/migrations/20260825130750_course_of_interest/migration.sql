-- AlterTable
ALTER TABLE "DoctorProfile" ADD COLUMN "courseOfInterestId" TEXT;

-- CreateIndex
CREATE INDEX "DoctorProfile_courseOfInterestId_idx" ON "DoctorProfile"("courseOfInterestId");

-- AddForeignKey
ALTER TABLE "DoctorProfile" ADD CONSTRAINT "DoctorProfile_courseOfInterestId_fkey" FOREIGN KEY ("courseOfInterestId") REFERENCES "CatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
