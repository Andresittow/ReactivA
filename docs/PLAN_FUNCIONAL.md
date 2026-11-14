# PLAN FUNCIONAL — ReactivA (de maqueta a producción)

> **Fuente de verdad del equipo.** Los tres prompts personales (`docs/prompts/PROMPT_*.md`) dependen de este documento.
> Si un prompt contradice este archivo, gana este archivo. Si hay que cambiar el contrato, se cambia **aquí**, por PR a `develop`, avisando a las tres personas.

Equipo y ramas (ver `CONTRIBUTING.md`): `main` · `develop` · `feature/Andres` · `feature/Vanessa` · `feature/Valeria` · `feature/app-layout`.

---

## 1. Diagnóstico: qué hay hoy en `develop` y qué falta

La maquetación está completa. Lo que sigue es una interfaz sin lógica de negocio:

| Área | Estado actual (verificado en el código) | Qué falta |
| --- | --- | --- |
| **Autenticación** | `login.ts` y `register.ts`: `onSubmit()` solo hace `router.navigate(...)`. No existe `AuthService`. `rememberMe` no se usa. El botón «Ingresar PIN de Clase» no tiene acción. | Registro y login reales, sesión persistente, cierre de sesión, recuperar contraseña. |
| **Rutas** | `app.routes.ts` no tiene guards: `/dashboard`, `/teacher-dashboard`, etc. abren sin sesión, y cualquiera entra al panel docente. | Guards por sesión y por rol; bloqueo de «atrás» a login/register estando logueado. |
| **Layout** | `app.ts → isAuthPage()` decide el sidebar comparando strings de URL. `/my-classrooms` mostraría el sidebar de estudiante. Ni `sidebar` ni `teacher-sidebar` tienen «Cerrar sesión». | Layout por datos de ruta, menú según rol, logout. |
| **Datos** | Todo vive en `localStorage` del navegador (`reactiva_*`): XP, tareas, retos, insignias, progreso de Misión Orgánica, elementos explorados. No está ligado a ningún usuario: dos personas en el mismo navegador comparten progreso. | Base de datos real con progreso por usuario. |
| **Perfil del estudiante** | `StudentProgressService.getProfile()` lee `currentUser`/`reactiva_user`, que **nadie escribe** → siempre muestra «Científico». `profile.ts` tiene nombre y correo fijos. | Perfil real desde el usuario autenticado. |
| **Panel docente** | `TeacherDashboardService` devuelve datos inventados: docente «Prof. Dr. Roberto Méndez», KPIs fijos (32/29/24/8/82), estudiantes ficticios («Mateo Rodríguez») y un fallback «Valeria Góngora». El PIN se guarda solo en el `localStorage` del profesor, así que ningún estudiante puede validarlo. | Aulas, miembros, KPIs y actividad reales; PIN por aula validable. |
| **Aulas duplicadas** | `teacher-dashboard.ts` y `my-classrooms.ts` tienen cada uno su copia de modelos (`DashboardClassroomGroup` vs `ClassroomGroup`) y su propio estado. Ninguna persiste. | Un solo servicio de aulas y un solo componente de UI. |
| **Settings** | Guarda en `localStorage`. Nada aplica tema, tamaño de fuente ni contraste al documento. Cambio de contraseña, cerrar otras sesiones y eliminar cuenta son simulaciones. | Preferencias por usuario aplicadas globalmente; acciones de cuenta reales. |
| **Challenges** | Leaderboards (`classLeaderboard`, `schoolLeaderboard`) son arrays estáticos. | Ranking real desde la base de datos. |
| **Virtual Lab** | `totalLabScore = 150` local; el XP ganado no llega al XP global ni al docente. | Persistir progreso y sumar XP/eventos reales. |
| **Help** | Solo FAQ desplegable; no envía nada. | Contacto/soporte guardado (mínimo). |
| **Backend** | No existe. `server.ts` es solo el servidor SSR de Express. | Backend (ver §2). |
| **SSR/Producción** | `app.routes.server.ts` usa `Prerender` para `**`: las rutas privadas no pueden prerenderizarse con sesión. No hay variables de entorno ni despliegue. | `RenderMode.Client` en rutas privadas, `environments`, despliegue, `main`. |

---

## 2. Decisiones técnicas (cerradas para que nadie improvise)

