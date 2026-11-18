-- =============================================================================
-- Migración Base Fase 0: Cimientos del Modelo de Datos de ReactivA (Idempotente)
-- Archivo: supabase/migrations/202611140000_core.sql
-- Autor: Andrés (Integrador)
-- =============================================================================

-- 1. Tabla: teacher_invite_codes (Códigos de invitación para docentes)
create table if not exists public.teacher_invite_codes (
    code text primary key,
    used_by uuid references auth.users(id) on delete set null,
    created_at timestamp with time zone default now() not null
);

alter table public.teacher_invite_codes enable row level security;

drop policy if exists "Lectura de codigos de invitacion" on public.teacher_invite_codes;
create policy "Lectura de codigos de invitacion"
    on public.teacher_invite_codes
    for select
    to authenticated
    using (used_by is null or used_by = auth.uid());

-- 2. Tabla: profiles (Perfiles de usuario vinculados a auth.users)
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    role text not null check (role in ('estudiante', 'docente')) default 'estudiante',
    full_name text not null default '',
    grade text,
    school text,
    avatar_url text,
    newsletter boolean not null default false,
    created_at timestamp with time zone default now() not null
);

alter table public.profiles enable row level security;

-- Función auxiliar: is_teacher_of(student_uuid uuid)
-- NOTA: Mientras Vanessa no cree la tabla 'classroom_members' en PR-V1,
-- devuelve false de forma segura. Vanessa actualizará el cuerpo de esta función.
create or replace function public.is_teacher_of(student_uuid uuid)
returns boolean
language plpgsql
security definer
stable
as $$
begin
    if exists (
        select 1 from information_schema.tables 
        where table_schema = 'public' and table_name = 'classroom_members'
    ) then
        return exists (
            select 1 
            from public.classrooms c
            join public.classroom_members cm on cm.classroom_id = c.id
            where c.teacher_id = auth.uid() and cm.student_id = student_uuid
        );
    end if;

    return false;
end;
$$;

drop policy if exists "Perfiles visibles por el propio usuario o su docente" on public.profiles;
create policy "Perfiles visibles por el propio usuario o su docente"
    on public.profiles
    for select
    to authenticated
    using (auth.uid() = id or public.is_teacher_of(id));

drop policy if exists "El propio usuario actualiza su perfil" on public.profiles;
create policy "El propio usuario actualiza su perfil"
    on public.profiles
    for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- Trigger para evitar que el cliente modifique su propio role en profiles
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
as $$
begin
    if new.role <> old.role then
        raise exception 'No está permitido modificar el rol de usuario asignado.';
    end if;
    return new;
end;
$$;

drop trigger if exists tr_prevent_role_change on public.profiles;
create trigger tr_prevent_role_change
    before update on public.profiles
    for each row
    execute function public.prevent_role_change();

-- 3. Tabla: student_progress (Progreso global del estudiante)
create table if not exists public.student_progress (
    student_id uuid primary key references auth.users(id) on delete cascade,
    xp integer not null default 0,
    level integer not null default 1,
    streak_days integer not null default 0,
    last_active_date date default current_date not null
);

alter table public.student_progress enable row level security;

drop policy if exists "Progreso visible por el estudiante o su docente" on public.student_progress;
create policy "Progreso visible por el estudiante o su docente"
    on public.student_progress
    for select
    to authenticated
    using (auth.uid() = student_id or public.is_teacher_of(student_id));

drop policy if exists "El estudiante actualiza su progreso" on public.student_progress;
create policy "El estudiante actualiza su progreso"
    on public.student_progress
    for all
    to authenticated
    using (auth.uid() = student_id)
    with check (auth.uid() = student_id);

-- 4. Tabla: student_tasks (Misiones diarias del estudiante)
create table if not exists public.student_tasks (
    student_id uuid not null references auth.users(id) on delete cascade,
    task_id text not null,
    completed boolean not null default false,
    primary key (student_id, task_id)
);

alter table public.student_tasks enable row level security;

drop policy if exists "Tareas visibles por el estudiante o su docente" on public.student_tasks;
create policy "Tareas visibles por el estudiante o su docente"
    on public.student_tasks
    for select
    to authenticated
    using (auth.uid() = student_id or public.is_teacher_of(student_id));

drop policy if exists "El estudiante gestiona sus tareas" on public.student_tasks;
create policy "El estudiante gestiona sus tareas"
    on public.student_tasks
    for all
    to authenticated
    using (auth.uid() = student_id)
    with check (auth.uid() = student_id);

-- 5. Tabla: student_challenges (Desafíos y retos del estudiante)
create table if not exists public.student_challenges (
    student_id uuid not null references auth.users(id) on delete cascade,
    challenge_id text not null,
    current_progress integer not null default 0,
    claimed boolean not null default false,
    primary key (student_id, challenge_id)
);

alter table public.student_challenges enable row level security;

drop policy if exists "Desafios visibles por el estudiante o su docente" on public.student_challenges;
create policy "Desafios visibles por el estudiante o su docente"
    on public.student_challenges
    for select
    to authenticated
    using (auth.uid() = student_id or public.is_teacher_of(student_id));

drop policy if exists "El estudiante gestiona sus desafios" on public.student_challenges;
create policy "El estudiante gestiona sus desafios"
    on public.student_challenges
    for all
    to authenticated
    using (auth.uid() = student_id)
    with check (auth.uid() = student_id);

