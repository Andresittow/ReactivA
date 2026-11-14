# PROMPT — VANESSA (`feature/Vanessa`)

> Copia todo lo que está debajo de la línea y pégalo en Antigravity/Codex.
> Requisitos previos: (1) `docs/PLAN_FUNCIONAL.md` ya está en `develop`; (2) Andrés avisó que la **Fase 0** (core, guards, layout, SQL base) está en `develop`. Si no, **no programes todavía**: solo lee y prepara.

---

## ROL Y CONTEXTO

Eres mi ingeniero de software senior en **ReactivA**, plataforma educativa de química hecha con **Angular 21 (standalone, zoneless, SSR)**. El código está en `ReactivA/`. La maquetación está terminada; ahora hay que volverla **funcional y lista para producción**. Somos tres personas con ramas separadas. Yo soy **Vanessa** y trabajo en `feature/Vanessa` con 5 componentes: **sidebar, virtual-lab, profile, help y my-classrooms**. Andrés (integrador) hace el núcleo (`core/`, auth, guards) y dashboard/periodic-table/home/challenges; Valeria hace login/register/organic-mission/settings/teacher-dashboard.

**Antes de escribir código:**
1. Lee completo `docs/PLAN_FUNCIONAL.md`. Es la fuente de verdad (decisiones §2, orden §3, rutas §4, datos §5, contrato de servicios §6, reglas §7).
2. Lee `CONTRIBUTING.md` y `docs/pull-requests/vanessa.md` (formato de PR).
3. Lee en `src/app/core/` lo que dejó Andrés: `AuthService`, guards, `LearningEventsService`, modelos, y las interfaces de `ClassroomService`.
4. Lee `docs/avance/vanessa.md`. Si no existe, créalo con las tareas de abajo en casillas `[ ]`. **Retoma siempre desde la primera casilla sin marcar** y actualízalo al terminar cada tarea.
5. Dime tu plan en 10 líneas antes de programar.

## DEPENDENCIAS ENTRE PERSONAS (importante)
- **De Andrés recibes:** `AuthService`, guards, `LearningEventsService`, `StudentProgressService` (con `addXp`, `getModuleProgress/saveModuleProgress`), migración base. Úsalos; no los reimplementes.
- **Tú entregas a Valeria:** `ClassroomService` implementado (PR-V1) y `MyClassroomsComponent` con `@Input() embedded` (PR-V2). Valeria lo usa en `teacher-dashboard` y en el PIN del login/register. **Por eso PR-V1 es tu prioridad nº 1 y debe salir pronto.**

## TAREAS (en este orden)

### PR-V1 · `ClassroomService` + `sidebar`  (rama `feature/Vanessa`)

**1. `core/services/classroom.service.ts` — implementar el contrato del plan §6**
- Migración propia `supabase/migrations/<timestamp>_classrooms.sql`: tablas `classrooms` y `classroom_members`, RLS (docente dueño gestiona su aula; estudiante solo ve aulas donde es miembro), RPC `join_classroom(pin)` (security definer; valida PIN, cupo y que no sea miembro; el estudiante solo puede estar en un aula activa a la vez — si ya tiene una, `already_member`), RPC `regenerate_pin(classroom_id)` (solo dueño), generación de PIN único legible (formato similar al actual `CHEM-1234`), y **completar `is_teacher_of(student)`** que dejó Andrés (ahora sí con `classroom_members`). Aplica la migración en el proyecto dev.
- Métodos: `listMine`, `create`, `update`, `remove`, `regeneratePin`, `listMembers` (incluye nombre, nota/estado derivados del progreso real cuando exista; si no, «Sin actividad»), `joinByPin`, `getMyClassroom`, `leave`. Errores con códigos estables (`invalid_pin`, `already_member`, `classroom_full`, `not_owner`) y mensaje en español.
- Pruebas unitarias del servicio con cliente falso.

**2. `sidebar`** (global, para estudiantes y para docentes en `/my-classrooms`, `/settings`, `/help`)
- Menú **según rol** usando `AuthService.role()`:
  - Estudiante: lo actual (Dashboard, Periodic Table, Virtual Lab, Organic Mission, Challenges, Profile) + Settings y Help.
  - Docente: «Panel docente» (`/teacher-dashboard`), «Mis aulas» (`/my-classrooms`) + Settings y Help.
- **Corregir rutas:** `'/tabla-periodica'` → `'/periodic-table'` (hoy depende de un redirect y rompe `routerLinkActive`).
- Tarjeta de usuario (nombre y rol reales desde `AuthService.user()`) y **botón «Cerrar sesión»** que llama `AuthService.signOut()`. Funciona colapsado (icono con `title`/`aria-label`).
- Estado colapsado persistido solo como preferencia de UI (`localStorage` permitido únicamente para esto).
- Accesibilidad básica: `aria-current` en el enlace activo, foco visible.
- Actualizar/crear su spec.

### PR-V2 · `my-classrooms`, `profile`, `virtual-lab`, `help`

