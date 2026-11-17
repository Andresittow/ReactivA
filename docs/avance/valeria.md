# Bitácora de Avance — Valeria

> **Rama de trabajo:** `feature/Valeria`.  
> **Fuente de verdad:** `docs/PLAN_FUNCIONAL.md` y `docs/prompts/PROMPT_VALERIA.md`.  
> Esta bitácora se lee al iniciar cada sesión y se actualiza al terminar cada tarea.

---

## FASE 1 — PR-L1 · `login` + `register` (Flujo de acceso completo)

- [x] Crear bitácora `docs/avance/valeria.md` e inicializar seguimiento.
- [x] Conectar `LoginComponent` con `AuthService.signIn`: estado de carga, botón deshabilitado, evitar doble envío.
- [x] Manejo de errores en login mediante `AuthError.code` (mensajes en español amigables, sin revelar si el correo existe).
- [x] Navegación post-login con `replaceUrl: true`, evaluando `returnUrl` interna segura o `AuthService.homeFor(role)`.
- [x] Modal/flujo de recuperación de contraseña en login (`requestPasswordReset(email)` con mensaje neutro).
- [x] Tarjeta de «Ingresar PIN de Clase» en login: almacenamiento en `sessionStorage` (`pendingClassPin`) y canje automático tras login con `ClassroomService.joinByPin`.
- [x] Soporte funcional de `rememberMe` en login mediante `AuthService`.
- [x] Conectar `RegisterComponent` con `AuthService.signUp`: estado de carga y manejo de errores por código.
- [x] Corregir formulario de registro: campo exclusivo de correo, campo opcional de PIN para estudiante y código de invitación docente para docente.
- [x] Validaciones de registro: nombre (mínimo 3 caracteres), contraseña (mínimo 8 con letra y número), grado según rol, términos y colegio dinámico.
- [x] Manejo de confirmación de correo (`needsEmailConfirmation`): pantalla informativa o redirección directa con `replaceUrl: true` y canje de PIN pendiente.
- [x] Actualizar pruebas unitarias `login.spec.ts` y `register.spec.ts` con dobles de prueba (`AuthService`, `ClassroomService`).
- [x] Validar los 5 pasos de CI (incluye `npm ci`; tests con `NODE_OPTIONS=--no-experimental-webstorage`).
- [x] Actualizar `docs/pull-requests/valeria.md`.

---

## FASE 2 — PR-L2 · `settings` + `organic-mission`

- [x] Implementar `core/services/settings.service.ts` (`load`, `save`, `apply`, `init`) y estilos globales de accesibilidad/tema en `styles.scss`.
- [x] Conectar `SettingsComponent` a `AuthService` y `SettingsService` (perfil real, cambio de contraseña, cierre de otras sesiones).
- [x] Deshabilitar opciones sin backend con «Próximamente» y ocultar secciones de estudiante a docentes.
- [x] Migrar `organic-mission` y `game.service.ts` a `StudentProgressService.saveModuleProgress` y `LearningEventsService.record`.
- [x] Eliminar claves locales y datos mock (`'Valeria G.'`, `'CHEM-8420'`).
- [x] Actualizar `game.service.spec.ts`.

---

## FASE 3 — PR-L3 · `teacher-dashboard`

- [ ] Migración `supabase/migrations/<timestamp>_teacher.sql` (`teacher_guidance` y RPCs seguros con RLS).
- [ ] `TeacherDashboardService` asíncrono y sin datos mock.
- [ ] Integrar `<app-my-classrooms [embedded]="true">` de Vanessa eliminando duplicidad.
- [ ] Enlace a Settings/Help y botón «Cerrar sesión» en `TeacherSidebar`.
- [ ] Pruebas unitarias completas.

## Cierre PR-L1 — 15 de noviembre de 2026

Retomados los cambios parciales de login/registro. Formularios conectados a servicios reales,
mensajes por código, retorno interno permitido por rol, replaceUrl, recuperación neutra,
PIN pendiente y ambos estados de confirmación de correo. UI asíncrona con markForCheck.
Pruebas manuales pendientes tras integración: lista exacta en docs/pull-requests/valeria.md.
Sin commit ni push. Sin cambios en archivos de Andrés o Vanessa.

## Cierre de implementación PR-L2 — 15 de noviembre de 2026

- SettingsService con load/save/apply/init por usuario, tema del sistema y protección SSR.
- Perfil/nombre/avatar, contraseña, cierre de otras sesiones y salida conectados a AuthService.
- Opciones sin respaldo deshabilitadas; preferencias de aprendizaje/ranking ocultas a docentes.
- Tema y accesibilidad globales; solo tema en caché local, sin perfil ni progreso en storage.
- Juego con snapshots mediante StudentProgressService, XP/eventos reales y registro de
  recompensas para impedir duplicados al reintentar/reiniciar. Nombre/PIN de aula reales.
- Lectura/marcado de orientación detrás de métodos preparados para PR-L3, sin iniciarlo.
- 190 pruebas pasan con NODE_OPTIONS=--no-experimental-webstorage; npm ci, tsc app/spec,
  build y diff --check aprobados. Sin el ajuste solo fallan 5 specs existentes de sidebar.
- No hay SQL nuevo ni archivos ajenos modificados. Sin commit ni push.
- Conservadas notas previas de PR-L1 en docs/avance/valeria-pr-l1.md.

Implementación local lista para revisión; pruebas manuales de dev/RLS pendientes, enumeradas
exactamente en docs/pull-requests/valeria.md. Persisten dependencias de Andrés: errores y
propiedad de caché en StudentProgressService, errores de insert de LearningEventsService,
nombre de usuario fuera del contrato y entorno CI. No se garantiza confirmación de guardado
remoto del juego hasta que el núcleo exponga esos estados. Panel docente real y orientación
siguen pendientes de PR-L3.
