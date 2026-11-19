# ReactivA 🧪⚡

**ReactivA** es una aplicación web educativa para apoyar el aprendizaje de química de estudiantes de grados 10.º y 11.º. Combina una tabla periódica interactiva, actividades de laboratorio virtual, una misión de química orgánica y desafíos con progreso gamificado.

La plataforma tiene dos perfiles: **estudiante**, para realizar actividades y consultar su avance, y **docente**, para crear aulas, compartir un PIN y consultar a los estudiantes vinculados. Utiliza Angular para la interfaz, Supabase para autenticación y persistencia, y Vercel para el despliegue.

## Entrega y acceso

| Entregable | Ubicación o evidencia |
| --- | --- |
| Código fuente y contribuciones del equipo | [Repositorio de GitHub](https://github.com/Andresittow/ReactivA), [historial de commits](https://github.com/Andresittow/ReactivA/commits/main/) y [pull requests](https://github.com/Andresittow/ReactivA/pulls?q=is%3Apr) |
| Descripción e instrucciones de ejecución | Este README de la raíz |
| Aplicación funcional | Desplegada en Vercel; enlace definitivo de producción pendiente de incorporar a este documento |
| Video de demostración | No se adjunta un video en esta versión de la documentación |
| Sustentación técnica | Participación de todos los integrantes según el reparto y el guion incluidos al final de este README |

Para una demostración sin conexión a Vercel, se puede ejecutar la aplicación localmente siguiendo las instrucciones de este documento. El inicio de sesión y la persistencia requieren conexión al proyecto Supabase configurado.

## Funcionalidades

| Área | Funcionalidad | Ruta |
| --- | --- | --- |
| Inicio | Presentación de la plataforma | `/home` |
| Autenticación | Registro e inicio de sesión por correo y contraseña; acceso según el rol y cierre de sesión | `/register`, `/login` |
| Panel del estudiante | Actividades, misiones y consulta de progreso | `/dashboard` |
| Tabla periódica | Consulta de elementos, propiedades, representación atómica y juego de parejas | `/periodic-table` |
| Laboratorio virtual | Actividades interactivas de química | `/virtual-lab` |
| Misión orgánica | Actividades por niveles sobre química del carbono | `/mision-organica` |
| Desafíos | Retos, insignias y clasificación por aula o colegio | `/challenges` |
| Perfil | Datos del estudiante, historial y unión a un aula mediante PIN | `/profile` |
| Panel docente | Identidad del docente autenticado y acceso a la gestión de aulas | `/teacher-dashboard` |
| Aulas | Creación y edición de aulas, PIN, consulta de miembros y asignación de talleres | `/my-classrooms` y vista de aulas del panel docente |
| Preferencias y ayuda | Ajustes del usuario y registro de solicitudes de ayuda | `/settings`, `/help` |

Las rutas privadas tienen guards de autenticación y rol. Los permisos sobre los datos se controlan también en Supabase mediante **Row Level Security (RLS)**; los guards del navegador no sustituyen esos permisos.

## Tecnologías y arquitectura

- **Angular 21 y TypeScript:** componentes standalone, rutas con carga diferida y formularios reactivos.
- **Signals y RxJS:** estado de la interfaz y flujos reactivos.
- **HTML y SCSS:** estilos por componente, diseño adaptable y representaciones visuales de las actividades.
- **Supabase Auth y PostgreSQL:** cuentas de usuario, perfiles, progreso, aulas y relaciones entre docentes y estudiantes.
- **Vitest:** pruebas de componentes, servicios y restauración de sesión.
- **GitHub Actions:** validación de TypeScript, pruebas y compilación en los PR.
- **Vercel:** publicación de la salida estática. Las páginas públicas se prerenderizan y las áreas privadas se ejecutan en el navegador.

```text
ReactivA/                         # Raíz del repositorio
├── README.md                     # Documentación de entrega
├── .github/workflows/            # Validación automática
├── supabase/migrations/          # Esquema, funciones y políticas de datos
└── ReactivA/                     # Proyecto Angular; ejecutar npm aquí
    ├── package.json
    ├── angular.json
    ├── vercel.json
    ├── scripts/                  # Compilación y validación de configuración
    └── src/
        ├── environments/         # Configuración por entorno
        └── app/
            ├── core/             # Autenticación, guards, modelos y servicios
            ├── dashboard/
            ├── periodic-table/
            ├── virtual-lab/
            ├── organic-mission/
            ├── challenges/
            ├── teacher-dashboard/
            ├── my-classrooms/
            ├── profile/
            ├── settings/
            └── help/
```

## Ejecutar en el equipo local

### Requisitos

- **Node.js 24.x**, según la configuración del proyecto y del despliegue.
- **npm**, con versión declarada `11.17.0` en el proyecto.
- Git y conexión a Internet para instalar dependencias y acceder a Supabase.

No es necesario instalar Angular CLI globalmente: los comandos npm utilizan la versión del proyecto.

### Instalación

```sh
git clone https://github.com/Andresittow/ReactivA.git
cd ReactivA/ReactivA
npm ci
```

### Configuración de desarrollo

El archivo [environment.development.ts](./ReactivA/src/environments/environment.development.ts) contiene `supabaseUrl` y `supabaseAnonKey` para desarrollo. La copia del repositorio ya incluye la configuración pública del proyecto utilizado por el equipo.

Para utilizar otro proyecto Supabase, reemplaza esos dos valores por su URL y su clave pública `publishable` o `anon`, y prepara su base de datos con las migraciones indicadas más adelante. Nunca introduzcas una clave `service_role`, una clave `sb_secret_...` ni la contraseña de la base de datos en el frontend.

### Iniciar la aplicación

```sh
npm start
```

Abre [http://localhost:4200](http://localhost:4200). El servidor de desarrollo recompila al guardar cambios.

## Preparar una base de datos Supabase propia

Este paso es necesario para un proyecto Supabase nuevo; no es necesario repetirlo para demostrar la aplicación con la base ya configurada del equipo.

En el SQL Editor del proyecto Supabase, ejecuta el contenido completo de cada archivo, uno por uno y en este orden:

1. [202611140000_core.sql](./supabase/migrations/202611140000_core.sql): perfiles, progreso, actividades, preferencias e inicialización de usuarios.
2. [202611150001_classrooms.sql](./supabase/migrations/202611150001_classrooms.sql): aulas, membresías y funciones para generar, renovar y canjear PIN.
3. [202611150002_support_assignments.sql](./supabase/migrations/202611150002_support_assignments.sql): talleres y solicitudes de ayuda.
4. [202611150003_leaderboards.sql](./supabase/migrations/202611150003_leaderboards.sql): función del ranking.
5. [202611150004_private_teacher_invites.sql](./supabase/migrations/202611150004_private_teacher_invites.sql): restricciones de acceso a códigos de registro docente.

Espera el resultado correcto de cada archivo antes de continuar. Si una consulta falla dentro de una transacción, ejecuta `ROLLBACK;` antes de reintentar el archivo corregido. Para una base con tablas creadas manualmente, compara primero su estructura: `CREATE TABLE IF NOT EXISTS` no adapta columnas existentes.

Para registrar un docente, un administrador debe crear un código privado de un solo uso desde SQL Editor:

```sql
insert into public.teacher_invite_codes (code)
values ('REEMPLAZA-POR-UN-CODIGO-PRIVADO-Y-UNICO');
```

El docente utiliza ese código en el registro. No publiques códigos válidos ni contraseñas en el repositorio. La confirmación por correo depende de la configuración de Supabase Auth; los enlaces de confirmación requieren que el origen de la aplicación esté autorizado en Authentication → URL Configuration.

## Pruebas y compilación

Ejecuta estos comandos desde la carpeta interna `ReactivA/`:

```sh
# Comprobar tipos de la aplicación y las pruebas
npm exec tsc -- --noEmit -p tsconfig.app.json
npm exec tsc -- --noEmit -p tsconfig.spec.json

# Ejecutar pruebas sin modo observación
npm test -- --no-watch

# Verificar la validación de configuración de despliegue
npm run test:deploy

# Compilar con configuración de desarrollo
npm run build -- --configuration development
```

Para compilar **producción**, copia [.env.example](./ReactivA/.env.example) a `.env.production` dentro de la carpeta interna y completa:

```dotenv
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_ANON_KEY=TU-CLAVE-PUBLICA
```

Después ejecuta:

```sh
npm run build
```

El script valida la configuración, genera `src/environments/environment.generated.ts` y prepara la salida en `dist/ReactivA/browser`. Tanto el archivo generado como `.env.production` están excluidos de Git. No se editan ni se suben manualmente.

## Despliegue en Vercel

La configuración versionada se encuentra en [vercel.json](./ReactivA/vercel.json).

| Opción | Valor |
| --- | --- |
| Framework | Angular |
| Root Directory | `ReactivA` |
| Node.js | `24.x` |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist/ReactivA/browser` |
| Rama de producción | `main` |
| Rama de integración y Preview | `develop` |

Configura `SUPABASE_URL` y `SUPABASE_ANON_KEY` en Vercel para cada entorno utilizado: **Preview** y **Production**. Los cambios en estas variables se incorporan en la siguiente compilación y requieren un nuevo deployment.

En Supabase → Authentication → URL Configuration, establece el dominio definitivo de producción como **Site URL** y añade las URLs de retorno necesarias en **Redirect URLs**. Para las pruebas en Preview, autoriza también su URL; conserva el origen local si continúas desarrollando.

El despliegue incluye el respaldo de Angular Router para abrir y recargar rutas privadas directamente. La restauración de sesión evita esperar consultas dentro del listener de autenticación de Supabase.

## Demostración funcional

Utiliza cuentas de prueba de ambos roles, con acceso a sus correos si está habilitada la confirmación. No se incluyen credenciales compartidas en este repositorio.

1. Registrar o iniciar sesión como estudiante y abrir el panel.
2. Explorar la tabla periódica y una actividad del laboratorio o de la misión orgánica.
3. Recargar una ruta privada y comprobar que la aplicación vuelve a cargar.
4. Completar una actividad y verificar su progreso después de cerrar y volver a iniciar sesión.
5. Iniciar sesión como docente, comprobar su identidad y crear un aula.
6. Copiar el PIN del aula y cerrar sesión.
7. Entrar como estudiante y unirse desde Perfil utilizando el PIN.
8. Volver al docente y mostrar al estudiante en el listado de miembros.
9. Recargar o volver a iniciar sesión para demostrar que el aula y la membresía persisten.

Estos flujos se comprobaron durante la preparación del despliegue y la validación del Preview por el equipo.

## Equipo y contribuciones

| Integrante | Cuenta de GitHub | Áreas de trabajo |
| --- | --- | --- |
| Andrés | [Andresittow](https://github.com/Andresittow) | Inicio, dashboard del estudiante, tabla periódica, desafíos, integración, validación y preparación del despliegue |
| Valeria Estefanía Góngora Torres | [valeriagongorator](https://github.com/valeriagongorator) | Login, registro, misión orgánica, configuración y panel docente |
| Vanessa | [vanessaucc](https://github.com/vanessaucc) | Navegación lateral, laboratorio virtual, perfil, ayuda y gestión de aulas |

El historial del repositorio y los PR conservan las contribuciones y las integraciones del equipo. Las áreas compartidas se coordinaron mediante las ramas personales y `feature/app-layout`.

El flujo de entrega es **rama de trabajo → PR a `develop` → validación → PR a `main`**. `main` contiene la versión de producción; las mejoras posteriores siguen el mismo flujo.

## Sustentación técnica del equipo

La sustentación debe incluir la intervención de los tres integrantes. Este reparto sirve como guía de exposición y debe acompañarse de una demostración real:

| Participante | Contenido propuesto |
| --- | --- |
| Andrés | Problema educativo, arquitectura general, tabla periódica y desafíos, flujo Git, pruebas y despliegue en Vercel |
| Valeria | Formularios y validaciones, autenticación y roles, misión orgánica y funcionamiento del panel docente |
| Vanessa | Navegación y componentes de interfaz, laboratorio virtual, perfil, creación de aulas y vinculación por PIN |
| Todo el equipo | Demostración del recorrido estudiante–docente, persistencia en Supabase y respuesta a preguntas técnicas |

Temas para explicar: componentes standalone y carga diferida; diferencias entre guards y RLS; relaciones entre perfiles, aulas y miembros; variables públicas de Supabase; restauración de sesión al recargar; y separación entre Preview y Production.

Si se requiere un video, puede seguir el mismo recorrido de demostración y reparto de participación. El enlace debe añadirse a la tabla de entregables cuando exista una grabación disponible.

## Alcance de la versión entregada

La autenticación por correo y contraseña, la persistencia y la gestión de aulas están conectadas a Supabase. Algunas métricas, listados y contenidos de la vista general docente conservan datos de demostración; no deben presentarse como analítica real de todos los estudiantes. Las integraciones escolares externas anunciadas en elementos de la interfaz no forman parte del flujo validado de esta entrega.