1. **Backend: Supabase** (Auth + Postgres + Row Level Security). Motivo: el modelo es relacional (docente → aulas → estudiantes → progreso), no requiere servidor propio y tiene capa gratuita. Todo el acceso pasa por **servicios en `src/app/core/`**; si algún día se cambia de proveedor, solo cambia `core/`.
2. **Un proyecto Supabase de desarrollo compartido** (creado por Andrés, con Vanessa y Valeria como colaboradoras) y **uno de producción** separado. Solo se usan la URL y la `anon key` en el frontend. **Nunca** la `service_role key` en el repo ni en el frontend.
3. **Patrón «caché sincrónica + escritura asíncrona»** para `StudentProgressService`. Hoy lo consumen `home`, `dashboard`, `challenges`, `periodic-table`, `organic-mission/game.service` y `teacher-dashboard.service` con métodos **síncronos**. Para no romper a nadie: al iniciar sesión se llama `hydrate()` (carga todo a memoria con signals) y los getters actuales siguen siendo síncronos; cada mutación actualiza la memoria y hace upsert a Supabase en segundo plano con manejo de error. **No se cambia la firma pública actual.**
4. **`localStorage` solo para comodidades de UI** (último tab abierto, etc.). Prohibido guardar ahí contraseñas, tokens a mano, datos de usuario o progreso. Las claves antiguas `reactiva_*`, `currentUser` y `reactiva_user` se eliminan y se hace limpieza al cerrar sesión.
5. **Rol docente protegido:** cualquiera podría registrarse como docente. Solución: el registro docente exige un **código de invitación** (tabla `teacher_invite_codes`) que valida un trigger en la base de datos. Los códigos los crea Andrés manualmente en Supabase. El rol **nunca** se confía al cliente sin esa validación.
6. **PIN de clase:** el PIN pertenece a un **aula** (`classrooms.join_pin`), no al navegador del docente. El estudiante se une con el RPC `join_classroom(pin)`.
7. **Un solo componente de aulas:** `MyClassroomsComponent` es la UI canónica. `teacher-dashboard` reemplaza su copia por `<app-my-classrooms [embedded]="true">`.
8. **SSR:** rutas públicas (`home`, `login`, `register`) siguen con `Prerender`; **todas las privadas pasan a `RenderMode.Client`**. Los guards usan `isPlatformBrowser`.
9. **No se cambia el diseño ya maquetado.** Solo se agregan estados mínimos nuevos (cargando, vacío, error) reutilizando los estilos existentes.
10. **Dependencias nuevas permitidas:** solo `@supabase/supabase-js` (la agrega Andrés en la Fase 0). Nadie más toca `package.json`.

---

## 3. Orden de trabajo y de merge (obligatorio)

```text
FASE 0  Andrés · feature/app-layout   →  PR → develop   (cimientos: core/, guards, layout, SQL base)
   │
   ├── FASE 1 (en paralelo, después de que la Fase 0 esté en develop)
   │     Vanessa · PR-V1: ClassroomService + sidebar (rol + logout)
   │     Valeria · PR-L1: login / register / PIN / recuperar contraseña
   │     Andrés  · PR-A1: StudentProgressService (Supabase) + home + dashboard
   │
   ├── FASE 2
   │     Vanessa · PR-V2: my-classrooms (UI), profile, virtual-lab, help
   │     Valeria · PR-L2: settings + organic-mission
   │     Andrés  · PR-A2: periodic-table + challenges (+ ranking)
   │
   ├── FASE 3
   │     Valeria · PR-L3: teacher-dashboard (requiere V1 y V2 de my-classrooms en develop)
   │
   └── FASE 4  Andrés · feature/app-layout + develop → main
         Pruebas de punta a punta, endurecer RLS, despliegue, checklist de producción
```

Reglas de la secuencia:
- **Nadie escribe código de la Fase 1 hasta que la Fase 0 esté en `develop`.** Mientras tanto leen este plan y preparan.
- Antes de empezar cada PR: `git fetch origin` y actualizar desde `origin/develop` como indica `CONTRIBUTING.md` (avance directo; si diverge, parar y hablar con Andrés).
- Cada PR debe pasar los cuatro comandos de CI (ver §9) y actualizar su bitácora.
- Excepción documentada a `CONTRIBUTING.md`: en la Fase 0, `feature/app-layout` modifica `app.routes.ts`, `app.ts`, `app.config.ts`, `app.routes.server.ts` y crea `src/app/core/` **antes** de integrar componentes. Es necesario para que haya guards y servicios compartidos.

