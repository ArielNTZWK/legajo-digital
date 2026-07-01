-- Perfil de empleado (extiende auth.users de Supabase)
create table empleados (
  id         uuid primary key references auth.users(id) on delete restrict,
  cuil       text unique not null,
  legajo     text unique,
  nombre     text not null,
  email      text not null,
  estado     text not null default 'activo',
  creado_en  timestamptz not null default now()
);
