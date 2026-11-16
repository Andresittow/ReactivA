# feat(valeria): PR-L1 — flujo de acceso con Supabase

Destino: `develop`. Origen: `feature/Valeria`. Revisión e integración: Andrés.

Login y registro pasan de navegación simulada a AuthService real, con carga y bloqueo
de doble envío. Login transmite rememberMe y rol esperado; usa returnUrl solo para rutas
internas conocidas y permitidas al rol, y navega con replaceUrl. Los errores se presentan
por AuthError.code sin exponer mensajes internos. Recuperación de contraseña con correo
validado y respuesta neutra tanto ante éxito como ante error.

Registro valida nombre, correo, colegio, contraseña de mínimo 8 con letra y número,
confirmación, términos y grado solo para estudiante. Docente requiere invitación enviada
al servidor. DOCENTE-2026 ya existe en dev; no se crea ni se incorpora al código del producto.
Con sesión inmediata navega al inicio; sin sesión muestra «Revisa tu correo» sin navegar.

El PIN se normaliza y persiste temporalmente como pendingClassPin en sessionStorage,
incluso al esperar confirmación por correo. Se consume solo tras autenticación de estudiante.
Un fallo al canjearlo muestra aviso y botón para continuar al inicio sin invalidar la sesión.
El almacenamiento bloqueado no impide autenticarse. Estados asíncronos actualizados mediante
markForCheck para Angular zoneless. Sin cambios al diseño salvo feedback y modales mínimos.

Validación: 158 tests aprobados en 15 archivos (incluye guards existentes de sesión/rol),
TypeScript app/spec y build de producción aprobados. Se mantienen advertencias de presupuesto
CSS existentes. Build local requiere salir del sandbox: dentro aborta con código 134.
No se ejecutaron commit ni push. No hay migraciones nuevas.

Cinco comandos validados desde `ReactivA/`:

```sh
npm ci
npm exec tsc -- --noEmit -p tsconfig.app.json
npm exec tsc -- --noEmit -p tsconfig.spec.json
NODE_OPTIONS=--no-experimental-webstorage npm test -- --watch=false
npm run build
```

## Requiere de otros

- Andrés: el workflow actual usa `npm test -- --watch=false` sin NODE_OPTIONS. Con Node
  24.16.0 ese comando falla en 5 pruebas existentes del sidebar por localStorage indefinido.
  Con `--no-experimental-webstorage` pasan los 158 tests usando almacenamiento de jsdom.
  Aplicar el ajuste al entorno CI o coordinar la solución con Vanessa. No se modificó el workflow.
- Andrés: AuthError compartido aún contiene el mensaje de contraseña de 6 caracteres.
  Estos formularios lo sustituyen por el mensaje de 8 con letra/número mediante el código
  weak_password; actualizar el mensaje compartido para futuros consumidores.
- La validación docente depende del trigger de Supabase; si Auth oculta su excepción como
  error genérico de base de datos, se mostrará un error genérico seguro, no una causa inventada.
- El enlace de recuperación lo configura AuthService hacia /login. PR-L1 solicita el correo;
  verificar el recorrido del enlace y coordinar con Andrés la pantalla para establecer la
  nueva contraseña si aún falta. No se cambió el contrato compartido.

## Pendiente de probar

Tras integrar el PR, en Supabase dev y navegador:

1. Registro estudiante: correo nuevo, nombre, colegio, grado, términos y contraseña válida;
   rechazar contraseñas de 7 caracteres, sin letra o sin número, y confirmación distinta.
   Si Confirm email está activo: ver «Revisa tu correo», permanecer en /register sin dashboard;
   confirmar el correo y luego iniciar sesión. Si está desactivado: ir a /dashboard con sesión.
   Comprobar ambos modos en dev cambiando la configuración de forma coordinada.
2. Registro docente válido: seleccionar docente, completar colegio y usar DOCENTE-2026;
   confirmar que no exige grado, que se crea perfil docente y que el destino con sesión es
   /teacher-dashboard. Sin sesión, comprobar la pantalla de correo y luego login docente.
   El código es de un solo uso: coordinar reposición u otro código para repetir el escenario.
3. Registro docente inválido: código inventado, vacío o ya usado; vacío bloquea el formulario,
   los otros reciben rechazo del servidor, muestran error y no abren dashboard docente.
4. Login de ambos roles: credenciales correctas e incorrectas, correo sin confirmar, selector
   equivocado, Recordarme activado y desactivado. Comprobar destino de cada rol y persistencia
   al cerrar/reabrir navegador; verificar error de red y bloqueo de doble clic.
5. «Atrás» tras login y registro con sesión inmediata: no recuperar formularios utilizables de
   acceso ni volver a una ruta privada sin autorización. Probar returnUrl permitido, de otro rol
   y externo: solo el permitido debe conservarse.
6. /login y /register con sesión activa: escribir ambas URL para estudiante y docente;
   comprobar redirección al inicio correspondiente sin mostrar el formulario.
7. Recuperar contraseña: abrir modal, rechazar correo inválido, enviar correo existente y
   desconocido y comparar respuesta neutra; probar fallo de red. Verificar llegada del correo,
   enlace y recorrido real de cambio de contraseña (dependencia compartida arriba).
8. PIN pendiente tras login: guardar un PIN real desde login, iniciar sesión estudiante y
   comprobar membresía y borrado de pendingClassPin. Repetir con PIN inválido, aula llena
   y membresía existente: ver aviso y poder continuar con sesión. Un login docente no lo canjea.
   Repetir registro estudiante con PIN con y sin confirmación de correo: sin sesión debe
   conservarse hasta el login; con sesión debe canjearse. Probar almacenamiento bloqueado.
