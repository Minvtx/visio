# 🧪 CHECKLIST DE PRUEBA — Visio Content Studio

> Fecha: 10 de febrero de 2026
> Objetivo: Validar todos los flujos antes de dar acceso a usuarios de prueba

---

## 🔧 Pre-requisitos (hacer una sola vez)

- [ ] **Variables de entorno**: Verificar que `.env` tenga:
  - `DATABASE_URL` apuntando a Supabase
  - `NEXTAUTH_SECRET` con un string seguro
  - `NEXTAUTH_URL` correcto (localhost para dev, dominio para prod)
  - `ANTHROPIC_API_KEY` con una key válida (para el tier FREE)
- [ ] **Base de datos sincronizada**: Correr `npx prisma db push`
- [ ] **Seed usuarios de prueba**: Correr `npx tsx scripts/seed-users.ts`
- [ ] **Verificar deploy en Vercel** (si aplica): Push a main y verificar que buildea

---

## ✅ Flujo 1: Registro y Onboarding (usuario nuevo)

| # | Paso | Resultado Esperado | ✓ |
|---|------|-------------------|---|
| 1.1 | Abrir `/` (landing page) | Se ve la landing con "Empezar Gratis" y "Iniciar Sesión" | ☐ |
| 1.2 | Click "Empezar Gratis" → `/register` | Se ve el formulario de registro | ☐ |
| 1.3 | Registrar con email+password+nombre+agencia | Se crea la cuenta y redirige a `/admin` | ☐ |
| 1.4 | Verificar que se creó workspace automático | En `/admin/settings` aparece el nombre de agencia | ☐ |
| 1.5 | Cerrar sesión y volver a loguearse | Login con las credenciales funciona | ☐ |

### Bugs conocidos corregidos:
- ✅ `/register` antes estaba bloqueado por el middleware (arreglado)

---

## ✅ Flujo 2: Configuración del Workspace

| # | Paso | Resultado Esperado | ✓ |
|---|------|-------------------|---|
| 2.1 | Ir a `/admin/settings` | Se ve la config del workspace, plan FREE, campo API Key | ☐ |
| 2.2 | Verificar que muestra plan "Free" y "2 clientes máx" | Correcto | ☐ |
| 2.3 | Cambiar el nombre del workspace y guardar | Se updatema correctamente | ☐ |
| 2.4 | (Opcional) Ingresar API Key propia de Anthropic | Se guarda, muestra icono "Configurada" | ☐ |

---

## ✅ Flujo 3: Crear y Configurar un Cliente

| # | Paso | Resultado Esperado | ✓ |
|---|------|-------------------|---|
| 3.1 | Ir a `/admin/clients` | Lista vacía, botón "Nuevo Cliente" | ☐ |
| 3.2 | Crear cliente con nombre, slug, industria | Se crea y redirige al detalle del cliente | ☐ |
| 3.3 | Crear un 2do cliente | Funciona (límite es 2 en FREE) | ☐ |
| 3.4 | Intentar crear un 3er cliente | Muestra error de límite del plan | ☐ |
| 3.5 | Ir al detalle del cliente | Se ven pestañas: Overview, Brand Kit, Knowledge, Assets, Contenido | ☐ |
| 3.6 | Editar Brand Kit (tono, personalidad, etc) | Se guardan los cambios | ☐ |
| 3.7 | Editar Knowledge Base (about, productos, audiencia) | Se guardan los cambios | ☐ |

---

## ✅ Flujo 4: Generar Contenido con IA (FLUJO CORE)

| # | Paso | Resultado Esperado | ✓ |
|---|------|-------------------|---|
| 4.1 | En el detalle del cliente, crear un mes de contenido | Aparece mes con status "PLANNING" | ☐ |
| 4.2 | Configurar el mes (objetivo, pilares, fechas relevantes) | Se guarda la config | ☐ |
| 4.3 | Click "Generar Contenido" | El status cambia a "GENERATING", se ve el Job Monitor | ☐ |
| 4.4 | Esperar la generación (~15-30 segundos) | Status cambia a "GENERATED", aparecen las piezas | ☐ |
| 4.5 | Verificar que se generaron piezas (POST, CAROUSEL, REEL, STORY) | Cada pieza tiene título, copy, hashtags, visual brief | ☐ |
| 4.6 | Abrir una pieza individual | Se ve el copy completo, hooks, hashtags, visual brief | ☐ |
| 4.7 | Aprobar una pieza | Status cambia a "APPROVED" | ☐ |
| 4.8 | Rechazar una pieza con feedback | Status cambia a "PENDING_REVIEW" | ☐ |

### ⚠️ Si la generación falla:
- Verificar que `ANTHROPIC_API_KEY` está en el `.env`
- Verificar en la consola del servidor si hay error de API key o de modelo
- Si dice modelo inválido → los archivos ya fueron corregidos, hacer rebuild

---

## ✅ Flujo 5: Mejoras Post-Generación (Skills individuales)

