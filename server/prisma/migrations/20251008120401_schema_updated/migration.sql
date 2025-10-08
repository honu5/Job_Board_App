-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "education" JSONB,
ADD COLUMN     "jobTitle" TEXT,
ADD COLUMN     "links" JSONB,
ADD COLUMN     "projects" JSONB;
