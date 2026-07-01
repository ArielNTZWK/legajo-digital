// Exporta la cadena de custodia de un documento (rol RRHH): metadata + todo
// el historial de accesos, para presentar ante inspección o juicio.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { documento_id } = await req.json();
    if (!documento_id) return json({ error: "falta documento_id" }, 400);

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: isRrhh } = await userClient.rpc("es_rrhh");
    if (!isRrhh) return json({ error: "solo RRHH" }, 403);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: doc, error: e1 } = await admin.from("documentos")
      .select("*").eq("id", documento_id).single();
    if (e1) return json({ error: e1.message }, 404);
    const { data: accesos, error: e2 } = await admin.from("registro_acceso")
      .select("*").eq("documento_id", documento_id).order("ocurrido_en", { ascending: false });
    if (e2) return json({ error: e2.message }, 500);

    return json({
      generado_en: new Date().toISOString(),
      documento: doc,
      total_accesos: accesos.length,
      accesos,
    });
  } catch (e) {
    return json({ error: String(e) }, 400);
  }
});
