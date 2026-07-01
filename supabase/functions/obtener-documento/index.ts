// Sirve un documento con registro previo del acceso (patrón servido-con-log).
// El cliente NUNCA toca el Storage: solo esta función emite signed URLs.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { documento_id, evento } = await req.json();
    if (!documento_id || !evento) return json({ error: "faltan parámetros" }, 400);

    const authHeader = req.headers.get("Authorization") ?? "";
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;
    const ua = req.headers.get("user-agent") ?? null;

    // Cliente con el JWT del usuario -> auth.uid() válido dentro de la RPC.
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    // 1) Registrar el acceso ANTES de servir. Devuelve el storage_path.
    const { data: path, error } = await userClient.rpc("registrar_acceso", {
      p_documento_id: documento_id,
      p_evento: evento,
      p_ip: ip,
      p_user_agent: ua,
    });
    if (error) return json({ error: error.message }, 403);

    // 2) Firmar la URL con service_role (bucket privado, 60s de vida).
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const opts = evento === "descarga" ? { download: true } : {};
    const { data: signed, error: e2 } = await admin.storage
      .from("legajos").createSignedUrl(path as string, 60, opts);
    if (e2) return json({ error: e2.message }, 500);

    return json({ url: signed.signedUrl });
  } catch (e) {
    return json({ error: String(e) }, 400);
  }
});
