import React, { useEffect, useRef, useState } from "react";
import {
  Shield, Lock, Eye, Download, Upload, Users, History, FileText,
  CheckCircle2, AlertTriangle, KeyRound, LogOut, Fingerprint, ScrollText,
  BadgeCheck, X, FileCheck, GraduationCap, ScrollText as PolicyIcon,
  ClipboardCheck, Stethoscope, FileWarning, Files, ChevronRight, Loader2
} from "lucide-react";
import logoColor from "./assets/logo-color.png";
import { supabase } from "./lib/supabase";

/* ------------------------------------------------------------------ */
/*  WellKnows · Legajo Digital — Fase 1                                */
/*  Auth Supabase (password + MFA TOTP), datos reales con RLS,         */
/*  Edge Functions para servir/cargar documentos y exportar custodia.  */
/* ------------------------------------------------------------------ */

const COL = {
  ink: "#1B1D49", blue: "#0D4678", cyan: "#06B8EB", amber: "#F9B701",
  crimson: "#BE163F", bg: "#EEF2F8", surface: "#FFFFFF", border: "#E2E8F2",
  muted: "#737C9C", inkSoft: "#3B4170",
};

// Presentación por tipo de documento (nombre y retención vienen de la DB).
const TIPO_UI = {
  recibo_sueldo: { icon: FileCheck, color: COL.blue },
  capacitacion:  { icon: GraduationCap, color: COL.cyan },
  politica:      { icon: PolicyIcon, color: COL.inkSoft },
  contrato:      { icon: ClipboardCheck, color: COL.ink },
  evaluacion:    { icon: FileText, color: COL.muted },
  medico:        { icon: Stethoscope, color: COL.amber },
  sancion:       { icon: FileWarning, color: COL.crimson },
  otro:          { icon: Files, color: COL.muted },
};
const tipoUI = (id) => TIPO_UI[id] ?? TIPO_UI.otro;
const retencionLabel = (t) =>
  t ? (t.retencion_anios ? `${t.retencion_anios} años` : "vida laboral") : "—";

const fmt = (d) => new Date(d).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });

// Mensaje legible desde un error de supabase.functions.invoke
async function fnErrorMsg(error) {
  try {
    if (error?.context && typeof error.context.json === "function") {
      const body = await error.context.json();
      if (body?.error) return body.error;
    }
  } catch { /* cuerpo no-JSON */ }
  return error?.message || "Error inesperado";
}

/* ---------------------------- UI helpers --------------------------- */

function Seal({ label = "INMUTABLE" }) {
  return (
    <span className="lg-mono" style={{
      display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, letterSpacing: 0.5,
      color: COL.blue, background: "#EAF6FD", border: `1px solid ${COL.cyan}33`,
      padding: "2px 7px", borderRadius: 999, fontWeight: 500,
    }}>
      <Lock size={10} /> {label}
    </span>
  );
}

