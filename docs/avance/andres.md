# Bitácora de Avance — Andrés (Integrador)

> **Ramas de trabajo:** `feature/app-layout` (Fase 0 y Fase 4) y `feature/Andres` (Fases 1 y 2).  
> **Fuente de verdad:** `docs/PLAN_FUNCIONAL.md`.  
> Esta bitácora se lee al iniciar cada sesión y se actualiza al terminar cada tarea.

---

## FASE 0 — Cimientos (rama `feature/app-layout`)

### 0.1 Dependencias y entorno
- [x] Agregar `@supabase/supabase-js` a `package.json` en `ReactivA/`.
- [x] Crear `src/environments/environment.ts` y `src/environments/environment.development.ts` con placeholders (`supabaseUrl`, `supabaseAnonKey`).
- [x] Configurar `fileReplacements` en `angular.json` para producción.
- [x] Documentar en `README.md` las variables de entorno necesarias y cómo configurarlas.

### 0.2 Núcleo `src/app/core/`
- [x] `core/supabase/supabase.client.ts`: cliente Supabase creado solo en navegador (`isPlatformBrowser`), con `persistSession` y soporte de almacenamiento para «Recordarme».
- [x] `core/models/`: interfaces compartidas (`Role`, `UserProfile`, `ModuleKey`, `Classroom`, `NewClassroom`, `ClassroomMember`, `LearningEvent`, `UserPreferences`).
- [x] `core/auth/auth.service.ts`: implementación completa del contrato (signals `user`, `isAuthenticated`, `role`, `ready`; `signUp`, `signIn`, `signOut`, `requestPasswordReset`, `updatePassword`, `updateProfile`, `signOutOthers`, `homeFor`; `AuthError` con códigos y mensajes en español; validación de `expectedRole` y `onAuthStateChange`).
- [x] `core/auth/auth.guard.ts`: guards funcionales (`authGuard`, `guestGuard`, `roleGuard(role)`) según la matriz del plan §4, con manejo de `returnUrl` interna y SSR-safe.
- [x] `core/services/learning-events.service.ts`: servicio `record()` fire-and-forget, resuelve `classroom_id`, no lanza errores al llamador.
- [x] `core/services/classroom.service.ts`: interfaz y esqueleto de métodos para Vanessa (`throw new Error(...)`).
- [x] `core/services/settings.service.ts`: interfaz y esqueleto para Valeria (`init()` no-op, métodos con stub).

### 0.3 Base de datos
- [x] `supabase/migrations/202611140000_core.sql`: migración base con tablas del plan §5 asignadas a Andrés (`profiles`, `teacher_invite_codes`, `student_progress`, `student_tasks`, `student_challenges`, `student_badges`, `module_progress`, `learning_events`, `user_settings`), triggers de nuevo usuario (validando código docente para rol 'docente' e insertando 'student_progress'), función `is_teacher_of(student uuid)` inicial, y políticas RLS completas en todas las tablas.
- [x] `supabase/README.md`: guía paso a paso para aplicar migraciones desde el SQL Editor o CLI de Supabase.

### 0.4 Rutas, layout y SSR
- [x] `app.routes.ts`: aplicar guards y `data: { layout: 'bare' | 'app' }` respetando la matriz del plan §4, lazy loading, redirect `/tabla-periodica` y wildcard a `/home`.
- [x] `app.ts` / `app.html`: layout dinámico basado en `data.layout` de la ruta activa en lugar de comparación de URLs, manteniendo soporte de compatibilidad y llamando a `settingsService.init()`.
- [x] `app.config.ts`: registrar `provideAppInitializer` para restaurar la sesión antes de la primera navegación (evitar parpadeo).
- [x] `app.routes.server.ts`: configurar `Prerender` para rutas públicas (`home`, `login`, `register`) y `RenderMode.Client` para todas las privadas.

### 0.5 Entrega de Fase 0
- [x] Pruebas unitarias de `AuthService` (con cliente Supabase simulado) y guards (`authGuard`, `guestGuard`, `roleGuard`).
- [x] Ejecutar y validar los 5 comandos de CI:
  - `npm ci`
  - `npm exec tsc -- --noEmit -p tsconfig.app.json`
  - `npm exec tsc -- --noEmit -p tsconfig.spec.json`
  - `npm test -- --watch=false`
  - `npm run build`
- [x] Actualizar `docs/pull-requests/andres.md` con la descripción de cambios de Fase 0.

---

## FASE 1 y 2 — Mis componentes (rama `feature/Andres`)

### PR-A1 · StudentProgressService + home + dashboard
- [x] Migrar `StudentProgressService` a Supabase con patrón de caché síncrona + guardado asíncrono (`hydrate()`, `reset()`, `getModuleProgress`, `saveModuleProgress`). Mantener firmas públicas intactas.
- [x] Cálculo real de racha (`streakDays`) basado en `lastActiveDate`.
- [x] Eliminar valores mock / inventados por defecto.
- [x] `home`: integrar `AuthService` para saludo, botones por estado de sesión y redirección protegida con `returnUrl`.
- [x] `dashboard`: nombre real, persistencia de grado, progreso de unidades calculado, tareas diarias por usuario, integración con `LearningEventsService`.
- [x] Actualizar `dashboard.spec.ts` con dobles de prueba.

### PR-A2 · periodic-table + challenges (+ ranking)
- [ ] `periodic-table`: sincronizar elementos explorados y récords de Memory con `module_progress` y registrar eventos/XP. Eliminar `localStorage`.
- [ ] `challenges`: retos por usuario (`student_challenges`), reclamo de XP/eventos, trofeos desde `student_badges`.
- [ ] Leaderboard real con función RPC `get_leaderboard('class' | 'school')` respetando `profileVisibility`.
- [ ] Estados de carga, vacío y error con reintento en ambos componentes.

---

## FASE 4 — Integración y producción (rama `feature/app-layout` y `develop → main`)
- [ ] Auditoría integral: cero `localStorage` con datos sensibles/progreso, cero datos mock residuales.
- [ ] Pruebas E2E manuales de la matriz del plan §9.
- [ ] Auditoría de RLS tabla por tabla con 2 estudiantes y 2 docentes.
- [ ] Checklist de producción del plan §10 (environments, `Cache-Control: no-store` en SSR, README final).
- [ ] PR `develop → main`.
