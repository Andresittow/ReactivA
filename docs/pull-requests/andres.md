# feat(andres): PR-A1 · StudentProgressService con Supabase, home y dashboard

Destino: `develop`. Origen: `feature/Andres`.

## Resumen del cambio
Implementación completa de **PR-A1** según `docs/PLAN_FUNCIONAL.md` (§2.3, §6):
1. **StudentProgressService (`dashboard/student-progress.service.ts`):**
   - Migración de `localStorage` a Supabase mediante el patrón «caché sincrónica + escritura asíncrona».
   - Firmas públicas existentes conservadas intactas (`getProfile`, `setProfileName`, `setProfileGrade`, `getGamificationState`, `addXp`, `getDashboardTasks`, `toggleDashboardTask`, `getChallengesState`, `progressChallenge`, `claimChallenge`, `getUnlockedBadges`, `unlockBadge`).
   - Métodos nuevos `hydrate(): Promise<void>` y `reset(): void`, con sincronización reactiva ante cambios de sesión.
   - Métodos nuevos `getModuleProgress<T>(module)` y `saveModuleProgress<T>(module, data)` sincronizados con la tabla `module_progress`.
   - Eliminación de datos mock por defecto: un estudiante nuevo arranca en 0 XP, Nivel 1 ("Iniciado en Química") y 0 días de racha.
   - Cálculo real de racha (`streakDays`) basado en la fecha de última actividad (`last_active_date`).
   - Limpieza automática de claves obsoletas de `localStorage` (`reactiva_*`, `currentUser`, `reactiva_user`).
2. **Ciclo de vida y sincronización de progreso en AuthService (`src/app/core/auth/auth.service.ts`):**
   - Contrato desacoplado `ProgressSyncHandler` / `PROGRESS_SYNC_HANDLER` para evitar dependencias circulares entre el Core y el Dashboard.
   - **`hydrate()`**: invocado explícitamente tras `signIn()` exitoso y al restaurar la sesión en `restoreSession()` (ejecutado en el bootstrap vía `provideAppInitializer`), además de reactivamente en `onAuthStateChange` (`SIGNED_IN`, `TOKEN_REFRESHED`).
   - **`reset()`**: invocado explícitamente en `signOut()` y ante el evento `SIGNED_OUT` en `onAuthStateChange` (así como defensivamente ante discrepancia de rol o sesión inválida).
   - Pruebas unitarias dedicadas en `src/app/core/auth/auth.service.spec.ts` validando estas 4 transiciones de sincronización.
3. **Modificación en archivo Core (`src/app/core/supabase/supabase.client.ts`):**
   - Se adaptó `ConfigurableAuthStorage` para capturar con bloques defensivos `try / catch` cualquier excepción de `localStorage` / `sessionStorage` (e.g. acceso denegado en modo incógnito, iframes restringidos o entornos virtuales de prueba como Vitest).
   - Se añadió stub de transporte `ServerWebSocketStub` para `@supabase/realtime-js` en SSR (Node.js < 22) para garantizar un build y prerender sin advertencias ni bloqueos de red.
4. **Home (`src/app/home/`):**
   - Eliminación de dependencias de `currentUser` y `reactiva_user` en `localStorage`.
   - Integración directa con `AuthService`: botones de navegación dinámica según el estado de sesión («Iniciar sesión/Registrarse» vs «Ir a mi panel» / «Panel Docente» según rol).
   - Enlaces protegidos a módulos que redirigen a `/login?returnUrl=...` si no hay sesión activa.
5. **Dashboard (`src/app/dashboard/`):**
   - Saludo con el nombre real del estudiante autenticado desde `AuthService.user()`.
   - `onGradeChange` persiste el cambio en backend a través de `AuthService.updateProfile` y `setProfileGrade`.
   - Cálculo dinámico de progreso de unidades temáticas (`topics[].progress`) desde `module_progress` (0% inicial honesto en lugar de números fijos 75/40/0).
   - Tareas diarias persistidas en `student_tasks` y vinculadas con `LearningEventsService.record(...)`.
   - Hook preparado para visualizar `assignments` (asignaciones académicas del aula) cuando Vanessa publique PR-V2.

## Validación
- `npm exec tsc -- --noEmit -p tsconfig.app.json`: Aprobado (0 errores).
- `npm exec tsc -- --noEmit -p tsconfig.spec.json`: Aprobado (0 errores).
- `npm test -- --watch=false`: **56 tests aprobados de 56** (10 suites en verde, incluyendo nuevas pruebas unitarias para `StudentProgressService`, sincronización de `AuthService` y dobles de prueba en `DashboardComponent`).
- `npm run build`: Compilación exitosa para producción y prerender SSR completo.

## Requiere de otros
- **Vanessa:**
  - `assignments`: el hook para renderizar tareas asignadas en el dashboard del estudiante está listo para consumir la tabla `assignments` cuando se implemente en PR-V2.
