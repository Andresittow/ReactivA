# PROMPT — VALERIA (`feature/Valeria`)

> Copia todo lo que está debajo de la línea y pégalo en Antigravity/Codex.
> Requisitos previos: (1) `docs/PLAN_FUNCIONAL.md` ya está en `develop`; (2) Andrés avisó que la **Fase 0** (core, `AuthService`, guards, layout, SQL base) está en `develop`. Si no, **no programes todavía**: solo lee y prepara.

---

## ROL Y CONTEXTO

Eres mi ingeniero de software senior en **ReactivA**, plataforma educativa de química hecha con **Angular 21 (standalone, zoneless, SSR)**. El código está en `ReactivA/`. La maquetación está terminada; ahora hay que volverla **funcional y lista para producción**. Somos tres personas con ramas separadas. Yo soy **Valeria** y trabajo en `feature/Valeria` con 5 componentes: **login, register, organic-mission, settings y teacher-dashboard**. Andrés (integrador) hace el núcleo (`core/`, `AuthService`, guards, layout) y dashboard/periodic-table/home/challenges; Vanessa hace sidebar/virtual-lab/profile/help/my-classrooms y el `ClassroomService`.

**Antes de escribir código:**
1. Lee completo `docs/PLAN_FUNCIONAL.md`. Es la fuente de verdad (decisiones §2, orden §3, rutas y validaciones §4, datos §5, contrato de servicios §6, reglas §7).
2. Lee `CONTRIBUTING.md` y `docs/pull-requests/valeria.md` (formato de PR).
3. Lee en `src/app/core/` lo que dejó Andrés: `AuthService` (y su `AuthError`), guards, `LearningEventsService`, modelos, interfaces de `ClassroomService` y `SettingsService`.
4. Lee `docs/avance/valeria.md`. Si no existe, créalo con las tareas de abajo en casillas `[ ]`. **Retoma siempre desde la primera casilla sin marcar** y actualízalo al terminar cada tarea.
5. Dime tu plan en 10 líneas antes de programar.

## DEPENDENCIAS ENTRE PERSONAS (importante)
- **De Andrés:** `AuthService`, guards, `LearningEventsService`, `StudentProgressService` (incluye `addXp` y `getModuleProgress/saveModuleProgress`), migración base.
- **De Vanessa:** `ClassroomService` implementado (PR-V1) y `MyClassroomsComponent` con `@Input() embedded` (PR-V2). Los necesitas para el PIN en login/register (parcial) y **sobre todo para `teacher-dashboard` (PR-L3)**. No empieces PR-L3 hasta que esos dos estén en `develop`.
- **Tú entregas:** `SettingsService` implementado (lo llama `AppComponent` al arrancar) y las tablas/RPC del panel docente.

## TAREAS (en este orden)

### PR-L1 · `login` + `register` (flujo de acceso completo)

**login**
- `onSubmit()` → `AuthService.signIn({ email, password, rememberMe, expectedRole: selectedRole })`. Mientras espera: botón deshabilitado + indicador de carga; evitar doble envío.
- Manejo de errores por `AuthError.code`, mostrando el mensaje en pantalla (no en consola): credenciales inválidas, correo sin confirmar, rol equivocado («Esta cuenta es de docente, cambia el selector»), red. No revelar si el correo existe.
- Éxito → `router.navigateByUrl(destino, { replaceUrl: true })`. `destino` = `returnUrl` **solo si es ruta interna y el rol puede entrar**; si no, `AuthService.homeFor(role)`. Con `replaceUrl`, «Atrás» no vuelve a login.
- «¿Olvidaste tu contraseña?»: modal/flujo con `requestPasswordReset(email)` y mensaje neutro («Si el correo existe, te enviaremos instrucciones»). Si la maqueta no tiene el enlace funcional, conéctalo con los estilos existentes.
- **Tarjeta «Ingresar PIN de Clase»:** el botón abre un campo de PIN (normalizado a mayúsculas, formato validado). Si no hay sesión, guarda el PIN en `sessionStorage` (clave `pendingClassPin`, se borra al usarlo) y lo canjea con `ClassroomService.joinByPin` justo después del login/registro de estudiante; si hay un error de PIN, el login no falla: muestra aviso y permite continuar. Si `ClassroomService` aún no está disponible en `develop`, deja el hook comentado y anótalo en «Requiere de otros».
- `rememberMe` realmente funcional (lo soporta `AuthService`).

