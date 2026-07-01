-- Registro de acceso — NÚCLEO LEGAL. Append-only.
create table registro_acceso (
  id           bigint generated always as identity primary key,
  documento_id uuid not null references documentos(id),
  empleado_id  uuid not null references empleados(id),
  evento       text not null,                       -- 'visualizacion' | 'descarga'
  ocurrido_en  timestamptz not null default now(),  -- sello de tiempo de SERVIDOR
  ip           inet,
  user_agent   text,
  hash_servido text not null
);
create index registro_documento_idx on registro_acceso (documento_id, ocurrido_en);
