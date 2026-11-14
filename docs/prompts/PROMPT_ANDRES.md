# PROMPT — ANDRÉS (integrador · `feature/app-layout` y `feature/Andres`)

> Copia todo lo que está debajo de la línea y pégalo en Antigravity/Codex.
> Requisito previo: `docs/PLAN_FUNCIONAL.md` ya está en tu rama (si no, créalo con el contenido del plan, commit `docs(andres): plan funcional`).

---

## ROL Y CONTEXTO

Eres mi ingeniero de software senior en **ReactivA**, una plataforma educativa de química hecha con **Angular 21 (standalone, zoneless, SSR con Express)**. El código está en `ReactivA/` dentro del repo. La maquetación ya está terminada; ahora hay que volverla **funcional y lista para producción**. Somos tres personas con ramas separadas: yo soy **Andrés** (integrador y dueño de `feature/app-layout`, `feature/Andres`, `develop` y `main`). Vanessa y Valeria trabajan en sus ramas con sus propios prompts.

**Antes de escribir una línea de código:**
1. Lee completo `docs/PLAN_FUNCIONAL.md` (diagnóstico, decisiones §2, orden §3, rutas §4, datos §5, contrato de servicios §6, reglas §7). Es la fuente de verdad.
2. Lee `CONTRIBUTING.md`, `README.md` y `docs/pull-requests/andres.md` (formato de PR).
3. Lee `docs/avance/andres.md`. Si no existe, créalo con la lista de tareas de abajo en casillas `[ ]`. **Retoma siempre desde la primera casilla sin marcar.** Actualiza el archivo al terminar cada tarea.
4. Antes de programar, dime en 10 líneas tu plan y qué pasos manuales necesito hacer yo (ver «Pasos manuales míos»). Espera mi confirmación solo si hay una decisión que no esté en el plan.

## MIS COMPONENTES Y FASES

Trabajo en **tres fases, en este orden**. No empieces una sin cerrar la anterior.

### FASE 0 — Cimientos (rama `feature/app-layout`)
Todo lo que Vanessa y Valeria necesitan para empezar. Es lo más importante: sin esto ellas no avanzan.

**0.1 Dependencias y entorno**
- Agregar `@supabase/supabase-js` (única dependencia nueva; solo yo toco `package.json`).
- Crear `src/environments/environment.ts` y `environment.development.ts` con `supabaseUrl` y `supabaseAnonKey` como **placeholders**, y configurar `fileReplacements` en `angular.json`. No commitear claves reales.
- Documentar en el README las variables necesarias.

**0.2 Núcleo `src/app/core/`** (estructura exacta del plan §6)
- `supabase/supabase.client.ts`: cliente creado solo en navegador (`isPlatformBrowser`), con `persistSession` y almacenamiento configurable para soportar «Recordarme» (si está desactivado, la sesión usa almacenamiento de sesión).
- `models/`: `Role`, `UserProfile`, `ModuleKey`, `Classroom`, `NewClassroom`, `ClassroomMember`, `LearningEvent`, `UserPreferences` (mueve aquí el tipo existente de settings **sin romper** el import actual: re-exporta desde el archivo viejo si hace falta).
- `auth/auth.service.ts`: implementación **completa** del contrato del plan §6 (signals `user`, `isAuthenticated`, `role`, `ready`; `signUp`, `signIn`, `signOut`, `requestPasswordReset`, `updatePassword`, `updateProfile`, `signOutOthers`, `homeFor`). `AuthError` con códigos estables y mensajes en español. Escuchar `onAuthStateChange`: ante `SIGNED_OUT` limpiar caché y navegar a `/login` con `replaceUrl`. `signIn` valida `expectedRole` y lanza `role_mismatch` si la cuenta es de otro rol (con el selector de rol del login).
- `auth/auth.guard.ts`: `authGuard`, `guestGuard`, `roleGuard(role)` (funciones, no clases). Reglas exactas de la matriz del plan §4. `authGuard` guarda `returnUrl` (validar que sea ruta interna). En servidor no bloquean (`isPlatformBrowser`).
- `services/learning-events.service.ts`: implementación completa de `record()` (fire-and-forget, resuelve `classroom_id` del estudiante, nunca lanza).
- `services/classroom.service.ts` y `services/settings.service.ts`: **solo interfaz + esqueleto** (`throw new Error('No implementado: lo implementa Vanessa/Valeria')`; `SettingsService.init()` no-op). Así ellas importan tipos reales desde el primer día.

