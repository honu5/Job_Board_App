/*
  Warnings:

  - Added the required column `authorId` to the `JobPost` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyName` to the `JobPost` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('REMOTE', 'IN_PERSON');

-- DropForeignKey
ALTER TABLE "public"."JobPost" DROP CONSTRAINT "JobPost_clientId_fkey";

-- AlterTable
ALTER TABLE "JobPost" ADD COLUMN     "authorId" TEXT NOT NULL,
ADD COLUMN     "companyName" TEXT NOT NULL,
ADD COLUMN     "hoursPerWeek" INTEGER,
ADD COLUMN     "workMode" "WorkMode" NOT NULL DEFAULT 'REMOTE',
ALTER COLUMN "clientId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "JobPost" ADD CONSTRAINT "JobPost_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPost" ADD CONSTRAINT "JobPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
