# Visio (Content Studio AI) – Plan V1 Ambicioso (Cola de Tareas para Agente)

**Fecha:** 27 de enero, 2026
**Objetivo:** Convertir Visio de “CMS + generación con IA” a una plataforma **end-to-end** con **gobernanza de calidad**, **feedback loop** y **switching features** que justifiquen migración desde herramientas existentes.

---

## 0) Contexto breve

Hoy tenemos:

* CRUDs (Clientes, Content Months, Content Pieces), Admin UI base, esquema Prisma robusto.
* Sistema de Skills + orquestación (Estrategia → Calendario → Piezas).

Problema: el mercado ya resuelve planificación/colaboración/aprobación/scheduling/analytics. Para que Visio gane, debemos entregar:

* **Consistencia de marca real** (no solo “tono”).
* **Aprobación con feedback accionable** y re-generación guiada.
* **Trazabilidad + roles/permisos + auditoría.**
* **Exportables y portal cliente impecable.**
* (Luego) publicación/scheduling y medición.

---

## 1) Norte del producto (V1)

### 1.1 Propuesta de valor (V1)

**“En 60–90 minutos dejamos listo un mes completo de contenido, coherente con la marca, revisable y aprobable por el cliente, con cambios aplicables en 1 clic y entregables listos para publicar.”**

### 1.2 Principios no negociables

1. **Calidad gobernada:** ninguna pieza se aprueba sin pasar validaciones (brand QA + claims + formato).
2. **Human-in-the-loop ultra rápido:** feedback → regenerar sin romper lo ya aprobado.
3. **Auditable:** quién generó/editar/aprobó + historial + versionado.
4. **Cliente feliz:** portal simple, sin fricción; exportables impecables.

---

## 2) Metas medibles (KPIs de V1)

* **Tiempo de producción mensual por cliente:** -60% vs flujo manual actual (objetivo: < 2–4 horas).
* **Tasa de aprobación en primera ronda:** ≥ 70%.
* **Tiempo promedio de aplicar feedback:** < 5 min por pieza (con “Apply feedback & regenerate”).
* **Consistencia de marca (score):** ≥ 85/100 según QA automático.

---

## 3) Alcance V1 (lo que vamos a construir)

### 3.1 Switching features (imprescindibles)

1. **Feedback loop por pieza**

   * Comentarios (por bloque / por pieza), estados “Changes requested”.
   * Botón: **Aplicar feedback y regenerar** (manteniendo contexto, marca y restricciones).

2. **Roles + permisos + auditoría**

   * Roles: Admin, Manager, Creator, Reviewer, Client.
   * Permisos por workspace/cliente/mes.
   * Auditoría: evento + actor + timestamp (generate/edit/approve/reject/publish/export).

3. **Portal cliente sólido (UX simple)**

   * Ver mes, piezas, previsualización, aprobar/rechazar, comentar.
   * Historial de cambios y versiones visibles.

4. **Exportables “cliente-ready”**

   * PDF (calendario + piezas + copies) + ZIP (assets + naming convención).
   * Export a CSV/Google Sheets (opcional).

5. **Brand governance real (QA + evidencia)**

   * Brand Kit expandido (reglas, do/don’t, términos prohibidos, claims permitidos).
   * Validación automática + score.
   * “Citas internas” desde KB: si hay afirmaciones de producto, referencia fuente.

### 3.2 Escala de Skills como producto

* Librería de Skills “opinionadas” por industria.
* Versionado de Skills + métricas por Skill (aprobación, retrabajo, calidad).
* Editor de Skills (mínimo viable) para ajustar prompts/reglas sin deploy.

### 3.3 (Luego, fase V1.1) Publicación / scheduling

* Integración con APIs sociales o export format para importar a herramientas.
* Publicación diferida + cola de publicación.

---

## 4) Lo que NO vamos a hacer (por ahora)

* Analytics avanzados multi-plataforma (full BI) desde el día 1.
* Edición de imagen estilo Canva completa.
* CRM completo o facturación.

---

## 5) Arquitectura/Infra: cambios necesarios

### 5.1 Async/Queue obligatorio

