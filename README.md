# Content Studio AI

Plataforma de producción y gestión de contenido mensual con IA.

## Setup

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

3. Inicializar base de datos:
```bash
npm run db:generate
npm run db:push
```

4. Ejecutar en desarrollo:
```bash
npm run dev
```

## Stack

- **Frontend**: Next.js 14+ (App Router)
- **UI**: Radix UI + Tailwind CSS
- **Database**: PostgreSQL + Prisma
- **AI**: Claude API (Anthropic)
- **Auth**: NextAuth.js

## Estructura

```
├── app/                  # Next.js App Router
│   ├── (admin)/          # Panel Admin
│   ├── (portal)/         # Portal Cliente (simplificado)
│   ├── (auth)/           # Login/Register
│   └── api/              # API Routes
├── components/           # React Components
│   ├── ui/               # Primitivos UI
│   ├── admin/            # Admin específicos
│   └── portal/           # Portal específicos
├── lib/                  # Utilities
│   ├── skills/           # Skill definitions
│   └── db.ts             # Prisma client
└── prisma/               # Database schema
```
