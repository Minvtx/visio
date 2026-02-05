import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from './prisma'
import { compare, hash } from 'bcryptjs'

// Extend next-auth types
declare module 'next-auth' {
    interface User {
        id: string
        role: 'ADMIN' | 'CLIENT' | 'MANAGER' | 'CREATOR' | 'REVIEWER'
        clientId?: string | null
        workspaceId?: string | null
    }

    interface Session {
        user: {
            id: string
            email: string
            name: string
            role: 'ADMIN' | 'CLIENT' | 'MANAGER' | 'CREATOR' | 'REVIEWER'
            clientId?: string | null
            workspaceId?: string | null
        }
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string
        role: 'ADMIN' | 'CLIENT' | 'MANAGER' | 'CREATOR' | 'REVIEWER'
        clientId?: string | null
        workspaceId?: string | null
    }
}

export const authOptions: NextAuthOptions = {
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    providers: [
        // Google OAuth
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        }),
        // Email/Password
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email y contraseña son requeridos')
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                })

                if (!user || !user.password) {
                    throw new Error('Credenciales inválidas')
                }

                const isPasswordValid = await compare(credentials.password, user.password)

                if (!isPasswordValid) {
                    throw new Error('Credenciales inválidas')
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    clientId: user.clientId,
                    workspaceId: user.workspaceId,
                }
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            // For OAuth providers, create user if doesn't exist
            if (account?.provider === 'google' && user.email) {
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email },
                })

                if (!existingUser) {
                    // Check if any admin exists
                    const adminExists = await prisma.user.findFirst({
                        where: { role: 'ADMIN' },
                    })

                    // Get or create default workspace
                    let workspace = await prisma.workspace.findFirst()
                    if (!workspace) {
                        workspace = await prisma.workspace.create({
                            data: {
                                name: 'Mi Agencia',
                                slug: 'mi-agencia',
                            },
                        })
                    }

                    // Create user - first user becomes ADMIN
                    await prisma.user.create({
                        data: {
                            email: user.email,
                            name: user.name || 'Usuario',
                            role: adminExists ? 'CLIENT' : 'ADMIN',
                            workspaceId: workspace.id,
                        },
                    })
                }
            }
            return true
        },
        async jwt({ token, user, account }) {
            // On initial sign in, fetch user data from database
            if (account && token.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: token.email },
                })
                if (dbUser) {
                    token.id = dbUser.id
                    token.role = dbUser.role
                    token.clientId = dbUser.clientId
                    token.workspaceId = dbUser.workspaceId
                }
            } else if (user) {
                token.id = user.id
                token.role = user.role
                token.clientId = user.clientId
                token.workspaceId = user.workspaceId
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id
                session.user.role = token.role
                session.user.clientId = token.clientId
                session.user.workspaceId = token.workspaceId
            }
            return session
        },
    },
}

// Helper to hash passwords
export async function hashPassword(password: string): Promise<string> {
    return hash(password, 12)
}

// Helper to verify passwords
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return compare(password, hashedPassword)
}
