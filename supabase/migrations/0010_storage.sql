-- Bucket privado para los documentos del legajo. Sin políticas públicas:
-- el acceso se sirve únicamente vía Edge Function con service_role + signed URL.
insert into storage.buckets (id, name, public)
values ('legajos', 'legajos', false)
on conflict (id) do nothing;
