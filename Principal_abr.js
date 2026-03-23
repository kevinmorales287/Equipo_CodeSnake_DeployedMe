// =============================================
//  ClinData — Principal_abr.js  v3
//  Módulo de abreviaturas: mayúsculas, detección,
//  Levenshtein, popup uno por uno, exportar PDF
//  Compatible con NOM-004-SSA3-2012 (script.js v3)
// =============================================

// =============================================
//  CATÁLOGO BASE
// =============================================
const ABREV_CATALOGO = {
    "P":"paciente","PX":"paciente","DX":"diagnóstico","TX":"tratamiento",
    "SX":"síntomas","HX":"historia clínica","CX":"cirugía","RX":"radiografía",
    "AHF":"antecedentes heredofamiliares","APP":"antecedentes personales patológicos",
    "APNP":"antecedentes personales no patológicos",
    "DM":"diabetes mellitus","DM1":"diabetes mellitus tipo 1","DM2":"diabetes mellitus tipo 2",
    "HTA":"hipertensión arterial","IAM":"infarto agudo de miocardio",
    "EVC":"evento vascular cerebral","ACV":"accidente cerebrovascular",
    "EPOC":"enfermedad pulmonar obstructiva crónica","ICC":"insuficiencia cardíaca congestiva",
    "IRC":"insuficiencia renal crónica","IRA":"insuficiencia renal aguda",
    "IVU":"infección de vías urinarias","ITU":"infección del tracto urinario",
    "PCR":"proteína C reactiva",
    "FC":"frecuencia cardiaca","FR":"frecuencia respiratoria",
    "TA":"tensión arterial","TAS":"tensión arterial sistólica","TAD":"tensión arterial diastólica",
    "SPO2":"saturación de oxígeno","TEMP":"temperatura","GLASGOW":"escala de coma Glasgow",
    "BH":"biometría hemática","QS":"química sanguínea","EGO":"examen general de orina",
    "ECG":"electrocardiograma","TAC":"tomografía axial computarizada",
    "RMN":"resonancia magnética nuclear","US":"ultrasonido","HB":"hemoglobina","HT":"hematocrito",
    "VO":"vía oral","IV":"vía intravenosa","IM":"vía intramuscular","SC":"vía subcutánea","SL":"sublingual",
    "C8H":"cada 8 horas","C12H":"cada 12 horas","C24H":"cada 24 horas",
    "C6H":"cada 6 horas","C48H":"cada 48 horas",
};

// ── Normalizar token: quita diagonal y caracteres especiales
function abrevNormalizar(token) {
    return token.toUpperCase().replace(/[^A-ZÁÉÍÓÚ0-9]/g, "");
}

// ── Lista extensa de palabras a IGNORAR
const ABREV_IGNORAR = new Set([
    "Y","O","E","U","A","DE","DEL","LA","EL","LOS","LAS","UN","UNA","CON","SIN",
    "EN","AL","SE","QUE","NO","SI","POR","PARA","SU","ES","HA","NI","YA","FUE",
    "MAS","SUS","LES","NOS","ERA","SON","HAN","SER","HAY","SINO","PERO",
    "COMO","ANTE","BAJO","CADA","CUYO","DONDE","ENTRE","HACIA","HASTA","PUES",
    "NIEGA","REFIERE","PRESENTA","TIENE","INDICA","MUESTRA","REPORTA","MENCIONA",
    "REALIZA","ACUDE","PADECE","TOLERA","INGIERE","DESCRIBE","SOLICITA","MANIFIESTA",
    "CONOCIDAS","CONOCIDO","CONOCIDA","PREVIO","PREVIA","PREVIOS","POSITIVO","NEGATIVO",
    "MASCULINO","FEMENINO","NUEVO","NUEVA","ACTIVO","ACTIVA","ACTUAL","CRÓNICO","AGUDO",
    "PACIENTE","MEDICO","NOTA","FECHA","NOMBRE","EDAD","SEXO","TIPO","NIVEL","GRADO",
    "FIEBRE","DOLOR","NAUSEA","VOMITO","CEFALEA","MAREO","TOS","DISNEA","EDEMA",
    "FOCO","APARENTE","SINDROME","CUADRO","PROCESO","ESTADO","SIGNO","SINTOMA",
    "AÑOS","DIAS","HORAS","MESES","SEMANAS","MINUTOS",
    "ALTA","BAJA","NORMAL","ANORMAL","LEVE","MODERADO","SEVERO","GRAVE",
    "SOBRE","TRAS","DESDE",
    "MG","ML","KG","CM","MM","LT","GR",
    "PARACETAMOL","IBUPROFENO","AMOXICILINA","METFORMINA","OMEPRAZOL",
    "NAPROXENO","TRAMADOL","DICLOFENACO","ASPIRINA","KETOROLACO",
]);

