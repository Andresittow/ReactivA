# Validación local de la preparación colaborativa

Fecha: 13 de noviembre de 2026. Base de integración: `276af18`.

## Cambios separados por rama

- `feature/Valeria`: documentación, Git Graph, workflow y plantilla de PR, límite de estilos documentado, persistencia SSR y navegación por rol. Diez tests nuevos.
- `feature/Andres`: provideRouter y aislamiento de persistencia para los nueve tests del dashboard (`ae307ba`).
- `feature/Vanessa`: expectativa en español en el test de búsqueda de laboratorio (`5bb8133`).
- `feature/app-layout`: actualizada localmente por avance directo hasta develop. No se modificaron rutas porque ya existen todas las necesarias.
- `develop`: copia local de la referencia remota, sin integración de cambios nuevos.
- `main`: permanece en `8cd3cb8`.

Todos los nuevos commits tienen como autora real a Valeria; el nombre de rama identifica el área responsable, no cambia la autoría. Solo se configuró identidad Git local. Las referencias remotas se actualizaron mediante fetch y origin/HEAD ahora coincide con develop, la rama predeterminada de GitHub.

## Evidencia ejecutada

| Comprobación | Resultado |
| --- | --- |
| TypeScript de aplicación, `tsc --noEmit -p tsconfig.app.json` | Aprobado |
| TypeScript de tests, `tsc --noEmit -p tsconfig.spec.json` | Aprobado |
| Tests de Valeria (login, register y GameService) | 10 aprobados |
| Tests de dashboard en feature/Andres | 9 aprobados |
| Tests de virtual-lab en feature/Vanessa | 5 aprobados |
| Suite conjunta en copia temporal | 26 aprobados, 7 archivos |
| Build de producción con cambios de Valeria y build de copia conjunta | Aprobados, 15 rutas prerenderizadas |
| Opciones de Git Graph | Verificadas con el package.json de 1.30.0 |

Para comprobar compatibilidad conjunta se copió el árbol de Valeria a una carpeta temporal y se superpusieron exclusivamente los dos archivos de test de las ramas de Andrés y Vanessa. Esto no hizo merges ni modificó develop. Cada rama conserva sus propios cambios: no afirmar que la suite completa de cada rama aislada está aprobada.

La compilación se ejecutó fuera del sandbox porque dentro se abortaba. Se limitó a un worker con NG_BUILD_MAX_WORKERS=1. Continúan siete advertencias de CSS sobre 20 kB y avisos de Node sobre module.register. El límite de error ahora es 55 kB; no se optimizó CSS. La copia usa las dependencias ya instaladas: no equivale a ejecutar npm ci ni el workflow remoto en Linux.

## Revisión y publicación pendientes

Los cuerpos de los tres PR están en [pull-requests](pull-requests/). Publicar requiere confirmación del usuario. Orden sugerido a Andrés: tests de Andrés y Vanessa primero, luego configuración y correcciones de Valeria. Antes de cada integración, revisar diferencias y volver a validar la base actualizada; sincronizar ramas divergentes únicamente con autorización para un merge de actualización. No usar rebase compartido ni force push.

No se ejecutó navegación manual en navegador ni autenticación contra backend. Login y registro siguen siendo una demostración de interfaz. La protección efectiva y la exclusividad de integración requieren la intervención administrativa de Andrés. El workflow no se ha ejecutado en GitHub y todavía no debe configurarse como check obligatorio sin verificar su nombre real.
