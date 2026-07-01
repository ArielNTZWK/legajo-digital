-- Consentimiento / opt-in al formato digital (append-only, evidencia legal)
create table consentimientos (
  id           bigint generated always as identity primary key,
  empleado_id  uuid not null references empleados(id),
  tipo         text not null default 'formato_digital',
  otorgado     boolean not null,
  ocurrido_en  timestamptz not null default now(),
  ip           inet,
  user_agent   text
);