**register**
- `onSubmit()` → `AuthService.signUp(...)`. Estados de carga y de error por código (`email_taken`, `weak_password`, `invalid_teacher_code`, red).
- **Corregir el campo «Correo Escolar o Código PIN»:** debe ser **solo correo**; agrega un campo opcional **«Código PIN de clase»** (solo estudiante). Si el rol es **docente**, aparece **«Código de invitación docente»** (obligatorio; lo valida el servidor — nunca asumas el rol sin validarlo).
- Mejorar validaciones del formulario: nombre (mín. 3, solo letras/espacios/acentos), contraseña **mínimo 8 con letra y número** (actualiza el mensaje y el medidor si existe), confirmación, grado obligatorio solo para estudiante (ya existe `setRole`), términos aceptados. `school` sale del formulario (no valor fijo «Colegio San Ignacio» oculto).
- Si Supabase requiere confirmación de correo (`needsEmailConfirmation`): pantalla/estado «Revisa tu correo» y **no** navegar al dashboard. Si no la requiere: navegar con `replaceUrl: true` al inicio del rol y canjear el PIN pendiente.
- Enlaces cruzados login ↔ register funcionando; ambos pueden entrarse **solo sin sesión** (lo garantiza `guestGuard`; verifica que estando logueado «Atrás»/URL manual te redirige).

**Pruebas:** actualizar `login.spec.ts` y `register.spec.ts` con `AuthService` doble: validaciones, error por código, navegación con `replaceUrl`, PIN pendiente.

### PR-L2 · `settings` + `organic-mission`

**settings** — implementa `core/services/settings.service.ts`
- `load/save/apply/init` según el contrato (plan §6). Preferencias en `user_settings` (cache local solo para aplicar el tema sin parpadeo). `apply()` pone clases/atributos en `<html>` para: tema (`light|dark|system`, escuchando `prefers-color-scheme`), tamaño de fuente, `reduceMotion`, alto contraste, fuente para dislexia, objetivos táctiles grandes. **Hoy nada de esto se aplica** (no hay manipulación del documento): crea los estilos globales mínimos necesarios en `styles.scss` bajo clases `html.theme-dark`, `html.high-contrast`, etc. sin romper el diseño por defecto. Respeta SSR.
- Datos de cuenta (`UserAccountData`) desde `AuthService.user()`; guardar nombre/usuario/avatar con `AuthService.updateProfile`. Correo: solo lectura (o flujo de cambio con confirmación si lo implementas bien).
- `submitPasswordChange()` → `AuthService.updatePassword` real (valida coincidencia y fortaleza; error si la sesión es antigua). Quitar el texto «(Modo Simulación)».
- `closeOtherSessions()` → `AuthService.signOutOthers()` real.
- `confirmDeleteAccount()`: hoy es un mensaje falso. O bien implementa eliminación real (RPC `delete_my_account` security definer que borre datos del usuario, con confirmación escribiendo la palabra «ELIMINAR» y cierre de sesión), o bien deja la opción **deshabilitada con «Próximamente»**. No simulaciones que parezcan reales.
- `twoFactorAuth` y otras opciones sin respaldo real: deshabilitar con «Próximamente» en vez de guardar un valor que no hace nada. `profileVisibility`/`showProgressPublicly` sí deben guardarse (las usa el ranking de Andrés).
- Docente también entra a Settings: ocultar secciones de aprendizaje/estudiante cuando `role() === 'docente'`.
- Cerrar sesión disponible en la cuenta como acción visible.

**organic-mission** (+ `game.service.ts`)
- El progreso (niveles, vidas, puntaje, preguntas respondidas) pasa de `localStorage` (`reactiva_mision_organica_progress`) a `StudentProgressService.saveModuleProgress('organic-mission', …)`; se restaura por usuario. Eliminar la clave local y limpiar en logout (ya lo hace `reset()`).
- XP real: al completar nivel/respuestas, `StudentProgressService.addXp()` y `LearningEventsService.record({ module: 'organic-mission', … })`. **Eliminar** los fallbacks `'Valeria G.'` y la dependencia de `TeacherDashboardService.recordLiveEvent`.
- PIN y orientación del docente: quitar `activeTeacherPin` = `'CHEM-8420'`; mostrar el nombre/PIN del aula real del estudiante (`ClassroomService.getMyClassroom()`; si no tiene aula, ocultar el banner «Supervisión Docente Activa»). Las orientaciones pedagógicas (`getStudentGuidance`/`clearStudentGuidance`) pasan a la tabla `teacher_guidance` (la migración se crea en PR-L3; en PR-L2 deja la lectura detrás de un método del servicio y marca la dependencia).
- `game.service.spec.ts` actualizado con dobles.

