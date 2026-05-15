// =============================================
//  ClinData — protocolos_module.js  v1
//  Módulo de Protocolos Quirúrgicos (HU #4)
//  Captura por fases PreQx / TransQx / Seguimiento
//  Persistencia: localStorage cd_protocolos
// =============================================

(function initProtocolosModule(global) {
    const registry = global.ClinDataModules || (global.ClinDataModules = {});
    const app = () => global.ClinDataApp;

    // ── Campos comunes (Biometría + IMC) ─────────────────────────────────────
    const COMMON_PRE_BIOMETRIA = [
        { id: 'fecha_pre', label: 'Fecha de captura (PRE)', type: 'date', group: 'Identificación' },
        { id: 'peso',      label: 'Peso',  type: 'number', unit: 'kg', min: 0, step: 0.1,  group: 'Biometría' },
        { id: 'talla',     label: 'Talla', type: 'number', unit: 'm',  min: 0, step: 0.01, group: 'Biometría' },
        { id: 'imc',       label: 'IMC',   type: 'computed', unit: 'kg/m²', group: 'Biometría',
            computed: (d) => (d.peso && d.talla) ? (Number(d.peso) / (Number(d.talla) * Number(d.talla))).toFixed(2) : '' },
    ];

    // ── Diccionario de protocolos ────────────────────────────────────────────
    const PROTOCOLO_SCHEMA = {

        ATR: {
            label: 'ATR — Artroplastía total de rodilla',
            icon: '🦵',
            preQx: [
                ...COMMON_PRE_BIOMETRIA,
                { id: 'lado', label: 'Lateralidad', type: 'select', options: ['Derecho','Izquierdo','Ambos'], group: 'Planificación' },
                { id: 'cirugia_realizar', label: 'Cirugía a realizar', type: 'select',
                    options: ['ATR primaria','ATR de revisión','Artrodesis','Lavado','Retiro de prótesis','Otro'], group: 'Planificación' },
                { id: 'angulo_clinico', label: 'Ángulo clínico Pre Qx', type: 'select',
                    options: ['Valgo','Varo','Neutro'], group: 'Planificación' },
                { id: 'eje_mec_mm',  label: 'Eje mecánico (mm)',        type: 'number', group: 'Mediciones RX' },
                { id: 'eje_mec_ang', label: 'Eje mecánico (ángulo °)',  type: 'number', group: 'Mediciones RX' },
                { id: 'afdm',  label: 'Ángulo Femoral Distal Mecánico (°)', type: 'number', group: 'Mediciones RX' },
                { id: 'afc',   label: 'Ángulo Femoral de Corte (°)',        type: 'number', group: 'Mediciones RX' },
                { id: 'at',    label: 'Ángulo Tibial (°)',                  type: 'number', group: 'Mediciones RX' },
                { id: 'slope', label: 'Ángulo Slope (°)',                   type: 'number', group: 'Mediciones RX' },
                { id: 'alfa',  label: 'Ángulo Alfa (°)',                    type: 'number', group: 'Mediciones RX' },
                { id: 'iocp',  label: 'Índice Offset Condilar Posterior',   type: 'number', group: 'Mediciones RX' },
                { id: 'dx_pre', label: 'Dx Pre Qx', type: 'select',
                    options: ['OA','AR','Osteonecrosis','Postrauma','Infección protésica','Otro'], group: 'Estado de salud' },
                { id: 'hb',  label: 'Hemoglobina', type: 'number', unit: 'g/dL', step: 0.1, group: 'Laboratorio' },
                { id: 'glu', label: 'Glucosa',     type: 'number', unit: 'mg/dL', group: 'Laboratorio' },
                { id: 'inr', label: 'INR',         type: 'number', step: 0.01,    group: 'Laboratorio' },
                { id: 'gs',  label: 'Grupo sanguíneo', type: 'select', options: ['O','A','B','AB'], group: 'Laboratorio' },
                { id: 'rh',  label: 'RH',          type: 'select', options: ['Positivo','Negativo'], group: 'Laboratorio' },
                { id: 'enf_asoc',   label: 'Enfermedades asociadas',  type: 'textarea', group: 'Medicamentos' },
                { id: 'analgesicos', label: 'Analgésicos actuales',   type: 'textarea', group: 'Medicamentos' },
                { id: 'kellgren', label: 'Kellgren-Lawrence (localización)', type: 'select',
                    options: ['Medial','Lateral','F-P','Tricompartimental'], group: 'Escalas' },
                { id: 'eva', label: 'EVA (0-10)', type: 'number', min: 0, max: 10, group: 'Escalas' },
                { id: 'kss_dolor', label: 'KSS Dolor/Movimiento', type: 'number', group: 'Escalas' },
                { id: 'kss_func',  label: 'KSS Función',           type: 'number', group: 'Escalas' },
                { id: 'kujala',    label: 'Escala Kujala',         type: 'number', group: 'Escalas' },
                { id: 'womac_dol', label: 'WOMAC Dolor',     type: 'number', group: 'Escalas' },
                { id: 'womac_rig', label: 'WOMAC Rigidez',   type: 'number', group: 'Escalas' },
                { id: 'womac_fun', label: 'WOMAC Funcional', type: 'number', group: 'Escalas' },
                { id: 'sf_fis',    label: 'SF-36/12 Físico', type: 'number', group: 'Escalas' },
                { id: 'sf_men',    label: 'SF-36/12 Mental', type: 'number', group: 'Escalas' },
            ],
            transQx: [
                { id: 'fecha_trans', label: 'Fecha de captura (TRANS)', type: 'date', group: 'Logística' },
                { id: 'fecha_qx',    label: 'Fecha Qx', type: 'date', group: 'Logística' },
                { id: 'hospital',    label: 'Hospital', type: 'text', group: 'Logística' },
                { id: 'cirugia_realizada', label: 'Cirugía realizada', type: 'text', group: 'Logística' },
                { id: 'cirujano',    label: 'Cirujano principal', type: 'text', group: 'Equipo' },
                { id: 'no_personas', label: 'No. personas en quirófano', type: 'number', min: 1, group: 'Equipo' },
                { id: 'anestesia',   label: 'Anestesia', type: 'select',
                    options: ['General','BPD','BSD','Regional','BPD + General','BSA'], group: 'Anestesia' },
                { id: 'tiempo_qx',   label: 'Tiempo Qx (min)',     type: 'number', group: 'Tiempos' },
                { id: 'sangrado',    label: 'Sangrado (ml)',       type: 'number', group: 'Tiempos' },
                { id: 'isquemia',    label: 'Tiempo de isquemia (min)', type: 'number', group: 'Tiempos' },
                { id: 'sin_isquemia', label: 'Sin uso de isquemia', type: 'checkbox', group: 'Tiempos' },
                { id: 'complicaciones', label: 'Complicaciones', type: 'textarea', group: 'Cierre' },
                { id: 'comentarios',    label: 'Comentarios',    type: 'textarea', group: 'Cierre' },
            ],
            seguimiento: [
                { id: 'fallecido',   label: 'Paciente fallecido', type: 'checkbox', group: 'Estado' },
                { id: 'fecha_seg',   label: 'Fecha de captura (SEG)', type: 'date', group: 'Estado' },
                { id: 'lado_eval',   label: 'Lado evaluado', type: 'select', options: ['Derecho','Izquierdo'], group: 'Estado' },
                { id: 'heridas',     label: 'Estado de heridas', type: 'select',
                    options: ['Cicatrizó sin complicaciones','Dehiscencia','Fístula/infección'], group: 'Herida y patela' },
                { id: 'patela',      label: 'Evaluación patelar', type: 'select',
                    options: ['Escape','Cepillo','J'], group: 'Herida y patela' },
                { id: 'fecha_muletas',  label: 'Inicio con muletas',  type: 'date', group: 'Hitos de marcha' },
                { id: 'fecha_andadera', label: 'Inicio con andadera', type: 'date', group: 'Hitos de marcha' },
                { id: 'fecha_sin_aux',  label: 'Marcha sin auxiliares', type: 'date', group: 'Hitos de marcha' },
                { id: 'eva_seg',     label: 'EVA actual (0-10)', type: 'number', min: 0, max: 10, group: 'Re-evaluación' },
                { id: 'kss_mov_seg', label: 'KSS Movimiento', type: 'number', group: 'Re-evaluación' },
                { id: 'kss_fun_seg', label: 'KSS Función',     type: 'number', group: 'Re-evaluación' },
                { id: 'tegner_seg',  label: 'Escala Tegner',   type: 'number', group: 'Re-evaluación' },
            ],
        },

        ATC: {
            label: 'ATC — Artroplastía total de cadera',
            icon: '🦴',
            preQx: [
                ...COMMON_PRE_BIOMETRIA,
                { id: 'cirugia_realizar', label: 'Cirugía a realizar', type: 'select',
                    options: ['ATC primaria','ATC de revisión','Otro'], group: 'Planificación' },
                { id: 'lado', label: 'Lateralidad', type: 'select', options: ['Derecho','Izquierdo'], group: 'Planificación' },
                { id: 'dx_pre', label: 'Dx Pre Qx', type: 'select',
                    options: ['OA','AR','Osteonecrosis','Fractura','Aflojamiento aséptico','Infección protésica',
                              'Fractura periprotésica','Secuela de displasia','Necrosis avascular'], group: 'Planificación' },
                { id: 'ang_cervdia_D', label: 'Ángulo cervicodiafisiario (°)', type: 'number', side: 'D', group: 'Mediciones RX (sin implante)' },
                { id: 'ang_cervdia_I', label: 'Ángulo cervicodiafisiario (°)', type: 'number', side: 'I', group: 'Mediciones RX (sin implante)' },
                { id: 'inc_acet_D', label: 'Inclinación acetabular (°)', type: 'number', side: 'D', group: 'Mediciones RX (sin implante)' },
                { id: 'inc_acet_I', label: 'Inclinación acetabular (°)', type: 'number', side: 'I', group: 'Mediciones RX (sin implante)' },
                { id: 'tam_acet_D', label: 'Tamaño acetabular (mm)',     type: 'number', side: 'D', group: 'Mediciones RX (sin implante)' },
                { id: 'tam_acet_I', label: 'Tamaño acetabular (mm)',     type: 'number', side: 'I', group: 'Mediciones RX (sin implante)' },
                { id: 'off_fem_D',  label: 'Offset femoral (mm)',        type: 'number', side: 'D', group: 'Mediciones RX (sin implante)' },
                { id: 'off_fem_I',  label: 'Offset femoral (mm)',        type: 'number', side: 'I', group: 'Mediciones RX (sin implante)' },
                { id: 'off_acet_D', label: 'Offset acetabular (mm)',     type: 'number', side: 'D', group: 'Mediciones RX (sin implante)' },
                { id: 'off_acet_I', label: 'Offset acetabular (mm)',     type: 'number', side: 'I', group: 'Mediciones RX (sin implante)' },
                { id: 'alt_fem_D',  label: 'Altura femoral (mm)',        type: 'number', side: 'D', group: 'Mediciones RX (sin implante)' },
                { id: 'alt_fem_I',  label: 'Altura femoral (mm)',        type: 'number', side: 'I', group: 'Mediciones RX (sin implante)' },
                { id: 'disc_long',  label: 'Discrepancia de longitud (mm)', type: 'number', group: 'Mediciones RX (sin implante)' },
                { id: 'pi',  label: 'Incidencia pélvica (PI)',          type: 'number', group: 'RX lateral' },
                { id: 'll',  label: 'Lordosis lumbar (LL)',             type: 'number', group: 'RX lateral' },
                { id: 'ss',  label: 'Inclinación sacra (SS)',           type: 'number', group: 'RX lateral' },
                { id: 'app', label: 'Plano pélvico anterior (APP)',     type: 'number', group: 'RX lateral' },
                { id: 'apf', label: 'Ángulo pélvico femoral (APF)',     type: 'number', group: 'RX lateral' },
                { id: 'dorr',  label: 'Clasificación DORR', type: 'select',
                    options: ['Angosta','Ancha','Amplia'], group: 'Clasificaciones' },
                { id: 'tonis', label: 'Escala TONIS',       type: 'select',
                    options: ['Grado 0','Grado 1','Grado 2','Grado 3'], group: 'Clasificaciones' },
                { id: 'hb',  label: 'Hemoglobina', type: 'number', unit: 'g/dL', step: 0.1, group: 'Laboratorio' },
                { id: 'glu', label: 'Glucosa',     type: 'number', unit: 'mg/dL', group: 'Laboratorio' },
                { id: 'inr', label: 'INR',         type: 'number', step: 0.01,    group: 'Laboratorio' },
                { id: 'gs',  label: 'Grupo sanguíneo', type: 'select', options: ['O','A','B','AB'], group: 'Laboratorio' },
                { id: 'rh',  label: 'RH', type: 'select', options: ['Positivo','Negativo'], group: 'Laboratorio' },
                { id: 'eva', label: 'EVA (0-10)', type: 'number', min: 0, max: 10, group: 'Escalas' },
                { id: 'hhs',    label: 'HHS (Harris Hip Score)', type: 'number', group: 'Escalas' },
                { id: 'womac',  label: 'WOMAC total',            type: 'number', group: 'Escalas' },
                { id: 'sf',     label: 'SF-36/12',               type: 'number', group: 'Escalas' },
            ],
            transQx: [
                { id: 'fecha_trans', label: 'Fecha TRANS', type: 'date', group: 'Logística' },
                { id: 'hospital',    label: 'Hospital',    type: 'text', group: 'Logística' },
                { id: 'cirujano',    label: 'Cirujano principal', type: 'text', group: 'Logística' },
                { id: 'ropa_desech', label: 'Ropa desechable', type: 'radio', options: ['Sí','No'], group: 'Logística' },
                { id: 'no_personas', label: 'No. personas en quirófano', type: 'number', group: 'Logística' },
                { id: 'abordaje',    label: 'Técnica de abordaje', type: 'select',
                    options: ['Lateral directo','Posterior','Anterior','Otro'], group: 'Técnica' },
                { id: 'anestesia',   label: 'Anestesia', type: 'select',
                    options: ['General','BPD','BSD','Regional','BPD + General','BSA'], group: 'Seguridad' },
                { id: 'tiempo_qx',   label: 'Tiempo Qx (min)', type: 'number', group: 'Tiempos' },
                { id: 'sangrado',    label: 'Sangrado (ml)',   type: 'number', group: 'Tiempos' },
                { id: 'transfusion', label: 'Transfusión (paquetes)', type: 'number', group: 'Tiempos' },
                { id: 'complicaciones', label: 'Complicaciones', type: 'textarea', group: 'Cierre' },
                { id: 'comentarios',    label: 'Comentarios',    type: 'textarea', group: 'Cierre' },
            ],
            seguimiento: [
                { id: 'fallecido', label: 'Paciente fallecido', type: 'checkbox', group: 'Estado' },
                { id: 'fecha_seg', label: 'Fecha SEG', type: 'date', group: 'Estado' },
                { id: 'lado_eval', label: 'Lado evaluado', type: 'select', options: ['Derecho','Izquierdo'], group: 'Estado' },
                { id: 'ang_cervdia_seg', label: 'Ángulo cervicodiafisiario (°)', type: 'number', group: 'Re-evaluación RX' },
                { id: 'off_fem_seg',     label: 'Offset femoral (mm)',           type: 'number', group: 'Re-evaluación RX' },
                { id: 'alt_fem_seg',     label: 'Altura femoral (mm)',           type: 'number', group: 'Re-evaluación RX' },
                { id: 'distancia_apex',  label: 'Distancia punta-ápex (mm)',     type: 'number', group: 'Re-evaluación RX' },
                { id: 'disc_long_seg',   label: 'Discrepancia de longitud (mm)', type: 'number', group: 'Re-evaluación RX' },
                { id: 'eva_seg',     label: 'EVA actual (0-10)', type: 'number', min: 0, max: 10, group: 'Funcional' },
                { id: 'hhs_seg',     label: 'HHS',                type: 'number', group: 'Funcional' },
                { id: 'womac_seg',   label: 'WOMAC total',        type: 'number', group: 'Funcional' },
                { id: 'satisfaccion', label: 'Satisfacción', type: 'select',
                    options: ['Muy satisfecho','Satisfecho','Poco satisfecho','No satisfecho'], group: 'Resultados' },
                { id: 'contralateral', label: 'Expectativa contralateral', type: 'select',
                    options: ['Se operaría la otra','Esperaría','Dudaría','No se operaría'], group: 'Resultados' },
            ],
        },

        HOMBRO: {
            label: 'Hombro',
            icon: '💪',
            preQx: [
                ...COMMON_PRE_BIOMETRIA,
                { id: 'fecha_lesion', label: 'Fecha de lesión', type: 'date', group: 'Contexto' },
                { id: 'lado',         label: 'Lado', type: 'select', options: ['Derecho','Izquierdo'], group: 'Contexto' },
                { id: 'enf_asoc',     label: 'Enfermedades asociadas', type: 'textarea', group: 'Contexto' },
                { id: 'eva', label: 'EVA (0-10)', type: 'number', min: 0, max: 10, group: 'Escalas' },
                { id: 'sst',     label: 'Simple Shoulder Test', type: 'number', group: 'Escalas' },
                { id: 'qdash',   label: 'Quick DASH',            type: 'number', group: 'Escalas' },
                { id: 'rowe',    label: 'Rowe',                  type: 'number', group: 'Escalas' },
                { id: 'ases',    label: 'ASES',                  type: 'number', group: 'Escalas' },
                { id: 'constant',label: 'Constant',              type: 'number', group: 'Escalas' },
                { id: 'rohi',    label: 'ROHI',                  type: 'number', group: 'Escalas' },
                { id: 'severidad', label: 'Índice de severidad', type: 'number', group: 'Escalas' },
            ],
            transQx: [
                { id: 'fecha_trans', label: 'Fecha TRANS', type: 'date', group: 'Logística' },
                { id: 'fecha_qx',    label: 'Fecha Qx',    type: 'date', group: 'Logística' },
                { id: 'hospital',    label: 'Hospital',    type: 'text', group: 'Logística' },
                { id: 'lado_op',     label: 'Lado operado', type: 'select', options: ['Derecho','Izquierdo'], group: 'Logística' },
                { id: 'abordaje',    label: 'Abordaje', type: 'select',
                    options: ['Todo artroscópico','Mini open','Abierto'], group: 'Técnica' },
                { id: 'cirujano',     label: 'Cirujano',     type: 'text', group: 'Equipo' },
                { id: 'ayudante',     label: 'Ayudante',     type: 'text', group: 'Equipo' },
                { id: 'anestesiologo',label: 'Anestesiólogo', type: 'text', group: 'Equipo' },
                { id: 'anestesia',    label: 'Anestesia', type: 'select',
                    options: ['General','Bloqueo y sedación'], group: 'Anestesia' },
                { id: 'tiempo_qx',    label: 'Tiempo Qx (min)', type: 'number', group: 'Tiempos' },
                { id: 'crioterapia',  label: 'Crioterapia', type: 'radio', options: ['Sí','No'], group: 'Cuidados' },
                { id: 'inmovilizador',label: 'Inmovilizador', type: 'select',
                    options: ['Cabestrillo','Completo','En ABD'], group: 'Cuidados' },
            ],
            seguimiento: [
                { id: 'fallecido', label: 'Paciente fallecido', type: 'checkbox', group: 'Estado' },
                { id: 'fecha_seg', label: 'Fecha SEG', type: 'date', group: 'Estado' },
                { id: 'lado_eval', label: 'Lado evaluado', type: 'select', options: ['Derecho','Izquierdo'], group: 'Estado' },
                { id: 'eva', label: 'EVA actual', type: 'select', options: ['Leve','Moderada','Intensa'], group: 'Dolor' },
                { id: 'sst_seg',     label: 'Simple Shoulder Test', type: 'number', group: 'Re-evaluación' },
                { id: 'qdash_seg',   label: 'Quick DASH',           type: 'number', group: 'Re-evaluación' },
                { id: 'rowe_seg',    label: 'Rowe',                 type: 'number', group: 'Re-evaluación' },
                { id: 'severidad_seg', label: 'Índice de severidad', type: 'number', group: 'Re-evaluación' },
                { id: 'ases_seg',    label: 'ASES',                 type: 'number', group: 'Re-evaluación' },
                { id: 'constant_seg',label: 'Constant',             type: 'number', group: 'Re-evaluación' },
                { id: 'satisfaccion', label: 'Satisfacción', type: 'select',
                    options: ['Muy satisfecho','Satisfecho','Poco satisfecho','No satisfecho'], group: 'Resultados' },
                { id: 'decision_retro', label: 'Decisión retrospectiva', type: 'select',
                    options: ['Se operaría la otra','Esperaría','Dudaría','No se operaría'], group: 'Resultados' },
            ],
        },

        LMC: {
            label: 'Ligamento / Menisco / Condral',
            icon: '🩹',
            preQx: [
                ...COMMON_PRE_BIOMETRIA,
                { id: 'fecha_lesion', label: 'Fecha de lesión', type: 'date', group: 'Contexto' },
                { id: 'lado',         label: 'Lado', type: 'select', options: ['Derecho','Izquierdo'], group: 'Contexto' },
                { id: 'enf_asoc',     label: 'Enfermedades asociadas', type: 'textarea', group: 'Contexto' },
                { id: 'eva',     label: 'EVA (0-10)', type: 'number', min: 0, max: 10, group: 'Escalas' },
                { id: 'koos',    label: 'KOOS',     type: 'number', group: 'Escalas' },
                { id: 'tegner',  label: 'Tegner',   type: 'number', group: 'Escalas' },
                { id: 'lysholm', label: 'Lysholm',  type: 'number', group: 'Escalas' },
                { id: 'kujala',  label: 'Kujala',   type: 'number', group: 'Escalas' },
                { id: 'ikdc',    label: 'IKDC',     type: 'number', group: 'Escalas' },
            ],
            transQx: [
                { id: 'fecha_trans', label: 'Fecha TRANS', type: 'date', group: 'Logística' },
                { id: 'lado_op',     label: 'Lado operado', type: 'select', options: ['Derecho','Izquierdo'], group: 'Logística' },
                { id: 'cirujano',    label: 'Cirujano', type: 'text', group: 'Equipo' },
                { id: 'no_personas', label: 'No. personas en QX', type: 'number', group: 'Equipo' },
                { id: 'anestesia',   label: 'Anestesia', type: 'select',
                    options: ['BPD','BSD','Regional','General'], group: 'Anestesia' },
                { id: 'tiempo_qx',   label: 'Tiempo Qx (min)',      type: 'number', group: 'Tiempos' },
                { id: 'tiempo_isq',  label: 'Tiempo isquemia (min)', type: 'number', group: 'Tiempos' },
                { id: 'bomba',       label: 'Bomba de irrigación', type: 'radio', options: ['Sí','No'], group: 'Manejo' },
                { id: 'complicaciones', label: 'Complicaciones', type: 'textarea', group: 'Cierre' },
                { id: 'comentarios',    label: 'Comentarios',    type: 'textarea', group: 'Cierre' },
            ],
            seguimiento: [
                { id: 'fallecido', label: 'Paciente fallecido', type: 'checkbox', group: 'Estado' },
                { id: 'fecha_seg', label: 'Fecha SEG', type: 'date', group: 'Estado' },
                { id: 'lado_eval', label: 'Lado evaluado', type: 'select', options: ['Derecho','Izquierdo'], group: 'Estado' },
                { id: 'eva_seg',     label: 'EVA actual (0-10)', type: 'number', min: 0, max: 10, group: 'Re-evaluación' },
                { id: 'koos_seg',    label: 'KOOS',    type: 'number', group: 'Re-evaluación' },
                { id: 'tegner_seg',  label: 'Tegner',  type: 'number', group: 'Re-evaluación' },
                { id: 'lysholm_seg', label: 'Lysholm', type: 'number', group: 'Re-evaluación' },
                { id: 'kujala_seg',  label: 'Kujala',  type: 'number', group: 'Re-evaluación' },
                { id: 'ikdc_seg',    label: 'IKDC',    type: 'number', group: 'Re-evaluación' },
            ],
        },

        FHP: {
            label: 'Fractura húmero proximal',
            icon: '🦴',
            preQx: [
                ...COMMON_PRE_BIOMETRIA,
                { id: 'fecha_lesion', label: 'Fecha de lesión', type: 'date', group: 'Lesión' },
                { id: 'lado',         label: 'Lado', type: 'select', options: ['Derecho','Izquierdo'], group: 'Lesión' },
            ],
            transQx: [
                { id: 'fecha_trans', label: 'Fecha TRANS', type: 'date', group: 'Logística' },
                { id: 'fecha_qx',    label: 'Fecha Qx',    type: 'date', group: 'Logística' },
                { id: 'lado_op',     label: 'Lado operado', type: 'select', options: ['Derecho','Izquierdo'], group: 'Logística' },
                { id: 'anestesia',   label: 'Anestesia', type: 'select',
                    options: ['General','Bloqueo y sedación'], group: 'Seguridad' },
            ],
            seguimiento: [
                { id: 'fallecido', label: 'Paciente fallecido', type: 'checkbox', group: 'Estado' },
                { id: 'fecha_seg', label: 'Fecha SEG', type: 'date', group: 'Estado' },
                { id: 'lado_eval', label: 'Lado evaluado', type: 'select', options: ['Derecho','Izquierdo'], group: 'Estado' },
                { id: 'eva', label: 'EVA actual', type: 'select', options: ['Leve','Moderada','Intensa'], group: 'Dolor' },
                { id: 'ases',     label: 'ASES',            type: 'number', group: 'Escalas' },
                { id: 'constant', label: 'Constant-Murley', type: 'number', group: 'Escalas' },
                { id: 'comp_infec', label: 'Infección',                 type: 'checkbox', group: 'Complicaciones' },
                { id: 'comp_dehis', label: 'Dehiscencia de heridas',    type: 'checkbox', group: 'Complicaciones' },
                { id: 'comp_axil',  label: 'Lesión nervio axilar',      type: 'checkbox', group: 'Complicaciones' },
                { id: 'comp_oste',  label: 'Osteonecrosis',             type: 'checkbox', group: 'Complicaciones' },
                { id: 'comp_otros', label: 'Otros',                     type: 'textarea', group: 'Complicaciones' },
            ],
        },

        FMT: {
            label: 'Fractura meseta tibial',
            icon: '🦵',
            preQx: [
                ...COMMON_PRE_BIOMETRIA,
                { id: 'fecha_lesion', label: 'Fecha de lesión', type: 'date', group: 'Contexto' },
                { id: 'lado',         label: 'Lado afectado', type: 'select', options: ['Derecho','Izquierdo'], group: 'Contexto' },
                { id: 'enf_asoc',     label: 'Enfermedades asociadas', type: 'textarea', group: 'Contexto' },
                { id: 'eva',       label: 'EVA (0-10)', type: 'number', min: 0, max: 10, group: 'Escalas' },
                { id: 'kss_dolor', label: 'KSS Dolor/Movimiento', type: 'number', group: 'Escalas' },
                { id: 'kss_func',  label: 'KSS Función',           type: 'number', group: 'Escalas' },
                { id: 'tegner',    label: 'Tegner',                type: 'number', group: 'Escalas' },
            ],
            transQx: [
                { id: 'fecha_trans', label: 'Fecha TRANS', type: 'date', group: 'Logística' },
                { id: 'fecha_qx',    label: 'Fecha Qx',    type: 'date', group: 'Logística' },
                { id: 'lado_op',     label: 'Lado operado', type: 'select', options: ['Derecho','Izquierdo'], group: 'Logística' },
                { id: 'cirujano',    label: 'Cirujano', type: 'text', group: 'Logística' },
                { id: 'anestesia',   label: 'Anestesia', type: 'select',
                    options: ['BPD','BSD','Regional','General'], group: 'Operatorio' },
                { id: 'tiempo_qx',   label: 'Tiempo Qx (min)',      type: 'number', group: 'Operatorio' },
                { id: 'tiempo_isq',  label: 'Tiempo isquemia (min)', type: 'number', group: 'Operatorio' },
                { id: 'sin_isquemia', label: 'Sin uso de isquemia',  type: 'checkbox', group: 'Operatorio' },
                { id: 'complicaciones', label: 'Complicaciones', type: 'textarea', group: 'Incidencias' },
                { id: 'comentarios',    label: 'Comentarios',    type: 'textarea', group: 'Incidencias' },
            ],
            seguimiento: [
                { id: 'fallecido', label: 'Paciente fallecido', type: 'checkbox', group: 'Estado' },
                { id: 'fecha_seg', label: 'Fecha SEG', type: 'date', group: 'Estado' },
                { id: 'lado_eval', label: 'Lado evaluado', type: 'select', options: ['Derecho','Izquierdo'], group: 'Estado' },
                { id: 'heridas',   label: 'Estado de heridas', type: 'select',
                    options: ['Cicatrizó sin complicaciones','Dehiscencia','Fístula/infección'], group: 'Herida' },
                { id: 'patela',    label: 'Evaluación patelar', type: 'select',
                    options: ['Escape','Cepillo','J'], group: 'Herida' },
                { id: 'fecha_qx_ref',  label: 'Fecha de cirugía',     type: 'date', group: 'Apoyo' },
                { id: 'fecha_muletas', label: 'Inicio con muletas',   type: 'date', group: 'Apoyo' },
                { id: 'fecha_andadera',label: 'Inicio con andadera',  type: 'date', group: 'Apoyo' },
                { id: 'fecha_sin_aux', label: 'Marcha sin muletas',   type: 'date', group: 'Apoyo' },
                { id: 'eva_seg',     label: 'EVA actual (0-10)', type: 'number', min: 0, max: 10, group: 'Evaluación final' },
                { id: 'kss_mov_seg', label: 'KSS Movimiento', type: 'number', group: 'Evaluación final' },
                { id: 'kss_fun_seg', label: 'KSS Función',     type: 'number', group: 'Evaluación final' },
                { id: 'tegner_seg',  label: 'Tegner',          type: 'number', group: 'Evaluación final' },
            ],
        },

        FCAD: {
            label: 'Fractura de cadera',
            icon: '🦴',
            preQx: [
                ...COMMON_PRE_BIOMETRIA,
                { id: 'fecha_lesion', label: 'Fecha de lesión', type: 'date', group: 'Trauma' },
                { id: 'lado',         label: 'Lado afectado', type: 'select', options: ['Derecho','Izquierdo'], group: 'Trauma' },
                { id: 'eva',          label: 'EVA (0-10)', type: 'number', min: 0, max: 10, group: 'Clínica' },
                { id: 'has',          label: 'HAS', type: 'checkbox', group: 'Clínica' },
                { id: 'comorb_otros', label: 'Otras comorbilidades', type: 'textarea', group: 'Clínica' },
                { id: 'medicamentos', label: 'Medicamentos actuales', type: 'textarea', group: 'Clínica' },
            ],
            transQx: [
                { id: 'fecha_trans', label: 'Fecha TRANS', type: 'date', group: 'Logística' },
                { id: 'hospital',    label: 'Hospital',    type: 'text', group: 'Logística' },
                { id: 'lado_op',     label: 'Lado operado', type: 'select', options: ['Derecho','Izquierdo'], group: 'Logística' },
                { id: 'ropa_desech', label: 'Ropa desechable', type: 'radio', options: ['Sí','No'], group: 'Logística' },
                { id: 'cirujano',    label: 'Cirujano', type: 'text', group: 'Logística' },
                { id: 'no_personas', label: 'No. personas en QX', type: 'number', group: 'Logística' },
                { id: 'anestesia',   label: 'Anestesia', type: 'select',
                    options: ['General','BPD','BSD','Regional','BPD + General + BSA'], group: 'Anestesia' },
                { id: 'tiempo_qx',   label: 'Tiempo Qx (min)', type: 'number', group: 'Tiempos' },
                { id: 'sangrado',    label: 'Sangrado (ml)',   type: 'number', group: 'Tiempos' },
                { id: 'transfusion', label: 'Transfusión (paquetes)', type: 'number', group: 'Tiempos' },
                { id: 'drenovak',    label: 'Drenovak', type: 'radio', options: ['Sí','No'], group: 'Tiempos' },
                { id: 'complicaciones', label: 'Complicaciones', type: 'textarea', group: 'Cierre' },
                { id: 'ang_cervdia_D', label: 'Ángulo cervicodiafisiario (°)', type: 'number', side: 'D', group: 'Mediciones RX precisión' },
                { id: 'ang_cervdia_I', label: 'Ángulo cervicodiafisiario (°)', type: 'number', side: 'I', group: 'Mediciones RX precisión' },
                { id: 'off_fem_D', label: 'Offset femoral (mm)', type: 'number', side: 'D', group: 'Mediciones RX precisión' },
                { id: 'off_fem_I', label: 'Offset femoral (mm)', type: 'number', side: 'I', group: 'Mediciones RX precisión' },
                { id: 'alt_fem_D', label: 'Altura femoral (mm)', type: 'number', side: 'D', group: 'Mediciones RX precisión' },
                { id: 'alt_fem_I', label: 'Altura femoral (mm)', type: 'number', side: 'I', group: 'Mediciones RX precisión' },
                { id: 'distancia_apex', label: 'Distancia punta-ápex (mm)', type: 'number', group: 'Mediciones RX precisión' },
                { id: 'disc_long', label: 'Discrepancia longitud (mm)', type: 'number', group: 'Mediciones RX precisión' },
            ],
            seguimiento: [
                { id: 'fallecido', label: 'Paciente fallecido', type: 'checkbox', group: 'Estado' },
                { id: 'fecha_seg', label: 'Fecha SEG', type: 'date', group: 'Estado' },
                { id: 'lado_eval', label: 'Lado evaluado', type: 'select', options: ['Derecho','Izquierdo'], group: 'Estado' },
                { id: 'ang_cervdia_seg', label: 'Ángulo cervicodiafisiario (°)', type: 'number', group: 'Re-evaluación RX' },
                { id: 'off_fem_seg',     label: 'Offset femoral (mm)',           type: 'number', group: 'Re-evaluación RX' },
                { id: 'alt_fem_seg',     label: 'Altura femoral (mm)',           type: 'number', group: 'Re-evaluación RX' },
                { id: 'distancia_apex_seg', label: 'Distancia punta-ápex (mm)',  type: 'number', group: 'Re-evaluación RX' },
                { id: 'disc_long_seg',   label: 'Discrepancia longitud (mm)',    type: 'number', group: 'Re-evaluación RX' },
                { id: 'eva_seg',   label: 'EVA actual (0-10)', type: 'number', min: 0, max: 10, group: 'Funcional' },
                { id: 'hhs_seg',   label: 'HHS', type: 'number', group: 'Funcional' },
                { id: 'womac_dol_seg', label: 'WOMAC Dolor',     type: 'number', group: 'Funcional' },
                { id: 'womac_rig_seg', label: 'WOMAC Rigidez',   type: 'number', group: 'Funcional' },
                { id: 'womac_fun_seg', label: 'WOMAC Funcional', type: 'number', group: 'Funcional' },
                { id: 'womac_tot_seg', label: 'WOMAC Total',     type: 'number', group: 'Funcional' },
                { id: 'satisfaccion', label: 'Satisfacción', type: 'select',
                    options: ['Muy satisfecho','Satisfecho','Poco satisfecho','No satisfecho'], group: 'Resultados' },
                { id: 'contralateral', label: 'Expectativa contralateral', type: 'select',
                    options: ['Se operaría la otra','Esperaría','Dudaría','No se operaría'], group: 'Resultados' },
            ],
        },

        OP_CADERA: {
            label: 'Op-Cadera (displasia pediátrica)',
            icon: '👶',
            unico: [
                { id: 'fecha',  label: 'Fecha de evaluación', type: 'date', group: 'Historial' },
                { id: 'gestacion',       label: 'Gestación (semanas)', type: 'number', group: 'Antecedentes perinatales' },
                { id: 'presentacion',    label: 'Presentación', type: 'select',
                    options: ['Cefálico','Pélvico','Transverso','Otro'], group: 'Antecedentes perinatales' },
                { id: 'peso_nacer',      label: 'Peso al nacer (g)', type: 'number', group: 'Antecedentes perinatales' },
                { id: 'comp_perinatal',  label: 'Complicación perinatal', type: 'radio', options: ['Sí','No'], group: 'Antecedentes perinatales' },
                { id: 'ant_displasia',   label: 'Antecedentes familiares de displasia', type: 'radio', options: ['Sí','No'], group: 'Antecedentes perinatales' },
                { id: 'otros_ant',       label: 'Otros antecedentes', type: 'textarea', group: 'Antecedentes perinatales' },
                { id: 'simetria',     label: 'Simetría', type: 'radio', options: ['Sí','No'], group: 'Exploración física' },
                { id: 'limit_mov',    label: 'Limitación de movimiento', type: 'radio', options: ['Sí','No'], group: 'Exploración física' },
                { id: 'inestabilidad',label: 'Inestabilidad', type: 'radio', options: ['Sí','No'], group: 'Exploración física' },
                { id: 'centraje_D',     label: 'Centraje', type: 'select', options: ['Centrada','No centrada'], side: 'D', group: 'US — Morfología del techo' },
                { id: 'centraje_I',     label: 'Centraje', type: 'select', options: ['Centrada','No centrada'], side: 'I', group: 'US — Morfología del techo' },
                { id: 'techo_oseo_D',   label: 'Techo óseo', type: 'select', options: ['Bueno >50%','Deficiente <50%','Pobre'], side: 'D', group: 'US — Morfología del techo' },
                { id: 'techo_oseo_I',   label: 'Techo óseo', type: 'select', options: ['Bueno >50%','Deficiente <50%','Pobre'], side: 'I', group: 'US — Morfología del techo' },
                { id: 'techo_cart_D',   label: 'Techo cartilaginoso', type: 'select', options: ['Cubre','No cubre'], side: 'D', group: 'US — Morfología del techo' },
                { id: 'techo_cart_I',   label: 'Techo cartilaginoso', type: 'select', options: ['Cubre','No cubre'], side: 'I', group: 'US — Morfología del techo' },
                { id: 'comentarios', label: 'Comentarios', type: 'textarea', group: 'Notas' },
            ],
        },

    };

    // Mapa de fases válidas por protocolo
    function fasesOf(key) {
        return key === 'OP_CADERA' ? ['unico'] : ['preQx','transQx','seguimiento'];
    }

    function faseLabel(fase) {
        return ({ preQx: 'Pre-Qx', transQx: 'Trans-Qx', seguimiento: 'Seguimiento', unico: 'Evaluación' })[fase] || fase;
    }

    // ── Storage helpers ──────────────────────────────────────────────────────
    function getAll() {
        try { return JSON.parse(localStorage.getItem('cd_protocolos') || '[]'); }
        catch { return []; }
    }
    function saveAll(arr) {
        localStorage.setItem('cd_protocolos', JSON.stringify(arr));
    }
    function getPatientProtocolos(patientId) {
        return getAll().filter(p => p.patientId === patientId)
            .sort((a, b) => (b.updatedAt || b.createdAt || 0).localeCompare(a.updatedAt || a.createdAt || ''));
    }
    function getById(id) {
        return getAll().find(p => p.id === id);
    }
    function upsert(record) {
        const all = getAll();
        const idx = all.findIndex(r => r.id === record.id);
        if (idx >= 0) all[idx] = record;
        else all.push(record);
        saveAll(all);
    }
    function deleteProtocolo(id) {
        const rec = getById(id);
        if (!rec) return;
        const user = app().currentUser || {};
        const isAdmin = user.role === 'admin';
        const isOwner = rec.createdBy === user.displayName;
        if (!isAdmin && !isOwner) {
            return global.showToast('No tienes permiso para eliminar este protocolo.', 'error');
        }
        if (!confirm('¿Eliminar este protocolo? Esta acción no se puede deshacer.')) return;
        saveAll(getAll().filter(p => p.id !== id));
        global.showToast('Protocolo eliminado.', 'success');
        refreshProtocolosSection();
    }

    // ── Sección del expediente ───────────────────────────────────────────────
    function buildExpedienteProtocolosSection(patient, perms) {
        const records = getPatientProtocolos(patient.id);
        const user = app().currentUser || {};
        const isAdmin = user.role === 'admin';

        const addBtn = perms.canAddProtocolo
            ? `<div class="exp-add-wrap" style="position:relative">
                    <button class="exp-btn-add" onclick="expToggleDd('expDdProtocolo')">+ Añadir ▾</button>
                    <div class="exp-dropdown" id="expDdProtocolo">${buildProtocoloMenu(patient.id)}</div>
               </div>`
            : '';

        const body = records.length
            ? records.map(r => buildProtoRow(r, user, isAdmin, perms)).join('')
            : '<div class="exp-empty">Sin protocolos registrados.</div>';

        return `
            <div class="exp-sec-card">
                <div class="exp-sec-head">
                    <span class="exp-sec-title">Protocolo quirúrgico</span>
                    ${addBtn}
                </div>
                <div class="exp-sec-body">${body}</div>
            </div>`;
    }

    function buildProtocoloMenu(patientId) {
        const items = Object.keys(PROTOCOLO_SCHEMA).map(key => {
            const def = PROTOCOLO_SCHEMA[key];
            return `<div class="exp-dd-item" onclick="openProtocolo('${key}', ${patientId})">${def.icon} ${def.label}</div>`;
        }).join('');
        return `<div class="exp-dd-head">Seleccionar protocolo</div>${items}`;
    }

    function buildProtoRow(rec, user, isAdmin, perms) {
        const def = PROTOCOLO_SCHEMA[rec.protocolo];
        if (!def) return '';
        const fases = fasesOf(rec.protocolo);
        const chips = fases.map(f => {
            const saved = !!rec.fases?.[f]?._meta;
            const date = saved ? new Date(rec.fases[f]._meta.savedAt).toLocaleDateString('es-MX') : '—';
            return `<span class="proto-fase-chip ${saved ? 'done' : ''}" title="${global.escapeHtml(faseLabel(f))}${saved ? ' · '+date : ''}">${faseLabel(f)}${saved ? ' ✓' : ''}</span>`;
        }).join(' ');

        const isOwner = rec.createdBy === user.displayName;
        const canEdit = !!perms.canAddProtocolo;
        const canDelete = isAdmin || (isOwner && canEdit);

        const editLabel = canEdit ? 'editar' : 'ver';
        const editCls   = canEdit ? 'exp-ab-ed' : 'exp-ab-vw';

        return `<div class="exp-mini-row">
            <span class="proto-pill proto-pill-${rec.protocolo}">${def.icon} ${global.escapeHtml(def.label.split('—')[0].trim())}</span>
            <span class="proto-fase-chips">${chips}</span>
            <span class="exp-mini-label" style="margin-left:auto;text-align:right;font-size:12px;color:var(--text-muted);">
                ${global.escapeHtml(rec.createdBy || '—')}
            </span>
            <div class="exp-acts">
                <button class="exp-ab ${editCls}" onclick="openProtocolo('${rec.protocolo}', ${rec.patientId}, ${rec.id})">${editLabel}</button>
                ${canDelete ? `<button class="exp-ab exp-ab-dl" onclick="deleteProtocolo(${rec.id})">eliminar</button>` : ''}
            </div>
        </div>`;
    }

    // ── Drawer ───────────────────────────────────────────────────────────────
    // Estado actual del drawer (record en edición + fase activa)
    let DRAWER_STATE = { record: null, fase: null, readonly: false };

    function ensureDrawerDom() {
        let drawer = document.getElementById('protoDrawer');
        if (drawer) return drawer;
        drawer = document.createElement('div');
        drawer.id = 'protoDrawer';
        drawer.className = 'doc-drawer';
        drawer.innerHTML = `
            <div class="doc-drawer-overlay" onclick="closeProtoDrawer()"></div>
            <div class="doc-drawer-panel">
                <div class="doc-drawer-header">
                    <span class="doc-drawer-title" id="protoDrawerTitle"></span>
                    <button class="doc-drawer-close" onclick="closeProtoDrawer()">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                <div id="protoDrawerTabs"></div>
                <div class="doc-drawer-body" id="protoDrawerBody"></div>
                <div class="doc-drawer-footer" id="protoDrawerFooter"></div>
            </div>`;
        document.body.appendChild(drawer);
        return drawer;
    }

    function openProtocolo(protocoloKey, patientId, existingId, faseActiva) {
        const def = PROTOCOLO_SCHEMA[protocoloKey];
        if (!def) return global.showToast('Protocolo no reconocido.', 'error');

        if (typeof global.closeAllExpDropdowns === 'function') global.closeAllExpDropdowns();

        const fases = fasesOf(protocoloKey);
        const user = app().currentUser || {};
        const role = user.role || '';
        const canEdit = role === 'medico';

        let record;
        if (existingId) {
            record = getById(existingId);
            if (!record) return global.showToast('Protocolo no encontrado.', 'error');
        } else {
            record = {
                id: Date.now(),
                patientId: Number(patientId),
                protocolo: protocoloKey,
                fases: fases.reduce((acc, f) => { acc[f] = null; return acc; }, {}),
                createdAt: new Date().toISOString(),
                createdBy: user.displayName || 'Usuario',
                createdByRole: role,
                updatedAt: new Date().toISOString(),
                updatedBy: user.displayName || 'Usuario',
            };
        }

        // Fase a abrir: la pasada, la más reciente con datos, o la primera
        let fase = faseActiva && fases.includes(faseActiva) ? faseActiva : null;
        if (!fase) {
            const conDatos = fases.filter(f => record.fases?.[f]);
            fase = conDatos.length
                ? conDatos.sort((a, b) =>
                    (record.fases[b]?._meta?.savedAt || '').localeCompare(record.fases[a]?._meta?.savedAt || ''))[0]
                : fases[0];
        }

        DRAWER_STATE = { record, fase, readonly: !canEdit };

        ensureDrawerDom();
        renderDrawer();
        document.getElementById('protoDrawer').classList.add('open');
    }

    function closeProtoDrawer() {
        const d = document.getElementById('protoDrawer');
        if (d) d.classList.remove('open');
        DRAWER_STATE = { record: null, fase: null, readonly: false };
    }

    function cambiarFaseProtocolo(fase) {
        if (!DRAWER_STATE.record) return;
        const fases = fasesOf(DRAWER_STATE.record.protocolo);
        if (!fases.includes(fase)) return;
        // Capturar lo que tenga el form actual antes de cambiar (sin guardar)
        const current = collectFormData();
        DRAWER_STATE.record.fases[DRAWER_STATE.fase] = {
            ...(DRAWER_STATE.record.fases[DRAWER_STATE.fase] || {}),
            ...current,
        };
        DRAWER_STATE.fase = fase;
        renderDrawer();
    }

    function renderDrawer() {
        const { record, fase, readonly } = DRAWER_STATE;
        if (!record) return;
        const def = PROTOCOLO_SCHEMA[record.protocolo];
        const patient = (app().patients || []).find(p => p.id === record.patientId) || { name: '—' };

        document.getElementById('protoDrawerTitle').innerHTML =
            `<span style="margin-right:6px;">${def.icon}</span>${global.escapeHtml(def.label)} — ${global.escapeHtml(patient.name)}`;

        // Tabs (no se muestran para OP_CADERA)
        const tabsEl = document.getElementById('protoDrawerTabs');
        const fases = fasesOf(record.protocolo);
        if (fases.length > 1) {
            tabsEl.innerHTML = `<div class="proto-tabs">${fases.map(f => {
                const saved = !!record.fases?.[f]?._meta;
                const active = f === fase ? 'active' : '';
                const done = saved ? 'done' : '';
                return `<button class="proto-tab ${active} ${done}" onclick="cambiarFaseProtocolo('${f}')">${faseLabel(f)}</button>`;
            }).join('')}</div>`;
        } else {
            tabsEl.innerHTML = '';
        }

        // Body: formulario de la fase
        const data = record.fases?.[fase] || {};
        document.getElementById('protoDrawerBody').innerHTML = renderFaseForm(def[fase] || [], data, readonly);

        // Footer
        const footer = document.getElementById('protoDrawerFooter');
        if (readonly) {
            footer.innerHTML = `<button class="btn-secondary" onclick="closeProtoDrawer()">Cerrar</button>`;
        } else {
            const meta = record.fases?.[fase]?._meta;
            const metaText = meta?.savedAt
                ? `<span style="font-size:11.5px;color:var(--text-muted);margin-right:auto;">Última edición: ${new Date(meta.savedAt).toLocaleString('es-MX')} · ${global.escapeHtml(meta.savedBy || '')}</span>`
                : '<span style="margin-right:auto;"></span>';
            footer.innerHTML = `
                ${metaText}
                <button class="btn-secondary" onclick="closeProtoDrawer()">Cancelar</button>
                <button class="btn-primary" onclick="guardarFaseProtocolo()">Guardar fase ${faseLabel(fase)}</button>`;
        }

        // Listener de cómputos (IMC y similares)
        attachComputedListeners(def[fase] || []);
    }

    function renderFaseForm(schema, data, readonly) {
        if (!schema.length) return '<div class="exp-empty">Sin campos para esta fase.</div>';

        // Agrupar por group
        const groups = {};
        const order = [];
        schema.forEach(f => {
            if (!groups[f.group]) { groups[f.group] = []; order.push(f.group); }
            groups[f.group].push(f);
        });

        return order.map(g => {
            const fields = groups[g];
            const renderedIds = new Set();
            const html = [];

            fields.forEach(f => {
                if (renderedIds.has(f.id)) return;
                if (f.side) {
                    // Buscar el par
                    const baseLabel = f.label;
                    const pair = fields.find(o => o.id !== f.id && o.label === baseLabel && o.side && o.side !== f.side);
                    if (pair) {
                        const d = f.side === 'D' ? f : pair;
                        const i = f.side === 'I' ? f : pair;
                        renderedIds.add(d.id);
                        renderedIds.add(i.id);
                        html.push(`
                            <div class="doc-form-field full">
                                <label>${global.escapeHtml(baseLabel)}</label>
                                <div class="doc-form-grid2" style="gap:8px;">
                                    <div><span class="proto-side-label">Derecho</span>${renderInput(d, data, readonly)}</div>
                                    <div><span class="proto-side-label">Izquierdo</span>${renderInput(i, data, readonly)}</div>
                                </div>
                            </div>`);
                        return;
                    }
                }
                renderedIds.add(f.id);
                html.push(renderField(f, data, readonly));
            });

            return `
                <div class="doc-form-section">
                    <div class="doc-form-label">${global.escapeHtml(g || '')}</div>
                    <div class="doc-form-grid2">${html.join('')}</div>
                </div>`;
        }).join('');
    }

    function renderField(f, data, readonly) {
        const isFull = ['textarea','radio'].includes(f.type) || f.type === 'checkbox';
        const cls = isFull ? 'doc-form-field full' : 'doc-form-field';
        return `<div class="${cls}">
            <label>${global.escapeHtml(f.label)}${f.unit ? `<span class="proto-unit">${global.escapeHtml(f.unit)}</span>` : ''}</label>
            ${renderInput(f, data, readonly)}
        </div>`;
    }

    function renderInput(f, data, readonly) {
        const v = data[f.id];
        const ro = readonly ? 'disabled' : '';
        const id = 'pf_' + f.id;

        switch (f.type) {
            case 'number': {
                const attrs = [
                    f.min !== undefined ? `min="${f.min}"` : '',
                    f.max !== undefined ? `max="${f.max}"` : '',
                    f.step !== undefined ? `step="${f.step}"` : '',
                ].filter(Boolean).join(' ');
                return `<input type="number" id="${id}" ${attrs} value="${v ?? ''}" ${ro}>`;
            }
            case 'text':
                return `<input type="text" id="${id}" value="${global.escapeHtml(v || '')}" ${ro}>`;
            case 'date':
                return `<input type="date" id="${id}" value="${v || ''}" ${ro}>`;
            case 'select': {
                const opts = (f.options || []).map(o => {
                    const sel = o === v ? 'selected' : '';
                    return `<option value="${global.escapeHtml(o)}" ${sel}>${global.escapeHtml(o)}</option>`;
                }).join('');
                return `<select id="${id}" ${ro}><option value="">—</option>${opts}</select>`;
            }
            case 'textarea':
                return `<textarea id="${id}" rows="2" ${ro}>${global.escapeHtml(v || '')}</textarea>`;
            case 'checkbox': {
                const ck = v ? 'checked' : '';
                return `<label style="display:inline-flex;align-items:center;gap:6px;font-weight:400;">
                    <input type="checkbox" id="${id}" ${ck} ${ro}>
                    <span style="font-size:13px;color:var(--text-secondary);">${global.escapeHtml(f.label)}</span>
                </label>`;
            }
            case 'radio': {
                const name = id;
                return `<div style="display:flex;gap:14px;">${
                    (f.options || []).map(o => {
                        const ck = o === v ? 'checked' : '';
                        return `<label style="display:inline-flex;align-items:center;gap:6px;font-weight:400;">
                            <input type="radio" name="${name}" value="${global.escapeHtml(o)}" ${ck} ${ro}>
                            <span style="font-size:13px;color:var(--text-secondary);">${global.escapeHtml(o)}</span>
                        </label>`;
                    }).join('')
                }</div>`;
            }
            case 'computed':
                return `<input type="text" id="${id}" value="${v || ''}" readonly tabindex="-1" style="background:var(--bg-surface-2);color:var(--text-secondary);">`;
            default:
                return `<input type="text" id="${id}" value="${global.escapeHtml(v || '')}" ${ro}>`;
        }
    }

    function collectFormData() {
        const { record, fase } = DRAWER_STATE;
        if (!record || !fase) return {};
        const schema = PROTOCOLO_SCHEMA[record.protocolo][fase] || [];
        const out = {};
        schema.forEach(f => {
            if (f.type === 'computed') return; // se recalcula al renderizar
            const el = document.getElementById('pf_' + f.id);
            if (f.type === 'checkbox') {
                out[f.id] = el ? el.checked : false;
            } else if (f.type === 'radio') {
                const checked = document.querySelector('input[name="pf_' + f.id + '"]:checked');
                out[f.id] = checked ? checked.value : null;
            } else if (!el) {
                return;
            } else if (f.type === 'number') {
                const s = el.value.trim();
                out[f.id] = s === '' ? null : Number(s);
            } else if (f.type === 'text' || f.type === 'textarea') {
                const s = el.value.trim();
                out[f.id] = s === '' ? null : s;
            } else {
                out[f.id] = el.value || null;
            }
        });
        return out;
    }

    function attachComputedListeners(schema) {
        const computedFields = schema.filter(f => f.type === 'computed' && typeof f.computed === 'function');
        if (!computedFields.length) return;

        function recompute() {
            const d = {};
            schema.forEach(f => {
                if (f.type === 'computed') return;
                const el = document.getElementById('pf_' + f.id);
                if (!el) return;
                if (f.type === 'checkbox') d[f.id] = el.checked;
                else if (f.type === 'number') {
                    const s = el.value.trim();
                    d[f.id] = s === '' ? null : Number(s);
                } else d[f.id] = el.value;
            });
            computedFields.forEach(f => {
                const tgt = document.getElementById('pf_' + f.id);
                if (tgt) tgt.value = f.computed(d) || '';
            });
        }

        // Suscribir inputs no-computed
        schema.forEach(f => {
            if (f.type === 'computed') return;
            const el = document.getElementById('pf_' + f.id);
            if (el) el.addEventListener('input', recompute);
        });

        // Cálculo inicial
        recompute();
    }

    function guardarFaseProtocolo() {
        const { record, fase, readonly } = DRAWER_STATE;
        if (!record || !fase || readonly) return;

        const data = collectFormData();
        const user = app().currentUser || {};
        data._meta = {
            savedAt: new Date().toISOString(),
            savedBy: user.displayName || 'Usuario',
            savedByRole: user.role || '',
        };
        record.fases[fase] = data;
        record.updatedAt = new Date().toISOString();
        record.updatedBy = user.displayName || 'Usuario';

        upsert(record);
        DRAWER_STATE.record = record;
        global.showToast('Fase ' + faseLabel(fase) + ' guardada.', 'success');
        renderDrawer();
        refreshProtocolosSection();
    }

    function refreshProtocolosSection() {
        if (typeof global.renderExpediente === 'function') global.renderExpediente();
    }

    // ── Registro ──────────────────────────────────────────────────────────────
    registry.protocolos = {
        buildExpedienteProtocolosSection,
        openProtocolo,
        getPatientProtocolos,
        deleteProtocolo,
        refreshProtocolosSection,
        PROTOCOLO_SCHEMA,
    };

    global.openProtocolo            = (...a) => openProtocolo(...a);
    global.deleteProtocolo          = (id)   => deleteProtocolo(id);
    global.refreshProtocolosSection = ()     => refreshProtocolosSection();
    global.closeProtoDrawer         = ()     => closeProtoDrawer();
    global.guardarFaseProtocolo     = ()     => guardarFaseProtocolo();
    global.cambiarFaseProtocolo     = (f)    => cambiarFaseProtocolo(f);

})(window);