// ── Sugerencias por letra inicial
const ABREV_SUGERENCIAS = {
    A:["anemia","asma","alergia","arritmia","angina"],
    B:["bradicardia","broncoespasmo","biometría hemática"],
    C:["cefalea","cirrosis","cardiopatía","convulsión","cólico"],
    D:["diagnóstico","diabetes mellitus","dislipidemia","disfagia"],
    E:["enfermedad renal crónica","epilepsia","edema","enfisema"],
    F:["fractura","fibromialgia","fallo renal"],
    G:["gastritis","glaucoma","gota"],
    H:["hipertensión arterial","hipotiroidismo","hepatitis","hemorragia"],
    I:["insuficiencia renal crónica","infarto","infección","isquemia"],
    L:["lupus","leucemia","linfoma"],
    M:["migraña","miopía","miocarditis"],
    N:["neuropatía","neumonía","náuseas"],
    O:["obesidad","osteoporosis","otitis"],
    P:["paciente","pancreatitis","parkinson","peritonitis"],
    R:["reflujo","rinitis","ruptura","radiografía"],
    S:["sepsis","síncope","sinusitis","síntomas"],
    T:["trauma craneoencefálico","trombosis","taquicardia"],
    U:["urticaria","úlcera péptica"],
    V:["vértigo","vasculitis","vómito"],
};

// Abreviaturas aprendidas por el médico actual
let abrevAprendidas = JSON.parse(localStorage.getItem("cd_abrev_aprendidas") || "{}");
function abrevGuardarAprendidas() {
    localStorage.setItem("cd_abrev_aprendidas", JSON.stringify(abrevAprendidas));
}

// =============================================
//  LEVENSHTEIN
// =============================================
function abrevLevenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>i||j?(i?i:j):0));
    for (let i=1;i<=m;i++)
        for (let j=1;j<=n;j++)
            dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
    return dp[m][n];
}

function abrevBuscarSimilar(word) {
    const catalogo = {...ABREV_CATALOGO, ...abrevAprendidas};
    let mejor = null, dist = 999;
    Object.keys(catalogo).forEach(k => {
        const d = abrevLevenshtein(word, k);
        if (d < dist && d <= 2 && Math.abs(word.length - k.length) <= 2) {
            dist = d; mejor = k;
        }
    });
    return mejor && dist > 0 ? {abrev:mejor, significado:catalogo[mejor], distancia:dist} : null;
}

// =============================================
//  TOKENIZAR
// =============================================
function abrevTokenizar(texto) {
    const raw = texto.toUpperCase().split(/[\s,\.;:\(\)\[\]]+/).filter(Boolean);
    return raw.map(tok => ({
        original: tok,
        normalizado: abrevNormalizar(tok)
    }));
}

// =============================================
//  DETECTAR abreviaturas en texto
// =============================================
function abrevDetectar(texto) {
    const tokens = abrevTokenizar(texto);
    const vistas = new Set();
    const conocidas = [], similares = [], desconocidas = [];

    tokens.forEach(({original, normalizado}) => {
        if (!normalizado || vistas.has(normalizado)) return;
        vistas.add(normalizado);
        if (ABREV_IGNORAR.has(normalizado)) return;
        const esAbrev = /^[A-ZÁÉÍÓÚ][A-ZÁÉÍÓÚ0-9]{0,5}$/.test(normalizado);
        if (!esAbrev) return;
        if (normalizado.length > 6) return;
        const catalogo = {...ABREV_CATALOGO, ...abrevAprendidas};
        if (catalogo[normalizado]) {
            conocidas.push({original, normalizado});
        } else {
            const sim = abrevBuscarSimilar(normalizado);
            if (sim) similares.push({original, normalizado, ...sim});
            else desconocidas.push({original, normalizado});
        }
    });

    return {conocidas, similares, desconocidas};
}

// =============================================
//  EXPANDIR texto completo
// =============================================
function abrevExpandir(texto, mode = "patient") {
    if (!texto) return "Sin información registrada.";
    const catalogo = {...ABREV_CATALOGO, ...abrevAprendidas};
    const partes = texto.toUpperCase().split(/(\s+|,|\.|;|:|\(|\))/);
    return partes.map(parte => {
        const norm = abrevNormalizar(parte);
        if (!norm || ABREV_IGNORAR.has(norm)) return parte;
        const match = catalogo[norm];
        if (!match) return parte;
        const exp = match.charAt(0).toUpperCase() + match.slice(1);
        return mode === "patient" ? exp : `${exp} (${parte.trim()})`;
    }).join("");
}

// =============================================
//  MODO MAYÚSCULAS
// =============================================
function abrevActivarMayusculas(ids) {
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el || el._abrevMayus) return;
        el.style.textTransform = "uppercase";
        el._abrevMayus = true;
        el.addEventListener("input", function() {
            const pos = this.selectionStart;
            this.value = this.value.toUpperCase();
            this.setSelectionRange(pos, pos);
        });
    });
}

