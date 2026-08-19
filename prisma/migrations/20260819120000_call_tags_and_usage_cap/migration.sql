-- Call tags + organization usage minute cap
ALTER TABLE "Organization" ADD COLUMN "usageMinutesCap" INTEGER;

ALTER TABLE "Call" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX "Call_createdAt_idx" ON "Call"("createdAt");
