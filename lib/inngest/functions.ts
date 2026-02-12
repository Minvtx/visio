import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import { generateStrategy, generatePieceConcept, generatePieceDetails } from "@/lib/agents/piece-generator";
import type { BrandContext, MonthBrief } from "@/lib/agents/content-generator";

/**
 * Inngest Function: Generate Month Content (Step-based)
 * 
 * Each step.run() = separate HTTP request = separate 10s window
 * Strategy: ~5s | Each piece: ~5s | Total: works on Vercel Hobby!
 */
export const generateMonthContent = inngest.createFunction(
    {
        id: "generate-month-content",
        name: "Generate Month Content with AI",
        retries: 1,
    },
    { event: "content/month.generate" },
    async ({ event, step }) => {
        const { monthId } = event.data;

        // Step 1: Fetch data (< 2s)
        const monthData = await step.run("fetch-data", async () => {
            console.log(`[Inngest] Step 1: Fetching data for month ${monthId}`);
            const contentMonth = await prisma.contentMonth.findUnique({
                where: { id: monthId },
                include: {
                    client: {
                        include: { brandKit: true, knowledgeBase: true, plan: true },
                    },
                },
            });
            if (!contentMonth) throw new Error(`ContentMonth ${monthId} not found`);

            // Delete old pieces
            const deleted = await prisma.contentPiece.deleteMany({ where: { contentMonthId: monthId } });
            console.log(`[Inngest] Deleted ${deleted.count} old pieces`);

            return JSON.parse(JSON.stringify(contentMonth)); // serialize for step
        });

        const { client } = monthData;

        // Build brand context (used in every step)
        const brandContext: BrandContext = {
            name: client.name,
            industry: client.industry || "General",
            brandPersonality: client.brandKit?.brandPersonality || [],
            brandArchetype: client.brandKit?.brandArchetype || undefined,
            tagline: client.brandKit?.tagline || undefined,
            valueProposition: client.brandKit?.valueProposition || undefined,
            primaryTone: client.brandKit?.primaryTone || client.brandKit?.tone || "Profesional pero cercano",
            secondaryTone: client.brandKit?.secondaryTone || undefined,
            speakingAs: (client.brandKit?.speakingAs as any) || "nosotros",
            emojiUsage: (client.brandKit?.emojiUsage as any) || "moderado",
            about: client.knowledgeBase?.about || client.description || "",
            products: (client.knowledgeBase?.products as any) || [],
            targetAudiences: (client.knowledgeBase?.targetAudiences as any) || [],
            guardrails: client.brandKit?.guardrails || [],
            forbiddenWords: client.brandKit?.forbiddenWords || [],
            requiredHashtags: client.brandKit?.requiredHashtags || [],
            forbiddenHashtags: client.brandKit?.forbiddenHashtags || [],
        };

        const monthBrief: MonthBrief = {
            month: monthData.month,
            year: monthData.year,
            primaryObjective: monthData.primaryObjective || undefined,
            specificGoal: monthData.specificGoal || undefined,
            seasonality: monthData.seasonality || undefined,
            relevantDates: (monthData.relevantDates as any) || [],
            contentPillars: (monthData.contentPillars as any) || [],
        };

        const plan = {
            posts: client.plan?.postsPerMonth || 12,
            carousels: client.plan?.carouselsPerMonth || 4,
            reels: client.plan?.reelsPerMonth || 4,
            stories: client.plan?.storiesPerMonth || 10,
        };

        // Step 2: Generate strategy with AI (~5s)
        const strategy = await step.run("generate-strategy", async () => {
            console.log(`[Inngest] Step 2: Generating strategy for ${monthId}...`);
            const strat = await generateStrategy(brandContext, monthBrief, plan, client.workspaceId);
            console.log(`[Inngest] Strategy generated. Assignments: ${strat.pieceAssignments?.length || 0}`);

            // Save strategy to DB
            await prisma.contentMonth.update({
                where: { id: monthId },
                data: { strategy: strat as object },
            });

            return strat;
        });

        // Build piece assignments from strategy
        const assignments = strategy.pieceAssignments || [];
        console.log(`[Inngest] Total assignments to generate: ${assignments.length}`);

        if (assignments.length === 0) {
            console.error(`[Inngest] WARNING: Strategy returned 0 assignments!`);
        }

        // Step 3-N: Generate each piece individually (~5s each)
        for (let i = 0; i < assignments.length; i++) {
            const assignment = assignments[i];

            // 1. Generate Concept (Title & Idea) - Fast (< 5s)
            const concept = await step.run(`generate-concept-${i}`, async () => {
                console.log(`[Inngest] Generating concept ${i + 1}/${assignments.length}...`);
                return await generatePieceConcept({
                    brand: brandContext,
                    brief: monthBrief,
                    format: assignment.format,
                    pillar: assignment.pillar,
                    dayOfMonth: assignment.dayOfMonth,
                    pieceNumber: i + 1,
                    totalPieces: assignments.length,
                }, client.workspaceId);
            });

            // 2. Generate Details (Copy, Hooks, Visuals) - Fast (< 8s)
            await step.run(`generate-details-${i}`, async () => {
                console.log(`[Inngest] Generating details for "${concept.topic}"...`);

                const piece = await generatePieceDetails(concept, {
                    brand: brandContext,
                    brief: monthBrief,
                    format: assignment.format,
                    pillar: assignment.pillar,
                    dayOfMonth: assignment.dayOfMonth,
                    pieceNumber: i + 1,
                    totalPieces: assignments.length,
                }, client.workspaceId);

                // Save piece to DB immediately
                const saved = await prisma.contentPiece.create({
                    data: {
                        contentMonthId: monthId,
                        type: piece.format,
                        title: piece.topic,
                        pillar: piece.pillar,
                        copy: JSON.stringify({
                            hooks: piece.hooks,
                            captionLong: piece.captionLong,
                            captionShort: piece.captionShort,
                            ctas: piece.ctas,
                        }),
                        hashtags: piece.hashtags,
                        visualBrief: piece.visualBrief,
                        suggestedDate: new Date(monthData.year, monthData.month - 1, piece.dayOfMonth),
                        status: "DRAFT",
                        order: i,
                        metadata: {
                            carouselSlides: piece.carouselSlides || null,
                        } as object,
                    },
                });

                console.log(`[Inngest] Piece ${i + 1} SAVED to DB: ${saved.id}`);
                return { pieceId: saved.id };
            });
        }

        // Final step: Mark as completed, count from DB (not local variable!)
        const result = await step.run("finalize", async () => {
            const pieceCount = await prisma.contentPiece.count({
                where: { contentMonthId: monthId },
            });

            await prisma.contentMonth.update({
                where: { id: monthId },
                data: {
                    status: "GENERATED",
                    generatedAt: new Date(),
                },
            });

            console.log(`[Inngest] ✅ COMPLETED! ${pieceCount} pieces in DB for month ${monthId}`);
            return { pieceCount };
        });

        return {
            success: true,
            piecesGenerated: result.pieceCount,
            totalRequested: assignments.length,
        };
    }
);
