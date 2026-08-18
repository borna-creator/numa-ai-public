-- CreateEnum
CREATE TYPE "CriterionQuestionType" AS ENUM ('YES_NO', 'EXCELLENT_GOOD_POOR', 'CONVERSATIONAL');

-- AlterTable
ALTER TABLE "ScorecardCriterion" ADD COLUMN "questionType" "CriterionQuestionType" NOT NULL DEFAULT 'YES_NO';
