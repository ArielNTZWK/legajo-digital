# Runbook de infraestructura — Legajo Digital WellKnows (Fase 1)

Guía para provisionar y desplegar la app real sobre Supabase + Netlify.
Los pasos marcados **[tu cuenta]** requieren tus credenciales y corren de tu lado
(ideal desde Claude Code). Los pasos de código ya están resueltos en este repo.

## 0. Requisitos
- Node.js 18+ y npm
- Supabase CLI: `npm i -g supabase`
- Cuenta de Supabase y cuenta de Netlify

## 1. Crear el proyecto Supabase  **[tu cuenta]**
1. En https://supabase.com → New project.
2. **Región: South America (São Paulo / sa-east-1)** — la más cercana para
   datos de nómina en LATAM (residencia del dato).
3. Guardá la **DB password**.
4. En Project Settings → API, copiá: `Project URL`, `anon key`, `service_role key`.

## 2. Vincular el CLI y aplicar el esquema  **[tu cuenta]**
```bash
supabase login
supabase init                     # genera supabase/config.toml (si no existe)
supabase link --project-ref <REF> # el REF está en la URL del proyecto
supabase db push                  # aplica migrations/0001..0010
supabase db execute --file supabase/seed.sql   # carga los tipos de documento
```
> Las migraciones ya crean el bucket privado `legajos` (0010) y toda la seguridad
> (RLS, triggers append-only, funciones). No hay que tocar nada a mano.

## 3. Habilitar MFA (obligatorio)  **[tu cuenta]**
En `supabase/config.toml`, sección `[auth.mfa]`:
```toml
[auth.mfa]
max_enrolled_factors = 10
[auth.mfa.totp]
enroll_enabled = true
verify_enabled = true
```
Aplicá con `supabase db push` o desde Dashboard → Authentication → MFA.
Recomendado además: Dashboard → Authentication → Policies → exigir MFA (AAL2).

## 4. Desplegar las Edge Functions  **[tu cuenta]**
```bash
# Secret de service_role SOLO para las funciones (nunca en el frontend):
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service_role_key>

supabase functions deploy obtener-documento
supabase functions deploy cargar-documento
supabase functions deploy export-cadena-custodia
```
> `SUPABASE_URL` y `SUPABASE_ANON_KEY` ya están disponibles como env por defecto
> en el runtime de Edge Functions.

## 5. Crear el primer usuario RRHH  **[tu cuenta]**
```sql
-- Tras crear el usuario en Authentication (o por invitación), marcarlo como RRHH:
insert into roles_usuario (user_id, rol)
values ('<uuid-del-usuario>', 'rrhh');
-- Y darle su fila de empleado si corresponde (nombre, cuil, legajo, email).
```

## 6. Conectar el frontend  (siguiente pass de desarrollo)
El frontend actual es el prototipo con datos simulados. La próxima etapa cablea
las vistas a estos endpoints reales: Supabase Auth (login + MFA), consultas con
RLS para "Mi legajo", e invocación de las tres Edge Functions.
1. Copiá `.env.example` a `.env` y completá `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
2. (Se agrega en el próximo pass) `src/lib/supabase.js` con el cliente y el
   contexto de auth; reemplazo del estado mock por llamadas reales.

## 7. Desplegar a Netlify  **[tu cuenta]**
- Cargá `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Netlify → Site settings →
  Environment variables.
- Deploy vía Git (build `npm run build`, publish `dist`) — el `netlify.toml` ya está.

## Checklist de verificación
- [ ] `supabase db push` aplica sin errores; existen las 5 tablas + funciones.
- [ ] UPDATE/DELETE sobre `registro_acceso` lanza excepción.
- [ ] Un empleado no ve documentos de otro (RLS).
- [ ] El bucket `legajos` es privado (URL directa sin firmar falla).
- [ ] `obtener-documento` deja fila en `registro_acceso` y devuelve signed URL de 60s.
- [ ] `cargar-documento` calcula el hash server-side y guarda nueva fila.
- [ ] MFA obligatorio en el login.