---

## 4. Matriz de rutas y permisos

| Ruta | Quién entra | Layout (`data.layout`) | Si no cumple |
| --- | --- | --- | --- |
| `/home` | Todos | `bare` | — |
| `/login`, `/register` | **Solo sin sesión** (`guestGuard`) | `bare` | Con sesión → su inicio por rol |
| `/dashboard`, `/virtual-lab`, `/periodic-table`, `/mision-organica`, `/challenges`, `/profile` | Estudiante | `app` | Sin sesión → `/login?returnUrl=…`; docente → `/teacher-dashboard` |
| `/settings`, `/help` | Cualquier usuario autenticado | `app` | Sin sesión → `/login?returnUrl=…` |
| `/teacher-dashboard` | Docente | `bare` (trae su propio `TeacherSidebar`) | Sin sesión → `/login`; estudiante → `/dashboard` |
| `/my-classrooms` | Docente | `app` | Igual que arriba |
| `/tabla-periodica` | — | — | Redirect a `/periodic-table` |
| `**` | — | — | Redirect a `/home` |

«Inicio por rol»: estudiante → `/dashboard`; docente → `/teacher-dashboard`.

### Validaciones de navegación (todas obligatorias)
- Tras iniciar sesión o registrarse: `router.navigateByUrl(destino, { replaceUrl: true })` para que **«Atrás» no vuelva a login/register**.
- Con sesión activa, escribir `/login` o `/register` a mano o usar «Atrás» → `guestGuard` redirige al inicio del rol.
- Cerrar sesión: limpiar caché en memoria, `signOut()` y `navigate(['/login'], { replaceUrl: true })`. Al pulsar «Atrás» después de salir, los guards deben bloquear las pantallas privadas.
- Sesión expirada o cerrada desde otra pestaña: `onAuthStateChange` → `SIGNED_OUT` → redirigir a `/login`.
- `returnUrl`: el `authGuard` lo guarda; tras el login se usa **solo si el rol puede entrar** y si es una ruta interna (nunca una URL externa).
- Al refrescar la página con sesión activa no debe verse un parpadeo de login: la sesión se restaura con `provideAppInitializer` **antes** de la primera navegación.
- «Recordarme» desactivado: la sesión debe terminar al cerrar el navegador (almacenamiento de sesión).

---

## 5. Modelo de datos (Postgres / Supabase)

Cada persona crea su propia migración en `supabase/migrations/` con nombre `AAAAMMDDHHMM_<tema>.sql` (marca de tiempo → no hay colisiones). **Todas las tablas con RLS activado.**

| Tabla | Columnas clave | Responsable de la migración |
| --- | --- | --- |
| `profiles` | `id uuid pk → auth.users`, `role ('estudiante'\|'docente')`, `full_name`, `grade`, `school`, `avatar_url`, `newsletter bool`, `created_at` | Andrés (Fase 0) |
| `teacher_invite_codes` | `code pk`, `used_by uuid null`, `created_at` | Andrés (Fase 0) |
| `student_progress` | `student_id pk`, `xp`, `level`, `streak_days`, `last_active_date` | Andrés (Fase 0) |
| `student_tasks` | `student_id`, `task_id`, `completed` (pk compuesta) | Andrés (Fase 0) |
| `student_challenges` | `student_id`, `challenge_id`, `current_progress`, `claimed` | Andrés (Fase 0) |
| `student_badges` | `student_id`, `badge_id`, `unlocked_at` | Andrés (Fase 0) |
| `module_progress` | `student_id`, `module ('periodic-table'\|'memory'\|'virtual-lab'\|'organic-mission')`, `data jsonb`, `updated_at` (pk `student_id,module`) | Andrés (Fase 0) |
| `learning_events` | `id`, `student_id`, `classroom_id null`, `module`, `title`, `detail`, `xp int`, `created_at` | Andrés (Fase 0) |
| `user_settings` | `user_id pk`, `preferences jsonb`, `updated_at` | Andrés (Fase 0) |
| `classrooms` | `id`, `teacher_id`, `name`, `tag`, `location`, `schedule`, `grade_filter`, `capacity`, `join_pin unique`, `active_module`, `current_week`, `total_weeks`, `created_at` | **Vanessa** (PR-V1) |
| `classroom_members` | `classroom_id`, `student_id`, `joined_at` (pk compuesta) | **Vanessa** (PR-V1) |
| `assignments` | `id`, `classroom_id`, `title`, `workshop`, `due_date null`, `created_at` | **Vanessa** (PR-V2) |
| `teacher_guidance` | `id`, `teacher_id`, `student_id`, `title`, `message`, `read bool`, `created_at` | **Valeria** (PR-L3) |
| `help_requests` | `id`, `user_id`, `subject`, `message`, `status`, `created_at` | **Vanessa** (PR-V2) |

