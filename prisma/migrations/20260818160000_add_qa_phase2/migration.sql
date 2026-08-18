-- CreateEnum
CREATE TYPE "ProcessingJobStatus" AS ENUM ('PENDING', 'DISPATCHED', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Call" ADD COLUMN "overallScore" INTEGER;

-- CreateTable
CREATE TABLE "CallTranscript" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "fullText" TEXT NOT NULL,
    "segments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallTranscript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallCriterionResult" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "passed" BOOLEAN,
    "reasoning" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallCriterionResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessingJob" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "status" "ProcessingJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "dispatchedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessingJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CallTranscript_callId_key" ON "CallTranscript"("callId");

-- CreateIndex
CREATE INDEX "CallCriterionResult_callId_idx" ON "CallCriterionResult"("callId");

-- CreateIndex
CREATE UNIQUE INDEX "CallCriterionResult_callId_criterionId_key" ON "CallCriterionResult"("callId", "criterionId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessingJob_callId_key" ON "ProcessingJob"("callId");

-- CreateIndex
CREATE INDEX "ProcessingJob_organizationId_idx" ON "ProcessingJob"("organizationId");

-- CreateIndex
CREATE INDEX "ProcessingJob_status_idx" ON "ProcessingJob"("status");

-- AddForeignKey
ALTER TABLE "CallTranscript" ADD CONSTRAINT "CallTranscript_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallCriterionResult" ADD CONSTRAINT "CallCriterionResult_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallCriterionResult" ADD CONSTRAINT "CallCriterionResult_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "ScorecardCriterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingJob" ADD CONSTRAINT "ProcessingJob_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;
