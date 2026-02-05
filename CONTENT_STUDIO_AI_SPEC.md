# CONTENT STUDIO AI - ESPECIFICACIÓN TÉCNICA COMPLETA

> Documento unificado para construir la plataforma desde cero.
> Última actualización: 2026-01-23

---

## 1. VISIÓN DEL PRODUCTO

### 1.1 Objetivo
Plataforma web para producción y gestión de contenido mensual con IA. Usa **Claude Skills** como motor de orquestación modular.

### 1.2 Propuesta de Valor
- Producción de contenido mensual en < 2 horas
- Calidad consistente via Skills especializadas
- Workflow profesional: Draft → Review → Approved → Scheduled
- Agnóstico al nicho (contexto desde BrandKit)

### 1.3 Usuarios

| Rol | Acceso | Descripción |
|-----|--------|-------------|
| **Admin** | Panel Admin completo | Opera la plataforma, configura clients, genera contenido |
| **Client** | Portal Cliente simple | Revisa, aprueba, descarga su contenido. UX simplificada |

> ⚠️ **IMPORTANTE**: El Portal Cliente debe ser extremadamente simple. Usuarios no técnicos deben poder revisar y aprobar contenido sin confusión.

---

## 2. ARQUITECTURA

### 2.1 Diagrama de Capas

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │   Admin Dashboard   │    │     Client Portal           │ │
│  │   (Full features)   │    │   (Simplified UI)           │ │
│  └─────────────────────┘    └─────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                      API LAYER                               │
│         REST/tRPC • Auth • Validation • RBAC                │
├─────────────────────────────────────────────────────────────┤
│                   SKILL ORCHESTRATOR                         │
│      Registry • Pipelines • Execution • Logging             │
├─────────────────────────────────────────────────────────────┤
│                     DATA LAYER                               │
│     PostgreSQL • Redis Cache • S3 Storage • BullMQ          │
├─────────────────────────────────────────────────────────────┤
│                      AI LAYER                                │
│              Claude API • Skills Engine                      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Stack Tecnológico

```yaml
frontend:
  framework: Next.js 14+ (App Router)
  state: Zustand
  ui: Radix UI + Tailwind CSS
  icons: Lucide React

backend:
  runtime: Node.js 20+ / TypeScript
  api: tRPC o Express
  validation: Zod
  auth: NextAuth.js

database:
  primary: PostgreSQL
  orm: Prisma
  cache: Redis
  queue: BullMQ

storage:
  provider: Cloudflare R2 / AWS S3

ai:
  provider: Anthropic Claude API
  model: claude-3-5-sonnet

deploy:
  frontend: Vercel
  backend: Railway / Render
```

---

## 3. MODELO DE DATOS

### 3.1 Prisma Schema

