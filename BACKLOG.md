# Backlog V1 Ambicioso - Cola de Tareas

> Este documento desglosa el Plan V1 en tickets accionables.
> **Prioridad de Ejecución:** F -> A -> B -> C -> D -> E -> H -> G

---

## 🏗️ EPIC F: Cola de Trabajos (Core Infrastructure)
**Prioridad:** Crítica (Bloqueante)
**Objetivo:** Estabilidad y manejo asíncrono de generaciones largas.

| Ticket ID | Título | Descripción / Alcance | Estimación |
|-----------|--------|-----------------------|------------|
| **F-01** | **Setup BullMQ + Redis** | Configurar instancia de Redis (local/cloud), instalar BullMQ, configurar Worker y Queue base en el proyecto Next.js. | 3 pts |
| **F-02** | **Job Model & Persistence** | Implementar modelo `Job` en Prisma. Crear utilidades para crear job, actualizar progreso y marcar completado/fallido. | 3 pts |
| **F-03** | **Job Processors (Skills)** | Migrar la ejecución síncrona actual de skills a Processors de BullMQ (`generateStrategy`, `generatePieces`). | 8 pts |
| **F-04** | **API Endpoint: Job Status** | Endpoint GET `/api/jobs/:id` para polling de estado. Endpoint POST para cancelar (opcional). | 2 pts |
| **F-05** | **UI: Job Monitor Component** | Componente visual (Toast o Banner) que muestre "Generando... 45%" y maneje el polling hasta completarse. | 5 pts |

---

## 🔄 EPIC A: Feedback Loop & Versionado
**Prioridad:** Alta (Switching Feature)
**Objetivo:** Ciclo de corrección rápido sin perder historial.

| Ticket ID | Título | Descripción / Alcance | Estimación |
|-----------|--------|-----------------------|------------|
| **A-01** | **Backend: Versioning System** | Implementar modelo `ContentPieceVersion`. Lógica para snapshotear pieza actual antes de editar (al guardar cambios). | 5 pts |
| **A-02** | **Backend: Comments API** | Endpoint CRUD para `Comment`. Relación con Piece. | 3 pts |
| **A-03** | **Logic: Apply Feedback & Regenerate** | Nuevo JobType `REGENERATE_PIECE`. Debe recibir `pieceId`, leer comentarios "OPEN", construir prompt de corrección y generar nueva versión. | 8 pts |
| **A-04** | **UI: Version History Viewer** | Sidebar o modal en el editor de pieza para ver historial de versiones y restaurar anteriores. | 5 pts |
| **A-05** | **UI: Commenting Interface** | Componente estilo Google Docs/Figma para dejar comentarios sobre la pieza. | 5 pts |

---

## 🛡️ EPIC B: Brand Governance (QA)
**Prioridad:** Alta (Calidad Diferencial)
**Objetivo:** Evitar alucinaciones y mantener consistencia.

| Ticket ID | Título | Descripción / Alcance | Estimación |
|-----------|--------|-----------------------|------------|
| **B-01** | **Brand Kit V1.5** | Expandir schema `BrandKit` con `forbiddenWords`, `claimsPolicy`, `requiredMentions`. UI para editar estos campos. | 3 pts |
| **B-02** | **Skill: QA Check** | Nueva Skill `qa_auditor` que recibe (BrandKit + ContentPiece) y devuelve JSON con score y violaciones. | 5 pts |
| **B-03** | **Pipeline: Automatic QA** | Integrar `qa_auditor` al final de `generatePieces` y `regeneratePiece`. Guardar resultado en `QualityCheck`. | 3 pts |
| **B-04** | **UI: QA Panel** | Badge de calidad (Verde/Amarillo/Rojo) en la pieza. Panel lateral que muestra las violaciones detectadas. | 3 pts |
| **B-05** | **Blocking Logic** | API impide transición a estado `APPROVED` si score < threshold y no hay override manual de Admin. | 2 pts |

---

## 🔐 EPIC C: Roles & Auditoría
**Prioridad:** Media (Enterprise Ready)
**Objetivo:** Seguridad y trazabilidad multi-usuario.

| Ticket ID | Título | Descripción / Alcance | Estimación |
|-----------|--------|-----------------------|------------|
| **C-01** | **Schema Update: Roles** | Migrar `UserRole` a granular (ADMIN, MANAGER, CREATOR, RO, CLIENT). Script de migración. | 2 pts |
| **C-02** | **Middleware RBAC** | Middleware o HOC (Higher Order Component) para proteger rutas Admin vs Portal. | 3 pts |
| **C-03** | **Backend Audit Logger** | Servicio `AuditService.log(action, user, resource)`. Implementar interceptores en acciones críticas. | 3 pts |
| **C-04** | **UI: Activity Log** | Vista "Activity" en el dashboard del cliente mostrando quién aprobó qué y cuándo. | 3 pts |

---

## 🎩 EPIC D: Portal Cliente
**Prioridad:** Media (UX)
**Objetivo:** Experiencia de aprobación sin fricción.

| Ticket ID | Título | Descripción / Alcance | Estimación |
|-----------|--------|-----------------------|------------|
| **D-01** | **Simplified Login** | Magic Link o login simplificado para clientes (si aplica). | 3 pts |
| **D-02** | **Client Dashboard V2** | Rediseño de `app/(portal)`: Vista Calendario visual. Filtros "Pendiente de mi aprobación". | 8 pts |
| **D-03** | **Approve/Reject Actions** | Botones flotantes grandes en versión móvil/desktop. Rechazar abre modal de feedback obligatorio. | 3 pts |

---

## 📦 EPIC E: Exportables
**Prioridad:** Media (Valor Tangible)
**Objetivo:** Entrega final.

| Ticket ID | Título | Descripción / Alcance | Estimación |
|-----------|--------|-----------------------|------------|
| **E-01** | **PDF Generation Service** | Job `EXPORT_PDF` usando `react-pdf` o similar server-side. Layout profesional con branding. | 8 pts |
| **E-02** | **ZIP Packager** | Job `EXPORT_ZIP`. Recolectar assets, generar TXTs con copies, comprimir y subir a almacenaminto temporal. | 5 pts |
| **E-03** | **UI: Download Center** | Sección en Dashboard/Portal para descargar exportables generados. | 2 pts |

---

## 🧪 EPIC H & G: Skills Avanzadas (Futuro)
**Prioridad:** Baja (Mejora Continua)

| Ticket ID | Título | Descripción / Alcance |
|-----------|--------|-----------------------|
| **H-01** | **Variant Generator** | Generar 3 variaciones de copy por pieza. Selector en UI. |
| **G-01** | **Skill Versioning** | Schema para versiones de skills. |

---

## Resumen de Estimación Inicial
- **Total Story Points (V1 Core):** ~85 pts.
- **Sprint 1 Sugerido:** EPIC F (Infra) + EPIC A-01/02 (Modelado Datos).
