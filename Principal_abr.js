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
    "P":"PACIENTE","PX":"PACIENTE","DX":"DIAGNÓSTICO","TX":"TRATAMIENTO",
    "SX":"SÍNTOMAS","HX":"HISTORIA CLÍNICA","CX":"CIRUGÍA","RX":"RADIOGRAFÍA",
    "AHF":"ANTECEDENTES HEREDOFAMILIARES","APP":"ANTECEDENTES PERSONALES PATOLÓGICOS",
    "APNP":"ANTECEDENTES PERSONALES NO PATOLÓGICOS",
    "DM":"DIABETES MELLITUS","DM1":"DIABETES MELLITUS TIPO 1","DM2":"DIABETES MELLITUS TIPO 2",
    "HTA":"HIPERTENSIÓN ARTERIAL","IAM":"INFARTO AGUDO DE MIOCARDIO",
    "EVC":"EVENTO VASCULAR CEREBRAL","ACV":"ACCIDENTE CEREBROVASCULAR",
    "EPOC":"ENFERMEDAD PULMONAR OBLIGATORIA CRÓNICA","ICC":"INSUFICIENCIA CARDÍACA CONGESTIVA",
    "IRC":"INSUFICIENCIA RENAL CRÓNICA","IRA":"INSUFICIENCIA RENAL AGUDA",
    "IVU":"INFECCIÓN DE VÍAS URINARIAS","ITU":"INFECCIÓN DEL TRACTO URINARIO",
    "PCR":"PROTEÍNA C REACTIVA",
    "FC":"FRECUENCIA CARDIACA","FR":"FRECUENCIA RESPIRATORIA",
    "TA":"TENSIÓN ARTERIAL","TAS":"TENSIÓN ARTERIAL SISTÓLICA","TAD":"TENSIÓN ARTERIAL DIASTÓLICA",
    "SPO2":"SATURACIÓN DE OXÍGENO","TEMP":"TEMPERATURA","GLASGOW":"ESCALA DE COMA GLASGOW",
    "BH":"BIOMETRÍA HEMÁTICA","QS":"QUÍMICA SANGUÍNEA","EGO":"EXAMEN GENERAL DE ORINA",
    "ECG":"ELECTROCARDIOGRAMA","TAC":"TOMOGRAFÍA AXIAL COMPUTARIZADA",
    "RMN":"RESONANCIA MAGNÉTICA NUCLEAR","US":"ULTRASONIDO","HB":"HEMOGLOBINA","HT":"HEMATOCRITO",
    "VO":"VÍA ORAL","IV":"VÍA INTRAVENOSA","IM":"VÍA INTRAMUSCULAR","SC":"VÍA SUBCUTÁNEA","SL":"SUBLINGUAL",
    "C8H":"CADA 8 HORAS","C12H":"CADA 12 HORAS","C24H":"CADA 24 HORAS",
    "C6H":"CADA 6 HORAS","C48H":"CADA 48 HORAS","C72H":"CADA 72 HORAS",
};

// ── Normalizar token: quita diagonal y caracteres especiales
function abrevNormalizar(token) {
    return token.toUpperCase().replace(/[^A-ZÁÉÍÓÚ0-9]/g, "");
}