Funciones/RPC y triggers (quién los crea):
- Trigger `on auth.users insert` → crea `profiles` con `raw_user_meta_data` (nombre, rol, grado, colegio) y valida `teacher_invite_codes` para el rol docente; también inserta la fila de `student_progress` — **Andrés**.
- `join_classroom(pin text)` y `regenerate_pin(classroom_id uuid)` (security definer, valida que el aula sea del docente) — **Vanessa**.
- `get_leaderboard(scope text)` con `scope in ('class','school')`, que devuelve solo nombre visible, nivel y XP y respeta `profileVisibility` — **Andrés** (PR-A2).
- RPC/vistas del panel docente (`teacher_overview`, `teacher_students`, `teacher_sections_progress`) — **Valeria** (PR-L3).

### Reglas RLS mínimas
- Un usuario lee y escribe **solo** sus filas (`auth.uid() = student_id/user_id/id`).
- Un docente puede **leer** `profiles`, `student_progress`, `module_progress`, `learning_events` y `student_tasks` de los estudiantes que son miembros de **sus** aulas (función auxiliar `is_teacher_of(student uuid)`), nunca de otros.
- Estudiante no puede crear aulas ni cambiar su `role`. El campo `role` de `profiles` no es editable por el cliente.
- Solo el docente dueño del aula la modifica. Un estudiante solo ve las aulas donde es miembro.
- `learning_events`: el estudiante inserta los suyos; el docente lee los de sus aulas.
- `teacher_guidance`: el docente inserta; el estudiante destinatario lee y marca `read`.
- Probar RLS con dos estudiantes y dos docentes distintos: nadie ve datos ajenos.

---

## 6. Contrato de servicios (`src/app/core/`)

Estructura que crea la Fase 0:

```text
src/app/core/
├── supabase/supabase.client.ts          # createClient desde environment; solo en navegador
├── models/                              # Interfaces compartidas (UserProfile, Role, Classroom, LearningEvent…)
├── auth/auth.service.ts                 # sesión, login, registro, logout, perfil
├── auth/auth.guard.ts                   # authGuard, guestGuard, roleGuard(role)
├── services/learning-events.service.ts  # record() que usan todos los módulos
├── services/classroom.service.ts        # interfaz + esqueleto; lo implementa Vanessa
└── services/settings.service.ts         # interfaz + esqueleto; lo implementa Valeria
```

Los archivos existentes **no se mueven** (`dashboard/student-progress.service.ts`, `teacher-dashboard/services/teacher-dashboard.service.ts`, `organic-mission/services/game.service.ts`) para no romper imports.

### `AuthService` (Andrés, Fase 0)
```ts
type Role = 'estudiante' | 'docente';
interface UserProfile { id: string; role: Role; fullName: string; email: string;
                        grade?: string; school?: string; avatarUrl?: string; }

readonly user: Signal<UserProfile | null>;          // null = sin sesión
readonly isAuthenticated: Signal<boolean>;
readonly role: Signal<Role | null>;
readonly ready: Signal<boolean>;                    // sesión restaurada

signUp(input: { email; password; fullName; role; grade?; school?;
                newsletter?; teacherInviteCode?; classPin? }): Promise<{ needsEmailConfirmation: boolean }>;
signIn(input: { email; password; rememberMe: boolean; expectedRole?: Role }): Promise<UserProfile>;
signOut(): Promise<void>;                           // limpia caché + navega a /login con replaceUrl
requestPasswordReset(email: string): Promise<void>;
updatePassword(newPassword: string): Promise<void>;
updateProfile(patch: Partial<Pick<UserProfile,'fullName'|'grade'|'school'|'avatarUrl'>>): Promise<UserProfile>;
signOutOthers(): Promise<void>;
homeFor(role: Role): string;                        // '/dashboard' | '/teacher-dashboard'
```
Errores: lanzar `AuthError` con `code` estable (`invalid_credentials`, `email_taken`, `weak_password`, `invalid_teacher_code`, `email_not_confirmed`, `role_mismatch`, `network`) y mensaje en español listo para mostrar.

