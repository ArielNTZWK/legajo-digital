-- Documentos (un archivo por fila; nueva versión = nueva fila, nunca sobrescribir)
create table documentos (
  id           uuid primary key default gen_random_uuid(),
  empleado_id  uuid not null references empleados(id),
  tipo         text not null references tipos_documento(id),
  periodo      date,
  titulo       text not null,
  version      int  not null default 1,
  storage_path text not null,
  hash_sha256  text not null,
  cargado_por  uuid not null references auth.users(id),
  cargado_en   timestamptz not null default now(),
  vigente      boolean not null default true
);
create index documentos_empleado_idx on documentos (empleado_id, tipo, periodo);