**3. `my-classrooms`** (UI canónica de aulas)
- Reemplazar los datos de ejemplo y el estado local por `ClassroomService`: listar, crear (modal «Crear aula»), editar/eliminar, ver estudiantes del aula (miembros reales), regenerar y copiar el PIN, búsqueda y filtros (`all|10|11|stem`) sobre datos reales.
- **«Asignar taller»:** migración propia `assignments` + `ClassroomService.assignWorkshop`. Que el estudiante pueda verlo lo conecta Andrés en el dashboard; tú solo dejas la tabla y el servicio funcionando.
- Añadir `@Input() embedded = false`. Con `embedded = true` no renderiza su propia cabecera/chrome de página (solo el contenido) para que Valeria lo incruste en `teacher-dashboard` sin duplicar. Cambiar el modelo `ClassroomGroup` por los tipos de `core/models`. Mantener `OnPush` + signals/`markForCheck`.
- Estados: cargando, vacío («Aún no tienes aulas — crea la primera»), error con reintentar. Validación de formulario (nombre obligatorio, cupo 1–60, horario/ubicación con longitud máxima), sin duplicar nombres de aula del mismo docente.
- Confirmación antes de eliminar un aula.

**4. `profile`** (solo estudiante)
- Eliminar datos fijos (nombre «Valeria Góngora», correo). Mostrar `AuthService.user()` + `StudentProgressService` (XP, nivel, racha, insignias) + historial real (eventos propios de `learning_events`). Métricas o secciones que no tengan fuente real (rúbricas, evaluaciones de práctica del profesor) deben mostrarse **vacías con mensaje honesto**, no con datos inventados, salvo que exista fuente en el plan.
- `saveProfile()` → `AuthService.updateProfile` (nombre, grado, colegio); avatar: subir a Supabase Storage (bucket `avatars`, política: cada usuario solo escribe en su carpeta; crea el bucket y política en tu migración) o, si no alcanzas, guardar solo iniciales y anotarlo como pendiente. Validar tipo (`image/*`) y tamaño (≤ 2 MB).
- Sección **«Mi aula»**: si no pertenece a ninguna, campo para ingresar PIN → `joinByPin`; si pertenece, nombre del aula + docente + botón «Salir del aula» (con confirmación).
- `downloadReportPdf()`: que descargue un reporte con los datos reales (sin dependencias nuevas; si hoy ya genera algo, mantenerlo pero con datos reales).

**5. `virtual-lab`**
- `totalLabScore = 150` es local. Hacerlo real: el XP de ecuaciones balanceadas y experimentos se suma con `StudentProgressService.addXp()` y se registra con `LearningEventsService.record({ module: 'virtual-lab', ... })`. El progreso del módulo (ejercicios resueltos, experimentos realizados) se guarda con `saveModuleProgress('virtual-lab', …)` y se restaura al volver. Evitar XP duplicado por repetir el mismo ejercicio (decide la regla —p. ej. XP solo la primera vez— y documéntala en el PR).
- Conservar toda la lógica visual y de simulación existente; solo cambia el origen/destino de los datos.

**6. `help`**
- Verificar que **todos** los enlaces y botones del Centro de Ayuda hagan algo real. Si hay (o falta) un formulario de contacto/soporte: guardarlo en `help_requests` (migración propia, RLS: el usuario inserta y lee los suyos) con validación y confirmación al usuario. Si no hay formulario en la maqueta, añadir uno mínimo reutilizando estilos existentes. El buscador de FAQ debe filtrar de verdad.

## LÍMITES
- Solo tus 5 componentes + `core/services/classroom.service.ts` + tus migraciones + tus specs. **No edites** `teacher-dashboard` (Valeria), `dashboard`/`challenges`/`home`/`periodic-table`/`core/auth` (Andrés), `package.json`. Si necesitas un cambio ahí, ponlo en «Requiere de otros» del PR.
- No cambies el diseño. Solo estados mínimos nuevos con estilos existentes.
- SSR-safe (`isPlatformBrowser`), sin datos inventados, sin `localStorage` para datos (plan §2.4 y §7).
- No push sin mi autorización; no force push; no rebase. Commits `feat(vanessa): …` / `fix(vanessa): …` con mi identidad.

## DEFINICIÓN DE TERMINADO (por cada PR)
- [ ] `npm exec tsc -- --noEmit -p tsconfig.app.json`, `… tsconfig.spec.json`, `npm test -- --watch=false`, `npm run build` en verde.
- [ ] Pruebas nuevas; las existentes siguen pasando.
- [ ] Probado a mano: crear aula → copiar PIN → (con otra cuenta de estudiante) unirse con PIN → aparece en «Ver estudiantes»; logout desde el sidebar → «Atrás» no deja ver pantallas privadas.
- [ ] RLS probada con dos docentes: uno no ve ni edita aulas del otro.
- [ ] Migraciones nuevas listadas en el PR con el orden de aplicación.
- [ ] `docs/avance/vanessa.md` y `docs/pull-requests/vanessa.md` actualizados.
- [ ] Resumen final: qué hiciste, qué migraciones aplicar, qué esperas de Andrés/Valeria.
