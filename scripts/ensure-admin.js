const { PrismaClient } = require('@prisma/client')
const { hash } = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    const email = 'admin@visio.com'
    const password = 'admin' // Contraseña simple para desarrollo

    console.log(`Verificando usuario ${email}...`)

    const user = await prisma.user.findUnique({
        where: { email }
    })

    if (user) {
        console.log('El usuario ya existe. Actualizando contraseña...')
        const hashedPassword = await hash(password, 12)
        await prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword,
                role: 'ADMIN'
            }
        })
        console.log('Usuario actualizado. Credenciales:')
        console.log(`Email: ${email}`)
        console.log(`Password: ${password}`)
    } else {
        console.log('Usuario no encontrado. Creando nuevo admin...')
        const hashedPassword = await hash(password, 12)

        // Crear o buscar workspace default
        let workspace = await prisma.workspace.findFirst()
        if (!workspace) {
            workspace = await prisma.workspace.create({
                data: { name: 'Default Workspace', slug: 'default' }
            })
        }

        await prisma.user.create({
            data: {
                email,
                name: 'Admin User',
                password: hashedPassword,
                role: 'ADMIN',
                workspaceId: workspace.id
            }
        })
        console.log('Usuario creado exitosamente. Credenciales:')
        console.log(`Email: ${email}`)
        console.log(`Password: ${password}`)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
