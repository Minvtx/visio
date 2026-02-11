import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import { contentGenerator } from "@/lib/agents/content-generator";
import type { BrandContext, MonthBrief, ContentPlan } from "@/lib/agents/content-generator";

/**
 * Inngest Function: Generate Month Content
 * 
 * This runs as a background job with up to 2 hours timeout (free tier).
 * Inngest calls this function via HTTP, so Vercel's 10s limit doesn't apply.
 */
export const generateMonthContent = inngest.createFunction(
    {
        id: "generate-month-content",
        name: "Generate Month Content with AI",
        retries: 1, // Retry once on failure
    },
    { event: "content/month.generate" },
    async ({ event, step }) => {
        const { monthId } = event.data;

        // Step 1: Fetch data and mark as generating
        const monthData = await step.run("fetch-month-data", async () => {
            const contentMonth = await prisma.contentMonth.findUnique({
                where: { id: monthId },
                include: {
                    client: {
                        include: {
                            brandKit: true,
                            knowledgeBase: true,
                            plan: true,
                        },
                    },
                },
            });

            if (!contentMonth) {
                throw new Error(`ContentMonth ${monthId} not found`);
            }

            // Mark as generating
            await prisma.contentMonth.update({
                where: { id: monthId },
                data: { status: "GENERATING" },
            });

            return contentMonth;
        });

        // Step 2: Build context and generate with AI
        const result = await step.run("generate-with-ai", async () => {
            const { client } = monthData;

            const brandContext: BrandContext = {
                name: client.name,
                industry: client.industry || "General",
                brandPersonality: client.brandKit?.brandPersonality || [],
                brandArchetype: client.brandKit?.brandArchetype || undefined,
                tagline: client.brandKit?.tagline || undefined,
                valueProposition: client.brandKit?.valueProposition || undefined,
                primaryTone: client.brandKit?.primaryTone || client.brandKit?.tone || "Profesional pero cercano",
                secondaryTone: client.brandKit?.secondaryTone || undefined,
                speakingAs: (client.brandKit?.speakingAs as "yo" | "nosotros" | "la marca") || "nosotros",
                emojiUsage: (client.brandKit?.emojiUsage as "ninguno" | "mínimo" | "moderado" | "abundante") || "moderado",
                about: client.knowledgeBase?.about || client.description || "",
                products: (client.knowledgeBase?.products as BrandContext["products"]) || [],
                targetAudiences: (client.knowledgeBase?.targetAudiences as BrandContext["targetAudiences"]) || [],
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
                relevantDates: (monthData.relevantDates as MonthBrief["relevantDates"]) || [],
                contentPillars: (monthData.contentPillars as MonthBrief["contentPillars"]) || [],
            };

            const contentPlan: ContentPlan = {
                posts: client.plan?.postsPerMonth || 12,
                carousels: client.plan?.carouselsPerMonth || 4,
                reels: client.plan?.reelsPerMonth || 4,
                stories: client.plan?.storiesPerMonth || 10,
            };

            console.log(`[Inngest] Generating content for month ${monthId}...`);

            const generated = await contentGenerator.generateMonth(
                brandContext,
                monthBrief,
                contentPlan,
                client.workspaceId
            );

            console.log(`[Inngest] Generated ${generated.pieces.length} pieces in ${generated.duration}ms`);

            return generated;
        });

        // Step 3: Save results to database
        await step.run("save-to-database", async () => {
            await prisma.$transaction(async (tx) => {
                // Delete existing pieces (allows regeneration)
                await tx.contentPiece.deleteMany({
                    where: { contentMonthId: monthId },
                });

                // Update ContentMonth with strategy
                await tx.contentMonth.update({
                    where: { id: monthId },
                    data: {
                        strategy: result.strategy as object,
                        status: "GENERATED",
                        generatedAt: new Date(),
                    },
                });

                // Create ContentPieces
                const piecesData = result.pieces.map((piece: any, index: number) => ({
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
                    status: "DRAFT" as const,
                    order: index,
                    metadata: {
                        carouselSlides: piece.carouselSlides || null,
                    } as object,
                }));

                await tx.contentPiece.createMany({
                    data: piecesData,
                });
            });
        });

        return {
            success: true,
            piecesCount: result.pieces.length,
            tokensUsed: result.tokensUsed,
            duration: result.duration,
        };
    }
);
