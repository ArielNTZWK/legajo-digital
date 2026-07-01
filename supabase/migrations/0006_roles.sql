-- Rol de usuario: 'empleado' (default) o 'rrhh' (administración del legajo)
create table roles_usuario (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rol     text not null default 'empleado' check (rol in ('empleado','rrhh'))
);

-- Helper: ¿el usuario actual es RRHH? Usado en RLS y en Edge Functions.
create or replace function es_rrhh() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from roles_usuario where user_id = auth.uid() and rol = 'rrhh');
$$;
