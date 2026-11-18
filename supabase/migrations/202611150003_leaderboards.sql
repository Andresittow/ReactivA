-- PR-A2: rankings reales por aula/colegio.
-- Idempotente: se puede ejecutar más de una vez en Supabase.

drop function if exists public.get_leaderboard(text);

create or replace function public.get_leaderboard(scope text)
returns table (
    display_name text,
    level integer,
    xp integer
)
language plpgsql
security definer
stable
set search_path = public, pg_catalog
as $$
declare
    current_user_id uuid := auth.uid();
    current_school text;
begin
    if current_user_id is null or scope not in ('class', 'school') then
        return;
    end if;

    if scope = 'school' then
        select p.school into current_school
        from public.profiles p
        where p.id = current_user_id;
    end if;

    return query
    with candidates as (
        select distinct p.id, p.full_name, p.school, sp.level, sp.xp
        from public.profiles p
        join public.student_progress sp on sp.student_id = p.id
        where p.role = 'estudiante'
          and (
              (scope = 'class' and exists (
                  select 1
                  from public.classroom_members cm
                  where cm.student_id = p.id
                    and cm.classroom_id in (
                        select own_cm.classroom_id
                        from public.classroom_members own_cm
                        where own_cm.student_id = current_user_id
                    )
              ))
              or (scope = 'school' and current_school is not null and p.school = current_school)
          )
    )
    select c.full_name as display_name, c.level, c.xp
    from candidates c
    left join public.user_settings us on us.user_id = c.id
    where c.id = current_user_id
       or coalesce(us.preferences ->> 'profileVisibility', 'public') <> 'private'
    order by c.xp desc, c.level desc, c.full_name asc;
end;
$$;

revoke all on function public.get_leaderboard(text) from public;
grant execute on function public.get_leaderboard(text) to authenticated;