-- 6. Tabla: student_badges (Insignias desbloqueadas por el estudiante)
create table if not exists public.student_badges (
    student_id uuid not null references auth.users(id) on delete cascade,
    badge_id text not null,
    unlocked_at timestamp with time zone default now() not null,
    primary key (student_id, badge_id)
);

alter table public.student_badges enable row level security;

drop policy if exists "Insignias visibles por el estudiante o su docente" on public.student_badges;
create policy "Insignias visibles por el estudiante o su docente"
    on public.student_badges
    for select
    to authenticated
    using (auth.uid() = student_id or public.is_teacher_of(student_id));

drop policy if exists "El estudiante gestiona sus insignias" on public.student_badges;
create policy "El estudiante gestiona sus insignias"
    on public.student_badges
    for all
    to authenticated
    using (auth.uid() = student_id)
    with check (auth.uid() = student_id);

-- 7. Tabla: module_progress (Progreso específico de cada módulo/minijuego)
create table if not exists public.module_progress (
    student_id uuid not null references auth.users(id) on delete cascade,
    module text not null check (module in ('periodic-table', 'memory', 'virtual-lab', 'organic-mission')),
    data jsonb not null default '{}'::jsonb,
    updated_at timestamp with time zone default now() not null,
    primary key (student_id, module)
);

alter table public.module_progress enable row level security;

drop policy if exists "Progreso de modulo visible por estudiante o docente" on public.module_progress;
create policy "Progreso de modulo visible por estudiante o docente"
    on public.module_progress
    for select
    to authenticated
    using (auth.uid() = student_id or public.is_teacher_of(student_id));

drop policy if exists "El estudiante gestiona su progreso de modulo" on public.module_progress;
create policy "El estudiante gestiona su progreso de modulo"
    on public.module_progress
    for all
    to authenticated
    using (auth.uid() = student_id)
    with check (auth.uid() = student_id);

-- 8. Tabla: learning_events (Registro de actividad y eventos de aprendizaje)
create table if not exists public.learning_events (
    id uuid primary key default gen_random_uuid(),
    student_id uuid not null references auth.users(id) on delete cascade,
    classroom_id uuid null,
    module text not null,
    title text not null,
    detail text,
    xp integer not null default 0,
    created_at timestamp with time zone default now() not null
);

alter table public.learning_events enable row level security;

drop policy if exists "Eventos de aprendizaje visibles por estudiante o docente" on public.learning_events;
create policy "Eventos de aprendizaje visibles por estudiante o docente"
    on public.learning_events
    for select
    to authenticated
    using (auth.uid() = student_id or public.is_teacher_of(student_id));

drop policy if exists "El estudiante inserta sus eventos de aprendizaje" on public.learning_events;
create policy "El estudiante inserta sus eventos de aprendizaje"
    on public.learning_events
    for insert
    to authenticated
    with check (auth.uid() = student_id);

-- 9. Tabla: user_settings (Preferencias de usuario)
create table if not exists public.user_settings (
    user_id uuid primary key references auth.users(id) on delete cascade,
    preferences jsonb not null default '{}'::jsonb,
    updated_at timestamp with time zone default now() not null
);

alter table public.user_settings enable row level security;

drop policy if exists "El usuario accede y gestiona sus propias preferencias" on public.user_settings;
create policy "El usuario accede y gestiona sus propias preferencias"
    on public.user_settings
    for all
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- =============================================================================
-- Trigger de Inicialización de Usuario en auth.users
-- Valida teacher_invite_codes para docentes e inserta profile + student_progress
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_role text;
    v_full_name text;
    v_grade text;
    v_school text;
    v_newsletter boolean;
    v_invite_code text;
    v_code_exists boolean;
begin
    v_role := coalesce(new.raw_user_meta_data->>'role', 'estudiante');
    v_full_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
    v_grade := new.raw_user_meta_data->>'grade';
    v_school := new.raw_user_meta_data->>'school';
    v_newsletter := coalesce((new.raw_user_meta_data->>'newsletter')::boolean, false);
    v_invite_code := new.raw_user_meta_data->>'teacher_invite_code';

    if v_role = 'docente' then
        if v_invite_code is null or trim(v_invite_code) = '' then
            raise exception 'El registro docente requiere un código de invitación válido.';
        end if;

        -- Validar código de invitación disponible
        select exists (
            select 1 from public.teacher_invite_codes
            where code = trim(v_invite_code) and used_by is null
        ) into v_code_exists;

        if not v_code_exists then
            raise exception 'El código de invitación docente no es válido o ya fue utilizado.';
        end if;

        -- Marcar el código como usado por este usuario
        update public.teacher_invite_codes
        set used_by = new.id
        where code = trim(v_invite_code);
    end if;

    -- Insertar en profiles
    insert into public.profiles (id, role, full_name, grade, school, newsletter)
    values (new.id, v_role, v_full_name, v_grade, v_school, v_newsletter)
    on conflict (id) do update
    set full_name = excluded.full_name,
        grade = excluded.grade,
        school = excluded.school,
        newsletter = excluded.newsletter;

    -- Si es estudiante, inicializar registro en student_progress
    if v_role = 'estudiante' then
        insert into public.student_progress (student_id, xp, level, streak_days, last_active_date)
        values (new.id, 0, 1, 0, current_date)
        on conflict (student_id) do nothing;
    end if;

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_user();
