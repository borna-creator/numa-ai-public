-- Monthly usage cap + reset day (1–28) per organization
ALTER TABLE "Organization" ADD COLUMN "usageMinutesMonthlyCap" INTEGER;
ALTER TABLE "Organization" ADD COLUMN "usageResetDayOfMonth" INTEGER;
