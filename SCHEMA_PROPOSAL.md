# Propuesta de Cambios al Schema de Prisma (V1 Ambicioso)

> Esta propuesta alinea la base de datos con los requerimientos del PLAN_V1.md: Feedback Loop, Brand QA, Roles, y Colas de Trabajo.

## 1. Roles y Permisos (User & Auth)

Expandimos los roles para soportar la granularidad requerida.

```prisma
enum UserRole {
  ADMIN       // Superadmin del sistema
  MANAGER     // Gestiona clientes y estrategía
  CREATOR     // Puede editar y generar contenido
  REVIEWER    // Solo puede ver y comentar
  CLIENT      // Acceso limitado al portal
}

model User {
  // ... campos existentes
  role        UserRole  @default(CLIENT)
  // ...
}
```

## 2. Versionado de Contenido (ContentPieceVersion)

Para soportar "Apply feedback & regenerate" sin perder historial.

```prisma
model ContentPiece {
  // ... campos existentes
  currentVersionId String?  @unique // Apuntador a la versión activa
  
  versions    ContentPieceVersion[]
  comments    Comment[]
  qualityChecks QualityCheck[]
}

model ContentPieceVersion {
  id             String        @id @default(uuid())
  pieceId        String
  piece          ContentPiece  @relation(fields: [pieceId], references: [id], onDelete: Cascade)
  
  versionNumber  Int
  copy           Json?         // Snapshot del copy en este punto
  visualBrief    String?       @db.Text
  
  changelog      String?       // "Regenerated based on feedback: ..."
  soureSkillId   String?       // ID de la skill que generó esto (si aplica)
  
  createdAt      DateTime      @default(now())
  createdBy      String?       // UserId (quien pidió el cambio o generó la versión)
  
  // Relación con QA específico de esta versión
  qualityCheck   QualityCheck?
}
```

## 3. Feedback Loop (Comments)

Comentarios granulares sobre el contenido.

```prisma
model Comment {
  id          String       @id @default(uuid())
  pieceId     String
  piece       ContentPiece @relation(fields: [pieceId], references: [id], onDelete: Cascade)
  
  userId      String       // Autor del comentario
  user        User         @relation(fields: [userId], references: [id])
  
  content     String       @db.Text
  quotedText  String?      // Texto seleccionado (si aplica)
  blockId     String?      // ID del bloque específico (hook, body, cta)
  
  status      CommentStatus @default(OPEN)
  
  createdAt   DateTime     @default(now())
  resolvedAt  DateTime?
}

enum CommentStatus {
  OPEN
  RESOLVED
  IGNORED
}
```

## 4. Brand Governance (QualityCheck)

Resultados de la auditoría automática de marca.

```prisma
model QualityCheck {
  id             String              @id @default(uuid())
  pieceId        String
  piece          ContentPiece        @relation(fields: [pieceId], references: [id], onDelete: Cascade)
  
  versionId      String?             @unique
  version        ContentPieceVersion? @relation(fields: [versionId], references: [id])
  
  score          Int                 // 0-100
  passed         Boolean             // Si cumplió el umbral configurado
  
  violations     Json?               // [{ rule: "no-passive-voice", severity: "high", text: "..." }]
  suggestions    Json?               // [{ original: "...", suggestion: "..." }]
  
  runAt          DateTime            @default(now())
}
```

## 5. Cola de Trabajos (Job System)

Persistencia para BullMQ y observabilidad.

```prisma
model Job {
  id          String    @id @default(uuid())
  type        JobType   // GENERATE_STRATEGY, GENERATE_PIECES, EXPORT_PDF, etc.
  status      JobStatus @default(QUEUED)
  
  resourceId  String?   // ID del Month o Piece relacionado (para buscar fácil)
  resourceType String?  // "ContentMonth", "ContentPiece"
  
  payload     Json      // Input parameters
  result      Json?     // Output result o location del archivo exportado
  error       String?   @db.Text
  
  progress    Int       @default(0) // 0-100
  
  createdAt   DateTime  @default(now())
  startedAt   DateTime?
  completedAt DateTime?
  
  userId      String?   // Quien disparó el job
}

enum JobType {
  GENERATE_STRATEGY
  GENERATE_CALENDAR
  GENERATE_PIECE_BATCH
  REGENERATE_PIECE
  RUN_QA_CHECK
  EXPORT_PDF
  EXPORT_ZIP
}

enum JobStatus {
  QUEUED
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}
```

## 6. Auditoría (AuditLog)

Trazabilidad completa de acciones críticas.

```prisma
model AuditLog {
  id          String   @id @default(uuid())
  userId      String
  action      String   // "APPROVE_PIECE", "UPDATE_BRAND_KIT", "EXPORT_MONTH"
  
  resourceId  String
  resourceType String  // "ContentMonth", "Client"
  
  metadata    Json?    // Detalles del cambio (diff, ip, etc.)
  
  createdAt   DateTime @default(now())
}
```

## Resumen de Impacto
- **Migraciones**: Se requiere migración. Tablas nuevas (`Job`, `Comment`, `QualityCheck`, `AuditLog`, `ContentPieceVersion`). Campos nuevos en `User` y `ContentPiece`.
- **Riesgo**: Bajo. No se modifican llaves foráneas críticas existentes destructivamente, solo se expanden.