// =============================================
//  INYECTAR ESTILOS del popup
// =============================================
function abrevInyectarEstilos() {
    if (document.getElementById("abrevStyles")) return;
    const s = document.createElement("style");
    s.id = "abrevStyles";
    s.textContent = `
        #abrevOverlay{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:9999;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .2s}
        #abrevOverlay.abrev-visible{opacity:1;pointer-events:all}
        .abrev-modal{background:#fff;border-radius:12px;box-shadow:0 25px 50px rgba(0,0,0,.2);width:560px;max-width:96vw;display:flex;flex-direction:column;overflow:hidden;transform:translateY(12px);transition:transform .2s}
        #abrevOverlay.abrev-visible .abrev-modal{transform:translateY(0)}
        .abrev-modal-header{padding:20px 24px 16px;border-bottom:1px solid #e2e8f0}
        .abrev-modal-title{font-size:16px;font-weight:600;color:#0f172a;margin-bottom:4px}
        .abrev-modal-sub{font-size:12.5px;color:#94a3b8;display:flex;align-items:center;gap:10px}
        .abrev-progress{display:flex;gap:4px;margin-left:auto}
        .abrev-prog-dot{width:8px;height:8px;border-radius:50%;background:#e2e8f0;transition:background .2s}
        .abrev-prog-dot.activo{background:#1d4ed8}
        .abrev-prog-dot.ok{background:#22c55e}
        .abrev-modal-body{padding:24px;min-height:220px;display:flex;flex-direction:column;gap:16px}
        .abrev-card{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;overflow:hidden}
        .abrev-card.similar{border-color:#fbbf24}
        .abrev-card-head{padding:14px 18px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #e2e8f0}
        .abrev-card.similar .abrev-card-head{background:#fffbeb;border-bottom-color:#fde68a}
        .abrev-pill{font-family:monospace;font-size:15px;font-weight:700;background:#dbeafe;color:#1d4ed8;padding:3px 10px;border-radius:5px}
        .abrev-badge-sim{background:#fef9c3;color:#92400e;font-size:11px;padding:2px 8px;border-radius:3px;font-weight:600;border:1px solid #fde68a}
        .abrev-card-body{padding:16px 18px;display:flex;flex-direction:column;gap:12px}
        .abrev-sim-row{display:flex;align-items:center;gap:8px;font-size:14px;flex-wrap:wrap}
        .abrev-sim-btns{display:flex;gap:8px;margin-top:4px}
        .abrev-btn-si{padding:7px 18px;border-radius:8px;border:none;background:#22c55e;color:#fff;font-size:13px;cursor:pointer;font-family:inherit;font-weight:500}
        .abrev-btn-si:hover{background:#16a34a}
        .abrev-btn-no{padding:7px 18px;border-radius:8px;border:1px solid #cbd5e1;background:#fff;color:#475569;font-size:13px;cursor:pointer;font-family:inherit}
        .abrev-btn-no:hover{border-color:#94a3b8}
        .abrev-opc-label{font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.04em}
        .abrev-opciones{display:flex;flex-wrap:wrap;gap:8px}
        .abrev-opc{padding:6px 14px;border-radius:20px;border:1.5px solid #cbd5e1;background:#fff;color:#475569;font-size:13px;cursor:pointer;transition:all .12s;font-family:inherit}
        .abrev-opc:hover{border-color:#0ea5e9;color:#0369a1}
        .abrev-opc.sel{background:#dbeafe;border-color:#1d4ed8;color:#1d4ed8;font-weight:600}
        .abrev-otra-wrap{display:flex;gap:8px;margin-top:4px}
        .abrev-otra-wrap input{flex:1;border:1px solid #cbd5e1;border-radius:8px;padding:8px 12px;font-size:13px;outline:none;font-family:inherit;color:#0f172a}
        .abrev-otra-wrap input:focus{border-color:#0ea5e9}
        .abrev-otra-wrap button{padding:8px 14px;border-radius:8px;border:none;background:#1d4ed8;color:#fff;font-size:13px;cursor:pointer;font-family:inherit;white-space:nowrap}
        .abrev-otra-wrap button:hover{background:#1e40af}
        .abrev-modal-footer{padding:14px 24px;border-top:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;gap:8px}
        .abrev-footer-left{font-size:12.5px;color:#94a3b8}
        .abrev-footer-right{display:flex;gap:8px}
        .abrev-btn-omitir{padding:8px 18px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;color:#94a3b8;font-size:13px;cursor:pointer;font-family:inherit;transition:all .15s}
        .abrev-btn-omitir:hover{border-color:#cbd5e1;color:#475569}
        .abrev-btn-siguiente{padding:8px 20px;border-radius:8px;border:none;background:#1d4ed8;color:#fff;font-size:13px;cursor:pointer;font-family:inherit;font-weight:500;transition:background .15s}
        .abrev-btn-siguiente:hover{background:#1e40af}
        .abrev-btn-exportar{padding:8px 20px;border-radius:8px;border:none;background:#22c55e;color:#fff;font-size:13px;cursor:pointer;font-family:inherit;font-weight:500}
        .abrev-btn-exportar:hover{background:#16a34a}
        .abrev-manual-wrap{display:none;flex-direction:column;gap:12px}
    `;
    document.head.appendChild(s);
}

// =============================================
//  ESTADO DEL POPUP
// =============================================
let _abrevTipo       = "patient";
let _abrevItems      = [];
let _abrevIdx        = 0;
let _abrevConfirm    = {};
let _abrevReemplazos = {};