**0.3 Base de datos**
- `supabase/migrations/<timestamp>_core.sql` con las tablas marcadas «Andrés (Fase 0)» del plan §5, trigger de creación de perfil + `student_progress`, validación de `teacher_invite_codes` para rol docente, función `is_teacher_of(student uuid)` (devuelve false mientras `classroom_members` no exista — Vanessa la completa; deja un comentario claro), y **RLS en todas las tablas** según §5.
- Un `supabase/README.md` con orden de migraciones y cómo aplicarlas (SQL editor o CLI).

**0.4 Rutas, layout y SSR**
- `app.routes.ts`: aplicar guards según la matriz del plan §4, `data: { layout: 'public' | 'app' | 'bare' }` en cada ruta. Mantener lazy loading, el redirect `/tabla-periodica` y `**` → `/home`. No eliminar rutas.
- `app.ts` / `app.html`: reemplazar `isAuthPage()` (comparación de strings de URL) por lectura de `data.layout` de la ruta activa. Mantener `isLoginPage()` solo si algo aún lo usa. Llamar `settingsService.init()` al arrancar.
- `app.config.ts`: `provideAppInitializer` que restaura la sesión **antes** de la primera navegación (sin parpadeo de login al refrescar).
- `app.routes.server.ts`: `Prerender` para `home`, `login`, `register`; `RenderMode.Client` para el resto.

**0.5 Entrega de Fase 0**
- Pruebas unitarias de `AuthService` (con cliente falso) y de los tres guards (todos los casos de la matriz).
- Los 5 comandos de validación del plan §9 en verde.
- `docs/pull-requests/andres.md` actualizado. Commit `feat(routes): …`/`feat(andres): …` y **PR a `develop`**. Avisarme cuándo está lista para que Vanessa y Valeria arranquen.

### FASE 1 y 2 — Mis componentes (rama `feature/Andres`)
Parte de `develop` ya con la Fase 0. Mis 4 componentes: **dashboard, periodic-table, home, challenges**.

**PR-A1 · StudentProgressService + home + dashboard**
- `dashboard/student-progress.service.ts`: migrar de `localStorage` a Supabase con el **patrón del plan §2.3** (caché síncrona + escritura asíncrona; `hydrate()` y `reset()`). **No cambiar firmas existentes**: `home`, `challenges`, `periodic-table`, `game.service` y `teacher-dashboard.service` dependen de ellas. `getProfile()` sale de `AuthService.user()`. Añadir `getModuleProgress/saveModuleProgress`. `AuthService` llama `hydrate()` tras iniciar/restaurar sesión y `reset()` en logout.
- Racha: calcular `streakDays` con `lastActiveDate` real (suma 1 si el último día activo fue ayer, reinicia si faltó más de un día).
- Eliminar defaults inventados («Científico», 4850 XP, nivel 14, racha 5, `estudiante@reactiva.edu.co`): un estudiante nuevo empieza en nivel 1, 0 XP, racha 0.
- `home`: eliminar la lectura de `currentUser`/`reactiva_user`; usar `AuthService`. Sin sesión → botones «Iniciar sesión / Registrarse»; con sesión → «Ir a mi panel» según rol. Enlaces a módulos protegidos sin sesión llevan a login con `returnUrl`.
- `dashboard`: saludo con el nombre real; `onGradeChange` actualiza el perfil real (`AuthService.updateProfile`); progreso de las unidades (`topics[].progress`) calculado desde `module_progress`/eventos reales, no números fijos (75/40/0); tareas diarias persistidas por usuario y reinicio diario correcto; si el aula tiene `assignments`, mostrarlos con los estilos de tarjetas ya existentes (si Vanessa aún no lo publicó, dejar el hook preparado y anotarlo en «Requiere de otros»). Cada acción de XP llama `LearningEventsService.record(...)`.
- Actualizar `dashboard.spec.ts` con dobles de `AuthService`.

