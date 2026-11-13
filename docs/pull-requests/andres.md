# fix(andres): corrige configuración de pruebas del dashboard

Destino: `develop`. Origen: `feature/Andres`. Commit: `ae307ba`.

Los nueve tests del dashboard fallaban porque RouterLink no tenía ActivatedRoute. Se añade provideRouter([]) y se aísla Web Storage con un almacenamiento en memoria nuevo por prueba; así no depende de persistencia previa ni del soporte de Web Storage en Node.

Validación: nueve tests del dashboard aprobados. En la copia conjunta de las tres ramas, TypeScript de aplicación y tests pasa y los 26 tests pasan.

No cambia el componente ni el comportamiento de producción. El commit conserva como autora real a Valeria, quien preparó la corrección en esta rama. Revisión e integración pendientes de Andrés. Publicación remota pendiente de confirmación.