### `StudentProgressService` (Andrés, PR-A1) — firma pública existente intacta
Se añaden `hydrate(): Promise<void>` y `reset(): void`. Se mantienen `getProfile`, `setProfileName`, `setProfileGrade`, `getGamificationState`, `addXp`, `getDashboardTasks`, `toggleDashboardTask`, `getChallengesState`, `progressChallenge`, `claimChallenge`, `getUnlockedBadges`, `unlockBadge`. Agrega además:
```ts
getModuleProgress<T>(module: ModuleKey): T | null;           // síncrono desde caché
saveModuleProgress<T>(module: ModuleKey, data: T): void;     // caché + upsert en segundo plano
```
`getProfile()` ahora sale de `AuthService.user()`; ya no lee `currentUser`.

### `LearningEventsService` (Andrés, Fase 0)
```ts
record(e: { module: ModuleKey | 'dashboard' | 'challenges'; title: string; detail?: string; xp?: number }): void;
// fire-and-forget; resuelve classroom_id del estudiante automáticamente; nunca lanza al llamador.
```
Reemplaza a `TeacherDashboardService.recordLiveEvent` (que se elimina en PR-L2/L3).

### `ClassroomService` (interfaz en Fase 0 · implementación **Vanessa**)
```ts
// Docente
listMine(): Promise<Classroom[]>;
create(input: NewClassroom): Promise<Classroom>;
update(id: string, patch: Partial<NewClassroom>): Promise<Classroom>;
remove(id: string): Promise<void>;
regeneratePin(id: string): Promise<string>;
listMembers(classroomId: string): Promise<ClassroomMember[]>;
assignWorkshop(classroomId: string, input: { title: string; workshop: string; dueDate?: string }): Promise<void>;
// Estudiante
joinByPin(pin: string): Promise<Classroom>;          // errores: invalid_pin, already_member, classroom_full
getMyClassroom(): Promise<Classroom | null>;
leave(classroomId: string): Promise<void>;
```

### `SettingsService` (interfaz en Fase 0 · implementación **Valeria**)
```ts
init(): void;                                        // lo llama AppComponent al arrancar y tras el login
load(): Promise<UserPreferences>;
save(p: UserPreferences): Promise<void>;
apply(p: UserPreferences): void;                     // tema, fontSize, reduceMotion, highContrast, dyslexicFont… vía clases en <html>
```
Hasta que Valeria lo implemente, `init()` es un no-op.

### `TeacherDashboardService` (Valeria, PR-L3) — pasa a asíncrono
Los métodos actuales (`getTeacherProfile`, `getActivePin`, `getAcademicOverviewKPIs`, `getRecentLearningActivities`, `getSectionsOverview`, `getStudentsList`, `sendPedagogicGuidance`, `getStudentGuidance`, `clearStudentGuidance`) devuelven `Promise`/`Observable`. Sin datos inventados.

---

## 7. Reglas que valen para las tres personas

1. **Solo tocas tus archivos.** Si necesitas un cambio en un archivo ajeno, descríbelo en la sección «Requiere de otros» de tu PR (`docs/pull-requests/<nombre>.md`); no lo edites.
2. **Cero datos inventados en producción:** eliminar nombres, correos y cifras de ejemplo del código (`'Valeria Góngora'`, `'Valeria G.'`, `'Prof. Dr. Roberto Méndez'`, `'Mateo R.'`, `32 estudiantes`, `CHEM-8420`, etc.). Un usuario nuevo ve estados vacíos honestos («Aún no tienes actividad»).
3. **Todo componente que lee datos remotos** muestra estado de carga, estado vacío y estado de error con la opción de reintentar.
4. **SSR-safe:** nada de `window`/`localStorage`/`document` sin `isPlatformBrowser`.
5. **Zoneless:** mantener `markForCheck()`/signals como el resto del proyecto.
6. **Seguridad:** no loguear contraseñas ni tokens; no guardar contraseñas; mensajes de error que no revelen si un correo existe (excepto en registro: «ya registrado»); validar en servidor (RLS/RPC), no solo en el formulario.
7. **Idioma de la UI:** español.
8. **Pruebas:** no romper las 26 existentes; cada PR añade pruebas de su lógica nueva (Vitest). Los specs que dependen de `localStorage` o `AuthService` usan dobles de prueba.
9. **Commits:** `feat(<nombre>): …` / `fix(<nombre>): …` según `CONTRIBUTING.md`. No push sin autorización de la persona. No force push. No rebase de historia compartida.
10. **Bitácora:** cada persona mantiene `docs/avance/<nombre>.md` con casillas `[ ]/[x]`. **Es lo primero que lee el agente al empezar una sesión** y lo último que actualiza al terminar una tarea. Así se puede continuar sin perder el hilo aunque la conversación se reinicie.
11. **PR:** descripción en `docs/pull-requests/<nombre>.md` (formato de los existentes) con: qué cambia, cómo se probó, migraciones aplicadas, «Requiere de otros».

