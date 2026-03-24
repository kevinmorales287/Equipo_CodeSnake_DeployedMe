// =============================================
//  ClinData — Principal_abr.js v3 (EXPERT)
//  Abreviaturas, Levenshtein, Ambigüedad
// =============================================

const ABREV_CATALOGO = {
    "DM":"diabetes mellitus","DM1":"diabetes mellitus tipo 1","DM2":"diabetes mellitus tipo 2",
    "HTA":"hipertensión arterial","FC":"frecuencia cardiaca","TA":"tensión arterial",
    "FR":"frecuencia respiratoria","SPO2":"saturación de oxígeno","TEMP":"temperatura",
    "IAM":"infarto agudo de miocardio","ACV":"accidente cerebrovascular",
    "IRC":"insuficiencia renal crónica","IRA":"insuficiencia renal aguda",
    "EVC":"evento vascular cerebral","IVU":"infección vías urinarias",
    "EPOC":"enfermedad pulmonar obstructiva crónica","ICC":"insuficiencia cardíaca congestiva",
    "PCR":"proteína C reactiva","BH":"biometría hemática","QS":"química sanguínea",
    "EGO":"examen general de orina","ECG":"electrocardiograma","TAC":"tomografía",
    "RMN":"resonancia magnética","RX":"radiografía","VO":"vía oral","IV":"vía intravenosa",
    "C8H":"cada 8 horas","C12H":"cada 12 horas","C24H":"cada 24 horas",
    "PX":"paciente","DX":"diagnóstico","TX":"tratamiento","SX":"síntomas","HX":"historia"
};

const ABREV_AMBIGUAS = {
    "ACV": ["accidente cerebrovascular", "anticonceptivo"],
    "IRA": ["insuficiencia renal aguda", "infección respiratoria aguda"],
    "PR": ["periodo refractario", "pulso radial"]
};

function abrevLevenshtein(a, b) {
    if (!a.length) return b.length; if (!b.length) return a.length;
    const m = [], n = a.length, o = b.length;
    for (let i = 0; i <= o; i++) m[i] = [i];
    for (let j = 0; j <= n; j++) m[0][j] = j;
    for (let i = 1; i <= o; i++) {
        for (let j = 1; j <= n; j++) {
            m[i][j] = b.charAt(i - 1) == a.charAt(j - 1) ? m[i - 1][j - 1] : Math.min(m[i - 1][j - 1] + 1, Math.min(m[i][j - 1] + 1, m[i - 1][j] + 1));
        }
    }
    return m[o][n];
}

/**
 * TAREA 3: Función de validación exportada
 */
function validarAbreviatura(texto) {
    if (!texto) return { valida: false, score: 0, sugerencias: [], conflictos: [] };
    const norm = texto.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (norm.length < 2) return { valida: false, score: 0, sugerencias: [], conflictos: [] };

    const literal = ABREV_CATALOGO[norm];
    const ambigua = ABREV_AMBIGUAS[norm];
    let score = 0, sug = [], conf = [];

    if (literal) {
        score = ambigua ? 70 : 100;
        if (ambigua) conf.push(`Ambigüedad: ${ambigua.join(" o ")}`);
    } else {
        Object.keys(ABREV_CATALOGO).forEach(k => {
            const d = abrevLevenshtein(norm, k);
            if (d <= 1 || (norm.length > 3 && d <= 2)) {
                sug.push({ term: k, exp: ABREV_CATALOGO[k], score: Math.max(0, 100 - (d * 30)) });
            }
        });
        sug.sort((a,b) => b.score - a.score);
        score = sug.length > 0 ? sug[0].score : 0;
    }

    return {
        valida: score >= 80,
        score,
        sugerencias: sug.slice(0, 3),
        conflictos: conf
    };
}

function abrevDetectar(texto) {
    if (!texto) return { conocidas: [], similares: [], desconocidas: [] };
    const words = texto.toUpperCase().split(/[^A-Z0-9]+/).filter(w => w.length >= 2);
    const vistas = new Set();
    const result = { conocidas: [], similares: [], desconocidas: [] };

    words.forEach(w => {
        if (vistas.has(w)) return; vistas.add(w);
        const v = validarAbreviatura(w);
        if (v.score === 100) result.conocidas.push({ token: w, exp: ABREV_CATALOGO[w] });
        else if (v.score >= 40) result.similares.push({ token: w, sugerencias: v.sugerencias });
        else result.desconocidas.push(w);
    });
    return result;
}

window.abrevHelper = { validar: validarAbreviatura, detectar: abrevDetectar, catalog: ABREV_CATALOGO };
