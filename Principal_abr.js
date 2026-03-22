// =============================================
//  ClinData — Principal_abr.js  v2
//  Módulo de abreviaturas: mayúsculas, detección,
//  Levenshtein, popup uno por uno, exportar PDF
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
    // Dosis con diagonal — se guardan sin diagonal internamente
    "C8H":"cada 8 horas","C12H":"cada 12 horas","C24H":"cada 24 horas",
    "C6H":"cada 6 horas","C48H":"cada 48 horas",
};

// ── Normalizar token: quita diagonal y caracteres especiales
// C/8H → C8H, SpO2 → SPO2
function abrevNormalizar(token) {
    return token.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ0-9]/g, "");
}

// ── Lista extensa de palabras a IGNORAR
// Incluye palabras médicas comunes que NO son abreviaturas
const ABREV_IGNORAR = new Set([
    // Artículos, preposiciones, conjunciones
    "Y","O","E","U","A","DE","DEL","LA","EL","LOS","LAS","UN","UNA","CON","SIN",
    "EN","AL","SE","QUE","NO","SI","POR","PARA","SU","ES","HA","NI","YA","FUE",
    "MAS","SUS","LES","NOS","ERA","SON","HAN","SER","HAY","ERA","SINO","PERO",
    "COMO","ANTE","BAJO","CADA","CUYO","DONDE","ENTRE","HACIA","HASTA","PUES",
    // Verbos comunes en expedientes
    "NIEGA","REFIERE","PRESENTA","TIENE","INDICA","MUESTRA","REPORTA","MENCIONA",
    "REALIZA","ACUDE","PADECE","TOLERA","INGIERE","DESCRIBE","SOLICITA","MANIFIESTA",
    // Adjetivos/sustantivos comunes que NO son abreviaturas
    "CONOCIDAS","CONOCIDO","CONOCIDA","PREVIO","PREVIA","PREVIOS","POSITIVO","NEGATIVO",
    "MASCULINO","FEMENINO","NUEVO","NUEVA","ACTIVO","ACTIVA","ACTUAL","CRÓNICO","AGUDO",
    // Palabras médicas completas frecuentes
    "PACIENTE","MEDICO","NOTA","FECHA","NOMBRE","EDAD","SEXO","TIPO","NIVEL","GRADO",
    "FIEBRE","DOLOR","NAUSEA","VOMITO","CEFALEA","MAREO","TOS","DISNEA","EDEMA",
    "FOCO","APARENTE","SINDROME","CUADRO","PROCESO","ESTADO","SIGNO","SINTOMA",
    "AÑOS","DIAS","HORAS","MESES","SEMANAS","MINUTOS","MESES","SEMANAS",
    "ALTA","BAJA","NORMAL","ANORMAL","LEVE","MODERADO","SEVERO","GRAVE",
    "SIN","CON","POR","BAJO","SOBRE","TRAS","DESDE","HASTA","ENTRE",
    // Números y medidas
    "MG","ML","KG","CM","MM","LT","GR",
    // Nombres de medicamentos comunes completos
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
//  TOKENIZAR — maneja c/8h, SpO2, etc.
// =============================================
function abrevTokenizar(texto) {
    // Separar por espacios y puntuación PERO preservar tokens con diagonal tipo c/8h
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

        // Ignorar palabras de la lista
        if (ABREV_IGNORAR.has(normalizado)) return;

        // Solo detectar si parece abreviatura:
        // - empieza con letra mayúscula
        // - máximo 6 caracteres (sin diagonal)
        // - es puramente alfanumérico después de normalizar
        const esAbrev = /^[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ0-9]{0,5}$/.test(normalizado);
        if (!esAbrev) return;

        // Ignorar si es una palabra larga (más de 6 chars = palabra completa probablemente)
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

    // Separar preservando separadores
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
        if (!el || el._abrevMayus) return; // evitar doble listener
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

        /* Header */
        .abrev-modal-header{padding:20px 24px 16px;border-bottom:1px solid #e2e8f0}
        .abrev-modal-title{font-size:16px;font-weight:600;color:#0f172a;margin-bottom:4px}
        .abrev-modal-sub{font-size:12.5px;color:#94a3b8;display:flex;align-items:center;gap:10px}
        .abrev-progress{display:flex;gap:4px;margin-left:auto}
        .abrev-prog-dot{width:8px;height:8px;border-radius:50%;background:#e2e8f0;transition:background .2s}
        .abrev-prog-dot.activo{background:#1d4ed8}
        .abrev-prog-dot.ok{background:#22c55e}

        /* Cuerpo — una sola tarjeta a la vez */
        .abrev-modal-body{padding:24px;min-height:220px;display:flex;flex-direction:column;gap:16px}

        /* Tarjeta de abreviatura */
        .abrev-card{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;overflow:hidden}
        .abrev-card.similar{border-color:#fbbf24}
        .abrev-card-head{padding:14px 18px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #e2e8f0}
        .abrev-card.similar .abrev-card-head{background:#fffbeb;border-bottom-color:#fde68a}
        .abrev-pill{font-family:monospace;font-size:15px;font-weight:700;background:#dbeafe;color:#1d4ed8;padding:3px 10px;border-radius:5px}
        .abrev-badge-sim{background:#fef9c3;color:#92400e;font-size:11px;padding:2px 8px;border-radius:3px;font-weight:600;border:1px solid #fde68a}
        .abrev-card-body{padding:16px 18px;display:flex;flex-direction:column;gap:12px}

        /* Sugerencia de similar */
        .abrev-sim-row{display:flex;align-items:center;gap:8px;font-size:14px;flex-wrap:wrap}
        .abrev-sim-btns{display:flex;gap:8px;margin-top:4px}
        .abrev-btn-si{padding:7px 18px;border-radius:8px;border:none;background:#22c55e;color:#fff;font-size:13px;cursor:pointer;font-family:inherit;font-weight:500}
        .abrev-btn-si:hover{background:#16a34a}
        .abrev-btn-no{padding:7px 18px;border-radius:8px;border:1px solid #cbd5e1;background:#fff;color:#475569;font-size:13px;cursor:pointer;font-family:inherit}
        .abrev-btn-no:hover{border-color:#94a3b8}

        /* Opciones de selección */
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

        /* Footer navegación */
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
let _abrevItems      = [];   // lista de todas las abreviaturas a revisar
let _abrevIdx        = 0;    // índice actual
let _abrevConfirm    = {};   // { "IRCC": "insuficiencia renal crónica" }
let _abrevReemplazos = {};   // { "IRCC": "IRC" } — correcciones tipográficas

// =============================================
//  INICIAR EXPORTACIÓN
// =============================================
function abrevIniciarExport(tipo) {
    if (!currentConsultation || !currentPatient) return;

    const campos = ["interrogatorio","antecedentes","padecimiento","exploracion","diagnostico","tratamiento"];
    const textoTotal = campos.map(f => currentConsultation[f] || "").join(" ");

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

    // Progress dots
    document.getElementById("abrevProgress").innerHTML = _abrevItems.map((it,i) => {
        const cls = i < actual
            ? "abrev-prog-dot ok"
            : i === actual
                ? "abrev-prog-dot activo"
                : "abrev-prog-dot";
        return `<div class="${cls}"></div>`;
    }).join("");

    document.getElementById("abrevSubtexto").textContent =
        `${actual + 1} de ${total} abreviatura${total > 1 ? "s" : ""} con dudas`;

    // Cuerpo de la tarjeta
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
                        <button class="abrev-btn-si" onclick="abrevAceptarSim()">
                            Sí, es ${item.abrev}
                        </button>
                        <button class="abrev-btn-no" onclick="abrevRechazarSim()">
                            No, es otra cosa
                        </button>
                    </div>
                    <div class="abrev-manual-wrap" id="abrevManual">
                        <div class="abrev-opc-label">Selecciona o escribe el significado</div>
                        <div class="abrev-opciones">
                            ${sugs.map(s =>
                                `<button class="abrev-opc ${yaConfirmada===s?'sel':''}"
                                    onclick="abrevElegirOpc('${s}',this)">${s}</button>`
                            ).join("")}
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
                        ${sugs.map(s =>
                            `<button class="abrev-opc ${yaConfirmada===s?'sel':''}"
                                onclick="abrevElegirOpc('${s}',this)">${s}</button>`
                        ).join("")}
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

    // Footer info
    document.getElementById("abrevFooterInfo").textContent =
        yaConfirmada ? `✓ Confirmada: ${yaConfirmada}` : "Sin confirmar — puedes omitir";

    // Footer botones
    document.getElementById("abrevFooterBtns").innerHTML = `
        <button class="abrev-btn-omitir" onclick="abrevOmitir()">Omitir</button>
        ${esUltimo
            ? `<button class="abrev-btn-exportar" onclick="abrevTerminar()">Guardar y exportar</button>`
            : `<button class="abrev-btn-siguiente" onclick="abrevSiguiente()">Siguiente →</button>`
        }`;
}

// ── Acciones de navegación ──
function abrevSiguiente() {
    if (_abrevIdx < _abrevItems.length - 1) {
        _abrevIdx++;
        abrevRenderTarjeta();
    }
}

function abrevOmitir() {
    // Avanzar sin confirmar esta abreviatura
    if (_abrevIdx < _abrevItems.length - 1) {
        _abrevIdx++;
        abrevRenderTarjeta();
    } else {
        abrevTerminar();
    }
}

function abrevAceptarSim() {
    const item = _abrevItems[_abrevIdx];
    _abrevReemplazos[item.normalizado] = item.abrev;
    _abrevConfirm[item.normalizado]    = item.significado;
    abrevActualizarFooter();
    // Avanzar automáticamente después de un momento
    setTimeout(() => {
        if (_abrevIdx < _abrevItems.length - 1) { _abrevIdx++; abrevRenderTarjeta(); }
        else abrevTerminar();
    }, 600);
}

function abrevRechazarSim() {
    const manual = document.getElementById("abrevManual");
    if (manual) {
        manual.style.display = "flex";
        // Ocultar los botones si/no
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
    // Guardar todas las confirmadas
    Object.entries(_abrevConfirm).forEach(([k,v]) => { abrevAprendidas[k] = v; });
    abrevGuardarAprendidas();
    document.getElementById("abrevOverlay").classList.remove("abrev-visible");
    abrevEjecutarPDF(_abrevTipo, _abrevConfirm, _abrevReemplazos);
}

// =============================================
//  EJECUTAR PDF
// =============================================
function abrevEjecutarPDF(tipo, extras, reemplazos) {
    if (!currentConsultation || !currentPatient) return;

    const catalogoFull = {...ABREV_CATALOGO, ...abrevAprendidas, ...extras};

    function expandir(texto) {
        if (!texto) return "Sin información registrada.";
        let t = texto.toUpperCase();
        // Aplicar correcciones tipográficas
        Object.entries(reemplazos || {}).forEach(([mal, bien]) => {
            t = t.replace(new RegExp(`\\b${mal}\\b`, "g"), bien);
        });
        const partes = t.split(/(\s+|,|\.|;|:|\(|\))/);
        return partes.map(parte => {
            const norm = abrevNormalizar(parte);
            if (!norm || ABREV_IGNORAR.has(norm)) return parte;
            const match = catalogoFull[norm];
            if (!match) return parte;
            const exp = match.toUpperCase();
            return tipo === "patient" ? exp : `${exp} (${parte.trim()})`;
        }).join("");
    }

    const {jsPDF} = window.jspdf;
    const doc = new jsPDF();
    let y = 15;
    const margin = 15, pageW = 210, contentW = pageW - margin * 2;

    doc.setFillColor(15,23,42); doc.rect(0,0,pageW,22,"F");
    doc.setTextColor(255,255,255); doc.setFontSize(14); doc.setFont(undefined,"bold");
    doc.text("ClinData — Expediente Clínico", margin, 14);
    doc.setFontSize(9); doc.setFont(undefined,"normal");
    doc.text(tipo === "patient" ? "Versión para paciente" : "Versión para médico", pageW-margin, 14, {align:"right"});

    y = 30; doc.setTextColor(0,0,0);
    doc.setFontSize(12); doc.setFont(undefined,"bold");
    doc.text(`Paciente: ${currentPatient.name}`, margin, y); y += 7;
    doc.setFontSize(10); doc.setFont(undefined,"normal");
    doc.text(`Edad: ${currentPatient.age} años  |  Sexo: ${currentPatient.sex}  |  Fecha: ${formatDateFull(currentConsultation.date)}`, margin, y); y += 7;
    if (currentPatient.allergies) { doc.text(`Alergias: ${currentPatient.allergies}`, margin, y); y += 7; }
    doc.setDrawColor(200,200,200); doc.line(margin, y, pageW-margin, y); y += 7;

    function addSection(title, text) {
        if (y > 260) { doc.addPage(); y = 15; }
        doc.setFontSize(11); doc.setFont(undefined,"bold"); doc.setTextColor(14,165,233);
        doc.text(title, margin, y); y += 5;
        doc.setTextColor(0,0,0); doc.setFont(undefined,"normal"); doc.setFontSize(10);
        const lines = doc.splitTextToSize(text, contentW);
        lines.forEach(l => { if(y>270){doc.addPage();y=15;} doc.text(l,margin,y); y+=5.5; });
        y += 4;
    }

    addSection("Interrogatorio",      expandir(currentConsultation.interrogatorio));
    addSection("Antecedentes",        expandir(currentConsultation.antecedentes));
    addSection("Padecimiento actual", expandir(currentConsultation.padecimiento));
    addSection("Exploración física",  expandir(currentConsultation.exploracion));
    addSection("Diagnóstico",         expandir(currentConsultation.diagnostico));
    addSection("Tratamiento",         expandir(currentConsultation.tratamiento));

    const pages = doc.internal.getNumberOfPages();
    for (let i=1;i<=pages;i++) {
        doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150);
        doc.text(`ClinData — ${new Date().toLocaleDateString("es-MX")} — Página ${i}/${pages}`, pageW/2, 290, {align:"center"});
    }
    doc.save(`expediente_${currentPatient.name.replace(/\s/g,"_")}_${tipo}.pdf`);
}

// =============================================
//  INICIALIZAR
// =============================================
function abrevInit() {
    abrevActivarMayusculas([
        "interrogatorio","antecedentes","padecimiento",
        "exploracion","tratamiento","notaImportante",
        "triageName","triageReason","triageNotes",
        "name","address"
    ]);
}