// ── Lista extensa de palabras a IGNORAR
const ABREV_IGNORAR = new Set([
    "Y","O","E","U","A","DE","DEL","LA","EL","LOS","LAS","UN","UNA","CON","ESTA","SIN",
    "EN","AL","SE","QUE","NO","SI","POR","PARA","SU","ES","HA","NI","YA","FUE","LE","LO", 
    "MAS","SUS","LES","NOS","ERA","SON","HAN","SER","HAY","SINO","PERO","LOS","SIN",
    "COMO","ANTE","BAJO","CADA","CUYO","DONDE","ENTRE","HACIA","HASTA","PUES",
    "NIEGA","REFIERE","PRESENTA","TIENE","INDICA","MUESTRA","REPORTA","MENCIONA",
    "REALIZA","ACUDE","PADECE","TOLERA","INGIERE","DESCRIBE","SOLICITA","MANIFIESTA",
    "CONOCIDAS","CONOCIDO","CONOCIDA","PREVIO","PREVIA","PREVIOS","POSITIVO","NEGATIVO",
    "MASCULINO","FEMENINO","NUEVO","NUEVA","ACTIVO","ACTIVA","ACTUAL","CRÓNICO","AGUDO",
    "PACIENTE","MEDICO","NOTA","FECHA","NOMBRE","EDAD","SEXO","TIPO","NIVEL","GRADO",
    "FIEBRE","DOLOR","NAUSEA","VOMITO","CEFALEA","MAREO","TOS","DISNEA","EDEMA",
    "FOCO","APARENTE","SINDROME","CUADRO","PROCESO","ESTADO","SIGNO","SINTOMA",
    "AÑOS","ANOS","DIAS","DÍAS","HORAS","MESES","SEMANAS","MINUTOS",
    "ALTA","BAJA","NORMAL","ANORMAL","LEVE","MODERADO","SEVERO","GRAVE",
    "SOBRE","TRAS","DESDE","VA","VEN","VE","HACE","CITA","PIEL",
    "MG","ML","KG","CM","MM","LT","GR",
    "PARACETAMOL","IBUPROFENO","AMOXICILINA","METFORMINA","OMEPRAZOL",
    "NAPROXENO","TRAMADOL","DICLOFENACO","ASPIRINA","KETOROLACO","VIA","HAYA","BIEN","MAL","ORAL"
]);

// ── Palabras de uso común (no abreviaturas)
const ABREV_EXCLUIR_PALABRAS = new Set([
    "AGUA","SAL","RATO","FUEGO","CASA","TIERRA","MODO","SECA","CUELLO","MIXTA","TOS"
]);

// ── Palabras de una letra que sí queremos considerar como abreviatura posible
const ABREV_ALLOWED_ONE = new Set(["S","N","M","P","T"]);

// ── Mapa de sistemas para la sección "Revisión por aparatos y sistemas" (historia clínica)
const sistemaMap = [
    ["sis_cardiovascular", "Cardiovascular"],
    ["sis_respiratorio", "Respiratorio"],
    ["sis_digestivo", "Digestivo"],
    ["sis_neurologico", "Neurológico"],
    ["sis_urinario", "Urinario"],
    ["sis_musculoesqueletico", "Musculoesquelético"],
    ["sis_piel", "Piel y tegumentos"],
    ["sis_endocrino", "Endocrino"],
    ["sis_genitoreproductivo", "Genitorreproductivo"],
    ["sis_psiquiatrico", "Psiquiátrico/Emocional"],
];

