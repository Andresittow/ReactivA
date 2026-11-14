# Trabajo colaborativo de ReactivA

El código Angular está en `ReactivA/`. Se conservan componentes standalone, lazy loading y la arquitectura actual.

| Rama | Responsable | Componentes |
| --- | --- | --- |
| `main` | Andrés, entrega final autorizada | Producción; no se modifica durante el desarrollo |
| `develop` | Andrés | Integración exclusivamente por Pull Request |
| `feature/Valeria` | `valeriagongorator` | login, register, organic-mission, settings, teacher-dashboard |
| `feature/Vanessa` | `vanessaucc` | sidebar, virtual-lab, profile, help, my-classrooms |
| `feature/Andres` | `Andresittow` | dashboard, challenges, periodic-table, home |
| `feature/app-layout` | Compartida, con turno coordinado | app.routes.ts y layout compartido |

## Desarrollo personal

1. Ejecutar `git status`, guardar el trabajo propio y coordinar dependencias antes de cambiar de rama. Nunca trasladar cambios sin confirmar a otra rama.
2. Ejecutar `git fetch origin` y trabajar en la rama personal exacta. Para crear su copia local, usar `git switch --track origin/feature/Valeria` (adaptar al integrante).
3. Revisar `git log --left-right --oneline HEAD...origin/develop` y `git diff HEAD...origin/develop`. Si la rama solo está atrasada, actualizar con `git merge --ff-only origin/develop`. Si diverge, detenerse y acordar con Andrés un merge de sincronización; nunca rebase de historial compartido ni force push.
4. Cambiar únicamente componentes propios. Las dependencias compartidas requieren coordinación con su responsable.
5. Desde `ReactivA/`, instalar con `npm ci`; validar con `npm exec tsc -- --noEmit -p tsconfig.app.json`, `npm exec tsc -- --noEmit -p tsconfig.spec.json`, `npm test -- --watch=false` y `npm run build`.
6. Revisar `git diff --check` y `git diff --cached`. Crear un commit real con la identidad propia: `feat(valeria): ...`, `fix(valeria): ...`, `feat(vanessa): ...`, `fix(vanessa): ...`, `feat(andres): ...`, `fix(andres): ...`. Usar `chore` o `docs` para configuración y documentación.
7. Publicar únicamente con autorización en la rama personal. Abrir PR hacia `develop`, solicitar revisión a Andrés y dejarle el merge. Preferir merge commits para conservar el historial real de las ramas; no exigir historial lineal.

No hacer push directo a `main` o `develop`, borrar ramas, reescribir commits, modificar autores históricos ni usar credenciales ajenas. Verificar nombre y correo con `git var GIT_AUTHOR_IDENT`; configurar solo `git config --local` con los datos propios. La configuración local no se comparte con otros clones.

## Turnos de rutas en feature/app-layout

1. Terminar el componente y sus pruebas en la rama personal.
2. Andrés revisa e integra su PR en `develop`.
3. Acordar en el equipo quién ocupa `feature/app-layout` y durante qué cambio; solo una persona a la vez. Revisar PR abiertos de la rama antes de empezar.
4. Con árbol limpio, hacer fetch, cambiar a `feature/app-layout` y actualizar desde `origin/develop` mediante avance directo cuando sea posible. Si diverge, coordinar con Andrés; no integrar automáticamente.
5. Confirmar que el componente ya existe en `origin/develop`. Añadir únicamente la ruta necesaria, respetando lazy loading, aliases, redirects y guards existentes. No duplicar ni eliminar rutas funcionales.
6. Validar imports, TypeScript, tests, build y navegación. Usar `feat(routes): ...` o `fix(routes): ...`.
7. Con autorización, publicar la rama compartida y abrir PR hacia `develop`. Andrés revisa e integra; liberar el turno.

## Git Graph

Abrir la raíz del repositorio en VS Code. Instalar la extensión recomendada `mhutchie.git-graph` y ejecutar **Git Graph: View Git Graph**. La configuración del workspace está verificada contra Git Graph 1.30.0: todas las ramas por defecto, remotas visibles, etiquetas locales y remotas separadas y fecha de autor. Si la vista conserva filtros anteriores, seleccionar **Show All** y habilitar **Show Remote Branches** en la propia vista.

Las columnas Author, Date y Commit identifican la actividad real. Las ramas que comparten commit comparten nodo: no crear commits para separar líneas ni asignar colores artificiales. Los autores existentes se conservan.

## Límites actuales

Login y registro son una demostración de formularios y navegación por rol; no autentican contra un backend. Elegir docente no concede autorización real. No registrar formularios con contraseñas en consola ni persistir contraseñas en el navegador.

El presupuesto de estilos conserva advertencias a 20 kB y ajusta el error de 25 a 55 kB para admitir el CSS existente (máximo observado: periodic-table, 51,94 kB). Esto no reduce CSS ni altera el diseño: la optimización sigue pendiente de los responsables. No aumentar otra vez el límite para ocultar crecimiento. Se mantienen los límites del bundle inicial de 500 kB/1 MB.

Las protecciones remotas requieren configuración administrativa por Andrés; ver [propuesta de protección](docs/PROTECCION_GITHUB.md). Una plantilla o un workflow por sí solos no restringen quién puede hacer merge.
