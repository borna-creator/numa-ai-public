-- CreateEnum
CREATE TYPE "ScorecardLanguage" AS ENUM ('ENGLISH', 'ARABIC', 'FRENCH');

-- AlterTable
ALTER TABLE "Scorecard" ADD COLUMN "language" "ScorecardLanguage" NOT NULL DEFAULT 'ENGLISH';
