# Legajo Digital · WellKnows — Prototipo Fase 1

Prototipo clickeable de la plataforma de legajo digital de RRHH. Demuestra el flujo completo de la **Fase 1 (solo registro de acceso)**: login con MFA, consentimiento/opt-in, patrón de servido‑con‑log, historial de accesos del empleado, auditoría inmutable para RRHH y export de cadena de custodia.

> **Importante:** es un prototipo de interfaz con **datos simulados en memoria**. No tiene backend, no persiste nada y los hashes son simulados. Sirve para que el equipo evalúe funcionalidad y flujo, no para manejar datos reales.

---

## 1. Logos

Los logos oficiales de WellKnows (2023) **ya están incorporados** en `src/assets/`:

- `logo-color.png` → sobre **fondos claros** (columna del formulario de login).
- `logo-white.png` → sobre **fondos oscuros** (panel hero del login y barra lateral).
- `favicon.png` → isotipo de la llama, usado como favicon.

Para actualizarlos a futuro, **sobrescribí esos archivos manteniendo el mismo nombre** (PNG con fondo transparente, recortado a su contenido). Si cambiás la extensión, actualizá las dos líneas de import al inicio de `src/App.jsx`.

## 2. Correr en local

```bash
npm install
npm run dev
```

Abrí http://localhost:5173. Login: cualquier contraseña + cualquier código de 6 dígitos.

---

## 3. Buildear

```bash
npm run build
```

Genera la carpeta `dist/` (sitio estático listo para publicar).

---

## 4. Publicar en Netlify

**Opción A — Drag & drop (lo más rápido):**
1. `npm run build`
2. Entrá a https://app.netlify.com → *Add new site* → *Deploy manually*
3. Arrastrá la carpeta **`dist/`**. En segundos tenés una URL para compartir con el equipo.

**Opción B — Conectado a Git (para iterar):**
1. Subí este repo a GitHub.
2. En Netlify: *Add new site* → *Import from Git*.
3. Build command: `npm run build` · Publish directory: `dist`.
4. Cada push redespliega solo. (El `netlify.toml` ya deja esto configurado.)

> Este `dist/` ya viene pre‑buildeado con los logos placeholder, por si querés publicarlo y mostrar el flujo **antes** de cargar los logos definitivos. Después de reemplazar los logos, corré `npm run build` de nuevo.

---

## 5. Marca

El prototipo usa la **paleta core de WellKnows**: `#1B1D49` · `#0D4678` · `#06B8EB` · `#F9B701` · `#BE163F`, con tipografías Space Grotesk (display), Inter (texto) e IBM Plex Mono (datos/forense). No pude leer el manual de marcas desde Drive porque está en formato de diseño/PDF. Si lo subís (o pasás tipografías y códigos hex exactos), se afina al detalle.

---

## 6. Nota de seguridad

Publicar este prototipo en una URL pública es seguro **solo porque los datos son inventados**. La app real con PII de nómina requiere el backend de Supabase con autenticación, RLS y acceso restringido (ver el esquema y el brief de Claude Code de la Fase 1).

---

## 7. Backend de producción (Supabase)

El repo ya incluye el **backend real** de la Fase 1 en `supabase/`:
- `migrations/0001–0010` — esquema, RLS, triggers append-only, funciones y bucket privado.
- `functions/` — Edge Functions `obtener-documento`, `cargar-documento`, `export-cadena-custodia`.
- `seed.sql` — catálogo de tipos de documento.

Para provisionar y desplegar la infraestructura, seguí **`SETUP.md`** (runbook paso a paso).
El frontend de este repo sigue siendo el prototipo con datos simulados; su cableado a
los endpoints reales es el próximo pass de desarrollo (ver SETUP.md §6).
