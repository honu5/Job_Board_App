-- AlterTable
ALTER TABLE "InterviewInvite" ADD COLUMN     "calendarEventId" TEXT,
ADD COLUMN     "meetLink" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "googleRefreshToken" TEXT;
