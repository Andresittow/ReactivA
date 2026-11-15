# Guía de Migraciones de Base de Datos (Supabase) — ReactivA

Este directorio contiene las migraciones oficiales de PostgreSQL para el proyecto Supabase (`reactiva-dev` y `reactiva-prod`).

## Convención de Nombres
Cada migración sigue el formato timestamp: `AAAAMMDDHHMM_<tema>.sql`.  
Las migraciones se ejecutan estrictamente en orden cronológico ascendente.

## Migraciones Disponibles

1. **`202611140000_core.sql`** (Andrés — Fase 0)
   - Tablas base del sistema: `teacher_invite_codes`, `profiles`, `student_progress`, `student_tasks`, `student_challenges`, `student_badges`, `module_progress`, `learning_events`, `user_settings`.
   - Función auxiliar `is_teacher_of(student_uuid uuid)`.
   - Trigger `prevent_role_change` en `profiles`.
   - Trigger `on_auth_user_created` en `auth.users` que valida el código docente para el rol `docente` y crea automáticamente el perfil y la fila de `student_progress`.
   - Políticas completas de Row Level Security (RLS) en todas las tablas.

## Cómo Aplicar en Supabase

### Opción A: Desde el SQL Editor de Supabase (Recomendado para Dev)
1. Inicia sesión en el dashboard de Supabase y selecciona el proyecto `reactiva-dev`.
2. Dirígete a la pestaña **SQL Editor** en el menú lateral.
3. Haz clic en **New query**.
4. Copia y pega el contenido completo de `supabase/migrations/202611140000_core.sql`.
5. Haz clic en **Run** (o presiona `Ctrl + Enter`).
6. Verifica que la salida indique éxito (`Success. No rows returned`).
7. Inserta al menos un código de invitación para habilitar el registro docente:
   ```sql
   INSERT INTO public.teacher_invite_codes (code) VALUES ('DOCENTE-2026') ON CONFLICT DO NOTHING;
   ```

### Opción B: Usando Supabase CLI
```bash
supabase link --project-ref <tu-project-ref>
supabase db push
```

## Próximas Migraciones del Equipo
- **Vanessa (PR-V1):** `classrooms`, `classroom_members`, actualización de `is_teacher_of()`, RPCs `join_classroom` y `regenerate_pin`.
- **Vanessa (PR-V2):** `assignments`, `help_requests`, bucket storage `avatars`.
- **Andrés (PR-A2):** RPC `get_leaderboard(scope text)`.
- **Valeria (PR-L3):** `teacher_guidance`, RPCs/vistas analíticas del panel docente.