### PR-L3 · `teacher-dashboard` (solo después de que Vanessa tenga V1 y V2 en `develop`)

- Migración propia `supabase/migrations/<timestamp>_teacher.sql`: tabla `teacher_guidance` (RLS: docente inserta/lee las suyas; estudiante destinatario lee y marca `read`), y RPC/vistas **seguras con RLS**: `teacher_overview(classroom_id null)` (totales, activos en los últimos 7 días, con/sin tareas completadas, promedio de progreso), `teacher_students(classroom_id null)`, `teacher_sections_progress(classroom_id null)`. Un docente solo obtiene datos de estudiantes de **sus** aulas (usa `is_teacher_of`).
- `TeacherDashboardService` → **asíncrono y sin datos inventados**: elimina `'Prof. Dr. Roberto Méndez'`, KPIs fijos (32/29/24/8/82), estudiantes ficticios (Mateo Rodríguez…), el fallback `'Valeria Góngora'`, el `PIN CHEM-8420` y todas las claves de `localStorage`. Perfil docente = `AuthService.user()` (+ colegio). `getRecentLearningActivities` desde `learning_events` de sus aulas (con actualización en vivo vía Supabase Realtime si es simple; si no, refresco periódico/botón). `recordLiveEvent` se elimina (lo reemplaza `LearningEventsService`).
- `teacher-dashboard.ts`: selector de aula activa (el «PIN ACTIVO DE SALA» es el `join_pin` del aula seleccionada; copiar y regenerar funcionan con `ClassroomService.regeneratePin`). KPIs, progreso por sección, lista y filtros de estudiantes y ficha individual con datos reales. Estado vacío cuando el docente aún no tiene aulas o estudiantes («Crea tu primera aula y comparte el PIN»).
- **Enviar orientación pedagógica** → inserta en `teacher_guidance`; el estudiante la ve en Misión Orgánica (PR-L2) y la marca como leída.
- **Eliminar la copia duplicada de aulas:** quita `DashboardClassroomGroup`, `DashboardNewGroupForm`, modales y estado propios, y en la vista `classrooms` usa `<app-my-classrooms [embedded]="true">`. `TeacherSidebar` sigue cambiando entre `overview` y `classrooms`.
- `TeacherSidebar`: añadir enlaces a **Settings y Help** y botón **«Cerrar sesión»** (`AuthService.signOut()`), con los estilos existentes.
- Pruebas del servicio y del componente con dobles.

## LÍMITES
- Solo tus 5 componentes + `core/services/settings.service.ts` + `styles.scss` (únicamente las reglas globales de accesibilidad/tema) + tus migraciones + tus specs. **No edites** `sidebar`/`my-classrooms`/`profile` (Vanessa), `dashboard`/`challenges`/`home`/`periodic-table`/`core/auth`/`app.*` (Andrés), `package.json`. Si necesitas un cambio ahí, ponlo en «Requiere de otros» del PR.
- No cambies el diseño. Solo estados mínimos nuevos con estilos existentes.
- SSR-safe, sin datos inventados, sin `localStorage` para datos (plan §2.4 y §7). Nunca registrar contraseñas en consola ni guardarlas.
- No push sin mi autorización; no force push; no rebase. Commits `feat(valeria): …` / `fix(valeria): …` con mi identidad.

## DEFINICIÓN DE TERMINADO (por cada PR)
- [ ] `npm exec tsc -- --noEmit -p tsconfig.app.json`, `… tsconfig.spec.json`, `npm test -- --watch=false`, `npm run build` en verde.
- [ ] Pruebas nuevas; las existentes siguen pasando.
- [ ] Probado a mano: registro de estudiante y de docente (con y sin código válido); login de ambos; «Atrás» tras login no vuelve a login/register; con sesión, `/login` redirige al inicio del rol; logout; tema oscuro de Settings se aplica y persiste tras recargar; el XP de Misión Orgánica aparece en el dashboard y en el panel docente.
- [ ] RLS probada: un docente no ve estudiantes de otro docente.
- [ ] Migraciones nuevas listadas en el PR con orden de aplicación.
- [ ] `docs/avance/valeria.md` y `docs/pull-requests/valeria.md` actualizados.
- [ ] Resumen final: qué hiciste, qué migraciones aplicar, qué esperas de Andrés/Vanessa.