// ── Sugerencias por letra inicial
const ABREV_SUGERENCIAS = {
    A:["ANEMIA","ASMA","ALERGIA","ARRITMIA","ANGINA"],
    B:["BRADICARDIA","BRONCOESPASMO","BIOMETRÍA HEMÁTICA"],
    C:["CEFALEA","CIRROSIS","CARDIOPATÍA","CONVULSIÓN","CÓLICO"],
    D:["DIAGNÓSTICO","DIABETES MELLITUS","DISLIPIDEMIA","DISFAGIA"],
    E:["ENFERMEDAD RENAL CRÓNICA","EPILEPSIA","EDEMA","ENFISEMA"],
    F:["FRACTURA","FIBROMIALGIA","FALLO RENAL"],
    G:["GASTRITIS","GLAUCOMA","GOTA"],
    H:["HIPERTENSIÓN ARTERIAL","HIPOTIROIDISMO","HEPATITIS","HEMORRAGIA"],
    I:["INSUFICIENCIA RENAL CRÓNICA","INFARTO","INFECCIÓN","ISQUEMIA"],
    L:["LUPUS","LEUCEMIA","LINFOMA"],
    M:["MIGRAÑA","MIOPIA","MIOCARDITIS"],
    N:["NEUROPATHIA","NEUMONÍA","NÁUSEAS"],
    O:["OBESIDAD","OSTEOPOROSIS","OTITIS"],
    P:["PACIENTE","PANCREATITIS","PARKINSON","PERITONITIS"],
    R:["REFLUJO","RINITIS","RUPURA","RADIOGRAFÍA"],
    S:["SEPSIS","SÍNCOPE","SINUSITIS","SÍNTOMAS"],
    T:["TRAUMA CRANEENCEFÁLICO","TROMBOSIS","TAQUICARDIA"],
    U:["Rticaria","ÚLCERA PÉPTICA"],
    V:["VÉRTIGO","VASCULITIS","VÓMITOS"],
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
//  Detección de abreviaturas
// =============================================
function abrevEsCandidato(normalizado) {
    if (!normalizado) return false;
    if (ABREV_IGNORAR.has(normalizado)) return false;
    if (ABREV_EXCLUIR_PALABRAS.has(normalizado)) return false;

    // Excluir números puros
    if (/^[0-9]+$/.test(normalizado)) return false;

    if (normalizado.length === 1) {
        return ABREV_ALLOWED_ONE.has(normalizado);
    }

    if (normalizado.length < 2 || normalizado.length > 4) {
        return false;
    }

    if (!/^[A-ZÁÉÍÓÚ0-9]+$/.test(normalizado)) {
        return false;
    }

    // Rechaza cadenas con consonantes y vocales que forman palabra legible no abreviatura
    // (agua, sal, etc. ya se excluyen con ABREV_EXCLUIR_PALABRAS)
    const startsWithVowel = /^[AEIOUÁÉÍÓÚ]/.test(normalizado);
    const hasVowel = /[AEIOUÁÉÍÓÚ]/.test(normalizado);
    const hasCons = /[BCDFGHJKLMNPQRSÑTVWXZ]/.test(normalizado);
    if (hasVowel && hasCons && normalizado.length > 1 && !ABREV_CATALOGO[normalizado] && normalizado.length <= 4) {
        // si es palabra composite real (solo un ejemplo), ya sea específico
        if (/^(AGUA|SAL|LUNA|CASA|TIERRA)$/.test(normalizado)) return false;
    }
    return true;
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

        if (!abrevEsCandidato(normalizado)) return;

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
        if (!texto || texto.trim() === "") return "NO REFIERE";
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

    function parseAhfText(text) {
        const rows = [];
        const normalized = String(text || "").toLowerCase();
        const items = normalized.split(/[;,\n]+/).map(s => s.trim()).filter(Boolean);
        items.forEach(item => {
            const m = item.match(/^(madre|mam[aá]|padre|pap[aá]|hermanos?|hermano|t[ií]os?|tio|abuelos?|abuelo|abuelas?|abuela|primos?|primo)\s*[:\-]?\s*(.*)$/i);
            if (m) {
                let label = m[1].toLowerCase();
                label = label.replace(/á/g, 'a').replace(/í/g, 'i');
                if (label.startsWith('mama')) label = 'madre';
                if (label.startsWith('papa')) label = 'padre';
                if (label === 'hermano') label = 'hermanos';
                if (label === 'tio') label = 'tios';
                if (label === 'abuelo') label = 'abuelos';
                if (label === 'abuela') label = 'abuelos';
                if (label === 'primo') label = 'primos';
                const normalizedLabel = label.toUpperCase();
                const value = m[2].trim().toUpperCase() || 'NO REFIERE';
                rows.push([normalizedLabel, value]);
            }
        });
        // De-duplicar y mantener el primer valor
        const unique = [];
        const seen = new Set();
        for (const [label, value] of rows) {
            if (!seen.has(label)) {
                seen.add(label);
                unique.push([label, value]);
            }
        }
        return unique;
    }

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
    doc.text(`PACIENTE: ${String(currentPatient.name||"").toUpperCase()}`, margin, y); y += 7;
    doc.setFontSize(9.5); doc.setFont(undefined,"normal");
    doc.text(`EDAD: ${currentPatient.age || "—"} AÑOS  |  SEXO: ${String(currentPatient.sex||"—").toUpperCase()}  |  FECHA: ${formatDateFull(currentConsultation.date).toUpperCase()}`, margin, y); y += 5.5;
    if (currentPatient.dob) { doc.text(`NACIMIENTO: ${formatDate(currentPatient.dob).toUpperCase()}  |  DOMICILIO: ${String(currentPatient.address||"—").toUpperCase()}`, margin, y); y += 5.5; }
    if (currentPatient.occupation||currentPatient.phone) { doc.text(`OCUPACIÓN: ${String(currentPatient.occupation||"—").toUpperCase()}  |  TEL: ${String(currentPatient.phone||"—").toUpperCase()}`, margin, y); y += 5.5; }
    if (currentPatient.allergies) { doc.setTextColor(180,0,0); doc.text(`⚠ ALERGIAS: ${String(currentPatient.allergies||"").toUpperCase()}`, margin, y); doc.setTextColor(0,0,0); y += 5.5; }
    if (currentPatient.chronicConditions) { doc.text(`PADECIMIENTOS CRÓNICOS: ${String(currentPatient.chronicConditions||"").toUpperCase()}`, margin, y); y += 5.5; }
    doc.setDrawColor(200,200,200); doc.line(margin, y, pageW-margin, y); y += 6;

    // ── Helpers ──
    function addTableSection(title, rows) {
        if (!rows || rows.length === 0) {
            rows = [["DESCRIPCIÓN", "NO REFIERE"]];
        }
        if (y > 242) { doc.addPage(); y = 15; }
        doc.setFontSize(10); doc.setFont(undefined,"bold"); doc.setTextColor(28,120,180);
        doc.text(title.toUpperCase(), margin, y); y += 5;
        const body = rows.map(([campo, valor]) => [campo.toUpperCase(), expandir(valor || "NO REFIERE")]);
        doc.autoTable({
            startY: y,
            head: [['CAMPO', 'VALOR']],
            body,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2, textColor: 40 },
            headStyles: { fillColor: [180,195,205], textColor: 20 },
            alternateRowStyles: { fillColor: [245,248,250] },
            tableLineColor: [180,190,200],
            margin: { left: margin, right: margin },
            tableWidth: contentW,
            columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 'auto' } },
        });
        y = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 4 : y + 14;
    }

    function addCompactSection(title, rows, cols = 2) {
        if (!rows || rows.length === 0) {
            rows = [["DESCRIPCIÓN", "NO REFIERE"]];
        }
        if (y > 242) { doc.addPage(); y = 15; }
        doc.setFontSize(10); doc.setFont(undefined,"bold"); doc.setTextColor(28,120,180);
        doc.text(title.toUpperCase(), margin, y); y += 5;

        const cells = rows.map(([campo, valor]) => [campo.toUpperCase(), expandir(valor || "NO REFIERE")]);
        const tableBody = [];
        for (let i = 0; i < cells.length; i += cols) {
            const row = [];
            for (let j = 0; j < cols; j++) {
                const item = cells[i+j];
                if (item) {
                    row.push(item[0], item[1]);
                } else {
                    row.push("", "");
                }
            }
            tableBody.push(row);
        }

        const columnStyles = {};
        for (let c = 0; c < cols*2; c++) {
            columnStyles[c] = { cellWidth: c % 2 === 0 ? 35 : (contentW - cols*35)/(cols) };
        }

        doc.autoTable({
            startY: y,
            head: [],
            body: tableBody,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2, textColor: 40 },
            headStyles: { fillColor: [180,195,205], textColor: 20 },
            alternateRowStyles: { fillColor: [245,248,250] },
            tableLineColor: [180,190,200],
            border: [180,190,200],
            margin: { left: margin, right: margin },
            tableWidth: contentW,
            columnStyles,
        });
        y = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 4 : y + 14;
    }

    function addSubTableSection(title, rows) {
        if (!rows || rows.length === 0) return;
        if (y > 258) { doc.addPage(); y = 15; }
        doc.setFontSize(9); doc.setFont(undefined,"bold"); doc.setTextColor(80,90,110);
        doc.text(title.toUpperCase(), margin + 4, y); y += 5;
        const body = rows.map(([campo, valor]) => [campo.toUpperCase(), expandir(valor || "").toUpperCase()]);
        doc.autoTable({
            startY: y,
            head: [['CAMPO', 'VALOR']],
            body,
            theme: 'grid',
            styles: { fontSize: 7.5, cellPadding: 2, textColor: 50 },
            headStyles: { fillColor: [215,225,230], textColor: 40 },
            alternateRowStyles: { fillColor: [248,250,252] },
            tableLineColor: [200,210,220],
            margin: { left: margin + 4, right: margin },
            tableWidth: contentW - 4,
            columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 'auto' } },
        });
        y = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 2 : y + 12;
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

        const ahfFieldsList = [
            ["MADRE", "hf-madre"],
            ["PADRE", "hf-padre"],
            ["ABUELO PATERNO", "hf-abp"],
            ["ABUELA PATERNA", "hf-abpa"],
            ["ABUELO MATERNO", "hf-abm"],
            ["ABUELA MATERNA", "hf-abma"],
            ["HERMANOS", "hf-herm"],
            ["HIJOS", "hf-hijos"],
            ["OTROS", "hf-otros"],
        ];

        const ahfText = val("ahf") || "";
        const parsedAhf = parseAhfText(ahfText);

        const structuredAhfRows = ahfFieldsList
            .map(([label, field]) => {
                const value = val(field) || "";
                return [label, value.trim() ? value.toUpperCase() : null];
            })
            .filter(([, value]) => value);

        let ahfRows = structuredAhfRows;

        if (ahfRows.length === 0) {
            if (parsedAhf.length > 0) {
                ahfRows = parsedAhf;
            } else {
                ahfRows = [["AHF", "NO REFIERE"]];
            }
        }

        addCompactSection("Antecedentes heredofamiliares (AHF)", ahfRows, 2);

        const apnpRadiologias = [
            ["Tabaquismo", "radio_tabaquismo", "tabaquismo_detalle"],
            ["Alcoholismo", "radio_alcoholismo", "alcoholismo_detalle"],
            ["Toxicomanías", "radio_toxicomanias", "toxicomanias_detalle"],
            ["Actividad física", "radio_actfisica", "actfisica_detalle"],
        ];

        const apnpRows = apnpRadiologias
            .map(([label, campoRadio, campoDetalle]) => {
                const radio = val(campoRadio) || "NO REFIERE";
                const detalle = val(campoDetalle);
                return [label, detalle ? `${radio} (${detalle})` : radio];
            });

        const adicionalesAPNP = [
            ["Escolaridad", val("pnp-esc")],
            ["Estado civil", val("pnp-ec")],
            ["Ocupación", val("pnp-ocu")],
            ["Vacunación", val("pnp-vac")],
        ];
        adicionalesAPNP.forEach(([label, value]) => apnpRows.push([label, value || "NO REFIERE"]));

        if (val("apnp_otros")) {
            apnpRows.push(["Otros", val("apnp_otros")]);
        }
        addCompactSection("Antecedentes personales no patológicos (APNP)", apnpRows, 2);

        const appRows = [
            ["Enfermedades previas", val("app_enfermedades") || "NO REFIERE"],
            ["Cirugías / Hospitalizaciones", val("app_cirugias") || "NO REFIERE"],
            ["Traumatismos", val("app_traumatismos") || "NO REFIERE"],
            ["Alergias y reacciones adversas", val("app_alergias") || "NO REFIERE"],
            ["Transfusiones", val("app_transfusiones") || "NO REFIERE"],
            ["Medicamentos actuales", val("app_medicamentos") || "NO REFIERE"],
        ];
        addCompactSection("Antecedentes personales patológicos (APP)", appRows, 2);

        const padecimientoRows = [
            ["Inicio y cronología", val("padecimiento_inicio") || "NO REFIERE"],
            ["Síntomas principales", val("padecimiento_sintomas") || "NO REFIERE"],
        ];
        addCompactSection("Padecimiento actual", padecimientoRows, 2);

        const sistemasRows = sistemaMap.map(([id, nombre]) => [nombre, val(id) || "NO REFIERE"]);
        addCompactSection("Revisión por aparatos y sistemas", sistemasRows, 2);

        const svRows = [
            ["TA", val("sv_tas") ? `${val("sv_tas")}/${val("sv_tad")} mmHg` : "NO REFIERE"],
            ["FC", val("sv_fc") ? `${val("sv_fc")} lpm` : "NO REFIERE"],
            ["FR", val("sv_fr") ? `${val("sv_fr")} rpm` : "NO REFIERE"],
            ["TEMP", val("sv_temp") ? `${val("sv_temp")}°C` : "NO REFIERE"],
            ["SPO2", val("sv_spo2") ? `${val("sv_spo2")}%` : "NO REFIERE"],
            ["GLUCEMIA", val("sv_glucemia") ? `${val("sv_glucemia")} mg/dL` : "NO REFIERE"],
            ["PESO", val("sv_peso") ? `${val("sv_peso")} kg` : "NO REFIERE"],
            ["TALLA", val("sv_talla") ? `${val("sv_talla")} cm` : "NO REFIERE"],
            ["IMC", val("sv_imc") || "NO REFIERE"],
            ["DOLOR", val("sv_dolor") ? `${val("sv_dolor")}/10` : "NO REFIERE"],
            ["HÁBITUS", val("sv_habitus") || "NO REFIERE"],
        ];
        addCompactSection("Signos vitales y somatometría", svRows, 2);

        const exploracionRows = [
            ["Cabeza y cuello", val("exp_cabeza")],
            ["Tórax y cardiopulmonar", val("exp_torax")],
            ["Abdomen", val("exp_abdomen")],
            ["Extremidades", val("exp_extremidades")],
            ["Neurológico", val("exp_neurologico")],
            ["Genitourinario", val("exp_genitourinario")],
            ["Piel y tegumentos / Otros", val("exp_otros")],
        ].filter(([_, v]) => v);
        if (exploracionRows.length > 0) addTableSection("Exploración física", exploracionRows);

        const estudiosRows = [
            ["Previos y actuales", val("estudios_previos")],
            ["Estudios de imagen", val("estudios_imagen")],
            ["Solicitados en esta consulta", val("estudios_solicitados")],
        ].filter(([_, v]) => v);
        if (estudiosRows.length > 0) addTableSection("Estudios de laboratorio y gabinete", estudiosRows);

        addTableSection("Diagnóstico principal (CIE-10)", [["Descripción", val("diagnostico")]]);
        addTableSection("Diagnósticos secundarios / diferenciales", [["Descripción", val("diagnostico_secundario")]]);

        const pronosticoTxt = [
            val("pronostico_radio") ? `${val("pronostico_radio")}` : "",
            val("pronostico_detalle") ? `(${val("pronostico_detalle")})` : ""
        ].filter(Boolean).join(" ").trim();

        const medsTxt = (currentConsultation.medicamentos || [])
            .map((m, i) => `${i+1}. ${m.nombre||""} ${m.concentracion||""} — ${m.dosis||""} ${m.via||""} ${m.frecuencia||""} por ${m.duracion||""}`)
            .filter(Boolean)
            .join("\n");

        addTableSection("Pronóstico", [["Descripción", pronosticoTxt || "No especificado"]]);
        addTableSection("Medicamentos prescritos", [["Lista", medsTxt || val("tratamiento") || "No refiere"]]);

        const indicRows = [
            ["Reposo/actividad", val("indicaciones_reposo")],
            ["Dieta", val("indicaciones_dieta")],
            ["Seguimiento", val("indicaciones_cita")],
            ["Referencia", val("indicaciones_referencia")],
        ].filter(([_, v]) => v);
        if (indicRows.length > 0) addTableSection("Indicaciones al paciente", indicRows);

        if (val("notaImportante")) addTableSection("Nota importante", [["Descripción", val("notaImportante")]]);

    // ════════════════════════════════════════════
    //  NOTA DE EVOLUCIÓN
    // ════════════════════════════════════════════
    } else if (tipoNota === "evolucion") {
        doc.setFontSize(12); doc.setFont(undefined,"bold"); doc.setTextColor(0,0,0);
        doc.text("NOTA DE EVOLUCIÓN", margin, y); y += 8;

        addTableSection("Evolución del cuadro clínico", [["Descripción", val("evolucion_clinica")]]);

        const svEvolRows = [
            ["TA", val("evol_ta") ? `${val("evol_ta")} mmHg` : ""],
            ["FC", val("evol_fc") ? `${val("evol_fc")} lpm` : ""],
            ["FR", val("evol_fr") ? `${val("evol_fr")} rpm` : ""],
            ["Temp", val("evol_temp") ? `${val("evol_temp")}°C` : ""],
            ["SpO₂", val("evol_spo2") ? `${val("evol_spo2")}%` : ""],
            ["Peso", val("evol_peso") ? `${val("evol_peso")} kg` : ""],
        ].filter(([_, v]) => v);
        if (svEvolRows.length > 0) addTableSection("Signos vitales", svEvolRows);

        addTableSection("Nuevos resultados de estudios", [["Descripción", val("evolucion_resultados")]]);
        addTableSection("Diagnóstico actualizado", [["Descripción", val("evolucion_diagnostico")]]);
        addTableSection("Tratamiento e indicaciones", [["Descripción", val("evolucion_tratamiento")]]);
        if (val("evolucion_nota")) addTableSection("Nota importante", [["Descripción", val("evolucion_nota")]]);

    // ════════════════════════════════════════════
    //  NOTA DE URGENCIAS
    // ════════════════════════════════════════════
    } else if (tipoNota === "urgencias") {
        doc.setFontSize(12); doc.setFont(undefined,"bold"); doc.setTextColor(0,0,0);
        doc.text("NOTA INICIAL DE URGENCIAS", margin, y); y += 8;

        const svUrgRows = [
            ["TA", val("urg_tas") && val("urg_tad") ? `${val("urg_tas")}/${val("urg_tad")} mmHg` : ""],
            ["FC", val("urg_fc") ? `${val("urg_fc")} lpm` : ""],
            ["FR", val("urg_fr") ? `${val("urg_fr")} rpm` : ""],
            ["Temp", val("urg_temp") ? `${val("urg_temp")}°C` : ""],
            ["SpO₂", val("urg_spo2") ? `${val("urg_spo2")}%` : ""],
            ["Glucemia", val("urg_glucemia") ? `${val("urg_glucemia")} mg/dL` : ""],
            ["Glasgow", val("urg_glasgow") ? val("urg_glasgow") : ""],
        ].filter(([_, v]) => v);
        if (svUrgRows.length > 0) addTableSection("Signos vitales al ingreso", svUrgRows);

        addTableSection("Motivo de atención en urgencias", [["Descripción", val("urg_motivo")]]);
        addTableSection("Resumen de interrogatorio y exploración", [["Descripción", val("urg_exploracion")]]);
        addTableSection("Resultados de estudios iniciales", [["Descripción", val("urg_estudios")]]);
        addTableSection("Diagnóstico en urgencias", [["Descripción", val("urg_diagnostico")]]);
        addTableSection("Tratamiento y pronóstico", [["Descripción", val("urg_tratamiento")]]);

        if (currentConsultation.destino_urg) {
            addTableSection("Destino del paciente", [["Descripción", [currentConsultation.destino_urg, currentConsultation.urg_destino_detalle].filter(Boolean).join(" — ")]]);
        }
    }

    // Agregar información de firma si existe
    if (currentConsultation.firma_medico) {
        y += 8; // Espacio adicional
        if (y > 255) { doc.addPage(); y = 15; }
        
        doc.setFontSize(10.5); doc.setFont(undefined, "bold"); doc.setTextColor(14, 165, 233);
        doc.text("AUTORÍA Y FIRMA ELECTRÓNICA", margin, y); y += 5.5;
        
        doc.setTextColor(0, 0, 0); doc.setFont(undefined, "normal"); doc.setFontSize(9.5);
        
        const firmaInfo = [
            `Médico responsable: ${currentConsultation.firma_medico}`,
            `Tipo de firma: ${currentConsultation.firma_tipo || "electrónica"}`,
            `Fecha y hora: ${currentConsultation.firma_fecha || new Date().toLocaleString("es-MX")}`
        ];
        
        if (currentConsultation.firma_cedula) {
            firmaInfo.push(`Cédula profesional: ${currentConsultation.firma_cedula}`);
        }
        
        firmaInfo.forEach(line => {
            if (y > 270) { doc.addPage(); y = 15; }
            doc.text(line, margin, y); y += 5;
        });
        
        y += 3; // Espacio después de la firma
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