import React, { useState } from "react";
import {
  Shield, Lock, Eye, Download, Upload, Users, History, FileText,
  CheckCircle2, AlertTriangle, KeyRound, LogOut, Fingerprint, ScrollText,
  BadgeCheck, X, FileCheck, GraduationCap, ScrollText as PolicyIcon,
  ClipboardCheck, Stethoscope, FileWarning, Files, ChevronRight, Loader2
} from "lucide-react";
import logoColor from "./assets/logo-color.png";
import logoWhite from "./assets/logo-white.png";

/* ------------------------------------------------------------------ */
/*  WellKnows · Legajo Digital — Prototipo Fase 1 (solo registro)      */
/*  Datos simulados en memoria. Sin backend. Demostrativo.            */
/* ------------------------------------------------------------------ */

const COL = {
  ink: "#1B1D49", blue: "#0D4678", cyan: "#06B8EB", amber: "#F9B701",
  crimson: "#BE163F", bg: "#EEF2F8", surface: "#FFFFFF", border: "#E2E8F2",
  muted: "#737C9C", inkSoft: "#3B4170",
};

const TIPOS = {
  recibo_sueldo: { nombre: "Recibo de sueldo", icon: FileCheck, retencion: "10 años", color: COL.blue },
  capacitacion:  { nombre: "Capacitación",      icon: GraduationCap, retencion: "Vida laboral", color: COL.cyan },
  politica:      { nombre: "Política de compañía", icon: PolicyIcon, retencion: "Versionado", color: COL.inkSoft },
  contrato:      { nombre: "Contrato / alta",   icon: ClipboardCheck, retencion: "Permanente", color: COL.ink },
  evaluacion:    { nombre: "Evaluación",        icon: FileText, retencion: "Vida laboral", color: COL.muted },
  medico:        { nombre: "Examen médico",     icon: Stethoscope, retencion: "Según SRT", color: COL.amber },
  sancion:       { nombre: "Apercibimiento",    icon: FileWarning, retencion: "Permanente", color: COL.crimson },
};

const EMPLEADOS = [
  { id: "e2", nombre: "Sofía Maidana",   cuil: "27-32145698-4", legajo: "WK-014", email: "smaidana@wellknows.com" },
  { id: "e1", nombre: "Diego Castro",    cuil: "20-29871345-1", legajo: "WK-007", email: "dcastro@wellknows.com" },
  { id: "e3", nombre: "Lucía Pereyra",   cuil: "27-35012876-9", legajo: "WK-021", email: "lpereyra@wellknows.com" },
  { id: "e4", nombre: "Martín Quiroga",  cuil: "20-30456912-7", legajo: "WK-033", email: "mquiroga@wellknows.com" },
];

function pseudoHash(seed) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  let out = "", x = h || 1;
  while (out.length < 64) {
    x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0;
    out += ("00000000" + x.toString(16)).slice(-8);
  }
  return out.slice(0, 64);
}
const fmt = (d) => new Date(d).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
const mockIP = () => "190." + (10 + Math.floor(Math.random() * 240)) + "." + Math.floor(Math.random() * 255) + "." + (2 + Math.floor(Math.random() * 250));

