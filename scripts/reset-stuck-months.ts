import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetStubbornMonths() {
    console.log('🔄 Buscando meses trabados en GENERATING...')

    const stuckMonths = await prisma.contentMonth.updateMany({
        where: {
            status: 'GENERATING'
        },
        data: {
            status: 'DRAFT'
        }
    })

    console.log(`✅ Se resetearon ${stuckMonths.count} meses a DRAFT.`)

    // También limpiar Jobs fallidos/viejos que quedaron en RUNNING
    const stuckJobs = await prisma.job.updateMany({
        where: {
            status: { in: ['QUEUED', 'RUNNING'] }
        },
        data: {
            status: 'FAILED',
            error: 'Interrumpido por timeout o reinicio servidor'
        }
    })

    console.log(`✅ Se marcaron ${stuckJobs.count} jobs como fallidos.`)
}

resetStubbornMonths()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