| # | Paso | Resultado Esperado | ✓ |
|---|------|-------------------|---|
| 5.1 | En una pieza, hacer click "Regenerar" | Se genera una versión nueva, diferente a la original | ☐ |
| 5.2 | Usar "Humanizar" en una pieza | El copy se reescribe más natural | ☐ |
| 5.3 | Usar "Mejorar" con opción (más corto/más punch/etc) | El copy se modifica según la opción | ☐ |
| 5.4 | Verificar que el historial de versiones funciona | Se puede ver y restaurar versiones anteriores | ☐ |

### Bugs conocidos corregidos:
- ✅ Las 4 funciones de improvement-skills usaban modelo inválido (arreglado)

---

## ✅ Flujo 6: Exportar Contenido

| # | Paso | Resultado Esperado | ✓ |
|---|------|-------------------|---|
| 6.1 | En un mes generado, click "Exportar → CSV" | Se descarga archivo CSV con todas las piezas | ☐ |
| 6.2 | Exportar → TXT | Se descarga archivo de texto legible | ☐ |
| 6.3 | Exportar → JSON | Se descarga JSON estructurado | ☐ |
| 6.4 | Abrir CSV en Google Sheets/Excel | Los datos se ven correctos y bien formateados | ☐ |

---

## ✅ Flujo 7: Portal del Cliente (lo que ve el cliente final)

| # | Paso | Resultado Esperado | ✓ |
|---|------|-------------------|---|
| 7.1 | Crear un usuario CLIENT asociado a un cliente | Se crea con rol CLIENT y clientId | ☐ |
| 7.2 | Loguearse con el usuario CLIENT | Redirige a `/portal` (no a /admin) | ☐ |
| 7.3 | Ir a `/portal/content` | Se ven las piezas del mes actual | ☐ |
| 7.4 | Aprobar una pieza desde el portal | Status cambia, se notifica al admin | ☐ |
| 7.5 | Enviar feedback en una pieza | El feedback queda grabado, admin lo ve | ☐ |
| 7.6 | Verificar que el progreso % se actualiza | La barra crece con cada aprobación | ☐ |
| 7.7 | Verificar que el CLIENT NO puede acceder a `/admin` | Redirige a `/portal` | ☐ |

---

## ✅ Flujo 8: Notificaciones

| # | Paso | Resultado Esperado | ✓ |
|---|------|-------------------|---|
| 8.1 | Ir a notificaciones (campana en el header admin) | Se ve lista de notificaciones | ☐ |
| 8.2 | Cuando el cliente aprueba una pieza desde el portal | Admin recibe notificación "Pieza Aprobada" | ☐ |
| 8.3 | Cuando el cliente aprueba TODAS las piezas | Admin recibe notificación "Mes Aprobado" | ☐ |

---

## 🔴 Bugs Conocidos Identificados (no bloqueantes para testing)

| Bug | Severidad | Estado |
|-----|-----------|--------|
| `notifyAdmins` no filtra por workspace (notifica a todos los admins) | Baja (MVP single-workspace) | Pendiente |
| Google OAuth no configurado (funciona solo login email) | Media (necesita credenciales Google) | Config pendiente |
| Botón "Upgrade" en settings no hace nada | Baja (no hay Stripe todavía) | Esperado |
| Google Calendar/Drive necesita OAuth tokens configurados | Baja (feature adicional) | Opcional |
| El `content-wizard-v2.ts` (pipeline) sigue como opción pero es 4x más caro | Info | Documentado |

---

## 📋 Datos de Prueba (seed-users.ts)

```
📧 admin@visio.app              | 🔑 Kx9#mPvL2q
📧 demo@visio.app               | 🔑 Nw4$jRtH8s
📧 agencia1@test.com            | 🔑 Bf7&zYcU3p
📧 agencia2@test.com            | 🔑 Qm2!xDnA9w
📧 agencia3@test.com            | 🔑 Ht5@kWbE6r
📧 agencia4@test.com            | 🔑 Jv8#pLsG1f
📧 agencia5@test.com            | 🔑 Uc3$tMhK7d
📧 agencia6@test.com            | 🔑 Zn6!wQyJ4m
📧 agencia7@test.com            | 🔑 Xa1@bFrN8v
📧 agencia8@test.com            | 🔑 Ry9#cGlP2s
```

> **Para crear un usuario CLIENT** (para probar el portal):
> Desde el admin, crear un usuario con rol CLIENT y asociarlo a un cliente existente.

---

## 🚀 Orden Recomendado de Testing

1. **Primero**: Flujos 1-2 (Registro + Settings) — Verificar que funcione el onboarding
2. **Segundo**: Flujo 3 (Crear cliente + Brand Kit) — Configurar correctamente para que la IA genere bien
3. **Tercero**: Flujo 4 (GENERAR CONTENIDO) — **El test más importante**
4. **Cuarto**: Flujo 5 (Mejoras) — Verificar que humanizar/regenerar funciona post-fix
5. **Quinto**: Flujo 6 (Exportar) — Validar los formatos de descarga
6. **Sexto**: Flujo 7 (Portal) — Probar la experiencia del cliente final
7. **Último**: Flujo 8 (Notificaciones) — Verificar que llegan las alertas

---

## ✏️ Notas Post-Testing

> Usar este espacio para anotar issues que surjan durante las pruebas:

**Issue 1:** _______________
**Issue 2:** _______________
**Issue 3:** _______________
