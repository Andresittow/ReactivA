# Propuesta para Andrés: protección de ramas

Preparada para revisión; no aplica cambios remotos.

## Situación verificada el 13 de noviembre de 2026

Repositorio personal público `Andresittow/ReactivA`, rama predeterminada `develop`. Las ramas `main` y `develop` indicaron `protected: false`; la consulta de rulesets devolvió una lista vacía. Valeria tiene escritura y carece de administración. Andrés debe configurar las reglas.

## Configuración propuesta

- Proteger exactamente `main` y `develop`; exigir Pull Request, impedir force pushes y eliminación.
- Exigir el check `Angular / validar` cuando el workflow haya corrido en GitHub y se confirme su nombre en la interfaz. No configurar checks inexistentes.
- Exigir revisión, descartar aprobaciones al llegar nuevos commits y restringir la desestimación de revisiones y los bypass.
- Conservar merge commits y las ramas permanentes; no activar borrado automático de ramas ni imponer historial lineal.
- `main`: entrega final solo con autorización expresa de Andrés. No usarla como destino de PR de desarrollo.

## Aprobación y permiso de integración son distintos

Un CODEOWNERS con `* @Andresittow`, junto con revisión obligatoria de propietarios, exige su aprobación en los cambios cubiertos, pero no bloquea el botón de merge para los demás colaboradores con permisos. No se añade automáticamente: Andrés debe decidir antes la excepción para PR propios, porque GitHub no permite autoaprobarlos.

En repositorios personales las restricciones clásicas de quién puede hacer push a ramas protegidas no ofrecen las mismas opciones que en organizaciones. No afirmar exclusividad técnica sin comprobar las opciones del plan y de los rulesets. Para una separación sostenible, evaluar trasladar el repositorio a una organización: dar escritura a integrantes en sus ramas y restringir actualizaciones de `develop` y `main` a Andrés mediante las reglas disponibles. Combinar esta restricción con PR obligatorio, sin bypass general que permita push directo.

Antes de activar reglas, acordar cómo revisar los PR escritos por Andrés: un segundo revisor designado o un procedimiento administrativo de excepción explícito y auditado. Exigir exclusivamente su aprobación sin excepción bloquearía sus propios PR.

Si el plan actual no permite esa restricción, el acuerdo de que solo Andrés integre será organizativo, no una garantía técnica. Revocar escritura a los demás permite reservar la integración al propietario, pero impide trabajar por push en las ramas compartidas del único repositorio; no cumple el flujo solicitado sin cambiarlo.

## Verificación administrativa

1. Elegir mecanismo compatible con el tipo y plan del repositorio y aprobar la excepción de PR propios.
2. Publicar e integrar primero el workflow por PR; comprobar su ejecución real.
3. Aplicar protecciones con la cuenta de Andrés y sin bypass amplios.
4. Verificar con las cuentas del equipo que pueden publicar en su rama, no pueden hacer push directo a las protegidas y no pueden integrar PR si no son Andrés.
5. Revisar permisos de aplicaciones, administradores y excepciones; documentar cualquier bypass.

Referencias oficiales:
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners
