-- Dependencias del frontend de aulas y del ranking. Ejecutar despues de core.
begin;

create table if not exists public.classrooms (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 150),
  tag text,
  location text,
  schedule text,
  grade_filter text,
  capacity integer not null default 40 check (capacity between 1 and 500),
  join_pin text not null unique check (join_pin ~ '^CHEM-[0-9]{4}$'),
  active_module text,
  current_week integer not null default 1 check (current_week > 0),
  total_weeks integer not null default 16 check (total_weeks > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.classroom_members (
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  student_id uuid primary key references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now()
);
create index if not exists classroom_members_classroom_idx on public.classroom_members(classroom_id);
create index if not exists classrooms_teacher_idx on public.classrooms(teacher_id);

-- Se ejecutan con el propietario para consultar pertenencia sin recursion de RLS.
create or replace function public.is_classroom_teacher(classroom_uuid uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (select 1 from public.classrooms where id = classroom_uuid and teacher_id = auth.uid());
$$;

create or replace function public.generate_classroom_pin()
returns text language plpgsql security definer set search_path = '' as $$
declare candidate text;
begin
  -- Serializa la generacion hasta terminar la transaccion para evitar colisiones.
  perform pg_catalog.pg_advisory_xact_lock(20261115, 1);
  for attempt in 1..1000 loop
    candidate := 'CHEM-' || lpad(floor(random() * 10000)::integer::text, 4, '0');
    if not exists (select 1 from public.classrooms where join_pin = candidate) then
      return candidate;
    end if;
  end loop;
  raise exception 'No hay PIN disponible. Intenta nuevamente.';
end;
$$;
alter table public.classrooms alter column join_pin set default public.generate_classroom_pin();

alter table public.classrooms enable row level security;
alter table public.classroom_members enable row level security;

drop policy if exists classrooms_read on public.classrooms;
create policy classrooms_read on public.classrooms for select to authenticated using (
  teacher_id = auth.uid() or exists (
    select 1 from public.classroom_members m where m.classroom_id = id and m.student_id = auth.uid()
  )
);
drop policy if exists classrooms_create on public.classrooms;
create policy classrooms_create on public.classrooms for insert to authenticated with check (
  teacher_id = auth.uid() and exists (select 1 from public.profiles where id = auth.uid() and role = 'docente')
);
drop policy if exists classrooms_update on public.classrooms;
create policy classrooms_update on public.classrooms for update to authenticated
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
drop policy if exists classrooms_delete on public.classrooms;
create policy classrooms_delete on public.classrooms for delete to authenticated using (teacher_id = auth.uid());

drop policy if exists classroom_members_read on public.classroom_members;
create policy classroom_members_read on public.classroom_members for select to authenticated
  using (student_id = auth.uid() or public.is_classroom_teacher(classroom_id));
drop policy if exists classroom_members_leave on public.classroom_members;
create policy classroom_members_leave on public.classroom_members for delete to authenticated
  using (student_id = auth.uid());
-- No INSERT/UPDATE directo: join_classroom valida PIN, rol y cupo.

-- PostgreSQL no permite cambiar el retorno de una funcion con CREATE OR REPLACE.
-- Algunas bases ya tienen una version que retorna classrooms en vez de jsonb.
-- Sin CASCADE: si hay dependencias, se detiene sin eliminar otros objetos.
-- Todo ocurre en esta transaccion y los permisos se restauran al final.
drop function if exists public.join_classroom(text);
create function public.join_classroom(pin text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare classroom_row public.classrooms; student_uuid uuid := auth.uid();
begin
  if student_uuid is null then raise exception 'unauthenticated'; end if;
  perform 1 from public.profiles where id = student_uuid and role = 'estudiante' for update;
  if not found then raise exception 'not_owner'; end if;
  if exists (select 1 from public.classroom_members where student_id = student_uuid) then
    raise exception 'already_member';
  end if;
  select * into classroom_row from public.classrooms where join_pin = upper(trim(pin)) for update;
  if not found then raise exception 'invalid_pin'; end if;
  if (select count(*) from public.classroom_members where classroom_id = classroom_row.id) >= classroom_row.capacity then
    raise exception 'classroom_full';
  end if;
  insert into public.classroom_members(classroom_id, student_id) values (classroom_row.id, student_uuid);
  return to_jsonb(classroom_row);
end;
$$;

create or replace function public.regenerate_pin(classroom_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare new_pin text;
begin
  if not public.is_classroom_teacher(classroom_id) then raise exception 'not_owner'; end if;
  new_pin := public.generate_classroom_pin();
  update public.classrooms set join_pin = new_pin where id = classroom_id and teacher_id = auth.uid();
  return new_pin;
end;
$$;

create or replace function public.my_classroom_teacher_name()
returns text language sql security definer stable set search_path = '' as $$
  select p.full_name from public.classroom_members m
    join public.classrooms c on c.id = m.classroom_id
    join public.profiles p on p.id = c.teacher_id
    where m.student_id = auth.uid() limit 1;
$$;

-- La funcion existente is_teacher_of ya consulta estas tablas al estar disponibles.
revoke all on public.classrooms, public.classroom_members from anon;
grant select, insert, update, delete on public.classrooms to authenticated;
grant select, delete on public.classroom_members to authenticated;
revoke insert, update on public.classroom_members from authenticated;
revoke all on function public.is_classroom_teacher(uuid), public.generate_classroom_pin(),
  public.join_classroom(text), public.regenerate_pin(uuid), public.my_classroom_teacher_name() from public;
grant execute on function public.is_classroom_teacher(uuid), public.generate_classroom_pin(),
  public.join_classroom(text), public.regenerate_pin(uuid), public.my_classroom_teacher_name() to authenticated;

commit;
