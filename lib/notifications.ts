import { prisma } from '@/lib/prisma'

export async function createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    resourceId?: string,
    resourceType?: string
) {
    try {
        await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                resourceId,
                resourceType
            }
        })
    } catch (e) {
        console.error('Failed to create notification', e)
    }
}

export async function notifyAdmins(type: string, title: string, message: string, resourceId?: string) {
    const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true }
    })

    await Promise.all(admins.map(admin =>
        createNotification(admin.id, type, title, message, resourceId, 'ContentPiece')
    ))
}
