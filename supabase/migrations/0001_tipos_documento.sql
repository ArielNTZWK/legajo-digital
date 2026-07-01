-- Catálogo de tipos de documento (reglas de retención y acuse por tipo)
create table tipos_documento (
  id                 text primary key,
  nombre             text not null,
  retencion_anios    int,
  requiere_acuse     boolean not null default false,
  acceso_restringido boolean not null default false
);
