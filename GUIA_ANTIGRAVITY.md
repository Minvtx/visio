# 🚀 Guía para Construir Content Studio AI con Antigravity

> Instructivo paso a paso para aprovechar al máximo las herramientas del agente.

---

## 1. PREPARACIÓN INICIAL

### 1.1 Estructura del Proyecto
Antes de empezar, crea la carpeta base y abre VS Code:

```powershell
# En tu terminal (o pídeme que lo haga)
mkdir C:\Users\kk\Desktop\ContentStudio
cd C:\Users\kk\Desktop\ContentStudio
code .
```

### 1.2 Archivo de Especificación
Ten siempre abierto `CONTENT_STUDIO_AI_SPEC.md` como referencia. Puedo leerlo cuando necesite contexto.

---

## 2. FASES DE DESARROLLO

### FASE 1: Setup Inicial
**Prompt sugerido:**
```
Inicializa el proyecto Content Studio siguiendo la spec en CONTENT_STUDIO_AI_SPEC.md:
1. Crea el monorepo con Turborepo
2. Setup Next.js en apps/web
3. Configura Prisma con el schema de la spec
4. Instala dependencias UI (Radix, Tailwind, Lucide)
```

**Herramientas que usaré:**
- `run_command` → Ejecutar npm/pnpm commands
- `write_to_file` → Crear archivos de config
- `replace_file_content` → Modificar configs existentes

---

### FASE 2: Base de Datos
**Prompt sugerido:**
```
Configura la base de datos:
1. Copia el Prisma schema de la spec
2. Configura la conexión a PostgreSQL local
3. Genera el cliente Prisma
4. Crea seeds para datos de prueba
```

**Herramientas que usaré:**
- `write_to_file` → schema.prisma, seed.ts
- `run_command` → prisma generate, prisma db push

---

### FASE 3: Skills System
**Prompt sugerido:**
```
Implementa el sistema de Skills:
1. Crea el Skill Registry en packages/skills
2. Implementa las 3 skills core: brand_snapshot, hook_variants, caption_long
3. Crea el invocador que conecta con Claude API
4. Agrega logging de GenerationRuns
```

**Herramientas que usaré:**
- `write_to_file` → Archivos de skills
- `view_file` → Revisar spec para schemas
- `grep_search` → Buscar referencias en el código

---

### FASE 4: API Endpoints
**Prompt sugerido:**
```
Crea los endpoints de la API:
1. Auth (login, register, me)
2. CRUD Clients con BrandKit
3. Content Months + Pieces
4. Endpoint de generación
5. Exports
```

**Herramientas que usaré:**
- `write_to_file` → Route handlers
- `view_code_item` → Revisar tipos existentes
- `run_command` → Probar endpoints

---

### FASE 5: UI Admin
**Prompt sugerido:**
```
Construye las pantallas del Admin Dashboard:
1. Layout base (Sidebar, TopBar, Inspector)
2. Dashboard con stats
3. Lista de Clients
4. Editor de Content Month (Calendar view)

Usa la estética moderna descrita en la spec: glassmorphism, gradientes, dark mode.
```

**Herramientas que usaré:**
- `write_to_file` → Componentes React
- `generate_image` → Mockups de referencia
- `browser_subagent` → Preview en vivo

---

### FASE 6: Portal Cliente
**Prompt sugerido:**
```
Crea el Portal Cliente simplificado:
1. Layout minimalista
2. Vista de "Mi Contenido" con cards
3. Botones grandes de Aprobar/Descargar
4. Sin jerga técnica, máximo 3 clicks

Recuerda: usuarios no técnicos, debe ser extremadamente fácil de usar.
```

---

### FASE 7: Testing & Polish
**Prompt sugerido:**
```
Verifica el proyecto:
1. Prueba el flujo completo: crear client → generar mes → aprobar → exportar
2. Revisa responsive en móvil
3. Optimiza performance
4. Documenta cómo deployar
```

**Herramientas que usaré:**
- `browser_subagent` → Testing visual
- `run_command` → Build, lint, tests
- `write_to_file` → README, docs

---

## 3. COMANDOS ÚTILES PARA MÍ

### Pedirme que Investigue
```
"Investiga cómo implementar [X] usando las mejores prácticas de 2026"
```
→ Usaré `search_web` para encontrar documentación actualizada

### Pedirme que Diseñe
```
"Genera un mockup del dashboard principal"
```
→ Usaré `generate_image` para crear referencias visuales

### Pedirme que Pruebe
```
"Abre el navegador y prueba el flujo de login"
```
→ Usaré `browser_subagent` para interactuar con la app

### Pedirme que Refactorice
```
"Revisa el código de [archivo] y mejóralo"
```
→ Usaré `view_file` + `replace_file_content` para optimizar

---

## 4. TIPS PARA PROMPTS EFECTIVOS

### ✅ Sé Específico
```
❌ "Haz el frontend"
✅ "Crea el componente ClientCard.tsx con: avatar, nombre, industria, 
    badge de estado, y botón de acciones. Usa Radix UI + Tailwind."
```

### ✅ Referencia la Spec
```
✅ "Implementa el endpoint POST /api/months/:id/generate 
    siguiendo el pipeline de la sección 4.2 de la spec"
```

### ✅ Indica el Contexto
```
✅ "Estoy en la fase de Skills. Ya tengo Prisma configurado. 
    Ahora necesito el registry de skills."
```

### ✅ Pide Validación
```
✅ "Después de crear el componente, abre el navegador y 
    verifica que se renderiza correctamente"
```

---

## 5. SECUENCIA DE ARRANQUE RECOMENDADA

```
SESIÓN 1 (2-3 horas)
├── Setup monorepo + Next.js
├── Prisma schema + DB
└── Auth básica

SESIÓN 2 (2-3 horas)
├── Skills Registry
├── 3 Skills core
└── Endpoint generate básico

SESIÓN 3 (3-4 horas)
├── UI Admin: Layout + Dashboard
├── CRUD Clients
└── Calendar view

SESIÓN 4 (2-3 horas)
├── Portal Cliente completo
└── Exports

SESIÓN 5 (2 horas)
├── Testing E2E
├── Polish UI
└── Deploy docs
```

---

## 6. PRIMER COMANDO PARA EMPEZAR

Cuando estés listo, simplemente escribe:

```
Vamos a empezar con la Fase 1: Setup Inicial.
Crea el proyecto Content Studio siguiendo la estructura 
de la spec CONTENT_STUDIO_AI_SPEC.md.
```

¡Y arrancamos! 🎯