**PR-A2 · periodic-table + challenges (+ ranking)**
- `periodic-table`: elementos explorados y récords de Memory (`reactiva_memory_best_*`) pasan a `module_progress` vía `StudentProgressService`; cada elemento nuevo explorado y cada victoria de Memory registran evento y XP. Quitar claves de `localStorage`.
- `challenges`: estado de retos por usuario (`student_challenges`), reclamar recompensa suma XP real e inserta evento; trofeos desde `student_badges`; **leaderboards reales** con RPC `get_leaderboard('class'|'school')` (migración propia en `supabase/migrations/`; solo nombre visible, nivel y XP; respetar `profileVisibility` de settings: `private` no aparece). Resaltar al usuario actual. Pestaña «Top Nacional»: si no hay datos reales, ocultarla o deshabilitarla con «Próximamente» en vez de mostrar datos falsos. Los textos fijos de temporada/torneo/reloj regresivo: si no hay fuente real, deben salir de una constante de configuración clara y no simular datos de usuarios.
- Estados de carga/vacío/error en ambos componentes.

### FASE 4 — Integración y producción (rama `feature/app-layout`, luego `develop → main`)
Solo cuando Vanessa y Valeria tengan todo en `develop`:
1. Auditar que **no queden** `localStorage` de datos, `reactiva_*`, `currentUser`, nombres/cifras inventados (`grep` en todo `src/`).
2. Probar de punta a punta todos los puntos de la lista manual del plan §9 y corregir lo que falle en mi alcance; lo ajeno, reportarlo en un issue/nota para su dueña.
3. Auditoría RLS tabla por tabla con 2 estudiantes + 2 docentes.
4. Checklist de producción del plan §10 completo (environments, `Cache-Control: no-store` en privadas desde `server.ts`, README real, despliegue, `CONTRIBUTING.md` sin «Límites actuales»).
5. PR `develop → main` con resumen de qué se probó.

## PASOS MANUALES MÍOS (pídemelos explícitamente cuando los necesites; no los inventes)
Crear proyectos Supabase dev/prod, invitar a Vanessa y Valeria, configurar URLs de Auth y confirmación de correo, crear códigos de invitación docente, compartir claves por canal privado, aplicar migraciones a prod. Detalle en plan §8.

## LÍMITES DE ESTE TRABAJO
- No edites componentes de Vanessa ni de Valeria (login, register, organic-mission, settings, teacher-dashboard, sidebar, virtual-lab, profile, help, my-classrooms). Si algo en ellos bloquea, anótalo en «Requiere de otros» del PR.
- No cambies el diseño maquetado. Solo estados mínimos nuevos.
- No push, no force push, no rebase de historia compartida. Commits con mi identidad (`git var GIT_AUTHOR_IDENT`).
- Nunca pongas `service_role` ni claves reales en el repo.

## DEFINICIÓN DE TERMINADO (por cada PR)
- [ ] Los 5 comandos del plan §9 pasan.
- [ ] Pruebas nuevas de la lógica añadida; las 26 existentes siguen en verde.
- [ ] Flujos manuales relevantes del plan §9 probados.
- [ ] `docs/avance/andres.md` y `docs/pull-requests/andres.md` actualizados.
- [ ] Resumen final: qué se hizo, qué migraciones debo aplicar, qué falta de otros.
