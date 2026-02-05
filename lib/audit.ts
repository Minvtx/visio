import { prisma } from '@/lib/prisma'

export type ActionType =
    | 'CREATE_PIECE'
    | 'UPDATE_PIECE'
    | 'APPROVE_PIECE'
    | 'REJECT_PIECE'
    | 'RESTORE_VERSION'
    | 'CREATE_COMMENT'
    | 'RESOLVE_COMMENT'
    | 'UPDATE_BRAND_KIT'
    | 'RUN_QA'

export async function logActivity(
    userId: string,
    action: ActionType,
    resourceId: string,
    resourceType: string,
    details: any = {}
) {
    try {
        await prisma.activityLog.create({
            data: {
                userId,
                action,
                resourceId,
                resourceType,
                details
            }
        })
    } catch (error) {
        console.error('Failed to log activity:', error)
        // We don't throw here to avoid blocking the main action
    }
}

export async function getRecentActivity(limit = 20) {
    return await prisma.activityLog.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: { id: true, name: true, role: true }
            }
        }
    })
}
