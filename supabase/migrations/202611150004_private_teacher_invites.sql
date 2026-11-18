-- Los codigos de alta docente solo se gestionan desde administracion.
-- El trigger de registro SECURITY DEFINER sigue pudiendo validarlos.
begin;
drop policy if exists "Lectura de codigos de invitacion" on public.teacher_invite_codes;
revoke all on public.teacher_invite_codes from public, anon, authenticated;
commit;
