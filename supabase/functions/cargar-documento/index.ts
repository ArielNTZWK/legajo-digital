// Carga de documentos (rol RRHH). Calcula el hash SHA-256 en el servidor,
// sube al bucket privado e inserta la fila. Versionado: nueva fila, no overwrite.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    // Verificar rol RRHH y obtener el id del cargador.
    const { data: isRrhh } = await userClient.rpc("es_rrhh");
    if (!isRrhh) return json({ error: "solo RRHH" }, 403);
    const { data: userData } = await userClient.auth.getUser();
    const cargadoPor = userData?.user?.id;
    if (!cargadoPor) return json({ error: "no autenticado" }, 401);

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const empleado_id = form.get("empleado_id") as string;
    const tipo = form.get("tipo") as string;
    const titulo = form.get("titulo") as string;
    const periodo = (form.get("periodo") as string) || null;
    if (!file || !empleado_id || !tipo || !titulo)
      return json({ error: "faltan campos" }, 400);

    const bytes = new Uint8Array(await file.arrayBuffer());
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const hash = [...new Uint8Array(digest)]
      .map((b) => b.toString(16).padStart(2, "0")).join("");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const path = `${empleado_id}/${tipo}/${crypto.randomUUID()}`;
    const { error: upErr } = await admin.storage.from("legajos")
      .upload(path, bytes, { contentType: file.type || "application/pdf", upsert: false });
    if (upErr) return json({ error: upErr.message }, 500);

    const { data, error } = await admin.from("documentos").insert({
      empleado_id, tipo, titulo, periodo,
      storage_path: path, hash_sha256: hash, cargado_por: cargadoPor,
    }).select("id").single();
    if (error) return json({ error: error.message }, 500);

    return json({ ok: true, documento_id: data.id, hash });
  } catch (e) {
    return json({ error: String(e) }, 400);
  }
});
