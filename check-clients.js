
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const clients = await prisma.client.findMany({
        include: {
            _count: {
                select: { contentMonths: true }
            }
        }
    })
    console.log('Total Clients:', clients.length)
    console.log(JSON.stringify(clients, null, 2))
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
