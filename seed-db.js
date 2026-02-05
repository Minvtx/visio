
const { PrismaClient } = require('@prisma/client')
const { hash } = require('bcryptjs')
const prisma = new PrismaClient()

async function seed() {
    console.log('Seeding...')

    // 1. Create Workspace
    let workspace = await prisma.workspace.findFirst({ where: { slug: 'mi-agencia' } })
    if (!workspace) {
        workspace = await prisma.workspace.create({
            data: {
                name: 'Mi Agencia',
                slug: 'mi-agencia'
            }
        })
        console.log('Workspace created:', workspace.id)
    } else {
        console.log('Workspace already exists:', workspace.id)
    }

    // 2. Create Admin User
    const email = 'admin@studio.com'
    const hashedPassword = await hash('admin123', 12)

    let admin = await prisma.user.findUnique({ where: { email } })
    if (!admin) {
        admin = await prisma.user.create({
            data: {
                email,
                name: 'Admin User',
                password: hashedPassword,
                role: 'ADMIN',
                workspaceId: workspace.id
            }
        })
        console.log('Admin user created:', admin.email)
    } else {
        // Force update workspaceId just in case
        admin = await prisma.user.update({
            where: { email },
            data: { workspaceId: workspace.id, role: 'ADMIN' }
        })
        console.log('Admin user updated:', admin.email)
    }

    console.log('Seed complete. You can login with admin@studio.com / admin123')
}

seed()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
