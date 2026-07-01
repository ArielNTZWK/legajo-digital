-- Inmutabilidad: bloquea UPDATE/DELETE sobre las tablas de evidencia.
create or replace function bloquear_modificacion() returns trigger
language plpgsql as $$
begin
  raise exception '% es append-only: operacion % no permitida', tg_table_name, tg_op;
end;
$$;

create trigger no_modificar_registro
  before update or delete on registro_acceso
  for each row execute function bloquear_modificacion();

create trigger no_modificar_consentimiento
  before update or delete on consentimientos
  for each row execute function bloquear_modificacion();
