-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "finishedAt" TIMESTAMP(3),
ADD COLUMN     "startedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "TalentRating" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "raterId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "period" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TalentRating_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TalentRating" ADD CONSTRAINT "TalentRating_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentRating" ADD CONSTRAINT "TalentRating_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