* Implementar **BullMQ + Redis** (o equivalente) para:

  * Generación de estrategia/calendario/piezas
  * Generación de variantes
  * Re-generación por feedback
  * Exportables (PDF/ZIP)
  * (Futuro) publicación

**Requisito:** UI debe mostrar estados (Queued/Running/Failed/Done) + retry.

### 5.2 Observabilidad

* Logging por job + correlation id.
* Métricas: tiempo por job, ratio fallos, costo estimado por ejecución.

### 5.3 Seguridad y permisos

* RBAC real (backend enforced) + scope workspace/client/month.

---

## 6) Epics + historias (cola de tareas)

> Nota: cada Epic incluye entregable claro + criterios de aceptación.

---

### EPIC A — Feedback Loop & Versionado de Contenido (prioridad máxima)

**Objetivo:** convertir “generar” en un ciclo de mejora rápido y trazable.

**Historias/Tareas:**

1. Modelo de datos para comentarios y versiones

   * `ContentPieceVersion` (snapshot del copy/metadata)
   * `Comment` (target: pieza o bloque)
   * `ChangeRequest` (status, assignee, due?)

2. Estados de pieza (workflow)

* DRAFT → IN_REVIEW → CHANGES_REQUESTED → APPROVED → (PUBLISHED opcional)

3. UI de feedback en Admin + Portal

* Comentarios por pieza
* Vista diff entre versiones

4. Acción: **Apply feedback & regenerate**

* Seleccionar feedback pendiente
* Ejecutar pipeline de “rewrite” con constraints (mantener claims aprobados)
* Crear nueva versión + mantener historial

**Criterios de aceptación:**

* Se puede pedir cambios, comentar y regenerar sin perder historial.
* Cada regeneración crea una versión.

---

### EPIC B — Brand Governance (QA + reglas + evidencia)

**Objetivo:** subir consistencia y reducir alucinación/riesgo.

**Historias/Tareas:**

1. Brand Kit V1.5 (estructura)

* Voz/tono + pilares + “do/don’t”
* Palabras prohibidas/obligatorias
* Claim policies: permitido / requiere disclaimer / prohibido
* Estilo por red (LinkedIn/IG/X): largo, hashtags, CTA

2. Brand QA service

* Función que evalúe cada pieza y genere:

  * `qualityScore` (0–100)
  * lista de violaciones
  * sugerencias de corrección

3. Evidence/citations desde KB

* Si una pieza menciona producto/beneficio/precio/estadística:

  * debe incluir “sourceNote” o referencia a KB item

4. UI: panel “QA” por pieza

* Mostrar score, violaciones, quick fixes

**Criterios de aceptación:**

* Ninguna pieza puede pasar a Approved si QA < umbral (configurable).
* El usuario puede ver por qué falla y regenerar para corregir.

---

### EPIC C — Roles, Permisos y Auditoría (RBAC)

**Objetivo:** enterprise-lite y confianza para agencias.

**Historias/Tareas:**

1. Roles y permisos

* Admin, Manager, Creator, Reviewer, Client
* Matriz de permisos por recurso

2. Enforcement backend

* Middleware + políticas por endpoint

3. Audit log

* Evento + actor + payload mínimo
* UI “Activity” por cliente/mes

**Criterios de aceptación:**

* Un Client no puede ver Admin UI.
* Audit log registra generate/edit/approve/reject/export.

---

### EPIC D — Portal Cliente “Delight”

**Objetivo:** approvals sin fricción, experiencia simple y premium.

**Historias/Tareas:**

1. Vistas principales

* Mes: calendario + lista piezas
* Detalle pieza: preview + comentarios + aprobar/rechazar

2. Notificaciones

* Email / in-app (mínimo) al pedir aprobación o cambios

3. Branding del portal

* Logo/colores del cliente (opcional)

**Criterios de aceptación:**

* Un cliente puede aprobar un mes entero sin entrenamiento.

---

### EPIC E — Exportables (PDF/ZIP + naming convención)

**Objetivo:** valor tangible inmediato, incluso sin scheduling.

**Historias/Tareas:**

1. PDF generator

* Portada (cliente/mes)
* Calendario
* Piezas (copy + variantes + notas)

2. ZIP generator

* Carpeta por semana/día
* `YYYY-MM-DD_platform_pieceName.txt`
* Assets y prompts