```prisma
// Workspace
model Workspace {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  settings  Json?
  createdAt DateTime @default(now())
  clients   Client[]
  users     User[]
}

// User (Admin o Client)
model User {
  id          String    @id @default(uuid())
  email       String    @unique
  name        String
  role        UserRole  @default(CLIENT)
  workspaceId String?
  workspace   Workspace? @relation(fields: [workspaceId], references: [id])
  clientId    String?
  client      Client?   @relation(fields: [clientId], references: [id])
  createdAt   DateTime  @default(now())
}

enum UserRole {
  ADMIN
  CLIENT
}

// Client/Brand
model Client {
  id            String        @id @default(uuid())
  workspaceId   String
  workspace     Workspace     @relation(fields: [workspaceId], references: [id])
  name          String
  slug          String
  industry      String?
  description   String?
  brandKit      BrandKit?
  knowledgeBase KnowledgeBase?
  plan          Plan?         @relation(fields: [planId], references: [id])
  planId        String?
  assets        Asset[]
  contentMonths ContentMonth[]
  users         User[]
  createdAt     DateTime      @default(now())
}

// Brand Kit
model BrandKit {
  id              String   @id @default(uuid())
  clientId        String   @unique
  client          Client   @relation(fields: [clientId], references: [id])
  tone            String
  voiceDescription String?
  guardrails      String[]
  forbiddenWords  String[]
  requiredHashtags String[]
  colorPalette    Json?
  typography      Json?
  updatedAt       DateTime @updatedAt
}

// Knowledge Base
model KnowledgeBase {
  id             String   @id @default(uuid())
  clientId       String   @unique
  client         Client   @relation(fields: [clientId], references: [id])
  about          String?
  products       Json?
  targetAudience Json?
  competitors    String[]
  customFields   Json?
  updatedAt      DateTime @updatedAt
}

// Plan
model Plan {
  id               String   @id @default(uuid())
  name             String
  postsPerMonth    Int      @default(12)
  carouselsPerMonth Int     @default(4)
  reelsPerMonth    Int      @default(4)
  storiesPerMonth  Int      @default(8)
  clients          Client[]
}

// Content Month
model ContentMonth {
  id          String             @id @default(uuid())
  clientId    String
  client      Client             @relation(fields: [clientId], references: [id])
  year        Int
  month       Int
  status      ContentMonthStatus @default(DRAFT)
  strategy    Json?
  calendar    Json?
  generatedAt DateTime?
  lockedAt    DateTime?
  pieces      ContentPiece[]
  createdAt   DateTime           @default(now())
  @@unique([clientId, year, month])
}

enum ContentMonthStatus {
  DRAFT
  GENERATED
  IN_REVIEW
  LOCKED
  EXPORTED
}

// Content Piece
model ContentPiece {
  id             String             @id @default(uuid())
  contentMonthId String
  contentMonth   ContentMonth       @relation(fields: [contentMonthId], references: [id])
  title          String
  format         ContentFormat
  pillar         String?
  copyLong       String?
  copyShort      String?
  cta            String?
  hashtags       String[]
  visualPrompt   String?
  status         ContentPieceStatus @default(IDEA)
  scheduledDate  DateTime?
  position       Int                @default(0)
  assets         Asset[]
  generations    GenerationRun[]
  approvedAt     DateTime?
  approvedBy     String?
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt
}

enum ContentFormat {
  POST
  CAROUSEL
  REEL
  STORY
  THREAD
}

enum ContentPieceStatus {
  IDEA
  DRAFT
  PENDING_REVIEW
  APPROVED
  SCHEDULED
  PUBLISHED
  ARCHIVED
}

// Asset
model Asset {
  id        String   @id @default(uuid())
  clientId  String
  client    Client   @relation(fields: [clientId], references: [id])
  filename  String
  url       String
  mimeType  String
  sizeBytes Int
  tags      String[]
  pieces    ContentPiece[]
  uploadedAt DateTime @default(now())
}

// Skill
model Skill {
  id           String   @id
  name         String
  category     SkillCategory
  inputSchema  Json
  outputSchema Json
  systemPrompt String
  temperature  Float    @default(0.7)
  maxTokens    Int      @default(1000)
  active       Boolean  @default(true)
  generations  GenerationRun[]
}

enum SkillCategory {
  STRATEGY
  COPY
  VISUAL
  QA
}

// Generation Run
model GenerationRun {
  id            String       @id @default(uuid())
  contentPieceId String?
  contentPiece  ContentPiece? @relation(fields: [contentPieceId], references: [id])
  skillId       String
  skill         Skill        @relation(fields: [skillId], references: [id])
  input         Json
  output        Json
  tokensUsed    Int
  version       Int          @default(1)
  createdAt     DateTime     @default(now())
}
```

---

## 4. SISTEMA DE SKILLS

### 4.1 Skills MVP

| ID | Categoría | Propósito |
|----|-----------|-----------|
| `brand_snapshot` | strategy | Resumen de marca |
| `monthly_strategy` | strategy | Objetivos y pilares |
| `content_calendar` | strategy | Planificación semanal |
| `hook_variants` | copy | 5 hooks alternativos |
| `caption_long` | copy | Copy 150+ palabras |
| `caption_short` | copy | Copy <50 palabras |
| `cta_variants` | copy | 3 CTAs |
| `hashtag_set` | copy | 10-15 hashtags |
| `visual_prompt_generator` | visual | Prompt para imagen |
| `redundancy_check` | qa | Detecta repetición |

### 4.2 Pipeline: Generate Month

