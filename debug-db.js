
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const workspaces = await prisma.workspace.findMany()
    console.log('Workspaces:', workspaces)
    const users = await prisma.user.findMany({
        include: { workspace: true }
    })
    console.log('Users:', users.map(u => ({ id: u.id, email: u.email, workspaceId: u.workspaceId, hasWorkspace: !!u.workspace })))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
