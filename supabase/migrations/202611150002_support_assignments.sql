begin;

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 150),
  workshop text not null check (length(trim(workshop)) between 1 and 2000),
  due_date date,
  created_at timestamptz not null default now()
);
create index if not exists assignments_classroom_idx on public.assignments(classroom_id);
alter table public.assignments enable row level security;
drop policy if exists assignments_read on public.assignments;
create policy assignments_read on public.assignments for select to authenticated using (
  public.is_classroom_teacher(classroom_id) or exists (
    select 1 from public.classroom_members m where m.classroom_id = assignments.classroom_id and m.student_id = auth.uid()
  )
);
drop policy if exists assignments_manage on public.assignments;
create policy assignments_manage on public.assignments for all to authenticated
  using (public.is_classroom_teacher(classroom_id)) with check (public.is_classroom_teacher(classroom_id));

create table if not exists public.help_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null check (length(trim(subject)) between 3 and 150),
  message text not null check (length(trim(message)) between 10 and 4000),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'resolved')),
  created_at timestamptz not null default now()
);
create index if not exists help_requests_user_idx on public.help_requests(user_id);
alter table public.help_requests enable row level security;
drop policy if exists help_requests_read on public.help_requests;
create policy help_requests_read on public.help_requests for select to authenticated using (user_id = auth.uid());
drop policy if exists help_requests_create on public.help_requests;
create policy help_requests_create on public.help_requests for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');

revoke all on public.assignments, public.help_requests from anon;
grant select, insert, update, delete on public.assignments to authenticated;
grant select, insert on public.help_requests to authenticated;
revoke update, delete on public.help_requests from authenticated;

commit;
