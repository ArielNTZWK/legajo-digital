alter table empleados        enable row level security;
alter table documentos       enable row level security;
alter table registro_acceso  enable row level security;
alter table consentimientos  enable row level security;
alter table roles_usuario    enable row level security;

-- ---- Empleado: ve solo lo suyo ----
create policy empleado_ve_su_perfil on empleados
  for select using (id = auth.uid());
create policy empleado_ve_sus_docs on documentos
  for select using (empleado_id = auth.uid() and vigente = true);
create policy empleado_ve_su_registro on registro_acceso
  for select using (empleado_id = auth.uid());
create policy empleado_ve_su_consentimiento on consentimientos
  for select using (empleado_id = auth.uid());
create policy usuario_ve_su_rol on roles_usuario
  for select using (user_id = auth.uid());

-- ---- RRHH: lectura de auditoría y administración ----
create policy rrhh_ve_empleados on empleados
  for select using (es_rrhh());
create policy rrhh_ve_docs on documentos
  for select using (es_rrhh());
create policy rrhh_ve_registro on registro_acceso
  for select using (es_rrhh());
create policy rrhh_ve_consentimientos on consentimientos
  for select using (es_rrhh());

-- Nota: NO hay policies de INSERT/UPDATE/DELETE para roles cliente sobre
-- registro_acceso ni consentimientos. La única escritura es vía las funciones
-- security definer. Las cargas de documentos entran por Edge Function con
-- service_role (que evita RLS por diseño).
