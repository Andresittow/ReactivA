# feat(valeria): PR-L2 — preferencias por cuenta y progreso de Misión Orgánica

Destino: `develop`. Origen: `feature/Valeria`. Revisión e integración: Andrés.

Settings guardaba un perfil ficticio y preferencias en localStorage, y simulaba las acciones
de seguridad. Ahora lee el perfil de AuthService y persiste las preferencias en user_settings,
filtradas por el usuario autenticado. Actualiza nombre y avatar con updateProfile, contraseña
con updatePassword, otras sesiones con signOutOthers y salida con signOut. Correo y rol son
solo lectura. Nombre de usuario, eliminación, 2FA, mensajes, notificaciones y asistencia
pedagógica sin consumidor quedan deshabilitados con «Próximamente». Docentes no ven
aprendizaje, notificaciones académicas ni preferencias de ranking de estudiante.

SettingsService implementa load/save/apply/init, valida los datos recibidos, comprueba errores
de Supabase, ignora respuestas tardías de otra sesión y restablece las preferencias al salir.
init es idempotente y observa cambios de cuenta. El tema del sistema responde a matchMedia
con limpieza del listener. Se aplican clases/atributos a html y estilos globales para tema,
tamaño de fuente, movimiento reducido, contraste, fuente legible y objetivos táctiles.
Solo el tema se almacena como comodidad visual (`reactiva_theme`); se eliminan las antiguas
claves de preferencias/perfil sin importar datos. SSR no consulta storage ni modifica DOM.

Misión Orgánica guarda niveles, vidas, puntos, preguntas, insignias y recompensas concedidas
con StudentProgressService.saveModuleProgress('organic-mission', …), tras hidratar su caché.
Respuestas y bonificaciones conceden XP mediante addXp y eventos mediante LearningEventsService.
El registro de recompensas evita repetir XP al contestar de nuevo, reintentar, reiniciar o
recargar; no es un control transaccional entre pestañas. Las instantáneas se clonan al guardar.
El estado local se vacía al cambiar de cuenta o salir y descarta cargas tardías de otra cuenta.
La clave antigua reactiva_mision_organica_progress se elimina sin importar datos anónimos.

Se retiran el fallback de nombre, el PIN fijo y la dependencia de TeacherDashboardService.
El banner muestra únicamente nombre/PIN del aula real de ClassroomService.getMyClassroom;
sin aula se oculta. Un fallo de aula permite reintentar y continuar la misión. La orientación
permanece detrás de getStudentGuidance/clearStudentGuidance en GameService, pendiente de PR-L3,
sin mensajes simulados ni tabla nueva.

## Alcance y migraciones

Solo settings, organic-mission (incluye modelos/servicio y specs propios), SettingsService,
estilos globales y documentación. No se modificaron app.*, core/auth, StudentProgressService,
LearningEventsService, ClassroomService ni componentes de Andrés/Vanessa. No se inició PR-L3.
No hay SQL nuevo: user_settings y module_progress ya están en la migración base con RLS.
Por tanto no hay migración que aplicar en este PR; cualquier futura deberá ser repetible
y llevar un nombre posterior a 202611150003.

Los cambios de documentación de PR-L1 que estaban sin commitear se conservan en
[registro anterior](../avance/valeria-pr-l1.md); se continúa la bitácora existente.
No se hicieron commit, push, merge ni cambios de rama.

## Validación

- 190 pruebas en 18 archivos aprobadas con el ajuste de entorno de Node 24 indicado abajo.
  Incluyen servicio y componente Settings, juego, aula real, SSR, cargas tardías, cambio de
  usuario, persistencia, errores y recompensas sin duplicados dentro de una secuencia de juego.
- TypeScript app/spec aprobados. Build de producción aprobado; conserva avisos de presupuesto
  CSS existentes (Settings 28,29 kB frente al aviso de 20 kB; límite de error sin cambios).
- git diff --check aprobado. Build ejecutado fuera del sandbox porque esbuild aborta dentro.
- No se probaron Supabase dev, RLS ni navegador a mano; ver lista siguiente.

Comandos desde `ReactivA/`:

```sh
npm ci
npm exec tsc -- --noEmit -p tsconfig.app.json
npm exec tsc -- --noEmit -p tsconfig.spec.json
NODE_OPTIONS=--no-experimental-webstorage npm test -- --watch=false
npm run build
```

El comando original `npm test -- --watch=false` también se ejecutó: 185 pasan y fallan
únicamente las 5 pruebas preexistentes de sidebar por localStorage experimental de Node
24.16.0. Los specs nuevos de PR-L2 usan dobles de storage y pasan también sin el ajuste.
No se modificó el workflow ajeno: no se afirma que el CI remoto esté en verde.

## Requiere de otros