```typescript
const pipeline = [
  { skill: 'brand_snapshot', input: ctx => ({ clientId: ctx.clientId }) },
  { skill: 'monthly_strategy', input: ctx => ({ 
    brandSnapshot: ctx.snapshot, month: ctx.month, year: ctx.year, plan: ctx.plan 
  })},
  { skill: 'content_calendar', input: ctx => ({ strategy: ctx.strategy, plan: ctx.plan }) },
  { 
    parallel: true, forEach: 'calendar.pieces',
    skills: ['hook_variants', 'caption_long', 'caption_short', 'cta_variants', 'hashtag_set', 'visual_prompt_generator']
  },
  { skill: 'redundancy_check', input: ctx => ({ pieces: ctx.pieces }) }
];
```

---

## 5. API ENDPOINTS

```yaml
auth:
  POST /api/auth/login
  POST /api/auth/register
  GET  /api/auth/me

clients:
  GET    /api/clients
  POST   /api/clients
  GET    /api/clients/:id
  PATCH  /api/clients/:id

months:
  POST   /api/clients/:id/months
  GET    /api/months/:id
  POST   /api/months/:id/generate
  PATCH  /api/months/:id/status

pieces:
  GET    /api/months/:id/pieces
  PATCH  /api/pieces/:id
  POST   /api/pieces/:id/approve
  POST   /api/pieces/:id/regenerate

exports:
  POST   /api/months/:id/export { format: csv|json|pdf|zip }

portal:
  GET  /api/portal/brand
  GET  /api/portal/month/:id
  POST /api/portal/pieces/:id/approve
  POST /api/portal/pieces/:id/feedback
```

---

## 6. UI/UX

### 6.1 Admin Dashboard Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Logo    ⌘K Search...                    🔔  Avatar ▼       │
├─────────┬───────────────────────────────────────┬───────────┤
│ SIDEBAR │           MAIN AREA                   │ INSPECTOR │
│ Dashboard│  Calendar / Kanban / Editor          │ Properties│
│ Clients │                                       │ Actions   │
│ Templates│                                      │           │
│ Exports │                                       │           │
└─────────┴───────────────────────────────────────┴───────────┘
```

### 6.2 Client Portal (SIMPLIFICADO)
```
┌─────────────────────────────────────────────────────────────┐
│ 🏠 Mi Marca                                      👤 Salir   │
├─────────────────────────────────────────────────────────────┤
│   📅 Contenido de Febrero 2026                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  12 Posts  •  4 Aprobados  •  8 Pendientes          │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                      │
│   │Card 1│ │Card 2│ │Card 3│ │Card 4│                      │
│   │ ✅   │ │ 🔶   │ │ 🔶   │ │ ✅   │                      │
│   └──────┘ └──────┘ └──────┘ └──────┘                      │
│                                                             │
│   [ 📥 Descargar Todo ]                                     │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Principios Portal Cliente
- **Max 3 clicks** para cualquier acción
- **Vocabulario simple**: "Ver", "Aprobar", "Descargar"
- **Colores claros**: Verde=aprobado, Amarillo=pendiente
- **Sin jerga técnica**: Ocultar skills, tokens, logs
- **Texto grande**: Mínimo 16px

---

## 7. ROADMAP

### MVP (6 semanas)
- Auth + Roles (Admin/Client)
- CRUD Clients + BrandKit
- ContentMonth + Pieces
- 5 Skills core
- Orchestrator básico
- Calendar view
- Export CSV/JSON
- Portal Cliente básico

### Phase 2 (4 semanas)
- Job Queue
- +10 Skills
- PDF Export
- Kanban view
- Command Palette

### Phase 3 (6 semanas)
- Social Scheduler
- Analytics
- Multi-workspace

---

## 8. ESTRUCTURA REPO

```
content-studio/
├── apps/
│   └── web/                  # Next.js
│       ├── app/
│       │   ├── (auth)/
│       │   ├── (admin)/
│       │   ├── (portal)/     # Client Portal
│       │   └── api/
│       └── components/
├── packages/
│   ├── database/             # Prisma
│   ├── skills/               # Skill definitions
│   └── orchestrator/         # Pipelines
├── turbo.json
└── package.json
```

---

## 9. INICIAR PROYECTO

```bash
pnpm create turbo@latest content-studio
pnpm create next-app@latest apps/web --typescript --tailwind --app
cd packages/database && pnpm add prisma @prisma/client
npx prisma init
# Copiar schema de sección 3.1
npx prisma generate && npx prisma db push
```
