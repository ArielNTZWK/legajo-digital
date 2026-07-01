-- Registra el acceso de forma atómica y devuelve el storage_path para firmar.
-- La invoca la Edge Function obtener-documento ANTES de emitir la signed URL.
create or replace function registrar_acceso(
  p_documento_id uuid,
  p_evento       text,
  p_ip           inet,
  p_user_agent   text
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_empleado uuid;
  v_hash     text;
  v_path     text;
begin
  select empleado_id, hash_sha256, storage_path
    into v_empleado, v_hash, v_path
  from documentos where id = p_documento_id and vigente = true;

  if v_empleado is null then raise exception 'documento inexistente'; end if;
  if v_empleado <> auth.uid() then raise exception 'acceso denegado'; end if;
  if p_evento not in ('visualizacion','descarga') then raise exception 'evento invalido'; end if;

  insert into registro_acceso
    (documento_id, empleado_id, evento, ip, user_agent, hash_servido)
  values (p_documento_id, v_empleado, p_evento, p_ip, p_user_agent, v_hash);

  return v_path;
end;
$$;

-- Registra el opt-in del empleado al formato digital.
create or replace function registrar_consentimiento(
  p_otorgado boolean, p_ip inet, p_user_agent text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into consentimientos (empleado_id, otorgado, ip, user_agent)
  values (auth.uid(), p_otorgado, p_ip, p_user_agent);
end;
$$;
