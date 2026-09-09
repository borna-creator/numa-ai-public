-- CreateEnum
CREATE TYPE "VoiceAgentLanguage" AS ENUM ('ENGLISH', 'FRENCH', 'ARABIC');

-- CreateTable
CREATE TABLE "VoiceAgentPrompt" (
    "language" "VoiceAgentLanguage" NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "greetingPrompt" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceAgentPrompt_pkey" PRIMARY KEY ("language")
);
