// Script para crear usuarios de prueba para MVP privado
// Ejecutar con: npx tsx scripts/seed-users.ts

import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// 10 Usuarios de prueba para el MVP con passwords aleatorias
const TEST_USERS = [
    { email: 'admin@visio.app', name: 'Admin Visio', password: 'Kx9#mPvL2q' },
    { email: 'demo@visio.app', name: 'Usuario Demo', password: 'Nw4$jRtH8s' },
    { email: 'agencia1@test.com', name: 'Agencia Creativa', password: 'Bf7&zYcU3p' },
    { email: 'agencia2@test.com', name: 'Marketing Digital Pro', password: 'Qm2!xDnA9w' },
    { email: 'agencia3@test.com', name: 'Social Media Lab', password: 'Ht5@kWbE6r' },
    { email: 'agencia4@test.com', name: 'Content Factory', password: 'Jv8#pLsG1f' },
    { email: 'agencia5@test.com', name: 'Brand Studio', password: 'Uc3$tMhK7d' },
    { email: 'agencia6@test.com', name: 'Digital First', password: 'Zn6!wQyJ4m' },
    { email: 'agencia7@test.com', name: 'Creative Hub', password: 'Xa1@bFrN8v' },
    { email: 'agencia8@test.com', name: 'Growth Agency', password: 'Ry9#cGlP2s' },
]

async function main() {
    console.log('🌱 Creando usuarios de prueba...\n')

    for (const userData of TEST_USERS) {
        // Check if user exists
        const existing = await prisma.user.findUnique({
            where: { email: userData.email }
        })

        if (existing) {
            console.log(`⏭️  Usuario ${userData.email} ya existe, saltando...`)
            continue
        }

        // Create workspace for each user
        const workspace = await prisma.workspace.create({
            data: {
                name: userData.name,
                slug: userData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-'),
                settings: {
                    tier: 'FREE',
                    maxClients: 2
                }
            }
        })
        console.log(`🏢 Workspace creado: ${workspace.name}`)

        // Hash password
        const hashedPassword = await hash(userData.password, 12)

        // Create user
        const user = await prisma.user.create({
            data: {
                email: userData.email,
                name: userData.name,
                password: hashedPassword,
                role: 'ADMIN',
                workspaceId: workspace.id
            }
        })

        console.log(`✅ Usuario creado: ${user.email}`)
    }

    console.log('\n' + '='.repeat(55))
    console.log('🎉 USUARIOS DE PRUEBA CREADOS')
    console.log('='.repeat(55))
    console.log('\nCredenciales:')
    console.log('-'.repeat(55))
    TEST_USERS.forEach(u => {
        console.log(`📧 ${u.email.padEnd(28)} | 🔑 ${u.password}`)
    })
    console.log('-'.repeat(55))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
