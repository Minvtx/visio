import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import { generateStrategy, generateSinglePiece } from "@/lib/agents/piece-generator";
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
            await prisma.contentPiece.deleteMany({ where: { contentMonthId: monthId } });

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
            console.log(`[Inngest] Generating strategy for ${monthId}...`);
            const strat = await generateStrategy(brandContext, monthBrief, plan, client.workspaceId);

            // Save strategy to DB
            await prisma.contentMonth.update({
                where: { id: monthId },
                data: { strategy: strat as object },
            });

            return strat;
        });

        // Build piece assignments from strategy
        const assignments = strategy.pieceAssignments || [];
        const totalPieces = assignments.length || (plan.posts + plan.carousels + plan.reels + plan.stories);

        // Step 3-N: Generate each piece individually (~5s each)
        let successCount = 0;

        for (let i = 0; i < assignments.length; i++) {
            const assignment = assignments[i];

            await step.run(`generate-piece-${i}`, async () => {
                console.log(`[Inngest] Generating piece ${i + 1}/${assignments.length}...`);

                try {
                    const piece = await generateSinglePiece({
                        brand: brandContext,
                        brief: monthBrief,
                        format: assignment.format,
                        pillar: assignment.pillar,
                        dayOfMonth: assignment.dayOfMonth,
                        pieceNumber: i + 1,
                        totalPieces: assignments.length,
                    }, client.workspaceId);

                    // Save piece to DB immediately
                    await prisma.contentPiece.create({
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

                    successCount++;
                } catch (err) {
                    console.error(`[Inngest] Failed to generate piece ${i + 1}:`, err);
                    // Continue with next piece, don't fail the whole job
                }
            });
        }

        // Final step: Mark as completed
        await step.run("finalize", async () => {
            await prisma.contentMonth.update({
                where: { id: monthId },
                data: {
                    status: "GENERATED",
                    generatedAt: new Date(),
                },
            });
            console.log(`[Inngest] Completed! ${successCount}/${assignments.length} pieces generated.`);
        });

        return {
            success: true,
            piecesGenerated: successCount,
            totalRequested: assignments.length,
        };
    }
);