// =============================================
//  INICIAR EXPORTACIÓN
//  ► Campos alineados con IDs de index.html v3
// =============================================
function abrevIniciarExport(tipo) {
    if (!currentConsultation || !currentPatient) return;

    const todosLosCampos = [
        // Historia clínica — Interrogatorio
        "ahf","apnp_otros",
        "app_enfermedades","app_cirugias","app_traumatismos",
        "app_alergias","app_transfusiones","app_medicamentos",
        "padecimiento_inicio","padecimiento_sintomas",
        "sis_cardiovascular","sis_respiratorio","sis_digestivo",
        "sis_neurologico","sis_urinario","sis_musculoesqueletico",
        "sis_piel","sis_endocrino","sis_genitoreproductivo","sis_psiquiatrico",
        // Exploración física
        "sv_habitus",
        "exp_cabeza","exp_torax","exp_abdomen",
        "exp_extremidades","exp_neurologico","exp_genitourinario","exp_otros",
        // Estudios
        "estudios_previos","estudios_imagen","estudios_solicitados",
        // Diagnóstico y tratamiento
        "diagnostico","diagnostico_secundario","pronostico_detalle",
        "tratamiento","indicaciones_reposo","indicaciones_dieta",
        "indicaciones_cita","indicaciones_referencia",
        // Nota de evolución
        "evolucion_clinica","evolucion_resultados",
        "evolucion_diagnostico","evolucion_tratamiento","evolucion_nota",
        // Nota de urgencias
        "urg_motivo","urg_exploracion","urg_estudios",
        "urg_diagnostico","urg_tratamiento",
        // Nota importante
        "notaImportante"
    ];

    const textoTotal = todosLosCampos.map(f => currentConsultation[f] || "").join(" ");

    const {similares, desconocidas} = abrevDetectar(textoTotal);
    const items = [
        ...similares.map(s => ({...s, tipo: "similar"})),
        ...desconocidas.map(d => ({...d, tipo: "desconocida"}))
    ];

    if (!items.length) {
        abrevEjecutarPDF(tipo, {}, {});
        return;
    }

    _abrevTipo       = tipo;
    _abrevItems      = items;
    _abrevIdx        = 0;
    _abrevConfirm    = {};
    _abrevReemplazos = {};

    abrevInyectarEstilos();
    abrevCrearOverlay();
    abrevRenderTarjeta();
    document.getElementById("abrevOverlay").classList.add("abrev-visible");
}

