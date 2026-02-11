import { prisma } from "@/lib/prisma";
import { contentGenerator } from '@/lib/agents/content-generator';
import type { BrandContext, MonthBrief, ContentPlan } from '@/lib/agents/content-generator';
import { Job } from "@prisma/client";

/**
 * Simplified Month Generator Processor
 * Uses a single monolithic API call instead of multiple skill calls
 * ~60% cheaper in token usage while maintaining quality
 */
export async function generateMonthProcessor(job: Job) {
    const { monthId } = job.payload as { monthId: string };

    console.log(`[Processor] Starting month generation for ${monthId}...`);

    // 1. Fetch all necessary data
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

    const { client } = contentMonth;

    // 2. Build Brand Context
    const brandContext: BrandContext = {
        name: client.name,
        industry: client.industry || 'General',
        // Identity
        brandPersonality: client.brandKit?.brandPersonality || [],
        brandArchetype: client.brandKit?.brandArchetype || undefined,
        tagline: client.brandKit?.tagline || undefined,
        valueProposition: client.brandKit?.valueProposition || undefined,
        // Voice
        primaryTone: client.brandKit?.primaryTone || client.brandKit?.tone || 'Profesional pero cercano',
        secondaryTone: client.brandKit?.secondaryTone || undefined,
        speakingAs: (client.brandKit?.speakingAs as 'yo' | 'nosotros' | 'la marca') || 'nosotros',
        emojiUsage: (client.brandKit?.emojiUsage as 'ninguno' | 'mínimo' | 'moderado' | 'abundante') || 'moderado',
        // Knowledge
        about: client.knowledgeBase?.about || client.description || '',
        products: (client.knowledgeBase?.products as BrandContext['products']) || [],
        targetAudiences: (client.knowledgeBase?.targetAudiences as BrandContext['targetAudiences']) || [],
        // Guardrails
        guardrails: client.brandKit?.guardrails || [],
        forbiddenWords: client.brandKit?.forbiddenWords || [],
        requiredHashtags: client.brandKit?.requiredHashtags || [],
        forbiddenHashtags: client.brandKit?.forbiddenHashtags || [],
    };

    // 3. Build Month Brief
    const monthBrief: MonthBrief = {
        month: contentMonth.month,
        year: contentMonth.year,
        primaryObjective: contentMonth.primaryObjective || undefined,
        specificGoal: contentMonth.specificGoal || undefined,
        seasonality: contentMonth.seasonality || undefined,
        relevantDates: (contentMonth.relevantDates as MonthBrief['relevantDates']) || [],
        contentPillars: (contentMonth.contentPillars as MonthBrief['contentPillars']) || [],
    };

    // 4. Build Content Plan
    const contentPlan: ContentPlan = {
        posts: client.plan?.postsPerMonth || 12,
        carousels: client.plan?.carouselsPerMonth || 4,
        reels: client.plan?.reelsPerMonth || 4,
        stories: client.plan?.storiesPerMonth || 10,
    };

    // 5. Generate content using simplified monolithic approach
    console.log(`[Processor] Generating ${contentPlan.posts + contentPlan.carousels + contentPlan.reels + contentPlan.stories} pieces...`);

    const result = await contentGenerator.generateMonth(
        brandContext,
        monthBrief,
        contentPlan,
        client.workspaceId // BYOK support
    );

    console.log(`[Processor] Generated ${result.pieces.length} pieces in ${result.duration}ms (${result.tokensUsed} tokens)`);

    // 6. Save Results to Database
    await prisma.$transaction(async (tx) => {
        // Delete existing pieces if any (allows regeneration)
        await tx.contentPiece.deleteMany({
            where: { contentMonthId: monthId }
        });

        // Update ContentMonth with strategy
        await tx.contentMonth.update({
            where: { id: monthId },
            data: {
                strategy: result.strategy as object,
                status: 'GENERATED',
                generatedAt: new Date(),
            },
        });

        // Create ContentPieces
        const piecesData = result.pieces.map((piece, index) => ({
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
            suggestedDate: new Date(contentMonth.year, contentMonth.month - 1, piece.dayOfMonth),
            status: 'DRAFT' as const,
            order: index,
            metadata: {
                carouselSlides: piece.carouselSlides || null,
            } as object,
        }));

        await tx.contentPiece.createMany({
            data: piecesData,
        });
    });

    return {
        piecesCount: result.pieces.length,
        tokensUsed: result.tokensUsed,
        duration: result.duration,
    };
}