function Btn({ children, onClick, kind = "primary", icon: Icon, small, disabled, type = "button" }) {
  const styles = {
    primary: { background: COL.cyan, color: "#062B3A", border: "none" },
    dark:    { background: COL.ink, color: "#fff", border: "none" },
    ghost:   { background: "transparent", color: COL.blue, border: `1px solid ${COL.border}` },
    danger:  { background: "#FCE8EE", color: COL.crimson, border: `1px solid ${COL.crimson}33` },
  }[kind];
  return (
    <button onClick={onClick} disabled={disabled} type={type}
      className="lg-body" style={{
        ...styles, opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex", alignItems: "center", gap: 7, fontWeight: 600,
        fontSize: small ? 12.5 : 13.5, padding: small ? "6px 11px" : "9px 15px",
        borderRadius: 9, transition: "transform .08s ease, filter .15s ease",
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
      {Icon && <Icon size={small ? 14 : 16} />} {children}
    </button>
  );
}

function Card({ children, style }) {
  return <div style={{ background: COL.surface, border: `1px solid ${COL.border}`, borderRadius: 16, ...style }}>{children}</div>;
}

function AuthError({ msg }) {
  if (!msg) return null;
  return (
    <div className="lg-body" style={{ display: "flex", alignItems: "center", gap: 8, background: "#FCE8EE", border: `1px solid ${COL.crimson}33`, color: COL.crimson, fontSize: 12.5, padding: "9px 12px", borderRadius: 9, marginBottom: 14 }}>
      <AlertTriangle size={14} /> {msg}
    </div>
  );
}

function AuthInfo({ msg }) {
  if (!msg) return null;
  return (
    <div className="lg-body" style={{ display: "flex", alignItems: "center", gap: 8, background: "#EAF6FD", border: `1px solid ${COL.cyan}55`, color: COL.blue, fontSize: 12.5, padding: "9px 12px", borderRadius: 9, marginBottom: 14 }}>
      <CheckCircle2 size={14} /> {msg}
    </div>
  );
}

/* ------------------------------ App -------------------------------- */

export default function App() {
  // loading | login | mfa (verificar TOTP) | enroll (primer login: QR)
  // | recovery (setear contraseña nueva desde el link del email) | app
  const [stage, setStage] = useState("loading");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newPwd2, setNewPwd2] = useState("");
  const [mfa, setMfa] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authInfo, setAuthInfo] = useState(null);
  const [factorId, setFactorId] = useState(null);
  const [enroll, setEnroll] = useState(null); // { id, qr, secret }
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  const [rol, setRol] = useState("empleado");
  const [vista, setVista] = useState("empleado");
  const [me, setMe] = useState(null);            // fila de empleados del usuario
  const [empleados, setEmpleados] = useState([]);
  const [docs, setDocs] = useState([]);
  const [registro, setRegistro] = useState([]);
  const [consents, setConsents] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const [serving, setServing] = useState(null);
  const [toast, setToast] = useState(null);
  const [custodia, setCustodia] = useState(null);

  const showToast = (msg, tone = "ok") => { setToast({ msg, tone }); setTimeout(() => setToast(null), 3200); };

  // Último consentimiento registrado manda (tabla append-only).
  const hasConsent = (empleadoId) => {
    const last = consents
      .filter((c) => c.empleado_id === empleadoId)
      .sort((a, b) => new Date(b.ocurrido_en) - new Date(a.ocurrido_en))[0];
    return !!last?.otorgado;
  };

  /* ------------------------- Sesión y MFA -------------------------- */

  useEffect(() => {
    // El link de recuperación llega como #access_token=...&type=recovery
    const isRecovery = window.location.hash.includes("type=recovery");
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        if (isRecovery) setStage("recovery");
        else resolveMfaState();
      } else {
        if (isRecovery) setAuthError("El enlace de recuperación no es válido o ya venció. Pedí uno nuevo.");
        setStage("login");
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStage("recovery");
      if (event === "SIGNED_OUT") {
        setStage("login"); setUserId(null); setUserEmail(null); setMe(null);
        setDocs([]); setRegistro([]); setConsents([]); setEmpleados([]);
        setPwd(""); setMfa(""); setFactorId(null); setEnroll(null);
        setNewPwd(""); setNewPwd2("");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Decide el paso según el nivel de garantía: aal2 -> app, factor
  // verificado pendiente -> pedir TOTP, sin factor -> enrolar (primer login).
  const resolveMfaState = async () => {
    setAuthError(null);
    const { data: aal, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) { setAuthError(error.message); setStage("login"); return; }
    if (aal.currentLevel === "aal2") { await enterApp(); return; }
    const { data: factors, error: fe } = await supabase.auth.mfa.listFactors();
    if (fe) { setAuthError(fe.message); setStage("login"); return; }
    const verified = (factors?.totp ?? []).find((f) => f.status === "verified");
    if (verified) { setFactorId(verified.id); setMfa(""); setStage("mfa"); }
    else await startEnroll(factors?.all ?? []);
  };

  const startEnroll = async (existing) => {
    // Limpiar factores TOTP que quedaron a medio enrolar.
    for (const f of existing.filter((f) => f.factor_type === "totp" && f.status !== "verified")) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Legajo WellKnows" });
    if (error) { setAuthError(error.message); setStage("login"); return; }
    const qr = data.totp.qr_code.startsWith("data:")
      ? data.totp.qr_code
      : "data:image/svg+xml;utf8," + encodeURIComponent(data.totp.qr_code);
    setEnroll({ id: data.id, qr, secret: data.totp.secret });
    setMfa("");
    setStage("enroll");
  };

  const handleForgot = async () => {
    if (authBusy) return;
    setAuthError(null); setAuthInfo(null);
    if (!email.trim()) { setAuthError("Ingresá tu correo y volvé a tocar el enlace."); return; }
    setAuthBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    setAuthBusy(false);
    if (error) setAuthError(error.message);
    else setAuthInfo("Te enviamos un correo con el enlace para restablecer tu contraseña.");
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (authBusy) return;
    setAuthError(null);
    if (newPwd.length < 8) { setAuthError("La contraseña debe tener al menos 8 caracteres."); return; }
    if (newPwd !== newPwd2) { setAuthError("Las contraseñas no coinciden."); return; }
    setAuthBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    if (error) setAuthError(error.message);
    else {
      setNewPwd(""); setNewPwd2("");
      // Contraseña actualizada: seguir el flujo normal (MFA / enroll / app).
      await resolveMfaState();
    }
    setAuthBusy(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (authBusy) return;
    setAuthBusy(true); setAuthError(null); setAuthInfo(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pwd });
    if (error) {
      setAuthError(error.message === "Invalid login credentials" ? "Correo o contraseña incorrectos" : error.message);
    } else {
      await resolveMfaState();
    }
    setAuthBusy(false);
  };

  const handleVerify = async () => {
    if (authBusy) return;
    setAuthBusy(true); setAuthError(null);
    const fid = stage === "enroll" ? enroll.id : factorId;
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: fid, code: mfa });
    if (error) {
      setAuthError("Código inválido o vencido. Probá con el código actual de tu app.");
      setMfa("");
    } else {
      await enterApp();
    }
    setAuthBusy(false);
  };

  const backToLogin = async () => { await supabase.auth.signOut(); };
  const logout = async () => { await supabase.auth.signOut(); };

  /* -------------------------- Datos reales ------------------------- */

  const enterApp = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setStage("login"); return; }
    setUserId(user.id); setUserEmail(user.email);
    setStage("app");
    setLoadingData(true);
    try {
      const { data: rolRow } = await supabase.from("roles_usuario").select("rol").eq("user_id", user.id).maybeSingle();
      const r = rolRow?.rol ?? "empleado";
      setRol(r); setVista(r === "rrhh" ? "rrhh" : "empleado");
      await refreshData(user.id, r);
    } finally {
      setLoadingData(false);
    }
  };

  const refreshData = async (uid = userId, r = rol) => {
    const { data: emp } = await supabase.from("empleados").select("*").eq("id", uid).maybeSingle();
    setMe(emp ?? null);
    if (r === "rrhh") {
      const [emps, allDocs, reg, cons] = await Promise.all([
        supabase.from("empleados").select("*").order("nombre"),
        supabase.from("documentos").select("*, tipos_documento(*), empleados(*)").order("cargado_en", { ascending: false }),
        supabase.from("registro_acceso").select("*, documentos(*, tipos_documento(*)), empleados(*)").order("ocurrido_en", { ascending: false }),
        supabase.from("consentimientos").select("*").order("ocurrido_en", { ascending: false }),
      ]);
      setEmpleados(emps.data ?? []);
      setDocs(allDocs.data ?? []);
      setRegistro(reg.data ?? []);
      setConsents(cons.data ?? []);
    } else {
      const [myDocs, reg, cons] = await Promise.all([
        supabase.from("documentos").select("*, tipos_documento(*)").eq("empleado_id", uid).order("cargado_en", { ascending: false }),
        supabase.from("registro_acceso").select("*").eq("empleado_id", uid).order("ocurrido_en", { ascending: false }),
        supabase.from("consentimientos").select("*").eq("empleado_id", uid).order("ocurrido_en", { ascending: false }),
      ]);
      setEmpleados([]);
      setDocs(myDocs.data ?? []);
      setRegistro(reg.data ?? []);
      setConsents(cons.data ?? []);
    }
  };

  /* --------------------- Acciones (Edge Functions) ------------------ */

  const accederDoc = async (doc, evento) => {
    if (serving) return;
    setServing(doc.id + evento);
    // Abrir la pestaña de forma síncrona para que el popup blocker no la corte.
    const win = window.open("", "_blank");
    try {
      const { data, error } = await supabase.functions.invoke("obtener-documento", {
        body: { documento_id: doc.id, evento },
      });
      if (error || !data?.url) {
        win?.close();
        showToast(`No se pudo servir el documento: ${error ? await fnErrorMsg(error) : "sin URL"}`, "bad");
      } else {
        if (win) win.location = data.url; else window.open(data.url, "_blank");
        showToast(`Acceso registrado · ${evento === "descarga" ? "descarga" : "visualización"} servida`);
        await refreshData();
      }
    } catch (e) {
      win?.close();
      showToast(`No se pudo servir el documento: ${e.message}`, "bad");
    } finally {
      setServing(null);
    }
  };

  const darConsentimiento = async () => {
    const { error } = await supabase.rpc("registrar_consentimiento", {
      p_otorgado: true, p_ip: null, p_user_agent: navigator.userAgent,
    });
    if (error) { showToast(`No se pudo registrar el consentimiento: ${error.message}`, "bad"); return; }
    showToast("Consentimiento registrado · ya podés acceder a tu legajo");
    await refreshData();
  };

  const cargarDoc = async (empleadoId, tipo, titulo, archivo) => {
    const form = new FormData();
    form.append("file", archivo);
    form.append("empleado_id", empleadoId);
    form.append("tipo", tipo);
    form.append("titulo", titulo);
    const { data, error } = await supabase.functions.invoke("cargar-documento", { body: form });
    if (error || !data?.ok) {
      showToast(`No se pudo cargar: ${error ? await fnErrorMsg(error) : "error del servidor"}`, "bad");
      return false;
    }
    showToast(`Documento cargado · hash ${data.hash.slice(0, 12)}… calculado en el servidor`);
    await refreshData();
    return true;
  };

  const exportCustodia = async (doc) => {
    const { data, error } = await supabase.functions.invoke("export-cadena-custodia", {
      body: { documento_id: doc.id },
    });
    if (error || !data) {
      showToast(`No se pudo exportar: ${error ? await fnErrorMsg(error) : "error del servidor"}`, "bad");
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `cadena-custodia-${doc.id}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    showToast("Constancia de cadena de custodia exportada (JSON)");
  };

  /* --------------------------- LOGIN / MFA ------------------------- */
  if (stage !== "app") {
    return (
      <Shell bare>
        <div className="lg-body" style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", minHeight: 560, borderRadius: 20, overflow: "hidden", border: `1px solid ${COL.border}`, background: COL.surface }}>
          {/* Panel marca */}
          <div style={{ background: `linear-gradient(155deg, ${COL.ink} 0%, ${COL.blue} 100%)`, padding: "44px 40px", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div className="lg-display" style={{ fontSize: 24, fontWeight: 700, letterSpacing: 0.3 }}>WellKnows</div>
            <div>
              <div className="lg-mono" style={{ fontSize: 11, letterSpacing: 1.5, color: COL.cyan, marginBottom: 14 }}>LEGAJO DIGITAL</div>
              <h1 className="lg-display" style={{ fontSize: 33, lineHeight: 1.12, fontWeight: 700, margin: 0 }}>Cada acceso<br />queda registrado.</h1>
              <p style={{ color: "#B9C4E6", fontSize: 14, marginTop: 16, maxWidth: 320, lineHeight: 1.55 }}>
                Recibos, capacitaciones y políticas en un solo lugar. Con sello de tiempo, huella del documento y trazabilidad inalterable.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Seal label="APPEND-ONLY" /><Seal label="MFA" /><Seal label="RETENCIÓN 10 AÑOS" />
            </div>
          </div>
          {/* Formulario */}
          <div style={{ padding: "48px 44px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <img src={logoColor} alt="WellKnows" style={{ height: 34, marginBottom: 26, alignSelf: "flex-start" }} />
            {stage === "loading" && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: COL.muted, fontSize: 13.5 }}>
                <Loader2 size={18} className="lg-spin" /> Verificando sesión…
              </div>
            )}
            {stage === "login" && (
              <form onSubmit={handleLogin}>
                <h2 className="lg-display" style={{ fontSize: 22, fontWeight: 600, color: COL.ink, margin: "0 0 4px" }}>Ingresá a tu legajo</h2>
                <p style={{ color: COL.muted, fontSize: 13, margin: "0 0 26px" }}>Acceso seguro con doble factor.</p>
                <AuthError msg={authError} />
                <AuthInfo msg={authInfo} />
                <Field label="Correo" value={email} onChange={setEmail} type="email" placeholder="nombre@wellknows.com" mono />
                <Field label="Contraseña" value={pwd} onChange={setPwd} type="password" placeholder="••••••••" />
                <div style={{ marginTop: 22 }}>
                  <Btn kind="dark" type="submit" icon={authBusy ? Loader2 : ChevronRight} disabled={authBusy || !email.trim() || !pwd}>
                    {authBusy ? "Verificando…" : "Continuar"}
                  </Btn>
                </div>
                <button type="button" onClick={handleForgot} className="lg-body"
                  style={{ background: "none", border: "none", cursor: "pointer", color: COL.blue, fontSize: 12.5, padding: 0, marginTop: 16, textAlign: "left", textDecoration: "underline" }}>
                  ¿Olvidaste tu contraseña?
                </button>
              </form>
            )}
            {stage === "recovery" && (
              <form onSubmit={handleSetPassword}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: "#EAF6FD", display: "grid", placeItems: "center", marginBottom: 16 }}><KeyRound size={20} color={COL.blue} /></div>
                <h2 className="lg-display" style={{ fontSize: 22, fontWeight: 600, color: COL.ink, margin: "0 0 4px" }}>Nueva contraseña</h2>
                <p style={{ color: COL.muted, fontSize: 13, margin: "0 0 26px" }}>Elegí una contraseña nueva para tu cuenta.</p>
                <AuthError msg={authError} />
                <Field label="Contraseña nueva" value={newPwd} onChange={setNewPwd} type="password" placeholder="mínimo 8 caracteres" />
                <Field label="Repetir contraseña" value={newPwd2} onChange={setNewPwd2} type="password" placeholder="••••••••" />
                <div style={{ marginTop: 22 }}>
                  <Btn kind="dark" type="submit" icon={authBusy ? Loader2 : Shield} disabled={authBusy || !newPwd || !newPwd2}>
                    {authBusy ? "Guardando…" : "Guardar y continuar"}
                  </Btn>
                </div>
              </form>
            )}
            {stage === "mfa" && (
              <>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: "#EAF6FD", display: "grid", placeItems: "center", marginBottom: 16 }}><KeyRound size={20} color={COL.blue} /></div>
                <h2 className="lg-display" style={{ fontSize: 22, fontWeight: 600, color: COL.ink, margin: "0 0 4px" }}>Verificación en dos pasos</h2>
                <p style={{ color: COL.muted, fontSize: 13, margin: "0 0 26px" }}>Ingresá el código de 6 dígitos de tu app de autenticación.</p>
                <AuthError msg={authError} />
                <CodeInput value={mfa} onChange={setMfa} onEnter={handleVerify} />
                <div style={{ marginTop: 22, display: "flex", gap: 10 }}>
                  <Btn kind="dark" icon={authBusy ? Loader2 : Shield} onClick={handleVerify} disabled={mfa.length < 6 || authBusy}>{authBusy ? "Verificando…" : "Verificar y entrar"}</Btn>
                  <Btn kind="ghost" onClick={backToLogin}>Volver</Btn>
                </div>
              </>
            )}
            {stage === "enroll" && enroll && (
              <>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: "#EAF6FD", display: "grid", placeItems: "center", marginBottom: 12 }}><Fingerprint size={20} color={COL.blue} /></div>
                <h2 className="lg-display" style={{ fontSize: 20, fontWeight: 600, color: COL.ink, margin: "0 0 4px" }}>Activá el doble factor</h2>
                <p style={{ color: COL.muted, fontSize: 12.5, margin: "0 0 14px" }}>
                  Escaneá el código QR con tu app de autenticación (Google Authenticator, Authy, 1Password…) y luego ingresá el código de 6 dígitos.
                </p>
                <AuthError msg={authError} />
                <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 14 }}>
                  <img src={enroll.qr} alt="QR para enrolar MFA" style={{ width: 132, height: 132, border: `1px solid ${COL.border}`, borderRadius: 12, background: "#fff" }} />
                  <div className="lg-mono" style={{ fontSize: 10.5, color: COL.muted, wordBreak: "break-all", flex: 1 }}>
                    Clave manual:<br /><span style={{ color: COL.inkSoft }}>{enroll.secret}</span>
                  </div>
                </div>
                <CodeInput value={mfa} onChange={setMfa} onEnter={handleVerify} />
                <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
                  <Btn kind="dark" icon={authBusy ? Loader2 : Shield} onClick={handleVerify} disabled={mfa.length < 6 || authBusy}>{authBusy ? "Verificando…" : "Activar y entrar"}</Btn>
                  <Btn kind="ghost" onClick={backToLogin}>Volver</Btn>
                </div>
              </>
            )}
          </div>
        </div>
      </Shell>
    );
  }

  /* ----------------------------- APP ------------------------------- */
  const misDocs = docs.filter((d) => d.empleado_id === userId);
  const miRegistro = registro.filter((r) => r.empleado_id === userId);
  const displayName = me?.nombre ?? userEmail ?? "";
  const initials = (me?.nombre ?? userEmail ?? "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Shell>
      <div className="lg-body" style={{ display: "flex", gap: 0, borderRadius: 18, overflow: "hidden", border: `1px solid ${COL.border}`, minHeight: 620, background: COL.surface }}>
        {/* Sidebar */}
        <aside style={{ width: 232, background: COL.ink, color: "#fff", padding: "22px 16px", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "0 6px 22px" }}>
            <div className="lg-display" style={{ fontSize: 19, fontWeight: 700, letterSpacing: 0.3 }}>WellKnows</div>
            <div className="lg-mono" style={{ fontSize: 9, letterSpacing: 1, color: COL.cyan, marginTop: 7 }}>LEGAJO DIGITAL</div>
          </div>

          {rol === "rrhh" && (
            <>
              <div className="lg-mono" style={{ fontSize: 9.5, letterSpacing: 1, color: "#7C86B8", padding: "0 6px 8px" }}>VISTA</div>
              <div style={{ background: "#161842", borderRadius: 11, padding: 4, display: "flex", gap: 4, marginBottom: 22 }}>
                {[["empleado", "Empleado", Users], ["rrhh", "RRHH", Files]].map(([k, lbl, Ic]) => (
                  <button key={k} onClick={() => setVista(k)} className="lg-body"
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12.5, fontWeight: 600, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
                      background: vista === k ? COL.cyan : "transparent", color: vista === k ? COL.ink : "#A6AFD8" }}>
                    <Ic size={14} /> {lbl}
                  </button>
                ))}
              </div>
            </>
          )}

          <nav style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 13 }}>
            {(vista === "empleado"
              ? [["Mi legajo", FileText], ["Mis accesos", History]]
              : [["Documentos", Files], ["Empleados", Users], ["Auditoría de accesos", ScrollText]]
            ).map(([lbl, Ic]) => (
              <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, color: "#C7CEEC" }}>
                <Ic size={15} color={COL.cyan} /> {lbl}
              </div>
            ))}
          </nav>

          <div style={{ marginTop: "auto", borderTop: "1px solid #2A2D5C", paddingTop: 14, display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 999, background: COL.blue, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700 }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</div>
              <div className="lg-mono" style={{ fontSize: 10, color: "#7C86B8" }}>{me?.legajo ?? rol.toUpperCase()}</div>
            </div>
            <button onClick={logout} title="Cerrar sesión" style={{ background: "none", border: "none", cursor: "pointer", color: "#7C86B8" }}><LogOut size={15} /></button>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, background: COL.bg, padding: "26px 30px", overflow: "auto" }}>
          {loadingData ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: COL.muted, fontSize: 13.5, padding: 30 }}>
              <Loader2 size={18} className="lg-spin" /> Cargando datos…
            </div>
          ) : vista === "empleado"
            ? <Empleado me={me} userEmail={userEmail} hasConsent={me ? hasConsent(me.id) : false} darConsentimiento={darConsentimiento} misDocs={misDocs} miRegistro={miRegistro} accederDoc={accederDoc} serving={serving} />
            : <RRHH empleados={empleados} docs={docs} registro={registro} hasConsent={hasConsent} cargarDoc={cargarDoc} setCustodia={setCustodia} showToast={showToast} />}
        </main>
      </div>

      {/* Modal cadena de custodia */}
      {custodia && <CustodiaModal doc={custodia} registro={registro.filter((r) => r.documento_id === custodia.id)} empleados={empleados} onClose={() => setCustodia(null)} showToast={showToast} onExport={() => exportCustodia(custodia)} />}

      {/* Toast */}
      {toast && (
        <div className="lg-body" style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 9,
          background: COL.ink, color: "#fff", padding: "11px 18px", borderRadius: 11, fontSize: 13, fontWeight: 500, boxShadow: "0 12px 36px rgba(27,29,73,.32)", zIndex: 60,
          borderLeft: `3px solid ${toast.tone === "bad" ? COL.crimson : COL.cyan}` }}>
          {toast.tone === "bad" ? <AlertTriangle size={16} color={COL.crimson} /> : <CheckCircle2 size={16} color={COL.cyan} />} {toast.msg}
        </div>
      )}
    </Shell>
  );
}

/* ----------------------- Input código TOTP ------------------------- */
function CodeInput({ value, onChange, onEnter }) {
  return (
    <input value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      onKeyDown={(e) => { if (e.key === "Enter" && value.length === 6) onEnter(); }}
      inputMode="numeric" autoComplete="one-time-code" placeholder="123456" className="lg-mono" autoFocus
      style={{ width: "100%", fontSize: 26, letterSpacing: 12, textAlign: "center", padding: "14px 0", border: `1px solid ${COL.border}`, borderRadius: 12, color: COL.ink, outline: "none" }} />
  );
}

/* --------------------------- Empleado ------------------------------ */
function Empleado({ me, userEmail, hasConsent, darConsentimiento, misDocs, miRegistro, accederDoc, serving }) {
  if (!me) {
    return (
      <>
        <Header eyebrow="MI LEGAJO" title={`Hola`} sub={userEmail ?? ""} />
        <Empty msg="Tu usuario todavía no tiene un legajo asociado. Contactá a RRHH para que den de alta tu ficha de empleado." />
      </>
    );
  }
  return (
    <>
      <Header eyebrow="MI LEGAJO" title={`Hola, ${me.nombre.split(" ")[0]}`} sub="Tus documentos laborales, disponibles y trazables." />

      {!hasConsent && (
        <Card style={{ borderColor: `${COL.amber}66`, background: "#FEF8E7", padding: "16px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FBEBB6", display: "grid", placeItems: "center", flexShrink: 0 }}><AlertTriangle size={18} color="#9A7A00" /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: COL.ink, fontSize: 14 }}>Consentimiento de formato digital pendiente</div>
            <div style={{ color: "#7A6A2E", fontSize: 12.5, marginTop: 2 }}>Para recibir tus recibos en formato digital necesitamos tu conformidad. Podés revertirla cuando quieras.</div>
          </div>
          <Btn kind="dark" icon={BadgeCheck} onClick={darConsentimiento}>Dar consentimiento</Btn>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}>
        {/* Documentos */}
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {misDocs.length === 0 && <Empty msg="Todavía no hay documentos en tu legajo." />}
          {misDocs.map((d) => {
            const ui = tipoUI(d.tipo); const Ic = ui.icon;
            const busyV = serving === d.id + "visualizacion", busyD = serving === d.id + "descarga";
            return (
              <Card key={d.id} style={{ padding: 15, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: `${ui.color}14`, display: "grid", placeItems: "center", flexShrink: 0 }}><Ic size={20} color={ui.color} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: COL.ink, fontSize: 14 }}>{d.titulo}</div>
                  <div className="lg-mono" style={{ fontSize: 10.5, color: COL.muted, marginTop: 3, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <span>{d.tipos_documento?.nombre ?? d.tipo}</span><span>· v{d.version}</span><span>· ret. {retencionLabel(d.tipos_documento)}</span>
                  </div>
                </div>
                <Btn kind="ghost" small icon={busyV ? Loader2 : Eye} onClick={() => accederDoc(d, "visualizacion")} disabled={!hasConsent || !!serving}>{busyV ? "Registrando…" : "Ver"}</Btn>
                <Btn kind="primary" small icon={busyD ? Loader2 : Download} onClick={() => accederDoc(d, "descarga")} disabled={!hasConsent || !!serving}>{busyD ? "Registrando…" : "Descargar"}</Btn>
              </Card>
            );
          })}
        </div>

        {/* Historial de accesos (transparencia) */}
        <Card style={{ padding: 18, alignSelf: "start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <History size={16} color={COL.blue} />
            <span className="lg-display" style={{ fontWeight: 600, color: COL.ink, fontSize: 15 }}>Mi historial de accesos</span>
          </div>
          <p style={{ color: COL.muted, fontSize: 12, margin: "0 0 14px" }}>Cada vez que ves o descargás un documento, queda esta constancia.</p>
          {miRegistro.length === 0
            ? <Empty msg="Todavía no registraste accesos. Abrí un documento para ver cómo queda la constancia." />
            : <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>{miRegistro.map((r) => <Ledger key={r.id} r={r} compact />)}</div>}
        </Card>
      </div>
    </>
  );
}

/* ----------------------------- RRHH -------------------------------- */
function RRHH({ empleados, docs, registro, hasConsent, cargarDoc, setCustodia, showToast }) {
  const [emp, setEmp] = useState("");
  const [tipo, setTipo] = useState("recibo_sueldo");
  const [titulo, setTitulo] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const empSel = emp || empleados[0]?.id || "";

  // Tipos desde los documentos ya cargados no alcanza; catálogo fijo del seed.
  const TIPOS_OPCIONES = [
    ["recibo_sueldo", "Recibo de sueldo"], ["contrato", "Contrato / alta / mod."],
    ["capacitacion", "Capacitación / entrenam."], ["politica", "Política de compañía"],
    ["evaluacion", "Evaluación de desempeño"], ["medico", "Examen médico / preocup."],
    ["sancion", "Apercibimiento / sanción"], ["otro", "Otro"],
  ];

  const onFile = (f) => {
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      showToast("Solo se aceptan archivos PDF", "bad");
      return;
    }
    setArchivo(f);
  };

  const submit = async () => {
    if (!empSel) return showToast("Elegí un empleado", "bad");
    if (!titulo.trim()) return showToast("Poné un título para el documento", "bad");
    if (!archivo) return showToast("Adjuntá el PDF a cargar", "bad");
    setSubiendo(true);
    const ok = await cargarDoc(empSel, tipo, titulo.trim(), archivo);
    setSubiendo(false);
    if (ok) { setTitulo(""); setArchivo(null); if (fileRef.current) fileRef.current.value = ""; }
  };

  return (
    <>
      <Header eyebrow="RECURSOS HUMANOS" title="Administración del legajo" sub="Cargá documentación y auditá los accesos. El registro es inalterable." />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Carga */}
        <Card style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Upload size={16} color={COL.blue} /><span className="lg-display" style={{ fontWeight: 600, color: COL.ink, fontSize: 15 }}>Cargar documento</span>
          </div>
          <Field label="Empleado" select value={empSel} onChange={setEmp} options={empleados.map((e) => [e.id, `${e.nombre} · ${e.legajo ?? e.cuil}`])} />
          <Field label="Tipo de documento" select value={tipo} onChange={setTipo} options={TIPOS_OPCIONES} />
          <Field label="Título" value={titulo} onChange={setTitulo} placeholder="Ej. Recibo de sueldo · Junio 2026" />
          <input ref={fileRef} type="file" accept=".pdf,application/pdf" style={{ display: "none" }}
            onChange={(e) => onFile(e.target.files?.[0])} />
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); onFile(e.dataTransfer.files?.[0]); }}
            style={{ border: `1.5px dashed ${dragOver ? COL.cyan : archivo ? COL.blue : COL.border}`, background: dragOver ? "#EAF6FD" : "transparent", cursor: "pointer", borderRadius: 12, padding: "16px", textAlign: "center", color: COL.muted, fontSize: 12.5, margin: "4px 0 14px" }}>
            {archivo ? (
              <>
                <FileCheck size={20} color={COL.blue} style={{ marginBottom: 6 }} />
                <div style={{ color: COL.ink, fontWeight: 600 }}>{archivo.name}</div>
                <div className="lg-mono" style={{ fontSize: 10, marginTop: 3 }}>{(archivo.size / 1024).toFixed(0)} KB · click para cambiar</div>
              </>
            ) : (
              <>
                <Files size={20} color={COL.muted} style={{ marginBottom: 6 }} />
                <div>Arrastrá el PDF acá o hacé click para elegirlo</div>
              </>
            )}
          </div>
          <Btn kind="dark" icon={subiendo ? Loader2 : Upload} onClick={submit} disabled={subiendo}>
            {subiendo ? "Subiendo…" : "Cargar y calcular hash"}
          </Btn>
        </Card>

        {/* Empleados */}
        <Card style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Users size={16} color={COL.blue} /><span className="lg-display" style={{ fontWeight: 600, color: COL.ink, fontSize: 15 }}>Empleados</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {empleados.length === 0 && <Empty msg="No hay empleados dados de alta." />}
            {empleados.map((e) => {
              const n = docs.filter((d) => d.empleado_id === e.id).length;
              const ok = hasConsent(e.id);
              return (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 11px", borderRadius: 11, background: COL.bg }}>
                  <div style={{ width: 30, height: 30, borderRadius: 999, background: COL.ink, color: "#fff", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700 }}>{e.nombre.split(" ").map((x) => x[0]).join("")}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: COL.ink }}>{e.nombre}</div>
                    <div className="lg-mono" style={{ fontSize: 10, color: COL.muted }}>{e.cuil} · {n} doc.</div>
                  </div>
                  <span className="lg-mono" style={{ fontSize: 10, fontWeight: 500, padding: "3px 8px", borderRadius: 999, color: ok ? COL.blue : "#9A7A00", background: ok ? "#EAF6FD" : "#FEF3D0" }}>{ok ? "consentido" : "pendiente"}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Auditoría inmutable */}
      <Card style={{ padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <ScrollText size={16} color={COL.blue} />
          <span className="lg-display" style={{ fontWeight: 600, color: COL.ink, fontSize: 15 }}>Auditoría de accesos</span>
          <span style={{ marginLeft: "auto" }}><Seal label="APPEND-ONLY · NO EDITABLE" /></span>
        </div>
        <p style={{ color: COL.muted, fontSize: 12, margin: "0 0 14px" }}>Registro completo de accesos. Ni RRHH puede modificarlo o borrarlo — es la cadena de custodia.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {registro.length === 0 && <Empty msg="Todavía no hay accesos registrados." />}
          {registro.map((r) => (
            <Ledger key={r.id} r={r} docTitulo={r.documentos?.titulo} empNombre={r.empleados?.nombre}
              onExport={r.documentos ? () => setCustodia(r.documentos) : null}
              onLockClick={() => showToast("Registro append-only: no se permite modificar ni borrar", "bad")} />
          ))}
        </div>
      </Card>
    </>
  );
}

/* --------------------- Ledger (elemento firma) --------------------- */
function Ledger({ r, compact, docTitulo, empNombre, onExport, onLockClick }) {
  const esDescarga = r.evento === "descarga";
  return (
    <div style={{ border: `1px solid ${COL.border}`, borderLeft: `3px solid ${COL.cyan}`, borderRadius: 11, padding: "11px 13px", background: COL.surface }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <Fingerprint size={15} color={COL.blue} />
        <span style={{ fontWeight: 600, fontSize: 12.5, color: COL.ink, textTransform: "capitalize" }}>{esDescarga ? "Descarga" : "Visualización"}</span>
        {!compact && docTitulo && <span style={{ fontSize: 12, color: COL.muted }}>· {docTitulo}</span>}
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 7 }}>
          {onLockClick && <button onClick={onLockClick} title="Inmutable" style={{ background: "none", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }}><Lock size={13} color={COL.muted} /></button>}
          {onExport && <button onClick={onExport} className="lg-body" style={{ background: "#EAF6FD", border: "none", color: COL.blue, fontSize: 11, fontWeight: 600, padding: "4px 9px", borderRadius: 7, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}><ScrollText size={12} /> Cadena</button>}
        </span>
      </div>
      <div className="lg-mono" style={{ fontSize: 10.5, color: COL.muted, marginTop: 7, display: "flex", flexDirection: "column", gap: 3 }}>
        {!compact && empNombre && <span>empleado: {empNombre}</span>}
        <span>sello: {fmt(r.ocurrido_en)}{r.ip ? ` · ip ${r.ip}` : ""}</span>
        <span style={{ wordBreak: "break-all" }}>hash: {r.hash_servido}</span>
      </div>
    </div>
  );
}

/* ----------------------- Modal cadena custodia --------------------- */
function CustodiaModal({ doc, registro, empleados, onClose, showToast, onExport }) {
  const t = doc.tipos_documento ?? null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(27,29,73,.5)", display: "grid", placeItems: "center", zIndex: 70, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="lg-body" style={{ background: COL.surface, borderRadius: 18, width: "100%", maxWidth: 560, maxHeight: "84vh", overflow: "auto", border: `1px solid ${COL.border}` }}>
        <div style={{ padding: "20px 22px", borderBottom: `1px solid ${COL.border}`, display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#EAF6FD", display: "grid", placeItems: "center" }}><ScrollText size={19} color={COL.blue} /></div>
          <div style={{ flex: 1 }}>
            <div className="lg-display" style={{ fontWeight: 600, color: COL.ink, fontSize: 16 }}>Cadena de custodia</div>
            <div style={{ fontSize: 12.5, color: COL.muted }}>{doc.titulo}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: COL.muted }}><X size={18} /></button>
        </div>
        <div style={{ padding: 22 }}>
          <div className="lg-mono" style={{ fontSize: 11, color: COL.inkSoft, background: COL.bg, borderRadius: 10, padding: 13, marginBottom: 16, display: "flex", flexDirection: "column", gap: 4 }}>
            <span>tipo: {t?.nombre ?? doc.tipo} · retención {retencionLabel(t)}</span>
            <span>cargado: {fmt(doc.cargado_en)}</span>
            <span style={{ wordBreak: "break-all" }}>hash documento: {doc.hash_sha256}</span>
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: COL.ink, marginBottom: 10 }}>Accesos registrados ({registro.length})</div>
          {registro.length === 0
            ? <Empty msg="Sin accesos registrados todavía para este documento." />
            : <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>{registro.map((r) => {
                const e = r.empleados ?? empleados.find((x) => x.id === r.empleado_id);
                return <Ledger key={r.id} r={r} empNombre={e?.nombre} onLockClick={() => showToast("Registro append-only: no se permite modificar ni borrar", "bad")} />;
              })}</div>}
          <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
            <Btn kind="dark" icon={Download} onClick={onExport}>Exportar constancia</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Bits -------------------------------- */
function Header({ eyebrow, title, sub }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div className="lg-mono" style={{ fontSize: 10.5, letterSpacing: 1.5, color: COL.cyan, fontWeight: 500 }}>{eyebrow}</div>
      <h1 className="lg-display" style={{ fontSize: 25, fontWeight: 700, color: COL.ink, margin: "5px 0 3px" }}>{title}</h1>
      <p style={{ color: COL.muted, fontSize: 13.5, margin: 0 }}>{sub}</p>
    </div>
  );
}
function Empty({ msg }) {
  return <div style={{ textAlign: "center", color: COL.muted, fontSize: 12.5, padding: "22px 10px", border: `1px dashed ${COL.border}`, borderRadius: 11 }}>{msg}</div>;
}
function Field({ label, value, onChange, type = "text", placeholder, mono, readOnly, select, options }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: COL.inkSoft, marginBottom: 6 }}>{label}</label>
      {select ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} className="lg-body"
          style={{ width: "100%", fontSize: 13.5, padding: "10px 11px", border: `1px solid ${COL.border}`, borderRadius: 10, color: COL.ink, background: "#fff", outline: "none" }}>
          {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      ) : (
        <input type={type} value={value} placeholder={placeholder} readOnly={readOnly}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          className={mono ? "lg-mono" : "lg-body"}
          style={{ width: "100%", fontSize: 13.5, padding: "10px 11px", border: `1px solid ${COL.border}`, borderRadius: 10, color: readOnly ? COL.muted : COL.ink, background: readOnly ? COL.bg : "#fff", outline: "none" }} />
      )}
    </div>
  );
}

function Shell({ children, bare }) {
  return (
    <div className="lg-body" style={{ minHeight: "100vh", background: COL.bg, padding: bare ? "40px 20px" : "26px 20px", display: "grid", placeItems: bare ? "center" : "start", boxSizing: "border-box" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .lg-display{font-family:'Space Grotesk',system-ui,sans-serif}
        .lg-body{font-family:'Inter',system-ui,sans-serif}
        .lg-mono{font-family:'IBM Plex Mono',ui-monospace,monospace}
        *{box-sizing:border-box}
        ::selection{background:${COL.cyan}40}
        @keyframes lg-rot{to{transform:rotate(360deg)}}
        .lg-spin{animation:lg-rot 1s linear infinite}
        @media (max-width:760px){ aside{display:none!important} }
        @media (prefers-reduced-motion:reduce){ *{transition:none!important;animation:none!important} }
      `}</style>
      <div style={{ width: "100%", maxWidth: bare ? 880 : 1080, margin: "0 auto" }}>{children}</div>
    </div>
  );
}
