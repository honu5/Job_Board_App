-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "aboutCompany" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "companySize" TEXT,
ADD COLUMN     "companyWebsite" TEXT,
ADD COLUMN     "contact" JSONB,
ADD COLUMN     "hiringNeeds" JSONB,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "logoUrl" TEXT;