- Andrés: propagar errores/estado de sincronización y asociar la caché a un usuario en
  StudentProgressService. hydrate atrapa excepciones y no comprueba todas las respuestas de
  Supabase; saveModuleProgress/addXp devuelven void y no comunican el rechazo de escritura.
  PR-L2 muestra error/reintento si hydrate rechaza, pero el contrato actual puede tratar
  una lectura fallida como progreso vacío y no permite confirmar un guardado remoto fallido.
  Además, las hidrataciones simultáneas de cuentas distintas deben descartarse en el núcleo:
  GameService descarta sus propias cargas tardías, pero no puede certificar el dueño de una
  caché compartida sin esa información. No se alteraron esos archivos.
- Andrés: LearningEventsService no comprueba el `error` de insert; verificar/proporcionar
  manejo de fallos del registro de eventos. PR-L2 lo consume mediante su contrato actual.
- Andrés/Vanessa: resolver los 5 fallos de storage del sidebar o aplicar el ajuste de Node
  al entorno CI, como ya se anotó en PR-L1.
- Nombre de usuario no existe en UserProfile ni en el patch de AuthService.updateProfile:
  se mantiene deshabilitado. Si se desea habilitar, coordinar modelo/columna/contrato.
- PR-L3 de Valeria: tabla teacher_guidance con RLS y lectura/marcado de mensajes detrás de
  los métodos preparados; panel docente real. La verificación visual de XP en ese panel
  queda pendiente de esa fase. En PR-L2 comprobar las filas learning_events/module_progress.
- Concurrencia y atomicidad entre XP, progreso y eventos siguen siendo las del núcleo;
  el registro de recompensas del juego evita repeticiones normales, no sustituye un RPC
  transaccional ni evita conflictos entre dos pestañas que jueguen a la vez.

## Pendiente de probar

En Supabase dev, tras integrar, usar dos estudiantes A/B y un docente, sin commitear credenciales:

1. Settings de A: comprobar nombre/correo/rol reales, editar nombre y elegir avatar; recargar
   y verificar persistencia en profiles. Correo/rol/usuario no deben ser editables. Provocar
   error de red al guardar y comprobar aviso sin éxito falso y posibilidad de reintentar.
2. Elegir oscuro/claro/sistema; comprobar Settings, dashboard, menú y Misión Orgánica,
   recargar y navegar entre páginas. En sistema, cambiar el tema del SO con la app abierta.
   Probar los tres tamaños de fuente, movimiento reducido, alto contraste, fuente legible
   y objetivos táctiles. Revertir y comprobar que vuelve el diseño claro por defecto.
3. Comprobar user_settings de A: preferencias guardadas y únicamente su fila accesible con
   su sesión. Probar perfil privado/público/institucional y mostrar progreso en ranking.
   Salir y entrar como B en el mismo navegador: no heredar ajustes de A; volver a A y
   restaurarlos. Verificar que localStorage no contiene perfil, preferencias completas ni
   progreso (solo reactiva_theme para esta funcionalidad).
4. Con docente abrir /settings: ver su perfil, cuenta/apariencia/seguridad/accesibilidad;
   no ver aprendizaje, avisos académicos ni opciones de ranking. Confirmar «Próximamente»
   deshabilitado para usuario, 2FA, eliminación, mensajes, avisos y asistencia sin consumidor.
5. Contraseña: rechazar menos de 8, sin letra, sin número o confirmación distinta. Cambiarla
   con sesión válida y comprobar nuevo login; probar rechazo/sesión antigua y error de red:
   mostrar error, mantener el modal y poder reintentar. Cerrar otras sesiones con dos navegadores:
   confirmar que el otro pierde acceso y el actual se conserva. Cerrar sesión desde Mi Cuenta.
6. Misión con A sin progreso: empezar con 0 puntos/5 vidas; contestar bien/mal, recargar y
   comprobar puntos, vidas y preguntas persistidas en module_progress. Completar un nivel;
   comprobar XP en dashboard/perfil y filas learning_events con module='organic-mission'.
7. Repetir una pregunta, reintentar nivel y reiniciar misión: comprobar que el puntaje del
   juego puede recomenzar, pero no concede otra vez el XP de preguntas/niveles ya premiados.
   Completar todos los niveles: bonus final e insignias una sola vez. Probar recarga entre pasos.
8. En el mismo navegador salir de A, entrar B y abrir misión: estado propio sin progreso de
   A; volver a A y restaurar. Probar también cierre de sesión con la misión abierta y cambios
   rápidos de cuenta; verificar especialmente la dependencia de caché del núcleo descrita arriba.
9. Inscribir A en un aula real: mostrar nombre y join_pin reales. B sin aula no ve banner.
   Fallo de carga de aula: mostrar reintento sin bloquear el juego. No mostrar orientación
   inventada; el envío/lectura real se probará en PR-L3.
10. Red lenta/cortada y almacenamiento local bloqueado: Settings debe mostrar error y permitir
    reintento; confirmar en Supabase si el progreso/XP/eventos llegaron. Hasta resolver el
    contrato de errores del núcleo, no interpretar la UI del juego como confirmación remota.
    Con las sesiones A/B comprobar RLS: ninguna puede leer/escribir la fila de la otra.