// =============================================
//  CREAR OVERLAY (solo una vez)
// =============================================
function abrevCrearOverlay() {
    if (document.getElementById("abrevOverlay")) return;
    const overlay = document.createElement("div");
    overlay.id = "abrevOverlay";
    overlay.innerHTML = `
        <div class="abrev-modal">
            <div class="abrev-modal-header">
                <div class="abrev-modal-title">Revisar abreviaturas antes de exportar</div>
                <div class="abrev-modal-sub">
                    <span id="abrevSubtexto"></span>
                    <div class="abrev-progress" id="abrevProgress"></div>
                </div>
            </div>
            <div class="abrev-modal-body" id="abrevModalBody"></div>
            <div class="abrev-modal-footer">
                <span class="abrev-footer-left" id="abrevFooterInfo"></span>
                <div class="abrev-footer-right" id="abrevFooterBtns"></div>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", e => {
        if (e.target === overlay) overlay.classList.remove("abrev-visible");
    });
}

// =============================================
//  RENDERIZAR TARJETA ACTUAL (uno por uno)
// =============================================
function abrevRenderTarjeta() {
    const total  = _abrevItems.length;
    const actual = _abrevIdx;
    const item   = _abrevItems[actual];
    const esUltimo = actual === total - 1;

    document.getElementById("abrevProgress").innerHTML = _abrevItems.map((it,i) => {
        const cls = i < actual ? "abrev-prog-dot ok" : i === actual ? "abrev-prog-dot activo" : "abrev-prog-dot";
        return `<div class="${cls}"></div>`;
    }).join("");

    document.getElementById("abrevSubtexto").textContent =
        `${actual + 1} de ${total} abreviatura${total > 1 ? "s" : ""} con dudas`;

    const sugs = (ABREV_SUGERENCIAS[item.normalizado[0]] || []).slice(0, 5);
    const yaConfirmada = _abrevConfirm[item.normalizado];
    let bodyHtml = "";

    if (item.tipo === "similar") {
        bodyHtml = `
            <div class="abrev-card similar">
                <div class="abrev-card-head">
                    <span class="abrev-pill">${item.original}</span>
                    <span class="abrev-badge-sim">~ posible error tipográfico</span>
                </div>
                <div class="abrev-card-body">
                    <div class="abrev-sim-row">
                        <span style="color:#94a3b8">¿Quisiste decir</span>
                        <strong style="font-family:monospace;color:#1d4ed8;font-size:15px">${item.abrev}</strong>
                        <span style="color:#94a3b8">→</span>
                        <span style="font-size:14px">${item.significado}?</span>
                    </div>
                    <div class="abrev-sim-btns">
                        <button class="abrev-btn-si" onclick="abrevAceptarSim()">Sí, es ${item.abrev}</button>
                        <button class="abrev-btn-no" onclick="abrevRechazarSim()">No, es otra cosa</button>
                    </div>
                    <div class="abrev-manual-wrap" id="abrevManual">
                        <div class="abrev-opc-label">Selecciona o escribe el significado</div>
                        <div class="abrev-opciones">
                            ${sugs.map(s => `<button class="abrev-opc ${yaConfirmada===s?'sel':''}" onclick="abrevElegirOpc('${s}',this)">${s}</button>`).join("")}
                        </div>
                        <div class="abrev-otra-wrap">
                            <input id="abrevOtraInput" placeholder="O escribe tu definición...">
                            <button onclick="abrevUsarOtra()">Usar esta</button>
                        </div>
                    </div>
                </div>
            </div>`;
    } else {
        bodyHtml = `
            <div class="abrev-card">
                <div class="abrev-card-head">
                    <span class="abrev-pill">${item.original}</span>
                    <span style="font-size:13px;color:#94a3b8">Abreviatura no reconocida — ¿qué significa?</span>
                </div>
                <div class="abrev-card-body">
                    <div class="abrev-opc-label">Selecciona una opción</div>
                    <div class="abrev-opciones">
                        ${sugs.map(s => `<button class="abrev-opc ${yaConfirmada===s?'sel':''}" onclick="abrevElegirOpc('${s}',this)">${s}</button>`).join("")}
                    </div>
                    <div class="abrev-otra-wrap">
                        <input id="abrevOtraInput" placeholder="O escribe tu definición..."
                            value="${yaConfirmada && !sugs.includes(yaConfirmada) ? yaConfirmada : ''}">
                        <button onclick="abrevUsarOtra()">Usar esta</button>
                    </div>
                </div>
            </div>`;
    }

    document.getElementById("abrevModalBody").innerHTML = bodyHtml;
    document.getElementById("abrevFooterInfo").textContent =
        yaConfirmada ? `✓ Confirmada: ${yaConfirmada}` : "Sin confirmar — puedes omitir";
    document.getElementById("abrevFooterBtns").innerHTML = `
        <button class="abrev-btn-omitir" onclick="abrevOmitir()">Omitir</button>
        ${esUltimo
            ? `<button class="abrev-btn-exportar" onclick="abrevTerminar()">Guardar y exportar</button>`
            : `<button class="abrev-btn-siguiente" onclick="abrevSiguiente()">Siguiente →</button>`}`;
}

// ── Acciones de navegación ──
function abrevSiguiente() {
    if (_abrevIdx < _abrevItems.length - 1) { _abrevIdx++; abrevRenderTarjeta(); }
}
function abrevOmitir() {
    if (_abrevIdx < _abrevItems.length - 1) { _abrevIdx++; abrevRenderTarjeta(); }
    else abrevTerminar();
}
function abrevAceptarSim() {
    const item = _abrevItems[_abrevIdx];
    _abrevReemplazos[item.normalizado] = item.abrev;
    _abrevConfirm[item.normalizado]    = item.significado;
    abrevActualizarFooter();
    setTimeout(() => {
        if (_abrevIdx < _abrevItems.length - 1) { _abrevIdx++; abrevRenderTarjeta(); }
        else abrevTerminar();
    }, 600);
}
function abrevRechazarSim() {
    const manual = document.getElementById("abrevManual");
    if (manual) {
        manual.style.display = "flex";
        manual.previousElementSibling.style.display = "none";
        manual.previousElementSibling.previousElementSibling.style.display = "none";
    }
}
function abrevElegirOpc(val, btn) {
    const item = _abrevItems[_abrevIdx];
    _abrevConfirm[item.normalizado] = val;
    document.querySelectorAll(".abrev-opc").forEach(b => b.classList.remove("sel"));
    btn.classList.add("sel");
    const inp = document.getElementById("abrevOtraInput");
    if (inp) inp.value = "";
    abrevActualizarFooter();
}
function abrevUsarOtra() {
    const inp = document.getElementById("abrevOtraInput");
    if (!inp || !inp.value.trim()) return;
    const item = _abrevItems[_abrevIdx];
    _abrevConfirm[item.normalizado] = inp.value.trim();
    document.querySelectorAll(".abrev-opc").forEach(b => b.classList.remove("sel"));
    abrevActualizarFooter();
}
function abrevActualizarFooter() {
    const item = _abrevItems[_abrevIdx];
    const conf = _abrevConfirm[item.normalizado];
    const info = document.getElementById("abrevFooterInfo");
    if (info && conf) info.textContent = `✓ Confirmada: ${conf}`;
}
function abrevTerminar() {
    Object.entries(_abrevConfirm).forEach(([k,v]) => { abrevAprendidas[k] = v; });
    abrevGuardarAprendidas();
    document.getElementById("abrevOverlay").classList.remove("abrev-visible");
    abrevEjecutarPDF(_abrevTipo, _abrevConfirm, _abrevReemplazos);
}

// =============================================
//  EJECUTAR PDF
//  ► val() y secciones alineados con campos
//    NOM-004 de script.js v3
// =============================================
function abrevEjecutarPDF(tipo, extras, reemplazos) {
    if (!currentConsultation || !currentPatient) return;

    const catalogoFull = {...ABREV_CATALOGO, ...abrevAprendidas, ...extras};

    function expandir(texto) {
        if (!texto || texto.trim() === "") return "No refiere.";
        let t = texto.toUpperCase();
        Object.entries(reemplazos || {}).forEach(([mal, bien]) => {
            t = t.replace(new RegExp(`\\b${mal}\\b`, "g"), bien);
        });
        const partes = t.split(/(\s+|,|\.|;|:|\(|\))/);
        return partes.map(parte => {
            const norm = abrevNormalizar(parte);
            if (!norm || ABREV_IGNORAR.has(norm)) return parte;
            const match = catalogoFull[norm];
            if (!match) return parte;
            const exp = match.charAt(0).toUpperCase() + match.slice(1);
            return tipo === "patient" ? exp : `${exp} (${parte.trim()})`;
        }).join("");
    }

    function val(id) { return currentConsultation[id] || ""; }

    const {jsPDF} = window.jspdf;
    const doc = new jsPDF();
    let y = 15;
    const margin = 15, pageW = 210, contentW = pageW - margin * 2;

    // ── Header ──
    doc.setFillColor(15,23,42); doc.rect(0,0,pageW,24,"F");
    doc.setTextColor(255,255,255); doc.setFontSize(14); doc.setFont(undefined,"bold");
    doc.text("ClinData — Expediente Clínico", margin, 14);
    doc.setFontSize(8); doc.setFont(undefined,"normal");
    doc.text("NOM-004-SSA3-2012", margin, 20);
    doc.text(tipo === "patient" ? "Versión para paciente" : "Versión para médico", pageW-margin, 14, {align:"right"});

    // ── Datos del paciente ──
    y = 32; doc.setTextColor(0,0,0);
    doc.setFontSize(12); doc.setFont(undefined,"bold");
    doc.text(`Paciente: ${currentPatient.name}`, margin, y); y += 7;
    doc.setFontSize(9.5); doc.setFont(undefined,"normal");
    doc.text(`Edad: ${currentPatient.age} años  |  Sexo: ${currentPatient.sex}  |  Fecha: ${formatDateFull(currentConsultation.date)}`, margin, y); y += 5.5;
    if (currentPatient.dob)               { doc.text(`Nacimiento: ${formatDate(currentPatient.dob)}  |  Domicilio: ${currentPatient.address||"—"}`, margin, y); y += 5.5; }
    if (currentPatient.occupation||currentPatient.phone) { doc.text(`Ocupación: ${currentPatient.occupation||"—"}  |  Tel: ${currentPatient.phone||"—"}`, margin, y); y += 5.5; }
    if (currentPatient.allergies)         { doc.setTextColor(180,0,0); doc.text(`⚠ Alergias: ${currentPatient.allergies}`, margin, y); doc.setTextColor(0,0,0); y += 5.5; }
    if (currentPatient.chronicConditions) { doc.text(`Padecimientos crónicos: ${currentPatient.chronicConditions}`, margin, y); y += 5.5; }
    doc.setDrawColor(200,200,200); doc.line(margin, y, pageW-margin, y); y += 6;

    // ── Helpers ──
    function addSection(title, text) {
        if (!text || text.trim() === "") return;
        if (y > 260) { doc.addPage(); y = 15; }
        doc.setFontSize(11); doc.setFont(undefined,"bold"); doc.setTextColor(14,165,233);
        doc.text(title, margin, y); y += 6;
        doc.setTextColor(0,0,0); doc.setFont(undefined,"normal"); doc.setFontSize(9.5);
        const lines = doc.splitTextToSize(expandir(text), contentW);
        lines.forEach(l => { if(y>270){doc.addPage();y=15;} doc.text(l,margin,y); y+=5.5; });
        y += 4;
    }

    function addSubSection(title, text) {
        if (!text || text.trim() === "") return;
        if (y > 265) { doc.addPage(); y = 15; }
        doc.setFontSize(9); doc.setFont(undefined,"bold"); doc.setTextColor(100,100,100);
        doc.text(title.toUpperCase(), margin + 4, y); y += 5;
        doc.setTextColor(0,0,0); doc.setFont(undefined,"normal"); doc.setFontSize(9.5);
        const lines = doc.splitTextToSize(expandir(text), contentW - 4);
        lines.forEach(l => { if(y>270){doc.addPage();y=15;} doc.text(l, margin+4, y); y+=5.5; });
        y += 2;
    }

    function sectionTitle(title) {
        if (y > 250) { doc.addPage(); y = 15; }
        doc.setFontSize(11); doc.setFont(undefined,"bold"); doc.setTextColor(14,165,233);
        doc.text(title, margin, y); y += 6;
    }

    const tipoNota = currentConsultation.tipoNota || "historia";

    // ════════════════════════════════════════════
    //  HISTORIA CLÍNICA
    // ════════════════════════════════════════════
    if (tipoNota === "historia") {
        doc.setFontSize(12); doc.setFont(undefined,"bold"); doc.setTextColor(0,0,0);
        doc.text("HISTORIA CLÍNICA — NOTA DE INGRESO", margin, y); y += 8;

        addSection("Antecedentes heredofamiliares (AHF)", val("ahf"));

        const apnpRadios = [
            currentConsultation.radio_tabaquismo   && `Tabaquismo: ${currentConsultation.radio_tabaquismo}${currentConsultation.tabaquismo_detalle   ? " — "+currentConsultation.tabaquismo_detalle   : ""}`,
            currentConsultation.radio_alcoholismo  && `Alcoholismo: ${currentConsultation.radio_alcoholismo}${currentConsultation.alcoholismo_detalle  ? " — "+currentConsultation.alcoholismo_detalle  : ""}`,
            currentConsultation.radio_toxicomanias && `Toxicomanías: ${currentConsultation.radio_toxicomanias}${currentConsultation.toxicomanias_detalle ? " — "+currentConsultation.toxicomanias_detalle : ""}`,
            currentConsultation.radio_actfisica    && `Actividad física: ${currentConsultation.radio_actfisica}${currentConsultation.actfisica_detalle    ? " — "+currentConsultation.actfisica_detalle    : ""}`,
        ].filter(Boolean).join("  |  ");
        addSection("Antecedentes personales no patológicos (APNP)", [apnpRadios, val("apnp_otros")].filter(Boolean).join("\n"));

        sectionTitle("Antecedentes personales patológicos (APP)");
        addSubSection("Enfermedades previas",          val("app_enfermedades"));
        addSubSection("Cirugías / Hospitalizaciones",  val("app_cirugias"));
        addSubSection("Traumatismos",                  val("app_traumatismos"));
        addSubSection("Alergias y reacciones adversas",val("app_alergias"));
        addSubSection("Transfusiones",                 val("app_transfusiones"));
        addSubSection("Medicamentos actuales",         val("app_medicamentos"));
        y += 2;

        sectionTitle("Padecimiento actual");
        addSubSection("Inicio y cronología",  val("padecimiento_inicio"));
        addSubSection("Síntomas principales", val("padecimiento_sintomas"));
        y += 2;

        const sistemaMap = [
            ["sis_cardiovascular",    "Cardiovascular"],
            ["sis_respiratorio",      "Respiratorio"],
            ["sis_digestivo",         "Digestivo"],
            ["sis_neurologico",       "Neurológico"],
            ["sis_urinario",          "Urinario"],
            ["sis_musculoesqueletico","Musculoesquelético"],
            ["sis_piel",              "Piel y tegumentos"],
            ["sis_endocrino",         "Endocrino"],
            ["sis_genitoreproductivo","Genitorreproductivo"],
            ["sis_psiquiatrico",      "Psiquiátrico / Emocional"],
        ];
        const sistemasTxt = sistemaMap.filter(([id]) => val(id)).map(([id, nombre]) => `${nombre}: ${val(id)}`).join("\n");
        addSection("Revisión por aparatos y sistemas", sistemasTxt);

        const sv = [
            val("sv_tas")     && `TA: ${val("sv_tas")}/${val("sv_tad")} mmHg`,
            val("sv_fc")      && `FC: ${val("sv_fc")} lpm`,
            val("sv_fr")      && `FR: ${val("sv_fr")} rpm`,
            val("sv_temp")    && `Temp: ${val("sv_temp")}°C`,
            val("sv_spo2")    && `SpO₂: ${val("sv_spo2")}%`,
            val("sv_glucemia")&& `Glucemia: ${val("sv_glucemia")} mg/dL`,
            val("sv_peso")    && `Peso: ${val("sv_peso")} kg`,
            val("sv_talla")   && `Talla: ${val("sv_talla")} cm`,
            val("sv_imc")     && `IMC: ${val("sv_imc")}`,
            val("sv_dolor")   && `Dolor: ${val("sv_dolor")}/10`,
            val("sv_habitus") && `Hábitus: ${val("sv_habitus")}`,
        ].filter(Boolean).join("  |  ");
        addSection("Signos vitales y somatometría", sv);

        sectionTitle("Exploración física");
        addSubSection("Cabeza y cuello",           val("exp_cabeza"));
        addSubSection("Tórax y cardiopulmonar",    val("exp_torax"));
        addSubSection("Abdomen",                    val("exp_abdomen"));
        addSubSection("Extremidades",               val("exp_extremidades"));
        addSubSection("Neurológico",                val("exp_neurologico"));
        addSubSection("Genitourinario",             val("exp_genitourinario"));
        addSubSection("Piel y tegumentos / Otros",  val("exp_otros"));
        y += 2;

        sectionTitle("Estudios de laboratorio y gabinete");
        addSubSection("Previos y actuales",           val("estudios_previos"));
        addSubSection("Estudios de imagen",            val("estudios_imagen"));
        addSubSection("Solicitados en esta consulta",  val("estudios_solicitados"));
        y += 2;

        addSection("Diagnóstico principal (CIE-10)",             val("diagnostico"));
        addSection("Diagnósticos secundarios / diferenciales",   val("diagnostico_secundario"));

        const pronosticoTxt = [currentConsultation.pronostico_radio && `Nivel: ${currentConsultation.pronostico_radio}`, val("pronostico_detalle")].filter(Boolean).join(" — ");
        addSection("Pronóstico", pronosticoTxt);

        const meds = (currentConsultation.medicamentos || []);
        const medsTxt = meds.length > 0
            ? meds.map((m,i) => `${i+1}. ${m.nombre||""}${m.concentracion?" "+m.concentracion:""} — ${m.dosis||""} ${m.via||""} ${m.frecuencia||""} por ${m.duracion||""}`.trim()).join("\n")
            : val("tratamiento");
        addSection("Medicamentos prescritos", medsTxt);

        const indicTxt = [
            val("indicaciones_reposo")    && `Reposo/actividad: ${val("indicaciones_reposo")}`,
            val("indicaciones_dieta")     && `Dieta: ${val("indicaciones_dieta")}`,
            val("indicaciones_cita")      && `Seguimiento: ${val("indicaciones_cita")}`,
            val("indicaciones_referencia")&& `Referencia: ${val("indicaciones_referencia")}`,
        ].filter(Boolean).join("\n");
        addSection("Indicaciones al paciente", indicTxt);

        if (val("notaImportante")) addSection("Nota importante", val("notaImportante"));

    // ════════════════════════════════════════════
    //  NOTA DE EVOLUCIÓN
    // ════════════════════════════════════════════
    } else if (tipoNota === "evolucion") {
        doc.setFontSize(12); doc.setFont(undefined,"bold"); doc.setTextColor(0,0,0);
        doc.text("NOTA DE EVOLUCIÓN", margin, y); y += 8;

        addSection("Evolución del cuadro clínico", val("evolucion_clinica"));

        const svEvol = [
            val("evol_ta")   && `TA: ${val("evol_ta")} mmHg`,
            val("evol_fc")   && `FC: ${val("evol_fc")} lpm`,
            val("evol_fr")   && `FR: ${val("evol_fr")} rpm`,
            val("evol_temp") && `Temp: ${val("evol_temp")}°C`,
            val("evol_spo2") && `SpO₂: ${val("evol_spo2")}%`,
            val("evol_peso") && `Peso: ${val("evol_peso")} kg`,
        ].filter(Boolean).join("  |  ");
        addSection("Signos vitales", svEvol);

        addSection("Nuevos resultados de estudios", val("evolucion_resultados"));
        addSection("Diagnóstico actualizado",        val("evolucion_diagnostico"));
        addSection("Tratamiento e indicaciones",     val("evolucion_tratamiento"));
        if (val("evolucion_nota")) addSection("Nota importante", val("evolucion_nota"));

    // ════════════════════════════════════════════
    //  NOTA DE URGENCIAS
    // ════════════════════════════════════════════
    } else if (tipoNota === "urgencias") {
        doc.setFontSize(12); doc.setFont(undefined,"bold"); doc.setTextColor(0,0,0);
        doc.text("NOTA INICIAL DE URGENCIAS", margin, y); y += 8;

        const svUrg = [
            val("urg_tas")     && `TA: ${val("urg_tas")}/${val("urg_tad")} mmHg`,
            val("urg_fc")      && `FC: ${val("urg_fc")} lpm`,
            val("urg_fr")      && `FR: ${val("urg_fr")} rpm`,
            val("urg_temp")    && `Temp: ${val("urg_temp")}°C`,
            val("urg_spo2")    && `SpO₂: ${val("urg_spo2")}%`,
            val("urg_glucemia")&& `Glucemia: ${val("urg_glucemia")} mg/dL`,
            val("urg_glasgow") && `Glasgow: ${val("urg_glasgow")}`,
        ].filter(Boolean).join("  |  ");
        addSection("Signos vitales al ingreso",                val("urg_tas") ? svUrg : "");
        addSection("Motivo de atención en urgencias",          val("urg_motivo"));
        addSection("Resumen de interrogatorio y exploración",  val("urg_exploracion"));
        addSection("Resultados de estudios iniciales",         val("urg_estudios"));
        addSection("Diagnóstico en urgencias",                 val("urg_diagnostico"));
        addSection("Tratamiento y pronóstico",                 val("urg_tratamiento"));

        if (currentConsultation.destino_urg) {
            addSection("Destino del paciente",
                [currentConsultation.destino_urg, currentConsultation.urg_destino_detalle].filter(Boolean).join(" — "));
        }
    }

    // ── Footer ──
    const pages = doc.internal.getNumberOfPages();
    for (let i=1;i<=pages;i++) {
        doc.setPage(i); doc.setFontSize(7.5); doc.setTextColor(150);
        doc.text(`ClinData — NOM-004-SSA3-2012 — ${new Date().toLocaleDateString("es-MX")} — Página ${i}/${pages}`, pageW/2, 290, {align:"center"});
    }
    doc.save(`expediente_${currentPatient.name.replace(/\s/g,"_")}_${tipoNota}_${tipo}.pdf`);
}

// =============================================
//  INICIALIZAR
//  ► IDs actualizados a los campos NOM-004
// =============================================
function abrevInit() {
    abrevActivarMayusculas([
        // Historia clínica — Interrogatorio
        "ahf","apnp_otros",
        "app_enfermedades","app_cirugias","app_traumatismos",
        "app_alergias","app_transfusiones","app_medicamentos",
        "padecimiento_inicio","padecimiento_sintomas",
        "sis_cardiovascular","sis_respiratorio","sis_digestivo",
        "sis_neurologico","sis_urinario","sis_musculoesqueletico",
        "sis_piel","sis_endocrino","sis_genitoreproductivo","sis_psiquiatrico",
        // Exploración física
        "sv_habitus",
        "exp_cabeza","exp_torax","exp_abdomen",
        "exp_extremidades","exp_neurologico","exp_genitourinario","exp_otros",
        // Estudios
        "estudios_previos","estudios_imagen","estudios_solicitados",
        // Diagnóstico y tratamiento
        "diagnostico","diagnostico_secundario","pronostico_detalle",
        "tratamiento","indicaciones_reposo","indicaciones_dieta",
        "indicaciones_cita","indicaciones_referencia",
        // Nota de evolución
        "evolucion_clinica","evolucion_resultados",
        "evolucion_diagnostico","evolucion_tratamiento","evolucion_nota",
        // Nota de urgencias
        "urg_motivo","urg_exploracion","urg_estudios",
        "urg_diagnostico","urg_tratamiento",
        // Nota importante y campos generales
        "notaImportante",
        "triageName","triageReason","triageNotes",
        "name","address"
    ]);
}