const DOCS_INIT = [
  { id: "d1", empleadoId: "e2", tipo: "recibo_sueldo", titulo: "Recibo de sueldo · Mayo 2026", periodo: "2026-05", version: 1, cargadoEn: "2026-06-03T11:20:00", hash: pseudoHash("d1-recibo-mayo") },
  { id: "d2", empleadoId: "e2", tipo: "recibo_sueldo", titulo: "Recibo de sueldo · Abril 2026", periodo: "2026-04", version: 1, cargadoEn: "2026-05-04T10:05:00", hash: pseudoHash("d2-recibo-abril") },
  { id: "d3", empleadoId: "e2", tipo: "politica", titulo: "Política de Seguridad e Higiene v3", periodo: null, version: 3, cargadoEn: "2026-05-18T09:00:00", hash: pseudoHash("d3-politica-syh") },
  { id: "d4", empleadoId: "e2", tipo: "capacitacion", titulo: "Capacitación · Manejo de glutaraldehído", periodo: null, version: 1, cargadoEn: "2026-06-10T14:30:00", hash: pseudoHash("d4-capacitacion") },
  { id: "d5", empleadoId: "e1", tipo: "recibo_sueldo", titulo: "Recibo de sueldo · Mayo 2026", periodo: "2026-05", version: 1, cargadoEn: "2026-06-03T11:20:00", hash: pseudoHash("d5-recibo") },
  { id: "d6", empleadoId: "e3", tipo: "recibo_sueldo", titulo: "Recibo de sueldo · Mayo 2026", periodo: "2026-05", version: 1, cargadoEn: "2026-06-03T11:20:00", hash: pseudoHash("d6-recibo") },
];

const REG_INIT = [
  { id: 9001, documentoId: "d2", empleadoId: "e2", evento: "descarga", ocurridoEn: "2026-05-06T08:42:11", ip: "190.114.22.9", hash: pseudoHash("d2-recibo-abril") },
  { id: 9002, documentoId: "d3", empleadoId: "e2", evento: "visualizacion", ocurridoEn: "2026-05-19T17:05:48", ip: "190.114.22.9", hash: pseudoHash("d3-politica-syh") },
];

const CONSENT_INIT = [
  { empleadoId: "e1", otorgado: true, ocurridoEn: "2026-04-02T10:00:00" },
  { empleadoId: "e3", otorgado: true, ocurridoEn: "2026-04-02T10:00:00" },
];

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

