# Estado Actual del Proyecto: Visio (Content Studio AI)
> Fecha: 27 de Enero, 2026
> Versión Documentada: 1.0 (WIP)

Este documento resume el estado actual de la aplicación **Visio (Content Studio AI)**, detallando su propósito, funcionalidades implementadas, trabajo en curso y roadmap pendiente.

---

## 1. Propósito del Proyecto
**Visio** es una plataforma diseñada para **orquestar y automatizar la producción de contenido mensual** para clientes (marcas) utilizando Inteligencia Artificial (Claude 3.5 Sonnet).

El flujo principal es:
1.  **Configurar Cliente**: Definir Brand Kit (voz, tono, identidad visual) y Knowledge Base.
2.  **Planificar Mes**: Crear un "Content Month" para un cliente.
3.  **Generar con IA**: El sistema genera Estrategia -> Calendario -> Piezas (Copy, Visuals) usando Skills modulares.
4.  **Revisión y Aprobación**: Flujo de aprobación (Draft -> Review -> Approved).
5.  **Entrega**: Portal simplificado para que el cliente final apruebe.

---

## 2. Dónde Estamos (Contexto)
Actualmente hemos completado la **Fase 2 (Generación)**, **Epic A (Feedback & Versionado)**, **Epics B y C (Governance & Roles)** y **Epic D (Portal Clientes)**.
El sistema es funcional end-to-end: desde la generación con IA hasta la aprobación final por parte del cliente en su propio portal simplificado.

---

## 3. Lo Que Tenemos (Funcionalidades Implementadas)

### Backend & Datos
-   **Schema de Prisma**: Modelado completo para `User`, `Workspace`, `Client`, `BrandKit`, `ContentMonth`, `ContentPiece` y `Skill`.
-   **API REST**:
    -   Endpoints CRUD para Clientes, Meses y Piezas (`app/api/...`).
    -   Endpoints de ejecución de Skills (`/generate`, `/approve`).
-   **Autenticación**: Sistema base implementado (NextAuth).

### Frontend (Admin Dashboard)
-   **Gestión de Clientes**:
    -   Listado de clientes.
    -   **Página de Detalles de Cliente (`app/(admin)/admin/clients/[id]`)**: Vista robusta que incluye pestañas para Brand Kit, Knowledge Base y lista de Meses de Contenido.
-   **Gestión de Contenido Mensual**:
    -   Creación de meses.
    -   Visualización de piezas de contenido dentro de un mes.
    -   UI para ver detalles de Piezas, status y estrategias.

### IA & Skills (Motor)
-   **Sistema de Skills**: Definición base de Skills (`lib/skills`, `app/api/skills`).
-   **Pipelines**: Lógica para orquestar la generación (Estrategia -> Calendario -> Piezas).

### Colaboración y Control (Epic A)
-   **RBAC & Audit**: Sistema de roles y logs de actividad centralizados.
-   **Notificaciones**: Alertas in-app para admins.

### Skills & IA (Epic E - En Progreso)
-   **Skills Base**: `brand_snapshot`, `monthly_strategy`, `content_calendar`.
-   **Skills Avanzados (Skills.sh)**:
    -   `copywriting`: Copy profesional (Claridad, Beneficios).
    -   `social-content`: Hooks virales y reglas por plataforma.
    -   `marketing-psychology`: Triggers de persuasión (Cialdini).
    -   `brand-guidelines`: Auditoría avanzada de marca vía LLM.
-   **Comentarios**: Sistema de feedback con resolución.
-   **Integración UI**: Brand Health mejorado con análisis semántico detallado.
-   **Orquestación**: Pipeline mensual actualizado para usar `social-content` (Hooks virales, reglas por plataforma).

### Brand Governance & QA (Epic B)
-   **QA Checker (QA Skill)**: Análisis de palabras prohibidas, hashtags y parámetros básicos.
-   **Brand Health Panel**: Visualización del score de QA en el editor.
-   **Bloqueo de Aprobación**: Los Reviewers no pueden aprobar piezas con QA fallido (configurable).

### Roles & Auditoría (Epic C)
-   **RBAC**: Definición granular de permisos por Rol.
-   **Activity Log**: Registro inmutable de acciones críticas.

### Portal de Clientes (Epic D)
-   **Portal Simplificado**: UI dedicada (`/portal`) para que los clientes revisen contenido sin complejidad.
-   **Flujo de Aprobación**: Botones claros para Aprobar/Comentar.
-   **Notificaciones**: Alumnos Admins reciben alertas cuando el Cliente aprueba o rechaza.

---

## 4. Lo Que Falta (Roadmap & Pendientes)

### A Corto Plazo
-   **UI de Notificaciones**: Mostrar campana y lista de notificaciones en el Admin Header.
-   **Dashboard Analytics**: Visualización de rendimiento de contenido (si hay integración con redes).
-   **Dashboard Analytics**: Visualización de rendimiento de contenido (si hay integración con redes).
-   **UI de Notificaciones**: Mostrar campana y lista de notificaciones en el Admin Header.

### A Mediano/Largo Plazo
-   **Cola de Trabajos (Queue)**: Implementación de BullMQ/Redis para manejar generaciones largas en background (actualmente síncrono o pseudo-async).
-   **Portal Cliente Completo**: Aunque existe la estructura (`app/(portal)`), la experiencia simplificada para el cliente final necesita pulido y validación.
-   **Exportación**: Generación de PDFs o ZIPs con el contenido del mes.
-   **Publicación Automática**: Integración con APIs de redes sociales (Meta, LinkedIn) para publicar directamente.

---

## 5. Estructura Clave del Código

-   **Modelos de Datos**: `prisma/schema.prisma` (La verdad absoluta de los datos).
-   **Admin UI**: `app/(admin)/admin/` (Donde ocurre la gestión).
    -   `clients/[id]/page.tsx`: El "corazón" de la gestión del cliente.
-   **Lógica de Negocio (API)**: `app/api/`
    -   `months/[id]/strategy`: Lógica de generación de estrategia.
    -   `pipelines/`: Orquestación de IA.
-   **Librerías/Utils**: `lib/`
    -   `skills/`: Definiciones de las habilidades de la IA.

---

### Resumen para el Desarrollador
> "La app es un CMS potenciado por IA. Ya tenemos el CMS (CRUDs). Ahora estamos construyendo el cerebro (la generación automática de ese contenido) y conectándolo a la UI."
