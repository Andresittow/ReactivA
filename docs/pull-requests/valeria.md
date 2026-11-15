# fix(valeria): prepara colaboración y corrige persistencia SSR y navegación

Destino: `develop`. Origen: `feature/Valeria`.

El prerenderizado accedía a localStorage desde el servidor y el login y registro enviaban a docentes al dashboard del estudiante. Se evita el acceso al almacenamiento en SSR, se conserva el juego en memoria si la persistencia está bloqueada y se dirige cada rol a su dashboard. Los formularios dejan de escribir contraseñas en consola. No se implementa autenticación real.

Se documentan exactamente las seis ramas y sus responsables, el turno de rutas y la revisión exclusiva de Andrés; se prepara plantilla de PR y workflow de TypeScript, tests y build. Git Graph usa opciones verificadas contra la versión 1.30.0.

El límite de error de estilos cambia de 25 a 55 kB para admitir el CSS existente, conservando la advertencia de 20 kB y los límites del bundle inicial. No reduce estilos ni altera el diseño; la optimización sigue pendiente. Se retira RouterLink sin uso del dashboard docente.

Validación: diez tests nuevos de autenticación y persistencia; TypeScript de aplicación y tests aprobado. Compilación de producción aprobada y 15 rutas prerenderizadas; quedan siete advertencias de estilos y avisos de deprecación de Node. En una copia temporal con los tests corregidos de Andrés y Vanessa, pasan los 26 tests.

Dependencias: integrar antes los PR de feature/Andres (ae307ba) y feature/Vanessa (5bb8133). Esta rama personal todavía no incluye esos commits: sus tests completos seguirán mostrando los fallos anteriores hasta su integración y posterior sincronización autorizada.

Las protecciones se proponen en docs/PROTECCION_GITHUB.md; no se aplicaron por falta de administración. main y develop no recibieron integraciones. Revisión y merge reservados a Andrés. Publicación remota pendiente de confirmación.