3. UI Export

* Botón export mes
* Estado de job (queue)

**Criterios de aceptación:**

* Export reproducible y ordenado.
* El cliente entiende qué publicar y cuándo.

---

### EPIC F — Cola de trabajos (BullMQ/Redis) + estados en UI

**Objetivo:** estabilidad, escalabilidad y UX confiable.

**Historias/Tareas:**

1. Infra de Redis + BullMQ
2. Job types: generateStrategy, generateCalendar, generatePieces, regeneratePiece, exportPDF, exportZIP
3. UI: job status + retry + logs resumidos

**Criterios de aceptación:**

* Generaciones largas no bloquean requests.
* Errores son visibles y recuperables.

---

### EPIC G — Librería & Editor de Skills (producto)

**Objetivo:** convertir arquitectura en ventaja competitiva.

**Historias/Tareas:**

1. Skill Library por vertical

* Plantillas: real estate, salud, gastronomía, ecommerce, servicios

2. Versionado de skills

* `SkillVersion` + changelog

3. Skill Editor mínimo

* Editar prompt + parámetros + variables
* Validación + “test run”

4. Métricas por skill

* % aprobación, QA promedio, retrabajo, costo

**Criterios de aceptación:**

* Se puede mejorar una skill sin tocar código (mínimo viable).

---

### EPIC H — Variantes + Repurpose multi-plataforma

**Objetivo:** aumentar output sin perder coherencia.

**Historias/Tareas:**

1. Variantes por pieza

* 3 intenciones: educativa, autoridad, conversión

2. Repurpose engine

* 1 idea → IG caption + LinkedIn post + X thread

3. UI de variantes

* Elegir una variante como “primary”

**Criterios de aceptación:**

* Variantes útiles, no “paráfrasis”.

---

## 7) Orden recomendado de ejecución (cola)

1. EPIC F (Queue) — habilita el resto con estabilidad.
2. EPIC A (Feedback + Versionado) — switching feature #1.
3. EPIC B (Brand QA + evidencia) — moat de calidad.
4. EPIC C (RBAC + auditoría) — confianza + multi-usuario.
5. EPIC D (Portal cliente) — reduce fricción y aumenta retención.
6. EPIC E (Exportables) — valor tangible inmediato.
7. EPIC H (Variantes/Repurpose) — multiplicador de output.
8. EPIC G (Skill editor/library) — escalabilidad comercial.

---

## 8) Requisitos técnicos de implementación (checklist)

* Mantener `schema.prisma` como source of truth.
* Migraciones claras (Prisma migrate).
* Endpoints idempotentes para jobs.
* Estado de jobs persistido en DB (`JobRun` table opcional, recomendado).
* Feature flags para activar nuevos flujos por workspace.

---

## 9) Definiciones (para alinear equipo)

* **ContentPieceVersion:** snapshot inmutable del contenido en un momento.
* **QA Score:** puntaje + reglas; gate de aprobación.
* **Apply feedback:** toma comentarios/requests y regenera con constraints.
* **Evidence:** referencia a KB item cuando hay claims de producto.

---

## 10) Riesgos y mitigaciones

* **Riesgo:** outputs mediocres → se percibe como “otra IA”.

  * Mitigación: QA + feedback loop + skills por vertical.

* **Riesgo:** alucinaciones o claims erróneos.

  * Mitigación: evidence/citations + policies + bloqueos.

* **Riesgo:** complejidad V1 sin estabilidad.

  * Mitigación: queue + observabilidad desde el inicio.

---

## 11) Entregables esperados por el agente (definition of done)

* Backlog convertido en tickets (por Epic) con:

  * Descripción
  * Criterios de aceptación
  * Dependencias
  * Estimación (T-shirt o story points)
  * Checklist de QA
* Propuesta de cambios al schema Prisma.
* Plan de endpoints y UI screens.

---

## 12) Mensaje final para el agente

> “No estamos haciendo un MVP minimalista. Estamos construyendo una V1 ambiciosa donde el diferencial es: **calidad gobernada + feedback loop rápido + experiencia cliente impecable + trazabilidad**. El sistema de Skills debe convertirse en producto: librería, versionado, métricas y editor.”
