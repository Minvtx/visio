import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
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
    adapter: PrismaAdapter(prisma),
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
            authorization: {
                params: {
                    scope: 'openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/drive.file',
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
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

                const email = credentials.email.toLowerCase()
                const user = await prisma.user.findUnique({
                    where: { email },
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
        async signIn({ user, account, profile }) {
            // For OAuth providers, update user role/workspace if needed
            if (account?.provider === 'google' && user.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: user.email },
                })

                if (!dbUser) {
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
                    // Note: PrismaAdapter will have created the base User record, 
                    // we just need to enhance it if it's new.
                    // But wait, PrismaAdapter creates the user BEFORE signIn callback finishes or during it?
                    // Actually, NextAuth creates the user if it doesn't exist via the adapter.

                    // Let's refine the existing user if it's new
                } else if (!dbUser.role) {
                    // This case shouldn't happen with our setup but good to be safe
                    await prisma.user.update({
                        where: { id: dbUser.id },
                        data: { role: 'CLIENT' }
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