---

## 8. Pasos manuales (los hace una persona, no el agente)

**Andrés**
1. Crear proyectos Supabase `reactiva-dev` y `reactiva-prod`; invitar a Vanessa y Valeria al de desarrollo.
2. En `reactiva-dev` → Authentication → URL Configuration: añadir `http://localhost:4200/**`. En `reactiva-prod`: la URL final del sitio.
3. Decidir si se exige confirmación de correo (recomendado en producción; apagada en dev para probar rápido).
4. Insertar códigos de invitación docente (`insert into teacher_invite_codes(code) values ('…')`).
5. Pasar a cada compañera la URL y la `anon key` de **dev** por un canal privado. Nunca por el repo.
6. Aplicar a producción las migraciones ya revisadas, en orden de nombre de archivo.

**Todas las personas:** crear dos cuentas de prueba de estudiante y una de docente en dev para probar RLS; no commitear credenciales.

---

## 9. Validación y definición de «terminado»

Desde `ReactivA/`:
```bash
npm ci
npm exec tsc -- --noEmit -p tsconfig.app.json
npm exec tsc -- --noEmit -p tsconfig.spec.json
npm test -- --watch=false
npm run build
```
Y además, a mano, en el navegador:
- [ ] Registro de estudiante → entra a `/dashboard` → «Atrás» no vuelve a `/register`.
- [ ] Cerrar sesión → «Atrás» no deja ver pantallas privadas.
- [ ] Docente intenta `/dashboard` → lo manda a `/teacher-dashboard`; estudiante intenta `/teacher-dashboard` → lo manda a `/dashboard`.
- [ ] Dos estudiantes distintos en el mismo navegador **no** comparten XP ni tareas.
- [ ] Un estudiante se une a un aula con PIN y aparece en el panel del docente con su progreso real.
- [ ] El XP ganado en laboratorio, retos o Misión Orgánica aparece en dashboard, perfil y panel docente.
- [ ] Un docente no ve estudiantes de otro docente (prueba RLS).
- [ ] Refrescar con sesión activa mantiene la sesión y no parpadea el login.
- [ ] `grep` del repo no encuentra los nombres/correos/cifras inventados de la regla 2.

---

## 10. Checklist de producción (Fase 4, Andrés)

- [ ] `src/environments/environment.ts` y `environment.development.ts` con `fileReplacements` en `angular.json`; sin secretos en el repo.
- [ ] `app.routes.server.ts`: públicas `Prerender`, privadas `Client`.
- [ ] RLS auditada tabla por tabla; ninguna tabla sin RLS.
- [ ] Migraciones aplicadas a `reactiva-prod` en orden; códigos docentes creados.
- [ ] Redirect URLs y plantillas de correo de Supabase Auth configuradas en prod.
- [ ] Despliegue (salida `server` con SSR → servicio Node como Render/Railway; o cambiar a salida estática si se decide). Variable `PORT` ya soportada por `server.ts`.
- [ ] Encabezados `Cache-Control: no-store` para rutas privadas (evita ver pantallas privadas con «Atrás» tras logout por caché del navegador).
- [ ] Actualizar `README.md` (estado real, variables, cómo correr, despliegue) y retirar la sección «Límites actuales» de `CONTRIBUTING.md`.
- [ ] CI en verde, PR `develop → main` revisado, etiqueta de versión.
