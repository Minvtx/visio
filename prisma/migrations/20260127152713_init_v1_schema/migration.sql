-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'CREATOR', 'REVIEWER', 'CLIENT');

-- CreateEnum
CREATE TYPE "ContentMonthStatus" AS ENUM ('DRAFT', 'GENERATING', 'GENERATED', 'IN_REVIEW', 'APPROVED', 'LOCKED', 'EXPORTED');

-- CreateEnum
CREATE TYPE "ContentFormat" AS ENUM ('POST', 'CAROUSEL', 'REEL', 'STORY', 'THREAD');

-- CreateEnum
CREATE TYPE "ContentPieceStatus" AS ENUM ('IDEA', 'DRAFT', 'PENDING_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SkillCategory" AS ENUM ('STRATEGY', 'COPY', 'VISUAL', 'QA');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('OPEN', 'RESOLVED', 'IGNORED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "workspaceId" TEXT,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "industry" TEXT,
    "description" TEXT,
    "planId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandKit" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "brandPersonality" TEXT[],
    "brandArchetype" TEXT,
    "tagline" TEXT,
    "missionStatement" TEXT,
    "valueProposition" TEXT,
    "tone" TEXT NOT NULL,
    "primaryTone" TEXT,
    "secondaryTone" TEXT,
    "communicationStyle" TEXT,
    "speakingAs" TEXT,
    "emojiUsage" TEXT,
    "voiceDescription" TEXT,
    "guardrails" TEXT[],
    "forbiddenWords" TEXT[],
    "forbiddenTopics" TEXT[],
    "requiredMentions" TEXT[],
    "competitorNames" TEXT[],
    "requiredHashtags" TEXT[],
    "forbiddenHashtags" TEXT[],
    "hashtagsPerPost" INTEGER NOT NULL DEFAULT 10,
    "colorPalette" JSONB,
    "typography" JSONB,
    "visualStyle" TEXT,
    "photoStyle" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandKit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeBase" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "about" TEXT,
    "history" TEXT,
    "products" JSONB,
    "services" JSONB,
    "targetAudience" JSONB,
    "targetAudiences" JSONB,
    "competitors" TEXT[],
    "testimonials" TEXT[],
    "caseStudies" TEXT[],
    "keyMetrics" TEXT[],
    "topPerformingContent" JSONB,
    "contentToAvoid" TEXT[],
    "frequentFeedback" TEXT[],
    "customFields" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeBase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "postsPerMonth" INTEGER NOT NULL DEFAULT 12,
    "carouselsPerMonth" INTEGER NOT NULL DEFAULT 4,
    "reelsPerMonth" INTEGER NOT NULL DEFAULT 4,
    "storiesPerMonth" INTEGER NOT NULL DEFAULT 8,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentMonth" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" "ContentMonthStatus" NOT NULL DEFAULT 'DRAFT',
    "primaryObjective" TEXT,
    "specificGoal" TEXT,
    "kpis" TEXT[],
    "seasonality" TEXT,
    "relevantDates" JSONB,
    "industryTrends" TEXT[],
    "competitorActivity" TEXT,
    "activeCampaigns" JSONB,
    "contentPillars" JSONB,
    "strategy" JSONB,
    "calendar" JSONB,
    "generatedAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentMonth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPiece" (
    "id" TEXT NOT NULL,
    "contentMonthId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ContentFormat" NOT NULL,
    "pillar" TEXT,
    "copy" JSONB,
    "hashtags" TEXT[],
    "visualBrief" TEXT,
    "status" "ContentPieceStatus" NOT NULL DEFAULT 'DRAFT',
    "suggestedDate" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currentVersionId" TEXT,

    CONSTRAINT "ContentPiece_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "tags" TEXT[],
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "SkillCategory" NOT NULL,
    "description" TEXT,
    "inputSchema" JSONB NOT NULL,
    "outputSchema" JSONB NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 1000,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationRun" (
    "id" TEXT NOT NULL,
    "contentPieceId" TEXT,
    "skillId" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "tokensUsed" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GenerationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "resourceId" TEXT,
    "resourceType" TEXT,
    "payload" JSONB NOT NULL,
    "result" JSONB,
    "error" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "userId" TEXT,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPieceVersion" (
    "id" TEXT NOT NULL,
    "pieceId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "copy" JSONB,
    "visualBrief" TEXT,
    "changelog" TEXT,
    "sourceSkillId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "ContentPieceVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "pieceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "quotedText" TEXT,
    "blockId" TEXT,
    "status" "CommentStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityCheck" (
    "id" TEXT NOT NULL,
    "pieceId" TEXT NOT NULL,
    "versionId" TEXT,
    "score" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "violations" JSONB,
    "suggestions" JSONB,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QualityCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AssetToContentPiece" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Client_workspaceId_slug_key" ON "Client"("workspaceId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "BrandKit_clientId_key" ON "BrandKit"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeBase_clientId_key" ON "KnowledgeBase"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentMonth_clientId_year_month_key" ON "ContentMonth"("clientId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "ContentPiece_currentVersionId_key" ON "ContentPiece"("currentVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "QualityCheck_versionId_key" ON "QualityCheck"("versionId");

-- CreateIndex
CREATE UNIQUE INDEX "_AssetToContentPiece_AB_unique" ON "_AssetToContentPiece"("A", "B");

-- CreateIndex
CREATE INDEX "_AssetToContentPiece_B_index" ON "_AssetToContentPiece"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandKit" ADD CONSTRAINT "BrandKit_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeBase" ADD CONSTRAINT "KnowledgeBase_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentMonth" ADD CONSTRAINT "ContentMonth_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPiece" ADD CONSTRAINT "ContentPiece_contentMonthId_fkey" FOREIGN KEY ("contentMonthId") REFERENCES "ContentMonth"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationRun" ADD CONSTRAINT "GenerationRun_contentPieceId_fkey" FOREIGN KEY ("contentPieceId") REFERENCES "ContentPiece"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationRun" ADD CONSTRAINT "GenerationRun_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPieceVersion" ADD CONSTRAINT "ContentPieceVersion_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "ContentPiece"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "ContentPiece"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityCheck" ADD CONSTRAINT "QualityCheck_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "ContentPiece"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityCheck" ADD CONSTRAINT "QualityCheck_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ContentPieceVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssetToContentPiece" ADD CONSTRAINT "_AssetToContentPiece_A_fkey" FOREIGN KEY ("A") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssetToContentPiece" ADD CONSTRAINT "_AssetToContentPiece_B_fkey" FOREIGN KEY ("B") REFERENCES "ContentPiece"("id") ON DELETE CASCADE ON UPDATE CASCADE;