function Btn({ children, onClick, kind = "primary", icon: Icon, small, disabled }) {
  const styles = {
    primary: { background: COL.cyan, color: "#062B3A", border: "none" },
    dark:    { background: COL.ink, color: "#fff", border: "none" },
    ghost:   { background: "transparent", color: COL.blue, border: `1px solid ${COL.border}` },
    danger:  { background: "#FCE8EE", color: COL.crimson, border: `1px solid ${COL.crimson}33` },
  }[kind];
  return (
    <button onClick={onClick} disabled={disabled}
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

/* ------------------------------ App -------------------------------- */

export default function App() {
  const [stage, setStage] = useState("login"); // login | mfa | app
  const [pwd, setPwd] = useState("");
  const [mfa, setMfa] = useState("");
  const [role, setRole] = useState("empleado");
  const me = EMPLEADOS[0]; // sesión: Sofía Maidana

  const [docs, setDocs] = useState(DOCS_INIT);
  const [registro, setRegistro] = useState(REG_INIT);
  const [consents, setConsents] = useState(CONSENT_INIT);
  const [serving, setServing] = useState(null);
  const [toast, setToast] = useState(null);
  const [custodia, setCustodia] = useState(null); // doc para modal

  const showToast = (msg, tone = "ok") => { setToast({ msg, tone }); setTimeout(() => setToast(null), 2600); };
  const hasConsent = (id) => consents.some((c) => c.empleadoId === id && c.otorgado);

  const accederDoc = (doc, evento) => {
    if (serving) return;
    setServing(doc.id + evento);
    // Patrón servido-con-log: se REGISTRA antes de servir.
    setTimeout(() => {
      setRegistro((r) => [{
        id: Math.max(0, ...r.map((x) => x.id)) + 1,
        documentoId: doc.id, empleadoId: doc.empleadoId, evento,
        ocurridoEn: new Date().toISOString(), ip: mockIP(), hash: doc.hash,
      }, ...r]);
      setServing(null);
      showToast(`Acceso registrado · ${evento === "descarga" ? "descarga" : "visualización"} servida`);
    }, 780);
  };

  const darConsentimiento = () => {
    setConsents((c) => [...c, { empleadoId: me.id, otorgado: true, ocurridoEn: new Date().toISOString() }]);
    showToast("Consentimiento registrado · ya podés acceder a tu legajo");
  };

  const cargarDoc = (empleadoId, tipo, titulo, periodo) => {
    const id = "d" + (docs.length + 100);
    const hash = pseudoHash(id + titulo + Date.now());
    setDocs((d) => [{ id, empleadoId, tipo, titulo, periodo, version: 1, cargadoEn: new Date().toISOString(), hash }, ...d]);
    showToast("Documento cargado · hash SHA-256 calculado en el servidor");
  };

  /* --------------------------- LOGIN / MFA ------------------------- */
  if (stage !== "app") {
    return (
      <Shell bare>
        <div className="lg-body" style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", minHeight: 560, borderRadius: 20, overflow: "hidden", border: `1px solid ${COL.border}`, background: COL.surface }}>
          {/* Panel marca */}
          <div style={{ background: `linear-gradient(155deg, ${COL.ink} 0%, ${COL.blue} 100%)`, padding: "44px 40px", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <img src={logoWhite} alt="WellKnows" style={{ height: 38, display: "block" }} />
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
            {stage === "login" ? (
              <>
                <h2 className="lg-display" style={{ fontSize: 22, fontWeight: 600, color: COL.ink, margin: "0 0 4px" }}>Ingresá a tu legajo</h2>
                <p style={{ color: COL.muted, fontSize: 13, margin: "0 0 26px" }}>Acceso seguro con doble factor.</p>
                <Field label="Correo" value={me.email} mono readOnly />
                <Field label="Contraseña" value={pwd} onChange={setPwd} type="password" placeholder="••••••••" />
                <div style={{ marginTop: 22 }}>
                  <Btn kind="dark" icon={ChevronRight} onClick={() => setStage("mfa")}>Continuar</Btn>
                </div>
                <p className="lg-mono" style={{ color: COL.muted, fontSize: 11, marginTop: 20 }}>demo · ingresá cualquier valor</p>
              </>
            ) : (
              <>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: "#EAF6FD", display: "grid", placeItems: "center", marginBottom: 16 }}><KeyRound size={20} color={COL.blue} /></div>
                <h2 className="lg-display" style={{ fontSize: 22, fontWeight: 600, color: COL.ink, margin: "0 0 4px" }}>Verificación en dos pasos</h2>
                <p style={{ color: COL.muted, fontSize: 13, margin: "0 0 26px" }}>Ingresá el código de 6 dígitos de tu app de autenticación.</p>
                <input value={mfa} onChange={(e) => setMfa(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric" placeholder="123456" className="lg-mono"
                  style={{ width: "100%", fontSize: 26, letterSpacing: 12, textAlign: "center", padding: "14px 0", border: `1px solid ${COL.border}`, borderRadius: 12, color: COL.ink, outline: "none" }} />
                <div style={{ marginTop: 22, display: "flex", gap: 10 }}>
                  <Btn kind="dark" icon={Shield} onClick={() => setStage("app")} disabled={mfa.length < 6}>Verificar y entrar</Btn>
                  <Btn kind="ghost" onClick={() => setStage("login")}>Volver</Btn>
                </div>
              </>
            )}
          </div>
        </div>
      </Shell>
    );
  }

  /* ----------------------------- APP ------------------------------- */
  const misDocs = docs.filter((d) => d.empleadoId === me.id);
  const miRegistro = registro.filter((r) => r.empleadoId === me.id);

  return (
    <Shell>
      <div className="lg-body" style={{ display: "flex", gap: 0, borderRadius: 18, overflow: "hidden", border: `1px solid ${COL.border}`, minHeight: 620, background: COL.surface }}>
        {/* Sidebar */}
        <aside style={{ width: 232, background: COL.ink, color: "#fff", padding: "22px 16px", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "0 6px 22px" }}>
            <img src={logoWhite} alt="WellKnows" style={{ height: 30, display: "block" }} />
            <div className="lg-mono" style={{ fontSize: 9, letterSpacing: 1, color: COL.cyan, marginTop: 7 }}>LEGAJO DIGITAL</div>
          </div>

          <div className="lg-mono" style={{ fontSize: 9.5, letterSpacing: 1, color: "#7C86B8", padding: "0 6px 8px" }}>VISTA (DEMO)</div>
          <div style={{ background: "#161842", borderRadius: 11, padding: 4, display: "flex", gap: 4, marginBottom: 22 }}>
            {[["empleado", "Empleado", Users], ["rrhh", "RRHH", Files]].map(([k, lbl, Ic]) => (
              <button key={k} onClick={() => setRole(k)} className="lg-body"
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12.5, fontWeight: 600, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
                  background: role === k ? COL.cyan : "transparent", color: role === k ? COL.ink : "#A6AFD8" }}>
                <Ic size={14} /> {lbl}
              </button>
            ))}
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 13 }}>
            {(role === "empleado"
              ? [["Mi legajo", FileText], ["Mis accesos", History]]
              : [["Documentos", Files], ["Empleados", Users], ["Auditoría de accesos", ScrollText]]
            ).map(([lbl, Ic]) => (
              <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, color: "#C7CEEC" }}>
                <Ic size={15} color={COL.cyan} /> {lbl}
              </div>
            ))}
          </nav>

          <div style={{ marginTop: "auto", borderTop: "1px solid #2A2D5C", paddingTop: 14, display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 999, background: COL.blue, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700 }}>{me.nombre.split(" ").map((n) => n[0]).join("")}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{me.nombre}</div>
              <div className="lg-mono" style={{ fontSize: 10, color: "#7C86B8" }}>{me.legajo}</div>
            </div>
            <button onClick={() => { setStage("login"); setMfa(""); setPwd(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#7C86B8" }}><LogOut size={15} /></button>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, background: COL.bg, padding: "26px 30px", overflow: "auto" }}>
          {role === "empleado"
            ? <Empleado me={me} hasConsent={hasConsent(me.id)} darConsentimiento={darConsentimiento} misDocs={misDocs} miRegistro={miRegistro} accederDoc={accederDoc} serving={serving} />
            : <RRHH docs={docs} registro={registro} consents={consents} cargarDoc={cargarDoc} setCustodia={setCustodia} showToast={showToast} />}
        </main>
      </div>

      {/* Modal cadena de custodia */}
      {custodia && <CustodiaModal doc={custodia} registro={registro.filter((r) => r.documentoId === custodia.id)} onClose={() => setCustodia(null)} showToast={showToast} />}

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

/* --------------------------- Empleado ------------------------------ */
function Empleado({ me, hasConsent, darConsentimiento, misDocs, miRegistro, accederDoc, serving }) {
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
          {misDocs.map((d) => {
            const t = TIPOS[d.tipo]; const Ic = t.icon;
            const busyV = serving === d.id + "visualizacion", busyD = serving === d.id + "descarga";
            return (
              <Card key={d.id} style={{ padding: 15, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: `${t.color}14`, display: "grid", placeItems: "center", flexShrink: 0 }}><Ic size={20} color={t.color} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: COL.ink, fontSize: 14 }}>{d.titulo}</div>
                  <div className="lg-mono" style={{ fontSize: 10.5, color: COL.muted, marginTop: 3, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <span>{t.nombre}</span><span>· v{d.version}</span><span>· ret. {t.retencion}</span>
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
function RRHH({ docs, registro, consents, cargarDoc, setCustodia, showToast }) {
  const [emp, setEmp] = useState(EMPLEADOS[0].id);
  const [tipo, setTipo] = useState("recibo_sueldo");
  const [titulo, setTitulo] = useState("");

  return (
    <>
      <Header eyebrow="RECURSOS HUMANOS" title="Administración del legajo" sub="Cargá documentación y auditá los accesos. El registro es inalterable." />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Carga */}
        <Card style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Upload size={16} color={COL.blue} /><span className="lg-display" style={{ fontWeight: 600, color: COL.ink, fontSize: 15 }}>Cargar documento</span>
          </div>
          <Field label="Empleado" select value={emp} onChange={setEmp} options={EMPLEADOS.map((e) => [e.id, `${e.nombre} · ${e.legajo}`])} />
          <Field label="Tipo de documento" select value={tipo} onChange={setTipo} options={Object.entries(TIPOS).map(([k, v]) => [k, v.nombre])} />
          <Field label="Título" value={titulo} onChange={setTitulo} placeholder="Ej. Recibo de sueldo · Junio 2026" />
          <div style={{ border: `1.5px dashed ${COL.border}`, borderRadius: 12, padding: "16px", textAlign: "center", color: COL.muted, fontSize: 12.5, margin: "4px 0 14px" }}>
            <Files size={20} color={COL.muted} style={{ marginBottom: 6 }} />
            <div>Arrastrá el PDF acá <span className="lg-mono" style={{ fontSize: 10 }}>(demo · se simula)</span></div>
          </div>
          <Btn kind="dark" icon={Upload} onClick={() => { if (!titulo.trim()) return showToast("Poné un título para el documento", "bad"); cargarDoc(emp, tipo, titulo.trim(), null); setTitulo(""); }}>Cargar y calcular hash</Btn>
        </Card>

        {/* Empleados */}
        <Card style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Users size={16} color={COL.blue} /><span className="lg-display" style={{ fontWeight: 600, color: COL.ink, fontSize: 15 }}>Empleados</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {EMPLEADOS.map((e) => {
              const n = docs.filter((d) => d.empleadoId === e.id).length;
              const ok = consents.some((c) => c.empleadoId === e.id && c.otorgado);
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
          {[...registro].sort((a, b) => new Date(b.ocurridoEn) - new Date(a.ocurridoEn)).map((r) => {
            const doc = docs.find((d) => d.id === r.documentoId);
            const emp2 = EMPLEADOS.find((e) => e.id === r.empleadoId);
            return <Ledger key={r.id} r={r} docTitulo={doc?.titulo} empNombre={emp2?.nombre}
              onExport={doc ? () => setCustodia(doc) : null}
              onLockClick={() => showToast("Registro append-only: no se permite modificar ni borrar", "bad")} />;
          })}
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
        <span>sello: {fmt(r.ocurridoEn)} · ip {r.ip}</span>
        <span style={{ wordBreak: "break-all" }}>hash: {r.hash}</span>
      </div>
    </div>
  );
}

/* ----------------------- Modal cadena custodia --------------------- */
function CustodiaModal({ doc, registro, onClose, showToast }) {
  const t = TIPOS[doc.tipo];
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
            <span>tipo: {t.nombre} · retención {t.retencion}</span>
            <span>cargado: {fmt(doc.cargadoEn)}</span>
            <span style={{ wordBreak: "break-all" }}>hash documento: {doc.hash}</span>
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: COL.ink, marginBottom: 10 }}>Accesos registrados ({registro.length})</div>
          {registro.length === 0
            ? <Empty msg="Sin accesos registrados todavía para este documento." />
            : <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>{[...registro].sort((a, b) => new Date(b.ocurridoEn) - new Date(a.ocurridoEn)).map((r) => {
                const e = EMPLEADOS.find((x) => x.id === r.empleadoId);
                return <Ledger key={r.id} r={r} empNombre={e?.nombre} onLockClick={() => showToast("Registro append-only: no se permite modificar ni borrar", "bad")} />;
              })}</div>}
          <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
            <Btn kind="dark" icon={Download} onClick={() => showToast("Constancia de cadena de custodia exportada (JSON)")}>Exportar constancia</Btn>
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
        @media (max-width:760px){ aside{display:none!important} }
        @media (prefers-reduced-motion:reduce){ *{transition:none!important} }
      `}</style>
      <div style={{ width: "100%", maxWidth: bare ? 880 : 1080, margin: "0 auto" }}>{children}</div>
    </div>
  );
}
